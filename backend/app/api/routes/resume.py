from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
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
    InvalidRequestError,
    ServiceUnavailableError,
)
from app.db.session import (
    get_db_session,
)
from app.models.user import User
from app.schemas.resume import (
    ResumeAnalysisListRead,
    ResumeAnalysisRead,
)
from app.services.resume import (
    ResumeService,
)


router = APIRouter(
    prefix="/resume",
    tags=["Resume"],
)


@router.post(
    "/analyze",
    response_model=(
        ResumeAnalysisRead
    ),
)
async def analyze_resume(
    file: Annotated[
        UploadFile,
        File(),
    ],
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
    target_role: Annotated[
        str | None,
        Form(),
    ] = None,
) -> ResumeAnalysisRead:
    file_bytes = await file.read()

    try:
        return (
            await ResumeService(
                session
            ).analyze(
                user=user,
                filename=(
                    file.filename
                    or "resume.pdf"
                ),
                file_bytes=(
                    file_bytes
                ),
                target_role=(
                    target_role
                ),
            )
        )

    except ValueError as exc:
        raise InvalidRequestError(
            message=str(exc),
        ) from exc

    except AIProviderError as exc:
        raise ServiceUnavailableError(
            message=str(exc),
        ) from exc


@router.get(
    "/analyses",
    response_model=(
        ResumeAnalysisListRead
    ),
)
async def list_analyses(
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
) -> ResumeAnalysisListRead:
    return await ResumeService(
        session
    ).list_analyses(
        user
    )

