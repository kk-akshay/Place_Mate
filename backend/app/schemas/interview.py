from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
)

InterviewKind = Literal[
    "technical",
    "hr",
]


class StartInterviewRequest(BaseModel):
    kind: InterviewKind

    question_count: Literal[3, 5] = 5

    target_role: str | None = Field(
        default=None,
        max_length=120,
    )


class InterviewAnswerInput(BaseModel):
    question_id: UUID

    answer: str = Field(
        default="",
        max_length=4000,
    )


class SubmitInterviewRequest(BaseModel):
    answers: list[InterviewAnswerInput]


class InterviewQuestionRead(BaseModel):
    id: UUID

    position: int

    question_text: str

    answer_text: str | None = None

    score: int | None = None

    feedback: str | None = None

    ideal_points: list[str] = Field(
        default_factory=list,
    )


class InterviewSessionRead(BaseModel):
    id: UUID

    kind: InterviewKind

    target_role: str

    question_count: int

    status: str

    overall_score: int | None = None

    summary: str | None = None

    strengths: list[str] = Field(
        default_factory=list,
    )

    improvements: list[str] = Field(
        default_factory=list,
    )

    created_at: datetime

    submitted_at: datetime | None = None

    questions: list[InterviewQuestionRead]


class InterviewSessionSummary(BaseModel):
    id: UUID

    kind: InterviewKind

    target_role: str

    question_count: int

    status: str

    overall_score: int | None = None

    created_at: datetime

    submitted_at: datetime | None = None


class InterviewSessionListRead(BaseModel):
    sessions: list[InterviewSessionSummary] = Field(
        default_factory=list,
    )


# ---- Shapes the AI must return (validated server-side) ----


class AIGeneratedQuestions(BaseModel):
    questions: list[str] = Field(
        min_length=1,
        max_length=10,
    )


class AIQuestionEvaluation(BaseModel):
    position: int = Field(
        ge=1,
    )

    score: int = Field(
        ge=0,
        le=10,
    )

    feedback: str

    ideal_points: list[str] = Field(
        default_factory=list,
        max_length=6,
    )


class AIInterviewEvaluation(BaseModel):
    overall_summary: str

    strengths: list[str] = Field(
        default_factory=list,
        max_length=8,
    )

    improvements: list[str] = Field(
        default_factory=list,
        max_length=8,
    )

    evaluations: list[AIQuestionEvaluation]