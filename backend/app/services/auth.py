from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hmac import compare_digest
from uuid import UUID, uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    ConflictError,
    UnauthorizedError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.auth_session import AuthSession
from app.models.user import User
from app.repositories.auth import AuthRepository
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
)


@dataclass(slots=True)
class AuthResult:
    user: User
    access_token: str
    refresh_token: str


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

        self.repository = AuthRepository(
            session,
        )


    async def register(
        self,
        payload: RegisterRequest,
    ) -> AuthResult:
        email = str(
            payload.email,
        ).strip().lower()

        existing_user = (
            await self.repository.get_user_by_email(
                email,
            )
        )

        if existing_user is not None:
            raise ConflictError(
                code="EMAIL_ALREADY_REGISTERED",
                message=(
                    "An account with this email already exists."
                ),
            )

        user = User(
            email=email,
            full_name=payload.full_name,
            password_hash=hash_password(
                payload.password,
            ),
        )

        try:
            await self.repository.add_user(
                user,
            )

            result = (
                await self._create_login_session(
                    user,
                )
            )

            await self.session.commit()

            return result

        except IntegrityError as exc:
            await self.session.rollback()

            raise ConflictError(
                code="EMAIL_ALREADY_REGISTERED",
                message=(
                    "An account with this email already exists."
                ),
            ) from exc


    async def login(
        self,
        payload: LoginRequest,
    ) -> AuthResult:
        email = str(
            payload.email,
        ).strip().lower()

        user = (
            await self.repository.get_user_by_email(
                email,
            )
        )

        if (
            user is None
            or not verify_password(
                payload.password,
                user.password_hash,
            )
        ):
            raise UnauthorizedError(
                code="INVALID_CREDENTIALS",
                message=(
                    "The email or password is incorrect."
                ),
            )

        if not user.is_active:
            raise UnauthorizedError(
                code="ACCOUNT_DISABLED",
                message=(
                    "This account is currently disabled."
                ),
            )

        result = (
            await self._create_login_session(
                user,
            )
        )

        await self.session.commit()

        return result


    async def refresh(
        self,
        refresh_token: str,
    ) -> AuthResult:
        payload = decode_token(
            refresh_token,
            expected_type="refresh",
        )

        user_id, session_id = (
            self._extract_ids(
                payload,
            )
        )

        auth_session = (
            await self.repository.get_auth_session(
                session_id,
            )
        )

        now = datetime.now(
            timezone.utc,
        )

        if (
            auth_session is None
            or auth_session.user_id
            != user_id
            or auth_session.revoked_at
            is not None
            or auth_session.expires_at
            <= now
            or not compare_digest(
                auth_session.refresh_token_hash,
                hash_refresh_token(
                    refresh_token,
                ),
            )
        ):
            raise UnauthorizedError(
                code="SESSION_EXPIRED",
                message=(
                    "Your login session has expired."
                ),
            )

        user = (
            await self.repository.get_user_by_id(
                user_id,
            )
        )

        if (
            user is None
            or not user.is_active
        ):
            raise UnauthorizedError(
                code="UNAUTHORIZED",
                message=(
                    "Authentication is required."
                ),
            )

        new_refresh_token = (
            create_refresh_token(
                user_id=user.id,
                session_id=auth_session.id,
            )
        )

        auth_session.refresh_token_hash = (
            hash_refresh_token(
                new_refresh_token,
            )
        )

        auth_session.expires_at = (
            now
            + timedelta(
                days=(
                    settings.refresh_token_expire_days
                ),
            )
        )

        access_token = (
            create_access_token(
                user_id=user.id,
                session_id=auth_session.id,
            )
        )

        await self.session.commit()

        return AuthResult(
            user=user,
            access_token=access_token,
            refresh_token=new_refresh_token,
        )


    async def logout(
        self,
        refresh_token: str | None,
    ) -> None:
        if refresh_token is None:
            return

        try:
            payload = decode_token(
                refresh_token,
                expected_type="refresh",
            )
        except UnauthorizedError:
            return

        user_id, session_id = (
            self._extract_ids(
                payload,
            )
        )

        auth_session = (
            await self.repository.get_auth_session(
                session_id,
            )
        )

        if (
            auth_session is None
            or auth_session.user_id
            != user_id
        ):
            return

        auth_session.revoked_at = (
            datetime.now(
                timezone.utc,
            )
        )

        await self.session.commit()


    async def _create_login_session(
        self,
        user: User,
    ) -> AuthResult:
        session_id = uuid4()

        expires_at = (
            datetime.now(
                timezone.utc,
            )
            + timedelta(
                days=(
                    settings.refresh_token_expire_days
                ),
            )
        )

        refresh_token = (
            create_refresh_token(
                user_id=user.id,
                session_id=session_id,
            )
        )

        auth_session = AuthSession(
            id=session_id,
            user_id=user.id,
            refresh_token_hash=(
                hash_refresh_token(
                    refresh_token,
                )
            ),
            expires_at=expires_at,
        )

        await self.repository.add_auth_session(
            auth_session,
        )

        access_token = (
            create_access_token(
                user_id=user.id,
                session_id=session_id,
            )
        )

        return AuthResult(
            user=user,
            access_token=access_token,
            refresh_token=refresh_token,
        )


    @staticmethod
    def _extract_ids(
        payload: dict[str, object],
    ) -> tuple[UUID, UUID]:
        try:
            user_id = UUID(
                str(payload["sub"]),
            )

            session_id = UUID(
                str(payload["sid"]),
            )

        except (
            KeyError,
            ValueError,
        ) as exc:
            raise UnauthorizedError(
                code="INVALID_TOKEN",
                message=(
                    "The authentication token is invalid."
                ),
            ) from exc

        return (
            user_id,
            session_id,
        )