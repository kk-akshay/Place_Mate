from typing import Literal

from pydantic import (
    BaseModel,
    Field,
)

ReadinessModuleKey = Literal[
    "aptitude",
    "coding",
    "resume",
    "technical_interview",
    "hr_interview",
]

ReadinessModuleStatus = Literal[
    "not_started",
    "active",
    "coming_soon",
]

RecommendationPriority = Literal[
    "high",
    "medium",
    "low",
]


class ReadinessModule(
    BaseModel,
):
    key: ReadinessModuleKey

    label: str

    weight: float = Field(
        ge=0,
        le=1,
    )

    score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    status: ReadinessModuleStatus

    summary: str

    href: str | None = None


class TopicInsight(
    BaseModel,
):
    module: ReadinessModuleKey

    topic: str

    score: float = Field(
        ge=0,
        le=100,
    )

    sample_size: int = Field(
        ge=0,
    )

    detail: str


class ReadinessRecommendation(
    BaseModel,
):
    module: ReadinessModuleKey

    priority: RecommendationPriority

    title: str

    detail: str

    href: str | None = None


class ReadinessWeekly(
    BaseModel,
):
    budget_seconds: int

    spent_seconds: int

    used_percent: float


class ReadinessRead(
    BaseModel,
):
    overall_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    level: str

    coverage_percent: float = Field(
        ge=0,
        le=100,
    )

    target_roles: list[str] = Field(
        default_factory=list,
    )

    preparation_goals: list[str] = Field(
        default_factory=list,
    )

    declared_weak_areas: list[str] = Field(
        default_factory=list,
    )

    modules: list[
        ReadinessModule
    ] = Field(
        default_factory=list,
    )

    strengths: list[
        TopicInsight
    ] = Field(
        default_factory=list,
    )

    weaknesses: list[
        TopicInsight
    ] = Field(
        default_factory=list,
    )

    gaps: list[str] = Field(
        default_factory=list,
    )

    recommendations: list[
        ReadinessRecommendation
    ] = Field(
        default_factory=list,
    )

    weekly: ReadinessWeekly