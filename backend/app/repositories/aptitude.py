from uuid import UUID

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)
from sqlalchemy.orm import (
    selectinload,
)

from app.models.aptitude import (
    AptitudeAnswer,
    AptitudeAttempt,
    AptitudeQuestion,
)


class AptitudeRepository:
    def __init__(
        self,
        session:
            AsyncSession,
    ) -> None:
        self.session = (
            session
        )


    async def get_random_questions(
        self,
        *,
        category: str,
        limit: int,
    ) -> list[
        AptitudeQuestion
    ]:
        statement = (
            select(
                AptitudeQuestion,
            )
            .where(
                AptitudeQuestion
                    .is_active
                    .is_(True),
            )
        )


        if (
            category
            != "mixed"
        ):
            statement = (
                statement.where(
                    AptitudeQuestion
                        .category
                    == category,
                )
            )


        statement = (
            statement
            .order_by(
                func.random(),
            )
            .limit(
                limit,
            )
        )


        result = (
            await self.session
            .execute(
                statement,
            )
        )


        return list(
            result.scalars()
            .all()
        )


    async def add_attempt(
        self,
        attempt:
            AptitudeAttempt,
    ) -> None:
        self.session.add(
            attempt,
        )

        await self.session.flush()


    async def add_answers(
        self,
        answers: list[
            AptitudeAnswer
        ],
    ) -> None:
        self.session.add_all(
            answers,
        )

        await self.session.flush()


    async def get_attempt(
        self,
        *,
        attempt_id: UUID,
        user_id: UUID,
    ) -> (
        AptitudeAttempt
        | None
    ):
        statement = (
            select(
                AptitudeAttempt,
            )
            .where(
                AptitudeAttempt.id
                == attempt_id,
                AptitudeAttempt.user_id
                == user_id,
            )
            .options(
                selectinload(
                    AptitudeAttempt.answers,
                ).selectinload(
                    AptitudeAnswer.question,
                ),
            )
        )


        result = (
            await self.session
            .execute(
                statement,
            )
        )


        return (
            result
            .scalar_one_or_none()
        )


    async def list_submitted_attempts(
        self,
        user_id: UUID,
    ) -> list[
        AptitudeAttempt
    ]:
        statement = (
            select(
                AptitudeAttempt,
            )
            .where(
                AptitudeAttempt.user_id
                == user_id,
                AptitudeAttempt
                    .submitted_at
                    .is_not(None),
            )
            .order_by(
                AptitudeAttempt
                    .submitted_at
                    .desc(),
            )
        )


        result = (
            await self.session
            .execute(
                statement,
            )
        )


        return list(
            result.scalars()
            .all()
        )


    async def category_counts(
        self,
    ) -> dict[str, int]:
        statement = (
            select(
                AptitudeQuestion.category,
                func.count(
                    AptitudeQuestion.id,
                ),
            )
            .where(
                AptitudeQuestion
                    .is_active
                    .is_(True),
            )
            .group_by(
                AptitudeQuestion.category,
            )
        )


        rows = (
            await self.session
            .execute(
                statement,
            )
        ).all()


        return {
            category:
                int(count)
            for (
                category,
                count,
            ) in rows
        }