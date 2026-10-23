from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    JSON,
    DateTime,
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


class InterviewSession(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "interview_sessions"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    kind: Mapped[str] = mapped_column(
        String(20),
        index=True,
        nullable=False,
    )

    target_role: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    question_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="in_progress",
    )

    overall_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    strengths: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    improvements: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    questions: Mapped[
        list[InterviewQuestion]
    ] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="InterviewQuestion.position",
    )


class InterviewQuestion(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "interview_questions"

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "position",
            name="uq_interview_questions_session_position",
        ),
    )

    session_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "interview_sessions.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    answer_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    ideal_points: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    session: Mapped[InterviewSession] = relationship(
        back_populates="questions",
    )