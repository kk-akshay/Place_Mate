from uuid import UUID

from sqlalchemy import (
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.coding_submission import (
    CodingSubmission,
)


class CodingSubmissionRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def add(
        self,
        submission: CodingSubmission,
    ) -> None:
        self.session.add(
            submission
        )

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        limit: int = 20,
    ) -> list[CodingSubmission]:
        statement = (
            select(
                CodingSubmission
            )
            .where(
                CodingSubmission.user_id
                == user_id
            )
            .order_by(
                CodingSubmission.created_at
                .desc()
            )
            .limit(
                limit
            )
        )

        result = await self.session.execute(
            statement
        )

        return list(
            result.scalars().all()
        )

    async def solved_question_ids(
        self,
        user_id: UUID,
    ) -> set[UUID]:
        statement = (
            select(
                CodingSubmission.question_id
            )
            .where(
                CodingSubmission.user_id
                == user_id,
                CodingSubmission.all_passed
                .is_(True),
            )
            .distinct()
        )

        result = await self.session.execute(
            statement
        )

        return set(
            result.scalars().all()
        )