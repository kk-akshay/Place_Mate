from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db_session
from app.models.user import User
from app.repositories.auth import AuthRepository

bearer_scheme = HTTPBearer(
    auto_error=False,
)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> User:
    if credentials is None:
        raise UnauthorizedError()

    payload = decode_token(
        credentials.credentials,
        expected_type="access",
    )

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

    repository = AuthRepository(
        session,
    )

    auth_session = (
        await repository.get_auth_session(
            session_id,
        )
    )

    if (
        auth_session is None
        or auth_session.user_id != user_id
        or auth_session.revoked_at
        is not None
        or auth_session.expires_at
        <= datetime.now(timezone.utc)
    ):
        raise UnauthorizedError(
            code="SESSION_EXPIRED",
            message=(
                "Your login session has expired."
            ),
        )

    user = (
        await repository.get_user_by_id(
            user_id,
        )
    )

    if (
        user is None
        or not user.is_active
    ):
        raise UnauthorizedError()

    return user