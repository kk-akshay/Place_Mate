from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
)


class ResumeAIResult(
    BaseModel,
):
    overall_score: int = Field(
        ge=0,
        le=100,
    )

    summary: str

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
            max_length=20,
        )
    )

    suggestions: list[str] = Field(
        default_factory=list,
        max_length=15,
    )

    improved_summary: str


class ResumeAnalysisRead(
    BaseModel,
):
    id: UUID

    original_filename: str

    target_role: str

    overall_score: int

    summary: str

    strengths: list[str]

    weaknesses: list[str]

    missing_keywords: list[str]

    suggestions: list[str]

    improved_summary: str

    created_at: datetime


class ResumeAnalysisListRead(
    BaseModel,
):
    analyses: list[
        ResumeAnalysisRead
    ] = Field(
        default_factory=list,
    )