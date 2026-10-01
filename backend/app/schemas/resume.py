from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    model_validator,
)


class ResumeAIResult(
    BaseModel,
):
    is_resume: bool = True

    detected_document_type: str | None = None

    overall_score: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    summary: str = ""

    strengths: list[str] = Field(
        default_factory=list,
        max_length=10,
    )

    weaknesses: list[str] = Field(
        default_factory=list,
        max_length=10,
    )

    missing_keywords: list[str] = (
        Field(
            default_factory=list,
            max_length=30,
        )
    )

    suggestions: list[str] = Field(
        default_factory=list,
        max_length=15,
    )

    improved_summary: str = ""

    @model_validator(mode="after")
    def require_analysis_for_resumes(
        self,
    ) -> "ResumeAIResult":
        # Real resumes must still be fully analysed, exactly as
        # before (these fields used to be required). Only
        # non-resume results may leave them empty.
        if self.is_resume and (
            "overall_score"
            not in self.model_fields_set
            or not self.summary.strip()
            or not self.improved_summary.strip()
        ):
            raise ValueError(
                "A resume analysis must include "
                "overall_score, summary and "
                "improved_summary."
            )

        return self


class ResumeAnalysisRead(
    BaseModel,
):
    id: UUID | None = None

    original_filename: str

    target_role: str

    is_resume: bool = True

    rejection_reason: str | None = None

    overall_score: int

    summary: str

    strengths: list[str]

    weaknesses: list[str]

    missing_keywords: list[str]

    suggestions: list[str]

    improved_summary: str

    created_at: datetime | None = None


class ResumeAnalysisListRead(
    BaseModel,
):
    analyses: list[
        ResumeAnalysisRead
    ] = Field(
        default_factory=list,
    )