from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import JSON, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.models.user import User


class StudentProfile(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "student_profiles"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        unique=True,
        index=True,
        nullable=False,
    )

    college_name: Mapped[str] = mapped_column(
        String(180),
        nullable=False,
    )

    degree: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    branch: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    graduation_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    target_roles: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    target_companies: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    skills: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    strengths: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    weak_areas: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    preparation_goals: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    weekly_hours: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    user: Mapped[User] = relationship(
        back_populates="profile",
    )