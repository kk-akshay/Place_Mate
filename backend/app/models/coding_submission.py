from uuid import UUID

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.db.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class CodingSubmission(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = (
        "coding_submissions"
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

    question_id: Mapped[UUID] = (
        mapped_column(
            ForeignKey(
                "coding_questions.id",
                ondelete="CASCADE",
            ),
            index=True,
            nullable=False,
        )
    )

    code: Mapped[str] = (
        mapped_column(
            Text,
            nullable=False,
        )
    )

    passed_tests: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    total_tests: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    hidden_passed: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    hidden_total: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    all_passed: Mapped[bool] = (
        mapped_column(
            Boolean,
            nullable=False,
            default=False,
        )
    )

    execution_time_ms: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
            default=0,
        )
    )