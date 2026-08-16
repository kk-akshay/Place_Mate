from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

PreparationModule = Literal[
    "aptitude",
    "coding",
    "technical_interview",
    "hr_interview",
    "resume",
]


class StartPreparationActivityRequest(BaseModel):
    module: PreparationModule

    activity_type: str = Field(
        min_length=2,
        max_length=60,
    )

    source_id: UUID

    planned_duration_seconds: int | None = Field(
        default=None,
        ge=1,
        le=86_400,
    )


class FinishPreparationActivityRequest(BaseModel):
    activity_type: str = Field(
        min_length=2,
        max_length=60,
    )

    source_id: UUID


class PreparationActivityRead(BaseModel):
    id: UUID

    module: str

    activity_type: str

    source_id: UUID | None

    started_at: datetime

    ended_at: datetime | None

    planned_duration_seconds: int | None

    duration_seconds: int | None


class PreparationModuleSummary(BaseModel):
    module: str

    spent_seconds: int

    percentage_of_spent: float


class WeeklyPreparationSummary(BaseModel):
    week_start: datetime

    week_end: datetime

    budget_seconds: int

    spent_seconds: int

    remaining_seconds: int

    used_percent: float

    modules: list[PreparationModuleSummary]