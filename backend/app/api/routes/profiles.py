from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.session import get_db_session
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.profile import (
    ProfileStatusRead,
    StudentProfileRead,
    StudentProfileUpsert,
)
from app.services.profile import ProfileService

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"],
)


@router.get(
    "/me/status",
    response_model=ProfileStatusRead,
)
async def get_profile_status(
    user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> ProfileStatusRead:
    completed = (
        await ProfileService(
            session,
        ).has_completed_onboarding(
            user,
        )
    )

    return ProfileStatusRead(
        onboarding_completed=completed,
    )


@router.get(
    "/me",
    response_model=StudentProfileRead,
)
async def get_my_profile(
    user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> StudentProfile:
    return await ProfileService(
        session,
    ).get_for_user(
        user,
    )


@router.put(
    "/me",
    response_model=StudentProfileRead,
)
async def save_my_profile(
    payload: StudentProfileUpsert,
    user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> StudentProfile:
    return await ProfileService(
        session,
    ).upsert(
        user,
        payload,
    )