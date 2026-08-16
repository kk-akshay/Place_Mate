from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.repositories.profile import ProfileRepository
from app.schemas.profile import StudentProfileUpsert


class ProfileService:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

        self.repository = ProfileRepository(
            session,
        )


    async def get_for_user(
        self,
        user: User,
    ) -> StudentProfile:
        profile = (
            await self.repository.get_by_user_id(
                user.id,
            )
        )

        if profile is None:
            raise ResourceNotFoundError(
                "Your student profile has not been created yet."
            )

        return profile


    async def has_completed_onboarding(
        self,
        user: User,
    ) -> bool:
        profile = (
            await self.repository.get_by_user_id(
                user.id,
            )
        )

        return profile is not None


    async def upsert(
        self,
        user: User,
        payload: StudentProfileUpsert,
    ) -> StudentProfile:
        profile = (
            await self.repository.get_by_user_id(
                user.id,
            )
        )

        data = payload.model_dump()

        if profile is None:
            profile = StudentProfile(
                user_id=user.id,
                **data,
            )

            await self.repository.add(
                profile,
            )

        else:
            for (
                field,
                value,
            ) in data.items():
                setattr(
                    profile,
                    field,
                    value,
                )

        await self.session.commit()

        await self.session.refresh(
            profile,
        )

        return profile