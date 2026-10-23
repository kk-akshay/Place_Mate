from datetime import datetime, timezone
from uuid import UUID

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.ai.prompts.interview import (
    build_evaluation_prompts,
    build_question_prompts,
)
from app.ai.providers.base import (
    AIProviderError,
)
from app.ai.providers.factory import (
    get_ai_provider,
)
from app.core.exceptions import (
    ConflictError,
    InvalidRequestError,
    ResourceNotFoundError,
)
from app.models.interview import (
    InterviewQuestion,
    InterviewSession,
)
from app.models.user import User
from app.repositories.interview import (
    InterviewRepository,
)
from app.repositories.profile import (
    ProfileRepository,
)
from app.schemas.interview import (
    AIGeneratedQuestions,
    AIInterviewEvaluation,
    InterviewQuestionRead,
    InterviewSessionListRead,
    InterviewSessionRead,
    InterviewSessionSummary,
    StartInterviewRequest,
    SubmitInterviewRequest,
)


class InterviewService:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

        self.repository = (
            InterviewRepository(session)
        )

        self.profile_repository = (
            ProfileRepository(session)
        )

    async def start_session(
        self,
        user: User,
        payload: StartInterviewRequest,
    ) -> InterviewSessionRead:
        profile = (
            await self.profile_repository
            .get_by_user_id(user.id)
        )

        requested_role = (
            payload.target_role.strip()
            if payload.target_role
            else ""
        )

        if requested_role:
            role = requested_role
        elif profile and profile.target_roles:
            role = profile.target_roles[0]
        else:
            role = "Placement candidate"

        skills = (
            list(profile.skills[:10])
            if profile
            else []
        )

        (
            system_prompt,
            user_prompt,
        ) = build_question_prompts(
            kind=payload.kind,
            target_role=role,
            skills=skills,
            question_count=(
                payload.question_count
            ),
        )

        raw = await (
            get_ai_provider().generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=(
                    AIGeneratedQuestions
                    .model_json_schema()
                ),
            )
        )

        try:
            generated = (
                AIGeneratedQuestions
                .model_validate(raw)
            )
        except ValidationError as exc:
            raise AIProviderError(
                "The AI service returned questions "
                "in an unexpected format."
            ) from exc

        texts = [
            question.strip()
            for question
            in generated.questions
            if question and question.strip()
        ]

        if len(texts) < payload.question_count:
            raise AIProviderError(
                "The AI service did not return "
                "enough questions. Please try again."
            )

        texts = texts[
            : payload.question_count
        ]

        interview_session = InterviewSession(
            user_id=user.id,
            kind=payload.kind,
            target_role=role[:120],
            question_count=len(texts),
            status="in_progress",
            questions=[
                InterviewQuestion(
                    position=index,
                    question_text=text,
                )
                for index, text
                in enumerate(
                    texts,
                    start=1,
                )
            ],
        )

        await self.repository.add_session(
            interview_session,
        )

        await self.session.commit()

        saved = (
            await self.repository
            .get_session(
                session_id=(
                    interview_session.id
                ),
                user_id=user.id,
                refresh=True,
            )
        )

        if saved is None:
            raise ResourceNotFoundError(
                "The interview session could "
                "not be loaded."
            )

        return self._build_read(saved)

    async def get_session(
        self,
        user: User,
        session_id: UUID,
    ) -> InterviewSessionRead:
        interview_session = (
            await self._get_owned(
                user,
                session_id,
            )
        )

        return self._build_read(
            interview_session,
        )

    async def list_sessions(
        self,
        user: User,
        kind: str | None,
    ) -> InterviewSessionListRead:
        sessions = (
            await self.repository
            .list_sessions(
                user_id=user.id,
                kind=kind,
            )
        )

        return InterviewSessionListRead(
            sessions=[
                InterviewSessionSummary(
                    id=item.id,
                    kind=item.kind,
                    target_role=(
                        item.target_role
                    ),
                    question_count=(
                        item.question_count
                    ),
                    status=item.status,
                    overall_score=(
                        item.overall_score
                    ),
                    created_at=(
                        item.created_at
                    ),
                    submitted_at=(
                        item.submitted_at
                    ),
                )
                for item in sessions
            ],
        )

    async def submit_session(
        self,
        user: User,
        session_id: UUID,
        payload: SubmitInterviewRequest,
    ) -> InterviewSessionRead:
        interview_session = (
            await self._get_owned(
                user,
                session_id,
            )
        )

        if (
            interview_session.status
            == "submitted"
        ):
            raise ConflictError(
                code=(
                    "INTERVIEW_ALREADY_SUBMITTED"
                ),
                message=(
                    "This interview session has "
                    "already been submitted."
                ),
            )

        submitted = {
            item.question_id: item.answer
            for item in payload.answers
        }

        if len(submitted) != len(
            payload.answers,
        ):
            raise InvalidRequestError(
                "A question was answered more "
                "than once."
            )

        question_ids = {
            question.id
            for question
            in interview_session.questions
        }

        if set(submitted) - question_ids:
            raise InvalidRequestError(
                "One or more answers do not "
                "belong to this session."
            )

        answered: list[InterviewQuestion] = []

        for question in (
            interview_session.questions
        ):
            text = (
                submitted.get(question.id)
                or ""
            ).strip()

            question.answer_text = (
                text or None
            )

            if text:
                answered.append(question)

        if not answered:
            raise InvalidRequestError(
                "Answer at least one question "
                "before submitting."
            )

        (
            system_prompt,
            user_prompt,
        ) = build_evaluation_prompts(
            kind=interview_session.kind,
            target_role=(
                interview_session.target_role
            ),
            answered=[
                {
                    "position": question.position,
                    "question": (
                        question.question_text
                    ),
                    "answer": (
                        question.answer_text
                    ),
                }
                for question in answered
            ],
        )

        raw = await (
            get_ai_provider().generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=(
                    AIInterviewEvaluation
                    .model_json_schema()
                ),
            )
        )

        try:
            evaluation = (
                AIInterviewEvaluation
                .model_validate(raw)
            )
        except ValidationError as exc:
            raise AIProviderError(
                "The AI service returned an "
                "evaluation in an unexpected "
                "format."
            ) from exc

        by_position = {
            item.position: item
            for item
            in evaluation.evaluations
        }

        for question in answered:
            if (
                question.position
                not in by_position
            ):
                raise AIProviderError(
                    "The AI service did not "
                    "evaluate every answer. "
                    "Please try again."
                )

        total = 0

        for question in (
            interview_session.questions
        ):
            result = by_position.get(
                question.position,
            )

            if (
                question.answer_text
                and result is not None
            ):
                question.score = result.score
                question.feedback = (
                    result.feedback
                )
                question.ideal_points = list(
                    result.ideal_points,
                )
            else:
                question.score = 0
                question.feedback = (
                    "No answer was provided "
                    "for this question."
                )
                question.ideal_points = []

            total += question.score

        question_total = len(
            interview_session.questions,
        )

        interview_session.overall_score = (
            round(
                total
                / (question_total * 10)
                * 100
            )
        )

        interview_session.summary = (
            evaluation.overall_summary
        )

        interview_session.strengths = list(
            evaluation.strengths,
        )

        interview_session.improvements = list(
            evaluation.improvements,
        )

        interview_session.status = (
            "submitted"
        )

        interview_session.submitted_at = (
            datetime.now(timezone.utc)
        )

        await self.session.commit()

        return self._build_read(
            interview_session,
        )

    async def _get_owned(
        self,
        user: User,
        session_id: UUID,
    ) -> InterviewSession:
        interview_session = (
            await self.repository
            .get_session(
                session_id=session_id,
                user_id=user.id,
            )
        )

        if interview_session is None:
            raise ResourceNotFoundError(
                "The interview session was "
                "not found."
            )

        return interview_session

    @staticmethod
    def _build_read(
        interview_session: InterviewSession,
    ) -> InterviewSessionRead:
        return InterviewSessionRead(
            id=interview_session.id,
            kind=interview_session.kind,
            target_role=(
                interview_session.target_role
            ),
            question_count=(
                interview_session
                .question_count
            ),
            status=interview_session.status,
            overall_score=(
                interview_session
                .overall_score
            ),
            summary=interview_session.summary,
            strengths=(
                interview_session.strengths
                or []
            ),
            improvements=(
                interview_session
                .improvements
                or []
            ),
            created_at=(
                interview_session.created_at
            ),
            submitted_at=(
                interview_session
                .submitted_at
            ),
            questions=[
                InterviewQuestionRead(
                    id=question.id,
                    position=question.position,
                    question_text=(
                        question.question_text
                    ),
                    answer_text=(
                        question.answer_text
                    ),
                    score=question.score,
                    feedback=question.feedback,
                    ideal_points=(
                        question.ideal_points
                        or []
                    ),
                )
                for question
                in interview_session.questions
            ],
        )