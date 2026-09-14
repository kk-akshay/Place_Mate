from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
)


class CodingQuestionSummary(
    BaseModel,
):
    id: UUID
    slug: str
    title: str
    difficulty: str
    topic: str


class CodingQuestionListRead(
    BaseModel,
):
    questions: list[
        CodingQuestionSummary
    ] = Field(
        default_factory=list,
    )

    total: int = Field(
        ge=0,
    )


class CodingSampleTestCaseRead(
    BaseModel,
):
    position: int
    input_data: str
    expected_output: str


class CodingQuestionRead(
    BaseModel,
):
    id: UUID
    slug: str
    title: str
    difficulty: str
    topic: str
    problem_statement: str
    input_format: str
    output_format: str
    constraints: str
    starter_code: str

    sample_test_cases: list[
        CodingSampleTestCaseRead
    ] = Field(
        default_factory=list,
    )


class CodingExecutionRequest(
    BaseModel,
):
    code: str = Field(
        min_length=1,
        max_length=20_000,
    )


CodingExecutionStatus = Literal[
    "passed",
    "failed",
    "runtime_error",
    "timeout",
    "runner_error",
]


class CodingVisibleTestResult(
    BaseModel,
):
    position: int = Field(
        ge=1,
    )

    passed: bool

    status: CodingExecutionStatus

    input_data: str

    expected_output: str

    actual_output: str

    error: str | None = None

    execution_time_ms: int = Field(
        ge=0,
    )


class CodingExecutionRead(
    BaseModel,
):
    mode: Literal[
        "run",
        "submit",
    ]

    passed_tests: int = Field(
        ge=0,
    )

    total_tests: int = Field(
        ge=0,
    )

    all_passed: bool

    visible_tests: list[
        CodingVisibleTestResult
    ] = Field(
        default_factory=list,
    )

    hidden_passed: int = Field(
        ge=0,
    )

    hidden_total: int = Field(
        ge=0,
    )

    execution_time_ms: int = Field(
        ge=0,
    )

    message: str | None = None


class CodingProgressRead(
    BaseModel,
):
    total_questions: int = Field(
        ge=0,
    )

    attempted_questions: int = Field(
        ge=0,
    )

    solved_questions: int = Field(
        ge=0,
    )

    submissions: int = Field(
        ge=0,
    )

    solve_percent: float = Field(
        ge=0,
        le=100,
    )