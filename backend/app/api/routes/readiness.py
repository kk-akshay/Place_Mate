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
from app.schemas.readiness import (
    ReadinessRead,
)
from app.services.readiness import (
    ReadinessService,
)

router = APIRouter(
    prefix="/readiness",
    tags=["Readiness"],
)


@router.get(
    "",
    response_model=ReadinessRead,
)
async def get_readiness(
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
) -> ReadinessRead:
    return await ReadinessService(
        session,
    ).get_readiness(
        user,
    )