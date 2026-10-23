from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.ai.providers.base import (
    AIProviderError,
)
from app.api.dependencies import (
    get_current_user,
)
from app.core.exceptions import (
    ServiceUnavailableError,
)
from app.db.session import (
    get_db_session,
)
from app.models.user import User
from app.schemas.interview import (
    InterviewKind,
    InterviewSessionListRead,
    InterviewSessionRead,
    StartInterviewRequest,
    SubmitInterviewRequest,
)
from app.services.interview import (
    InterviewService,
)

router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
)


@router.post(
    "/sessions",
    response_model=InterviewSessionRead,
    status_code=status.HTTP_201_CREATED,
)
async def start_session(
    payload: StartInterviewRequest,
    user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> InterviewSessionRead:
    try:
        return await InterviewService(
            session,
        ).start_session(
            user,
            payload,
        )

    except AIProviderError as exc:
        raise ServiceUnavailableError(
            message=str(exc),
        ) from exc


@router.get(
    "/sessions",
    response_model=InterviewSessionListRead,
)
async def list_sessions(
    user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    kind: Annotated[
        InterviewKind | None,
        Query(),
    ] = None,
) -> InterviewSessionListRead:
    return await InterviewService(
        session,
    ).list_sessions(
        user,
        kind,
    )


@router.get(
    "/sessions/{session_id}",
    response_model=InterviewSessionRead,
)
async def get_session(
    session_id: UUID,
    user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> InterviewSessionRead:
    return await InterviewService(
        session,
    ).get_session(
        user,
        session_id,
    )


@router.post(
    "/sessions/{session_id}/submit",
    response_model=InterviewSessionRead,
)
async def submit_session(
    session_id: UUID,
    payload: SubmitInterviewRequest,
    user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> InterviewSessionRead:
    try:
        return await InterviewService(
            session,
        ).submit_session(
            user,
            session_id,
            payload,
        )

    except AIProviderError as exc:
        raise ServiceUnavailableError(
            message=str(exc),
        ) from exc