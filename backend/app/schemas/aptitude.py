from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
)

AptitudeCategory = Literal[
    "mixed",
    "quantitative",
    "logical",
    "verbal",
]


QuestionCount = Literal[
    5,
    10,
]


class AptitudeCategorySummary(
    BaseModel,
):
    category: str
    question_count: int


class AptitudeCatalogRead(
    BaseModel,
):
    categories: list[
        AptitudeCategorySummary
    ]

    available_question_counts: list[
        int
    ]


class StartAptitudeAttemptRequest(
    BaseModel,
):
    category: AptitudeCategory = (
        "mixed"
    )

    question_count: QuestionCount = 5


class AptitudeQuestionRead(
    BaseModel,
):
    id: UUID
    position: int

    category: str
    topic: str
    difficulty: str

    question_text: str

    options: list[str]


class AptitudeAttemptRead(
    BaseModel,
):
    id: UUID

    category: str

    question_count: int

    duration_seconds: int

    started_at: datetime

    expires_at: datetime

    questions: list[
        AptitudeQuestionRead
    ]


class SubmitAnswerInput(
    BaseModel,
):
    question_id: UUID

    selected_option: int = Field(
        ge=0,
        le=3,
    )


class SubmitAptitudeAttemptRequest(
    BaseModel,
):
    answers: list[
        SubmitAnswerInput
    ]


class AptitudeQuestionResult(
    BaseModel,
):
    question_id: UUID

    position: int

    category: str
    topic: str
    difficulty: str

    question_text: str

    options: list[str]

    selected_option: int | None

    correct_option: int
    is_correct: bool

    explanation: str


class AptitudeResultRead(
    BaseModel,
):
    attempt_id: UUID

    category: str

    total_questions: int

    correct_answers: int

    score_percent: float

    timed_out: bool

    submitted_at: datetime

    questions: list[
        AptitudeQuestionResult
    ]


class AptitudeCategoryProgress(
    BaseModel,
):
    category: str

    attempts: int

    average_score: float


class AptitudeProgressRead(
    BaseModel,
):
    total_attempts: int

    total_questions: int

    total_correct: int

    accuracy_percent: float

    average_score: float

    best_score: float

    categories: list[
        AptitudeCategoryProgress
    ]