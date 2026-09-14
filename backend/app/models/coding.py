from __future__ import annotations

from uuid import UUID

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class CodingQuestion(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "coding_questions"

    slug: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(180),
        nullable=False,
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        index=True,
        nullable=False,
    )

    topic: Mapped[str] = mapped_column(
        String(80),
        index=True,
        nullable=False,
    )

    problem_statement: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    input_format: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    output_format: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    constraints: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    starter_code: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    test_cases: Mapped[
        list[CodingTestCase]
    ] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="CodingTestCase.position",
    )


class CodingTestCase(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "coding_test_cases"

    __table_args__ = (
        UniqueConstraint(
            "question_id",
            "position",
            name=(
                "uq_coding_test_cases_question_position"
            ),
        ),
    )

    question_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "coding_questions.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    input_data: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    expected_output: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_hidden: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    question: Mapped[
        CodingQuestion
    ] = relationship(
        back_populates="test_cases",
    )