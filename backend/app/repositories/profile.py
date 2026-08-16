from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_profile import StudentProfile


class ProfileRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session


    async def get_by_user_id(
        self,
        user_id: UUID,
    ) -> StudentProfile | None:
        result = await self.session.execute(
            select(
                StudentProfile,
            ).where(
                StudentProfile.user_id
                == user_id,
            )
        )

        return result.scalar_one_or_none()


    async def add(
        self,
        profile: StudentProfile,
    ) -> None:
        self.session.add(profile)

        await self.session.flush()