from uuid import UUID

from sqlalchemy import (
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.resume_analysis import (
    ResumeAnalysis,
)
from app.models.student_profile import (
    StudentProfile,
)


class ResumeRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def get_profile(
        self,
        user_id: UUID,
    ) -> StudentProfile | None:
        result = (
            await self.session.execute(
                select(
                    StudentProfile
                ).where(
                    StudentProfile
                    .user_id
                    == user_id
                )
            )
        )

        return (
            result
            .scalars()
            .one_or_none()
        )

    async def add_analysis(
        self,
        analysis: ResumeAnalysis,
    ) -> None:
        self.session.add(
            analysis
        )

        await self.session.flush()

    async def list_analyses(
        self,
        user_id: UUID,
    ) -> list[
        ResumeAnalysis
    ]:
        result = (
            await self.session.execute(
                select(
                    ResumeAnalysis
                )
                .where(
                    ResumeAnalysis.user_id
                    == user_id
                )
                .order_by(
                    ResumeAnalysis
                    .created_at
                    .desc()
                )
            )
        )

        return list(
            result.scalars().all()
        )