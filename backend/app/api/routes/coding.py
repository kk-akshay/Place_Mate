from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
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
from app.schemas.coding import (
    CodingExecutionRead,
    CodingExecutionRequest,
    CodingProgressRead,
    CodingQuestionListRead,
    CodingQuestionRead,
)
from app.services.coding import (
    CodingService,
)

router = APIRouter(
    prefix="/coding",
    tags=["Coding"],
)


@router.get(
    "/questions",
    response_model=(
        CodingQuestionListRead
    ),
)
async def list_questions(
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
    difficulty: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=20,
        ),
    ] = None,
    topic: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=80,
        ),
    ] = None,
) -> CodingQuestionListRead:
    del user

    return await CodingService(
        session
    ).list_questions(
        difficulty=difficulty,
        topic=topic,
    )


@router.get(
    "/progress",
    response_model=(
        CodingProgressRead
    ),
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
) -> CodingProgressRead:
    return await CodingService(
        session
    ).get_progress(
        user
    )


@router.get(
    "/questions/{question_id}",
    response_model=(
        CodingQuestionRead
    ),
)
async def get_question(
    question_id: UUID,
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
) -> CodingQuestionRead:
    del user

    return await CodingService(
        session
    ).get_question(
        question_id
    )


@router.post(
    "/questions/{question_id}/run",
    response_model=(
        CodingExecutionRead
    ),
)
async def run_code(
    question_id: UUID,
    payload: CodingExecutionRequest,
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
) -> CodingExecutionRead:
    del user

    return await CodingService(
        session
    ).run_code(
        question_id,
        payload,
    )


@router.post(
    "/questions/{question_id}/submit",
    response_model=(
        CodingExecutionRead
    ),
)
async def submit_code(
    question_id: UUID,
    payload: CodingExecutionRequest,
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
) -> CodingExecutionRead:
    return await CodingService(
        session
    ).submit_code(
        user,
        question_id,
        payload,
    )