from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    or_,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.preparation_activity import (
    PreparationActivity,
)
from app.models.student_profile import (
    StudentProfile,
)


class PreparationRepository:
    def __init__(
        self,
        session:
            AsyncSession,
    ) -> None:
        self.session = (
            session
        )


    async def get_profile(
        self,
        user_id: UUID,
    ) -> StudentProfile | None:
        result = (
            await self.session.execute(
                select(
                    StudentProfile,
                ).where(
                    StudentProfile
                        .user_id
                    == user_id,
                )
            )
        )


        return (
            result
            .scalar_one_or_none()
        )


    async def get_by_source(
        self,
        *,
        user_id: UUID,
        activity_type: str,
        source_id: UUID,
    ) -> (
        PreparationActivity
        | None
    ):
        result = (
            await self.session.execute(
                select(
                    PreparationActivity,
                ).where(
                    PreparationActivity
                        .user_id
                    == user_id,

                    PreparationActivity
                        .activity_type
                    == activity_type,

                    PreparationActivity
                        .source_id
                    == source_id,
                )
            )
        )


        return (
            result
            .scalar_one_or_none()
        )


    async def add(
        self,
        activity:
            PreparationActivity,
    ) -> None:
        self.session.add(
            activity,
        )

        await self.session.flush()


    async def list_for_period(
        self,
        *,
        user_id: UUID,
        period_start:
            datetime,
        period_end:
            datetime,
    ) -> list[
        PreparationActivity
    ]:
        statement = (
            select(
                PreparationActivity,
            )
            .where(
                PreparationActivity
                    .user_id
                == user_id,

                PreparationActivity
                    .started_at
                < period_end,

                or_(
                    PreparationActivity
                        .ended_at
                        .is_(None),

                    PreparationActivity
                        .ended_at
                    >= period_start,
                ),
            )
            .order_by(
                PreparationActivity
                    .started_at
                    .asc(),
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