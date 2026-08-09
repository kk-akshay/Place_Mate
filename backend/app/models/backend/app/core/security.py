from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Any, Literal
from uuid import UUID, uuid4

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

TokenType = Literal[
    "access",
    "refresh",
]


password_hasher = PasswordHash.recommended()


def hash_password(
    password: str,
) -> str:
    return password_hasher.hash(
        password,
    )


def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    return password_hasher.verify(
        password,
        password_hash,
    )


def hash_refresh_token(
    token: str,
) -> str:
    return sha256(
        token.encode("utf-8")
    ).hexdigest()


def create_access_token(
    *,
    user_id: UUID,
    session_id: UUID,
) -> str:
    return _create_token(
        user_id=user_id,
        session_id=session_id,
        token_type="access",
        expires_delta=timedelta(
            minutes=(
                settings.access_token_expire_minutes
            ),
        ),
    )


def create_refresh_token(
    *,
    user_id: UUID,
    session_id: UUID,
) -> str:
    return _create_token(
        user_id=user_id,
        session_id=session_id,
        token_type="refresh",
        expires_delta=timedelta(
            days=(
                settings.refresh_token_expire_days
            ),
        ),
    )


def _create_token(
    *,
    user_id: UUID,
    session_id: UUID,
    token_type: TokenType,
    expires_delta: timedelta,
) -> str:
    now = datetime.now(
        timezone.utc,
    )

    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "type": token_type,
        "jti": str(uuid4()),
        "iat": now,
        "exp": now + expires_delta,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(
    token: str,
    *,
    expected_type: TokenType,
) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[
                settings.jwt_algorithm,
            ],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
            options={
                "require": [
                    "sub",
                    "sid",
                    "type",
                    "jti",
                    "iat",
                    "exp",
                    "iss",
                    "aud",
                ],
            },
        )
    except InvalidTokenError as exc:
        raise UnauthorizedError(
            code="INVALID_TOKEN",
            message=(
                "The authentication token is invalid or expired."
            ),
        ) from exc

    if (
        payload.get("type")
        != expected_type
    ):
        raise UnauthorizedError(
            code="INVALID_TOKEN_TYPE",
            message=(
                "The authentication token type is invalid."
            ),
        )

    return payload