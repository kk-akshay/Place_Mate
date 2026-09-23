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
