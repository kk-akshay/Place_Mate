from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    ValidationInfo,
    field_validator,
)


class StudentProfileUpsert(BaseModel):
    college_name: str = Field(
        min_length=2,
        max_length=180,
    )

    degree: str = Field(
        min_length=2,
        max_length=120,
    )

    branch: str = Field(
        min_length=2,
        max_length=120,
    )

    graduation_year: int = Field(
        ge=2000,
        le=2100,
    )

    target_roles: list[str] = Field(
        min_length=1,
        max_length=10,
    )

    target_companies: list[str] = Field(
        default_factory=list,
        max_length=10,
    )

    skills: list[str] = Field(
        min_length=1,
        max_length=20,
    )

    strengths: list[str] = Field(
        default_factory=list,
        max_length=15,
    )

    weak_areas: list[str] = Field(
        default_factory=list,
        max_length=15,
    )

    preparation_goals: list[str] = Field(
        min_length=1,
        max_length=10,
    )

    weekly_hours: int = Field(
        ge=1,
        le=80,
    )

    @field_validator(
        "college_name",
        "degree",
        "branch",
    )
    @classmethod
    def normalize_text(
        cls,
        value: str,
    ) -> str:
        value = " ".join(
            value.strip().split()
        )

        if not value:
            raise ValueError(
                "This field cannot be empty."
            )

        return value

    @field_validator(
        "target_roles",
        "target_companies",
        "skills",
        "strengths",
        "weak_areas",
        "preparation_goals",
    )
    @classmethod
    def normalize_list(
        cls,
        value: list[str],
        info: ValidationInfo,
    ) -> list[str]:
        normalized: list[str] = []

        seen: set[str] = set()

        for item in value:
            cleaned = " ".join(
                item.strip().split()
            )

            if not cleaned:
                continue

            if len(cleaned) > 100:
                raise ValueError(
                    "Each item must be 100 characters or fewer."
                )

            key = cleaned.casefold()

            if key in seen:
                continue

            seen.add(key)
            normalized.append(cleaned)

        required_fields = {
            "target_roles",
            "skills",
            "preparation_goals",
        }

        if (
            info.field_name in required_fields
            and not normalized
        ):
            raise ValueError(
                "At least one item is required."
            )

        return normalized


class StudentProfileRead(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID

    college_name: str
    degree: str
    branch: str
    graduation_year: int

    target_roles: list[str]
    target_companies: list[str]

    skills: list[str]
    strengths: list[str]
    weak_areas: list[str]

    preparation_goals: list[str]

    weekly_hours: int

    created_at: datetime
    updated_at: datetime


class ProfileStatusRead(BaseModel):
    onboarding_completed: bool