from datetime import (
    datetime,
    timedelta,
    timezone,
)
from uuid import UUID

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.exceptions import (
    ConflictError,
    ResourceNotFoundError,
)
from app.models.aptitude import (
    AptitudeAnswer,
    AptitudeAttempt,
)
from app.models.user import User
from app.repositories.aptitude import (
    AptitudeRepository,
)
from app.schemas.aptitude import (
    AptitudeAttemptRead,
    AptitudeCatalogRead,
    AptitudeCategoryProgress,
    AptitudeCategorySummary,
    AptitudeProgressRead,
    AptitudeQuestionRead,
    AptitudeQuestionResult,
    AptitudeResultRead,
    StartAptitudeAttemptRequest,
    SubmitAptitudeAttemptRequest,
)

SECONDS_PER_QUESTION = 75


class AptitudeService:
    def __init__(
        self,
        session:
            AsyncSession,
    ) -> None:
        self.session = (
            session
        )

        self.repository = (
            AptitudeRepository(
                session,
            )
        )


    async def get_catalog(
        self,
    ) -> AptitudeCatalogRead:
        counts = (
            await self.repository
            .category_counts()
        )


        categories = [
            AptitudeCategorySummary(
                category=
                    category,
                question_count=
                    count,
            )
            for (
                category,
                count,
            ) in sorted(
                counts.items(),
            )
        ]


        return AptitudeCatalogRead(
            categories=
                categories,

            available_question_counts=[
                5,
                10,
            ],
        )


    async def start_attempt(
        self,
        user: User,
        payload:
            StartAptitudeAttemptRequest,
    ) -> AptitudeAttemptRead:
        questions = (
            await self.repository
            .get_random_questions(
                category=
                    payload.category,

                limit=
                    payload
                    .question_count,
            )
        )


        if (
            len(questions)
            < payload
                .question_count
        ):
            raise ConflictError(
                code=(
                    "NOT_ENOUGH_APTITUDE_QUESTIONS"
                ),
                message=(
                    "There are not enough questions available for this practice configuration."
                ),
            )


        now = (
            datetime.now(
                timezone.utc,
            )
        )


        duration_seconds = (
            payload
                .question_count
            * SECONDS_PER_QUESTION
        )


        attempt = (
            AptitudeAttempt(
                user_id=
                    user.id,

                category=
                    payload.category,

                question_count=
                    payload
                    .question_count,

                duration_seconds=
                    duration_seconds,

                started_at=
                    now,

                expires_at=(
                    now
                    + timedelta(
                        seconds=
                            duration_seconds,
                    )
                ),
            )
        )


        await self.repository.add_attempt(
            attempt,
        )


        answers = [
            AptitudeAnswer(
                attempt_id=
                    attempt.id,

                question_id=
                    question.id,

                position=
                    index,
            )
            for (
                index,
                question,
            ) in enumerate(
                questions,
                start=1,
            )
        ]


        await self.repository.add_answers(
            answers,
        )


        await self.session.commit()


        saved_attempt = (
            await self.repository
            .get_attempt(
                attempt_id=
                    attempt.id,

                user_id=
                    user.id,
            )
        )


        if (
            saved_attempt
            is None
        ):
            raise ResourceNotFoundError(
                "The aptitude attempt could not be loaded."
            )


        return self._build_attempt(
            saved_attempt,
        )


    async def get_active_attempt(
        self,
        user: User,
        attempt_id: UUID,
    ) -> AptitudeAttemptRead:
        attempt = (
            await self._get_attempt(
                user,
                attempt_id,
            )
        )


        if (
            attempt
                .submitted_at
            is not None
        ):
            raise ConflictError(
                code=(
                    "ATTEMPT_ALREADY_SUBMITTED"
                ),
                message=(
                    "This aptitude attempt has already been submitted."
                ),
            )


        return self._build_attempt(
            attempt,
        )


    async def submit_attempt(
        self,
        user: User,
        attempt_id: UUID,
        payload:
            SubmitAptitudeAttemptRequest,
    ) -> AptitudeResultRead:
        attempt = (
            await self._get_attempt(
                user,
                attempt_id,
            )
        )


        if (
            attempt
                .submitted_at
            is not None
        ):
            raise ConflictError(
                code=(
                    "ATTEMPT_ALREADY_SUBMITTED"
                ),
                message=(
                    "This aptitude attempt has already been submitted."
                ),
            )


        submitted_answers = {
            answer.question_id:
                answer
                    .selected_option
            for answer
            in payload.answers
        }


        if (
            len(
                submitted_answers,
            )
            != len(
                payload.answers,
            )
        ):
            raise ConflictError(
                code=(
                    "DUPLICATE_APTITUDE_ANSWER"
                ),
                message=(
                    "A question was answered more than once."
                ),
            )


        attempt_question_ids = {
            answer.question_id
            for answer
            in attempt.answers
        }


        unknown_ids = (
            set(
                submitted_answers,
            )
            - attempt_question_ids
        )


        if unknown_ids:
            raise ConflictError(
                code=(
                    "INVALID_APTITUDE_ANSWER"
                ),
                message=(
                    "One or more submitted answers do not belong to this attempt."
                ),
            )


        correct_answers = 0


        for answer in (
            attempt.answers
        ):
            selected_option = (
                submitted_answers
                .get(
                    answer
                        .question_id,
                )
            )


            answer.selected_option = (
                selected_option
            )


            answer.is_correct = (
                selected_option
                is not None
                and
                selected_option
                == answer
                    .question
                    .correct_option
            )


            if (
                answer
                    .is_correct
            ):
                correct_answers += 1


        now = (
            datetime.now(
                timezone.utc,
            )
        )


        attempt.correct_answers = (
                correct_answers
            )


        attempt.score_percent = (
                round(
                    (
                        correct_answers
                        / attempt
                            .question_count
                    )
                    * 100,
                    2,
                )
            )


        attempt.timed_out = (
                now
                > attempt
                    .expires_at
            )


        attempt.submitted_at = (
                now
            )


        await self.session.commit()


        refreshed = (
            await self.repository
            .get_attempt(
                attempt_id=
                    attempt.id,

                user_id=
                    user.id,
            )
        )


        if (
            refreshed
            is None
        ):
            raise ResourceNotFoundError(
                "The aptitude result could not be loaded."
            )


        return self._build_result(
            refreshed,
        )


    async def get_result(
        self,
        user: User,
        attempt_id: UUID,
    ) -> AptitudeResultRead:
        attempt = (
            await self._get_attempt(
                user,
                attempt_id,
            )
        )


        if (
            attempt
                .submitted_at
            is None
        ):
            raise ConflictError(
                code=(
                    "ATTEMPT_NOT_SUBMITTED"
                ),
                message=(
                    "Submit this aptitude attempt before viewing results."
                ),
            )


        return self._build_result(
            attempt,
        )


    async def get_progress(
        self,
        user: User,
    ) -> AptitudeProgressRead:
        attempts = (
            await self.repository
            .list_submitted_attempts(
                user.id,
            )
        )


        if not attempts:
            return (
                AptitudeProgressRead(
                    total_attempts=
                        0,

                    total_questions=
                        0,

                    total_correct=
                        0,

                    accuracy_percent=
                        0,

                    average_score=
                        0,

                    best_score=
                        0,

                    categories=
                        [],
                )
            )


        total_questions = (
            sum(
                attempt
                    .question_count
                for attempt
                in attempts
            )
        )


        total_correct = (
            sum(
                attempt
                    .correct_answers
                or 0
                for attempt
                in attempts
            )
        )


        scores = [
            attempt
                .score_percent
            or 0
            for attempt
            in attempts
        ]


        category_scores: dict[
                str,
                list[float],
            ] = {}


        for attempt in attempts:
            category_scores.setdefault(
                attempt.category,
                [],
            ).append(
                attempt
                    .score_percent
                or 0,
            )


        categories = [
            AptitudeCategoryProgress(
                category=
                    category,

                attempts=
                    len(
                        values,
                    ),

                average_score=
                    round(
                        sum(
                            values,
                        )
                        / len(
                            values,
                        ),
                        2,
                    ),
            )
            for (
                category,
                values,
            ) in sorted(
                category_scores
                .items(),
            )
        ]


        return (
            AptitudeProgressRead(
                total_attempts=
                    len(
                        attempts,
                    ),

                total_questions=
                    total_questions,

                total_correct=
                    total_correct,

                accuracy_percent=
                    round(
                        (
                            total_correct
                            / total_questions
                        )
                        * 100,
                        2,
                    )
                    if total_questions
                    else 0,

                average_score=
                    round(
                        sum(
                            scores,
                        )
                        / len(
                            scores,
                        ),
                        2,
                    ),

                best_score=
                    round(
                        max(
                            scores,
                        ),
                        2,
                    ),

                categories=
                    categories,
            )
        )


    async def _get_attempt(
        self,
        user: User,
        attempt_id: UUID,
    ) -> AptitudeAttempt:
        attempt = (
            await self.repository
            .get_attempt(
                attempt_id=
                    attempt_id,

                user_id=
                    user.id,
            )
        )


        if (
            attempt
            is None
        ):
            raise ResourceNotFoundError(
                "The aptitude attempt was not found."
            )


        return attempt


    @staticmethod
    def _build_attempt(
        attempt:
            AptitudeAttempt,
    ) -> AptitudeAttemptRead:
        return (
            AptitudeAttemptRead(
                id=
                    attempt.id,

                category=
                    attempt.category,

                question_count=
                    attempt
                    .question_count,

                duration_seconds=
                    attempt
                    .duration_seconds,

                started_at=
                    attempt
                    .started_at,

                expires_at=
                    attempt
                    .expires_at,

                questions=[
                    AptitudeQuestionRead(
                        id=
                            answer
                            .question
                            .id,

                        position=
                            answer
                            .position,

                        category=
                            answer
                            .question
                            .category,

                        topic=
                            answer
                            .question
                            .topic,

                        difficulty=
                            answer
                            .question
                            .difficulty,

                        question_text=
                            answer
                            .question
                            .question_text,

                        options=
                            answer
                            .question
                            .options,
                    )
                    for answer
                    in attempt
                        .answers
                ],
            )
        )


    @staticmethod
    def _build_result(
        attempt:
            AptitudeAttempt,
    ) -> AptitudeResultRead:
        if (
            attempt
                .submitted_at
            is None
        ):
            raise ValueError(
                "Attempt has not been submitted."
            )


        return (
            AptitudeResultRead(
                attempt_id=
                    attempt.id,

                category=
                    attempt.category,

                total_questions=
                    attempt
                    .question_count,

                correct_answers=
                    attempt
                    .correct_answers
                or 0,

                score_percent=
                    attempt
                    .score_percent
                or 0,

                timed_out=
                    attempt
                    .timed_out,

                submitted_at=
                    attempt
                    .submitted_at,

                questions=[
                    AptitudeQuestionResult(
                        question_id=
                            answer
                            .question
                            .id,

                        position=
                            answer
                            .position,

                        category=
                            answer
                            .question
                            .category,

                        topic=
                            answer
                            .question
                            .topic,

                        difficulty=
                            answer
                            .question
                            .difficulty,

                        question_text=
                            answer
                            .question
                            .question_text,

                        options=
                            answer
                            .question
                            .options,

                        selected_option=
                            answer
                            .selected_option,

                        correct_option=
                            answer
                            .question
                            .correct_option,

                        is_correct=
                            bool(
                                answer
                                .is_correct,
                            ),

                        explanation=
                            answer
                            .question
                            .explanation,
                    )
                    for answer
                    in attempt
                        .answers
                ],
            )
        )