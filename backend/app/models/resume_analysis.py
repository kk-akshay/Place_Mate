from uuid import UUID

from sqlalchemy import (
    ForeignKey,
    Integer,
    JSON,
    String,
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


class ResumeAnalysis(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = (
        "resume_analyses"
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

    original_filename: Mapped[str] = (
        mapped_column(
            String(255),
            nullable=False,
        )
    )

    target_role: Mapped[str] = (
        mapped_column(
            String(120),
            nullable=False,
        )
    )

    overall_score: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    summary: Mapped[str] = (
        mapped_column(
            Text,
            nullable=False,
        )
    )

    strengths: Mapped[list[str]] = (
        mapped_column(
            JSON,
            nullable=False,
            default=list,
        )
    )

    weaknesses: Mapped[list[str]] = (
        mapped_column(
            JSON,
            nullable=False,
            default=list,
        )
    )

    missing_keywords: Mapped[
        list[str]
    ] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    suggestions: Mapped[list[str]] = (
        mapped_column(
            JSON,
            nullable=False,
            default=list,
        )
    )

    improved_summary: Mapped[str] = (
        mapped_column(
            Text,
            nullable=False,
        )
    )