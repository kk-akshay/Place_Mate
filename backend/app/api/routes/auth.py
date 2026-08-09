from typing import Annotated

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    Response,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.db.session import get_db_session
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserRead,
)
from app.services.auth import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def set_refresh_cookie(
    response: Response,
    refresh_token: str,
) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        max_age=(
            settings.refresh_token_expire_days
            * 24
            * 60
            * 60
        ),
        path=(
            f"{settings.api_v1_prefix}/auth"
        ),
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    response: Response,
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> AuthResponse:
    result = await AuthService(
        session,
    ).register(payload)

    set_refresh_cookie(
        response,
        result.refresh_token,
    )

    return AuthResponse(
        access_token=result.access_token,
        user=UserRead.model_validate(
            result.user,
        ),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
async def login(
    payload: LoginRequest,
    response: Response,
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> AuthResponse:
    result = await AuthService(
        session,
    ).login(payload)

    set_refresh_cookie(
        response,
        result.refresh_token,
    )

    return AuthResponse(
        access_token=result.access_token,
        user=UserRead.model_validate(
            result.user,
        ),
    )


@router.post(
    "/refresh",
    response_model=AuthResponse,
)
async def refresh(
    response: Response,
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    refresh_token: Annotated[
        str | None,
        Cookie(
            alias=settings.refresh_cookie_name,
        ),
    ] = None,
) -> AuthResponse:
    if refresh_token is None:
        raise UnauthorizedError(
            code="REFRESH_TOKEN_MISSING",
            message=(
                "A valid login session is required."
            ),
        )

    result = await AuthService(
        session,
    ).refresh(refresh_token)

    set_refresh_cookie(
        response,
        result.refresh_token,
    )

    return AuthResponse(
        access_token=result.access_token,
        user=UserRead.model_validate(
            result.user,
        ),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(
    response: Response,
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    refresh_token: Annotated[
        str | None,
        Cookie(
            alias=settings.refresh_cookie_name,
        ),
    ] = None,
) -> None:
    await AuthService(
        session,
    ).logout(refresh_token)

    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=(
            f"{settings.api_v1_prefix}/auth"
        ),
    )