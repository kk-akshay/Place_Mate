from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_session import AuthSession
from app.models.user import User


class AuthRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session


    async def get_user_by_email(
        self,
        email: str,
    ) -> User | None:
        result = await self.session.execute(
            select(User).where(
                User.email == email,
            )
        )

        return result.scalar_one_or_none()


    async def get_user_by_id(
        self,
        user_id: UUID,
    ) -> User | None:
        return await self.session.get(
            User,
            user_id,
        )


    async def get_auth_session(
        self,
        session_id: UUID,
    ) -> AuthSession | None:
        return await self.session.get(
            AuthSession,
            session_id,
        )


    async def add_user(
        self,
        user: User,
    ) -> None:
        self.session.add(user)

        await self.session.flush()


    async def add_auth_session(
        self,
        auth_session: AuthSession,
    ) -> None:
        self.session.add(
            auth_session,
        )

        await self.session.flush()