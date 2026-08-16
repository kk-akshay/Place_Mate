from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
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

if TYPE_CHECKING:
    from app.models.user import User


class AptitudeQuestion(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = (
        "aptitude_questions"
    )

    category: Mapped[str] = (
        mapped_column(
            String(30),
            index=True,
            nullable=False,
        )
    )

    topic: Mapped[str] = (
        mapped_column(
            String(80),
            nullable=False,
        )
    )

    difficulty: Mapped[str] = (
        mapped_column(
            String(20),
            index=True,
            nullable=False,
        )
    )

    question_text: Mapped[str] = (
        mapped_column(
            Text,
            nullable=False,
        )
    )

    options: Mapped[list[str]] = (
        mapped_column(
            JSON,
            nullable=False,
        )
    )

    correct_option: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    explanation: Mapped[str] = (
        mapped_column(
            Text,
            nullable=False,
        )
    )

    is_active: Mapped[bool] = (
        mapped_column(
            Boolean,
            nullable=False,
            default=True,
        )
    )

    answers: Mapped[
        list[AptitudeAnswer]
    ] = relationship(
        back_populates="question",
    )


class AptitudeAttempt(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = (
        "aptitude_attempts"
    )

    user_id: Mapped[UUID] = (
        mapped_column(
            ForeignKey(
                "users.id",
                ondelete="CASCADE",
            ),
            index=True,
            nullable=False,
        )
    )

    category: Mapped[str] = (
        mapped_column(
            String(30),
            nullable=False,
        )
    )

    question_count: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    duration_seconds: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    started_at: Mapped[datetime] = (
        mapped_column(
            DateTime(
                timezone=True,
            ),
            nullable=False,
            server_default=func.now(),
        )
    )

    expires_at: Mapped[datetime] = (
        mapped_column(
            DateTime(
                timezone=True,
            ),
            nullable=False,
        )
    )

    submitted_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(
            timezone=True,
        ),
        nullable=True,
    )

    correct_answers: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        nullable=True,
    )

    score_percent: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    timed_out: Mapped[bool] = (
        mapped_column(
            Boolean,
            nullable=False,
            default=False,
        )
    )

    user: Mapped[User] = (
        relationship()
    )

    answers: Mapped[
        list[AptitudeAnswer]
    ] = relationship(
        back_populates="attempt",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="AptitudeAnswer.position",
    )


class AptitudeAnswer(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = (
        "aptitude_answers"
    )

    __table_args__ = (
        UniqueConstraint(
            "attempt_id",
            "question_id",
            name=(
                "uq_aptitude_answers_attempt_question"
            ),
        ),
    )

    attempt_id: Mapped[UUID] = (
        mapped_column(
            ForeignKey(
                "aptitude_attempts.id",
                ondelete="CASCADE",
            ),
            index=True,
            nullable=False,
        )
    )

    question_id: Mapped[UUID] = (
        mapped_column(
            ForeignKey(
                "aptitude_questions.id",
                ondelete="RESTRICT",
            ),
            index=True,
            nullable=False,
        )
    )

    position: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    selected_option: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        nullable=True,
    )

    is_correct: Mapped[
        bool | None
    ] = mapped_column(
        Boolean,
        nullable=True,
    )

    attempt: Mapped[
        AptitudeAttempt
    ] = relationship(
        back_populates="answers",
    )

    question: Mapped[
        AptitudeQuestion
    ] = relationship(
        back_populates="answers",
    )