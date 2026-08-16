from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    status,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.api.dependencies import (
    get_current_user,
)
from app.db.session import (
    get_db_session,
)
from app.models.user import User
from app.schemas.aptitude import (
    AptitudeAttemptRead,
    AptitudeCatalogRead,
    AptitudeProgressRead,
    AptitudeResultRead,
    StartAptitudeAttemptRequest,
    SubmitAptitudeAttemptRequest,
)
from app.services.aptitude import (
    AptitudeService,
)

router = APIRouter(
    prefix="/aptitude",
    tags=["Aptitude"],
)


@router.get(
    "/catalog",
    response_model=
        AptitudeCatalogRead,
)
async def get_catalog(
    user: Annotated[
        User,
        Depends(
            get_current_user,
        ),
    ],
    session: Annotated[
        AsyncSession,
        Depends(
            get_db_session,
        ),
    ],
) -> AptitudeCatalogRead:
    del user

    return (
        await AptitudeService(
            session,
        ).get_catalog()
    )


@router.post(
    "/attempts",
    response_model=
        AptitudeAttemptRead,
    status_code=
        status
        .HTTP_201_CREATED,
)
async def start_attempt(
    payload:
        StartAptitudeAttemptRequest,
    user: Annotated[
        User,
        Depends(
            get_current_user,
        ),
    ],
    session: Annotated[
        AsyncSession,
        Depends(
            get_db_session,
        ),
    ],
) -> AptitudeAttemptRead:
    return (
        await AptitudeService(
            session,
        ).start_attempt(
            user,
            payload,
        )
    )


@router.get(
    "/attempts/{attempt_id}",
    response_model=
        AptitudeAttemptRead,
)
async def get_attempt(
    attempt_id: UUID,
    user: Annotated[
        User,
        Depends(
            get_current_user,
        ),
    ],
    session: Annotated[
        AsyncSession,
        Depends(
            get_db_session,
        ),
    ],
) -> AptitudeAttemptRead:
    return (
        await AptitudeService(
            session,
        ).get_active_attempt(
            user,
            attempt_id,
        )
    )


@router.post(
    "/attempts/{attempt_id}/submit",
    response_model=
        AptitudeResultRead,
)
async def submit_attempt(
    attempt_id: UUID,
    payload:
        SubmitAptitudeAttemptRequest,
    user: Annotated[
        User,
        Depends(
            get_current_user,
        ),
    ],
    session: Annotated[
        AsyncSession,
        Depends(
            get_db_session,
        ),
    ],
) -> AptitudeResultRead:
    return (
        await AptitudeService(
            session,
        ).submit_attempt(
            user,
            attempt_id,
            payload,
        )
    )


@router.get(
    "/attempts/{attempt_id}/result",
    response_model=
        AptitudeResultRead,
)
async def get_result(
    attempt_id: UUID,
    user: Annotated[
        User,
        Depends(
            get_current_user,
        ),
    ],
    session: Annotated[
        AsyncSession,
        Depends(
            get_db_session,
        ),
    ],
) -> AptitudeResultRead:
    return (
        await AptitudeService(
            session,
        ).get_result(
            user,
            attempt_id,
        )
    )


@router.get(
    "/progress",
    response_model=
        AptitudeProgressRead,
)
async def get_progress(
    user: Annotated[
        User,
        Depends(
            get_current_user,
        ),
    ],
    session: Annotated[
        AsyncSession,
        Depends(
            get_db_session,
        ),
    ],
) -> AptitudeProgressRead:
    return (
        await AptitudeService(
            session,
        ).get_progress(
            user,
        )
    )