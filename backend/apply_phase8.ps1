# Place-Mate Phase 8 - apply backend changes
# Run this from inside the backend\ folder (same place you ran `alembic history`)
$ErrorActionPreference = 'Stop'

# ---- app\ai\providers\base.py ----
New-Item -ItemType Directory -Force -Path 'app\ai\providers' | Out-Null
@'
from abc import ABC, abstractmethod
from typing import Any


class AIProviderError(Exception):
    """
    Raised whenever the configured AI provider cannot produce a
    usable JSON response - unreachable API, rejected key, rate
    limit, malformed response, etc.

    Callers only ever need to catch this one exception type; each
    provider implementation is responsible for translating its own
    failure modes (network errors, HTTP status codes, bad JSON) into
    an AIProviderError with a clear, user-safe message.
    """


class AIProvider(ABC):
    """
    Common interface every AI provider (Groq, Gemini, ...) must
    implement so the rest of the app never needs to know which
    provider is actually configured.
    """

    @abstractmethod
    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Ask the model for a JSON object and return it as a parsed
        dict. `schema` is a JSON Schema (as produced by Pydantic's
        `model_json_schema()`) describing the expected shape; it is
        used to instruct the model, not to strictly enforce the
        response - callers must still validate the result themselves
        (the resume service does this with Pydantic).

        Must raise AIProviderError for any failure instead of
        letting provider-specific exceptions escape.
        """
        raise NotImplementedError

'@ | Set-Content -Path 'app\ai\providers\base.py' -Encoding UTF8

# ---- app\ai\providers\groq.py ----
New-Item -ItemType Directory -Force -Path 'app\ai\providers' | Out-Null
@'
import json
from typing import Any

import httpx

from app.ai.providers.base import (
    AIProvider,
    AIProviderError,
)

GROQ_CHAT_COMPLETIONS_URL = (
    "https://api.groq.com/openai/v1/chat/completions"
)


class GroqProvider(AIProvider):
    """
    Cloud AI provider backed by Groq's OpenAI-compatible chat
    completions API. No local process, no laptop dependency - this
    is a plain HTTPS call using the existing `httpx` dependency.
    """

    def __init__(self, *, api_key: str, model: str) -> None:
        if not api_key:
            raise AIProviderError(
                "GROQ_API_KEY is not configured on the server."
            )

        self._api_key = api_key
        self._model = model

    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        schema_instructions = (
            "Respond with a single JSON object only. "
            "Do not include markdown, code fences, or any text "
            "before or after the JSON object. "
            "The JSON object must conform to this JSON Schema:\n"
            f"{json.dumps(schema)}"
        )

        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        f"{system_prompt}\n\n{schema_instructions}"
                    ),
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            "response_format": {
                "type": "json_object",
            },
            "temperature": 0.3,
        }

        try:
            async with httpx.AsyncClient(
                timeout=60.0,
            ) as client:
                response = await client.post(
                    GROQ_CHAT_COMPLETIONS_URL,
                    headers={
                        "Authorization": (
                            f"Bearer {self._api_key}"
                        ),
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise AIProviderError(
                "Could not reach the Groq API."
            ) from exc

        if response.status_code in (401, 403):
            raise AIProviderError(
                "The Groq API key was rejected. "
                "Check the GROQ_API_KEY value."
            )

        if response.status_code == 429:
            raise AIProviderError(
                "The Groq API rate limit was reached. "
                "Please try again shortly."
            )

        if response.status_code >= 400:
            raise AIProviderError(
                "The Groq API returned an error "
                f"(HTTP {response.status_code})."
            )

        try:
            body = response.json()
            content = (
                body["choices"][0]["message"]["content"]
            )
        except (
            KeyError,
            IndexError,
            ValueError,
        ) as exc:
            raise AIProviderError(
                "The Groq API returned an unexpected "
                "response shape."
            ) from exc

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise AIProviderError(
                "The Groq API did not return valid JSON."
            ) from exc

'@ | Set-Content -Path 'app\ai\providers\groq.py' -Encoding UTF8

# ---- app\ai\providers\gemini.py ----
New-Item -ItemType Directory -Force -Path 'app\ai\providers' | Out-Null
@'
import json
from typing import Any

import httpx

from app.ai.providers.base import (
    AIProvider,
    AIProviderError,
)

GEMINI_GENERATE_CONTENT_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/{model}:generateContent"
)


class GeminiProvider(AIProvider):
    """
    Cloud AI provider backed by Google's Gemini API. Implements the
    same interface as GroqProvider so `AI_PROVIDER=gemini` in the
    environment is the only change needed to switch providers - no
    code changes anywhere else in the app.
    """

    def __init__(self, *, api_key: str, model: str) -> None:
        if not api_key:
            raise AIProviderError(
                "GEMINI_API_KEY is not configured on the server."
            )

        self._api_key = api_key
        self._model = model

    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        schema_instructions = (
            "Respond with a single JSON object only. "
            "Do not include markdown, code fences, or any text "
            "before or after the JSON object. "
            "The JSON object must conform to this JSON Schema:\n"
            f"{json.dumps(schema)}"
        )

        payload = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            f"{system_prompt}\n\n"
                            f"{schema_instructions}"
                        ),
                    },
                ],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": user_prompt},
                    ],
                },
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.3,
            },
        }

        url = GEMINI_GENERATE_CONTENT_URL.format(
            model=self._model,
        )

        try:
            async with httpx.AsyncClient(
                timeout=60.0,
            ) as client:
                response = await client.post(
                    url,
                    params={"key": self._api_key},
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise AIProviderError(
                "Could not reach the Gemini API."
            ) from exc

        if response.status_code in (400, 401, 403):
            raise AIProviderError(
                "The Gemini API key was rejected. "
                "Check the GEMINI_API_KEY value."
            )

        if response.status_code == 429:
            raise AIProviderError(
                "The Gemini API rate limit was reached. "
                "Please try again shortly."
            )

        if response.status_code >= 400:
            raise AIProviderError(
                "The Gemini API returned an error "
                f"(HTTP {response.status_code})."
            )

        try:
            body = response.json()
            content = (
                body["candidates"][0]["content"]
                ["parts"][0]["text"]
            )
        except (
            KeyError,
            IndexError,
            ValueError,
        ) as exc:
            raise AIProviderError(
                "The Gemini API returned an unexpected "
                "response shape."
            ) from exc

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise AIProviderError(
                "The Gemini API did not return valid JSON."
            ) from exc

'@ | Set-Content -Path 'app\ai\providers\gemini.py' -Encoding UTF8

# ---- app\ai\providers\factory.py ----
New-Item -ItemType Directory -Force -Path 'app\ai\providers' | Out-Null
@'
from functools import lru_cache

from app.ai.providers.base import (
    AIProvider,
    AIProviderError,
)
from app.core.config import settings


@lru_cache
def get_ai_provider() -> AIProvider:
    """
    Return the AI provider selected by the AI_PROVIDER environment
    variable ("groq" or "gemini"). Cached so the same provider
    instance is reused across requests within one running process.
    """

    provider_name = settings.ai_provider.strip().lower()

    if provider_name == "groq":
        from app.ai.providers.groq import GroqProvider

        return GroqProvider(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
        )

    if provider_name == "gemini":
        from app.ai.providers.gemini import GeminiProvider

        return GeminiProvider(
            api_key=settings.gemini_api_key,
            model=settings.gemini_model,
        )

    raise AIProviderError(
        f"Unsupported AI_PROVIDER '{provider_name}'. "
        "Use 'groq' or 'gemini'."
    )

'@ | Set-Content -Path 'app\ai\providers\factory.py' -Encoding UTF8

# ---- app\core\config.py ----
New-Item -ItemType Directory -Force -Path 'app\core' | Out-Null
@'
from functools import lru_cache
from typing import Literal

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    app_name: str = "AI Placement Preparation Platform API"

    jwt_secret_key: str

    jwt_algorithm: str = "HS256"

    jwt_issuer: str = "place-mate-api"

    jwt_audience: str = "place-mate-web"

    access_token_expire_minutes: int = 15

    refresh_token_expire_days: int = 7

    refresh_cookie_name: str = (
        "place_mate_refresh_token"
    )

    refresh_cookie_secure: bool = False

    refresh_cookie_samesite: Literal[
        "lax",
        "strict",
        "none",
    ] = "lax"

    environment: Literal[
        "development",
        "test",
        "production",
    ] = "development"

    api_v1_prefix: str = "/api/v1"

    database_url: str

    frontend_url: str = "http://localhost:3000"

    ai_provider: str = "groq"

    groq_api_key: str = ""

    groq_model: str = "llama-3.3-70b-versatile"

    gemini_api_key: str = ""

    gemini_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
'@ | Set-Content -Path 'app\core\config.py' -Encoding UTF8

# ---- app\core\exceptions.py ----
New-Item -ItemType Directory -Force -Path 'app\core' | Out-Null
@'
from typing import Any


class AppException(Exception):
    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int,
        details: Any | None = None,
    ) -> None:
        super().__init__(message)

        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class ResourceNotFoundError(AppException):
    def __init__(
        self,
        message: str = "The requested resource was not found.",
    ) -> None:
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=message,
            status_code=404,
        )


class ConflictError(AppException):
    def __init__(
        self,
        *,
        code: str = "RESOURCE_CONFLICT",
        message: str = "The requested operation conflicts with existing data.",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=409,
        )


class UnauthorizedError(AppException):
    def __init__(
        self,
        message: str = "Authentication is required.",
        code: str = "UNAUTHORIZED",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=401,
        )


class ForbiddenError(AppException):
    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
    ) -> None:
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=403,
        )


class InvalidRequestError(AppException):
    def __init__(
        self,
        message: str,
        code: str = "INVALID_REQUEST",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=400,
        )


class ServiceUnavailableError(AppException):
    def __init__(
        self,
        message: str = "An upstream service is temporarily unavailable.",
        code: str = "SERVICE_UNAVAILABLE",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=503,
        )
'@ | Set-Content -Path 'app\core\exceptions.py' -Encoding UTF8

# ---- app\api\router.py ----
New-Item -ItemType Directory -Force -Path 'app\api' | Out-Null
@'
from fastapi import (
    APIRouter,
)

from app.api.routes import (
    aptitude,
    auth,
    coding,
    health,
    preparation,
    profiles,
    resume,
    users,
)

api_router = (
    APIRouter()
)


api_router.include_router(
    health.router,
)

api_router.include_router(
    auth.router,
)

api_router.include_router(
    users.router,
)

api_router.include_router(
    profiles.router,
)

api_router.include_router(
    aptitude.router,
)

api_router.include_router(
    preparation.router,
)

api_router.include_router(
    coding.router,
)

api_router.include_router(
    resume.router,
)
'@ | Set-Content -Path 'app\api\router.py' -Encoding UTF8

# ---- app\api\routes\resume.py ----
New-Item -ItemType Directory -Force -Path 'app\api\routes' | Out-Null
@'
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

'@ | Set-Content -Path 'app\api\routes\resume.py' -Encoding UTF8

# ---- app\services\resume.py ----
New-Item -ItemType Directory -Force -Path 'app\services' | Out-Null
@'
from io import BytesIO

from pydantic import (
    ValidationError,
)
from pypdf import (
    PdfReader,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.ai.prompts.resume import (
    build_resume_prompts,
)
from app.ai.providers.base import (
    AIProviderError,
)
from app.ai.providers.factory import (
    get_ai_provider,
)
from app.models.resume_analysis import (
    ResumeAnalysis,
)
from app.models.user import User
from app.repositories.resume import (
    ResumeRepository,
)
from app.schemas.resume import (
    ResumeAIResult,
    ResumeAnalysisListRead,
    ResumeAnalysisRead,
)


MAX_RESUME_BYTES = (
    5 * 1024 * 1024
)


class ResumeService:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

        self.repository = (
            ResumeRepository(
                session
            )
        )

        self.ai = (
            get_ai_provider()
        )

    async def analyze(
        self,
        *,
        user: User,
        filename: str,
        file_bytes: bytes,
        target_role: str | None,
    ) -> ResumeAnalysisRead:
        if not filename.lower().endswith(
            ".pdf"
        ):
            raise ValueError(
                "Only PDF resumes "
                "are supported."
            )

        if (
            len(file_bytes)
            > MAX_RESUME_BYTES
        ):
            raise ValueError(
                "Resume PDF must be "
                "5 MB or smaller."
            )

        resume_text = (
            self._extract_pdf_text(
                file_bytes
            )
        )

        if (
            len(
                resume_text.strip()
            )
            < 100
        ):
            raise ValueError(
                "The PDF does not contain "
                "enough extractable text."
            )

        profile = (
            await self.repository
            .get_profile(
                user.id
            )
        )

        resolved_role = (
            target_role.strip()
            if (
                target_role
                and target_role
                .strip()
            )
            else (
                profile.target_roles[0]
                if (
                    profile
                    and profile.target_roles
                )
                else (
                    "Placement candidate"
                )
            )
        )

        (
            system_prompt,
            user_prompt,
        ) = build_resume_prompts(
            target_role=(
                resolved_role
            ),
            resume_text=(
                resume_text[:20_000]
            ),
        )

        raw = await self.ai.generate_json(
            system_prompt=(
                system_prompt
            ),
            user_prompt=user_prompt,
            schema=(
                ResumeAIResult
                .model_json_schema()
            ),
        )

        try:
            ai_result = (
                ResumeAIResult
                .model_validate(
                    raw
                )
            )
        except ValidationError as exc:
            raise AIProviderError(
                "The AI service returned a response "
                "that did not match the expected format."
            ) from exc

        analysis = ResumeAnalysis(
            user_id=user.id,
            original_filename=(
                filename
            ),
            target_role=(
                resolved_role
            ),
            overall_score=(
                ai_result
                .overall_score
            ),
            summary=(
                ai_result.summary
            ),
            strengths=(
                ai_result.strengths
            ),
            weaknesses=(
                ai_result.weaknesses
            ),
            missing_keywords=(
                ai_result
                .missing_keywords
            ),
            suggestions=(
                ai_result.suggestions
            ),
            improved_summary=(
                ai_result
                .improved_summary
            ),
        )

        await self.repository.add_analysis(
            analysis
        )

        await self.session.commit()

        await self.session.refresh(
            analysis
        )

        return self._build_read(
            analysis
        )

    async def list_analyses(
        self,
        user: User,
    ) -> ResumeAnalysisListRead:
        analyses = (
            await self.repository
            .list_analyses(
                user.id
            )
        )

        return ResumeAnalysisListRead(
            analyses=[
                self._build_read(
                    analysis
                )
                for analysis
                in analyses
            ]
        )

    @staticmethod
    def _extract_pdf_text(
        file_bytes: bytes,
    ) -> str:
        try:
            reader = PdfReader(
                BytesIO(
                    file_bytes
                )
            )

            text = "\n".join(
                (
                    page.extract_text()
                    or ""
                )
                for page
                in reader.pages
            )

        except Exception as exc:
            raise ValueError(
                "The PDF could not "
                "be read."
            ) from exc

        return text

    @staticmethod
    def _build_read(
        analysis: ResumeAnalysis,
    ) -> ResumeAnalysisRead:
        return ResumeAnalysisRead(
            id=analysis.id,
            original_filename=(
                analysis
                .original_filename
            ),
            target_role=(
                analysis.target_role
            ),
            overall_score=(
                analysis
                .overall_score
            ),
            summary=analysis.summary,
            strengths=(
                analysis.strengths
            ),
            weaknesses=(
                analysis.weaknesses
            ),
            missing_keywords=(
                analysis
                .missing_keywords
            ),
            suggestions=(
                analysis.suggestions
            ),
            improved_summary=(
                analysis
                .improved_summary
            ),
            created_at=(
                analysis.created_at
            ),
        )
'@ | Set-Content -Path 'app\services\resume.py' -Encoding UTF8

# ---- app\models\__init__.py ----
New-Item -ItemType Directory -Force -Path 'app\models' | Out-Null
@'
from app.models.aptitude import (
    AptitudeAnswer,
    AptitudeAttempt,
    AptitudeQuestion,
)
from app.models.auth_session import (
    AuthSession,
)
from app.models.coding import (
    CodingQuestion,
    CodingTestCase,
)
from app.models.coding_submission import (
    CodingSubmission,
)
from app.models.preparation_activity import (
    PreparationActivity,
)
from app.models.resume_analysis import (
    ResumeAnalysis,
)
from app.models.student_profile import (
    StudentProfile,
)
from app.models.user import User

__all__ = [
    
    "AptitudeAnswer",
    "AptitudeAttempt",
    "AptitudeQuestion",
    "AuthSession",
    "CodingQuestion",
    "CodingSubmission",
    "CodingTestCase",
    "PreparationActivity",
    "ResumeAnalysis",
    "StudentProfile",
    "User",
]
'@ | Set-Content -Path 'app\models\__init__.py' -Encoding UTF8

# ---- requirements.txt ----
@'
fastapi>=0.116,<1.0
uvicorn[standard]>=0.35,<1.0
sqlalchemy[asyncio]>=2.0,<3.0
asyncpg>=0.30,<1.0
alembic>=1.16,<2.0
pydantic-settings>=2.10,<3.0
PyJWT>=2.10,<3.0
pwdlib[argon2]>=0.3,<1.0
email-validator>=2.2,<3.0
httpx>=0.28,<1.0
pypdf>=6.0,<7.0
python-multipart>=0.0.20,<1.0

'@ | Set-Content -Path 'requirements.txt' -Encoding UTF8

# ---- .env.example ----
@'
APP_NAME=AI Placement Preparation Platform API
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql+asyncpg://placement_app:change_me@localhost:5432/placement_platform
FRONTEND_URL=http://localhost:3000
JWT_SECRET_KEY=replace-with-a-secure-random-secret
JWT_ALGORITHM=HS256
JWT_ISSUER=place-mate-api
JWT_AUDIENCE=place-mate-web

ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

REFRESH_COOKIE_NAME=place_mate_refresh_token
REFRESH_COOKIE_SECURE=false
REFRESH_COOKIE_SAMESITE=lax

AI_PROVIDER=groq

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

'@ | Set-Content -Path '.env.example' -Encoding UTF8

# ---- alembic\versions\4c8ec7504734_actually_add_resume_analyses_table.py ----
New-Item -ItemType Directory -Force -Path 'alembic\versions' | Out-Null
@'
"""actually add resume analyses table

Revision ID: 4c8ec7504734
Revises: 4844f59f87bd
Create Date: 2026-09-23 05:42:42.992424

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c8ec7504734'
down_revision: Union[str, Sequence[str], None] = '4844f59f87bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('resume_analyses',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('original_filename', sa.String(length=255), nullable=False),
    sa.Column('target_role', sa.String(length=120), nullable=False),
    sa.Column('overall_score', sa.Integer(), nullable=False),
    sa.Column('summary', sa.Text(), nullable=False),
    sa.Column('strengths', sa.JSON(), nullable=False),
    sa.Column('weaknesses', sa.JSON(), nullable=False),
    sa.Column('missing_keywords', sa.JSON(), nullable=False),
    sa.Column('suggestions', sa.JSON(), nullable=False),
    sa.Column('improved_summary', sa.Text(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_resume_analyses_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_resume_analyses'))
    )
    op.create_index(op.f('ix_resume_analyses_user_id'), 'resume_analyses', ['user_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_resume_analyses_user_id'), table_name='resume_analyses')
    op.drop_table('resume_analyses')
    # ### end Alembic commands ###

'@ | Set-Content -Path 'alembic\versions\4c8ec7504734_actually_add_resume_analyses_table.py' -Encoding UTF8

Write-Host 'All Phase 8 files written.' -ForegroundColor Green
