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

from app.models.coding import (
    CodingQuestion,
)


class CodingRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def list_questions(
        self,
        *,
        difficulty: str | None = None,
        topic: str | None = None,
    ) -> list[CodingQuestion]:
        statement = (
            select(
                CodingQuestion,
            )
            .where(
                CodingQuestion
                .is_active
                .is_(True),
            )
        )

        if difficulty:
            statement = (
                statement.where(
                    func.lower(
                        CodingQuestion
                        .difficulty,
                    )
                    == difficulty.lower()
                )
            )

        if topic:
            statement = (
                statement.where(
                    func.lower(
                        CodingQuestion
                        .topic,
                    )
                    == topic.lower()
                )
            )

        statement = (
            statement.order_by(
                CodingQuestion
                .difficulty
                .asc(),
                CodingQuestion
                .title
                .asc(),
            )
        )

        result = (
            await self.session.execute(
                statement,
            )
        )

        return list(
            result
            .scalars()
            .all()
        )

    async def get_question(
        self,
        question_id: UUID,
    ) -> CodingQuestion | None:
        statement = (
            select(
                CodingQuestion,
            )
            .options(
                selectinload(
                    CodingQuestion
                    .test_cases,
                )
            )
            .where(
                CodingQuestion.id
                == question_id,
                CodingQuestion
                .is_active
                .is_(True),
            )
        )

        result = (
            await self.session.execute(
                statement,
            )
        )

        return (
            result
            .scalars()
            .unique()
            .one_or_none()
        )