from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
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
from app.schemas.preparation import (
    FinishPreparationActivityRequest,
    PreparationActivityRead,
    StartPreparationActivityRequest,
    WeeklyPreparationSummary,
)
from app.services.preparation import (
    PreparationService,
)

router = APIRouter(
    prefix="/preparation",
    tags=["Preparation"],
)


@router.get(
    "/weekly",
    response_model=
        WeeklyPreparationSummary,
)
async def get_weekly_summary(
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
) -> WeeklyPreparationSummary:
    return (
        await PreparationService(
            session,
        ).get_weekly_summary(
            user,
        )
    )


@router.post(
    "/activities/start",
    response_model=
        PreparationActivityRead,
)
async def start_activity(
    payload:
        StartPreparationActivityRequest,
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
) -> PreparationActivityRead:
    return (
        await PreparationService(
            session,
        ).start_activity(
            user,
            payload,
        )
    )


@router.post(
    "/activities/finish",
    response_model=
        PreparationActivityRead,
)
async def finish_activity(
    payload:
        FinishPreparationActivityRequest,
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
) -> PreparationActivityRead:
    return (
        await PreparationService(
            session,
        ).finish_activity(
            user,
            payload,
        )
    )