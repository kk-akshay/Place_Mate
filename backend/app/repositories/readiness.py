from uuid import UUID

from sqlalchemy import (
    distinct,
    func,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.aptitude import (
    AptitudeAnswer,
    AptitudeAttempt,
    AptitudeQuestion,
)
from app.models.coding import (
    CodingQuestion,
)
from app.models.coding_submission import (
    CodingSubmission,
)


class ReadinessRepository:
    """
    Read-only aggregate queries used only by the
    readiness feature. Everything else is reused
    from the existing module repositories.
    """

    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def aptitude_topic_stats(
        self,
        user_id: UUID,
    ) -> list[
        tuple[
            str,
            str,
            int,
            int,
        ]
    ]:
        """
        Returns (category, topic, total_answers,
        correct_answers) across every submitted
        attempt of the user.
        """

        total_count = func.count(
            AptitudeAnswer.id,
        )

        correct_count = (
            func.count(
                AptitudeAnswer.id,
            ).filter(
                AptitudeAnswer
                .is_correct
                .is_(True),
            )
        )

        statement = (
            select(
                AptitudeQuestion.category,
                AptitudeQuestion.topic,
                total_count,
                correct_count,
            )
            .select_from(
                AptitudeAnswer,
            )
            .join(
                AptitudeAttempt,
                AptitudeAttempt.id
                == AptitudeAnswer
                .attempt_id,
            )
            .join(
                AptitudeQuestion,
                AptitudeQuestion.id
                == AptitudeAnswer
                .question_id,
            )
            .where(
                AptitudeAttempt.user_id
                == user_id,
                AptitudeAttempt
                .submitted_at
                .is_not(None),
            )
            .group_by(
                AptitudeQuestion.category,
                AptitudeQuestion.topic,
            )
        )

        result = (
            await self.session.execute(
                statement,
            )
        )

        return [
            (
                str(category),
                str(topic),
                int(total),
                int(correct),
            )
            for (
                category,
                topic,
                total,
                correct,
            ) in result.all()
        ]

    async def coding_topic_stats(
        self,
        user_id: UUID,
    ) -> list[
        tuple[
            str,
            int,
            int,
            int,
        ]
    ]:
        """
        Returns (topic, total_questions,
        attempted_questions, solved_questions)
        for every active coding topic.
        """

        total_result = (
            await self.session.execute(
                select(
                    CodingQuestion.topic,
                    func.count(
                        CodingQuestion.id,
                    ),
                )
                .where(
                    CodingQuestion
                    .is_active
                    .is_(True),
                )
                .group_by(
                    CodingQuestion.topic,
                )
            )
        )

        totals = {
            str(topic): int(count)
            for (
                topic,
                count,
            ) in total_result.all()
        }

        attempted_result = (
            await self.session.execute(
                select(
                    CodingQuestion.topic,
                    func.count(
                        distinct(
                            CodingSubmission
                            .question_id,
                        ),
                    ),
                )
                .select_from(
                    CodingSubmission,
                )
                .join(
                    CodingQuestion,
                    CodingQuestion.id
                    == CodingSubmission
                    .question_id,
                )
                .where(
                    CodingSubmission
                    .user_id
                    == user_id,
                    CodingQuestion
                    .is_active
                    .is_(True),
                )
                .group_by(
                    CodingQuestion.topic,
                )
            )
        )

        attempted = {
            str(topic): int(count)
            for (
                topic,
                count,
            ) in attempted_result.all()
        }

        solved_result = (
            await self.session.execute(
                select(
                    CodingQuestion.topic,
                    func.count(
                        distinct(
                            CodingSubmission
                            .question_id,
                        ),
                    ),
                )
                .select_from(
                    CodingSubmission,
                )
                .join(
                    CodingQuestion,
                    CodingQuestion.id
                    == CodingSubmission
                    .question_id,
                )
                .where(
                    CodingSubmission
                    .user_id
                    == user_id,
                    CodingSubmission
                    .all_passed
                    .is_(True),
                    CodingQuestion
                    .is_active
                    .is_(True),
                )
                .group_by(
                    CodingQuestion.topic,
                )
            )
        )

        solved = {
            str(topic): int(count)
            for (
                topic,
                count,
            ) in solved_result.all()
        }

        return [
            (
                topic,
                total,
                attempted.get(
                    topic,
                    0,
                ),
                solved.get(
                    topic,
                    0,
                ),
            )
            for (
                topic,
                total,
            ) in sorted(
                totals.items(),
            )
        ]