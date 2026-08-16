from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.models.preparation_activity import PreparationActivity
from app.models.user import User
from app.repositories.preparation import PreparationRepository
from app.schemas.preparation import (
    FinishPreparationActivityRequest,
    PreparationActivityRead,
    PreparationModuleSummary,
    StartPreparationActivityRequest,
    WeeklyPreparationSummary,
)


class PreparationService:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session
        self.repository = PreparationRepository(
            session,
        )

    async def start_activity(
        self,
        user: User,
        payload: StartPreparationActivityRequest,
    ) -> PreparationActivityRead:
        existing = await self.repository.get_by_source(
            user_id=user.id,
            activity_type=payload.activity_type,
            source_id=payload.source_id,
        )

        if existing is not None:
            return self._to_read(
                existing,
            )

        now = datetime.now(
            timezone.utc,
        )

        activity = PreparationActivity(
            user_id=user.id,
            module=payload.module,
            activity_type=payload.activity_type,
            source_id=payload.source_id,
            started_at=now,
            planned_duration_seconds=(
                payload.planned_duration_seconds
            ),
        )

        await self.repository.add(
            activity,
        )

        await self.session.commit()

        await self.session.refresh(
            activity,
        )

        return self._to_read(
            activity,
        )

    async def finish_activity(
        self,
        user: User,
        payload: FinishPreparationActivityRequest,
    ) -> PreparationActivityRead:
        activity = await self.repository.get_by_source(
            user_id=user.id,
            activity_type=payload.activity_type,
            source_id=payload.source_id,
        )

        if activity is None:
            raise ResourceNotFoundError(
                "Preparation activity was not found."
            )

        if activity.ended_at is not None:
            return self._to_read(
                activity,
            )

        now = datetime.now(
            timezone.utc,
        )

        elapsed = max(
            0,
            int(
                (
                    now
                    - activity.started_at
                ).total_seconds()
            ),
        )

        if (
            activity.planned_duration_seconds
            is not None
        ):
            elapsed = min(
                elapsed,
                activity.planned_duration_seconds,
            )

        activity.ended_at = now

        activity.duration_seconds = elapsed

        await self.session.commit()

        await self.session.refresh(
            activity,
        )

        return self._to_read(
            activity,
        )

    async def get_weekly_summary(
        self,
        user: User,
    ) -> WeeklyPreparationSummary:
        profile = await self.repository.get_profile(
            user.id,
        )

        if profile is None:
            raise ResourceNotFoundError(
                "Complete your student profile before viewing preparation time."
            )

        now = datetime.now(
            timezone.utc,
        )

        week_start = (
            now
            - timedelta(
                days=now.weekday(),
                hours=now.hour,
                minutes=now.minute,
                seconds=now.second,
                microseconds=now.microsecond,
            )
        )

        week_end = (
            week_start
            + timedelta(
                days=7,
            )
        )

        activities = await self.repository.list_for_period(
            user_id=user.id,
            period_start=week_start,
            period_end=week_end,
        )

        module_seconds: dict[str, int] = {}

        for activity in activities:
            effective_start = max(
                activity.started_at,
                week_start,
            )

            effective_end = (
                activity.ended_at
                or now
            )

            if (
                activity.planned_duration_seconds
                is not None
            ):
                planned_end = (
                    activity.started_at
                    + timedelta(
                        seconds=(
                            activity.planned_duration_seconds
                        ),
                    )
                )

                effective_end = min(
                    effective_end,
                    planned_end,
                )

            effective_end = min(
                effective_end,
                week_end,
            )

            seconds = max(
                0,
                int(
                    (
                        effective_end
                        - effective_start
                    ).total_seconds()
                ),
            )

            module_seconds[
                activity.module
            ] = (
                module_seconds.get(
                    activity.module,
                    0,
                )
                + seconds
            )

        spent_seconds = sum(
            module_seconds.values(),
        )

        budget_seconds = (
            profile.weekly_hours
            * 3600
        )

        remaining_seconds = max(
            0,
            budget_seconds
            - spent_seconds,
        )

        used_percent = (
            round(
                (
                    spent_seconds
                    / budget_seconds
                )
                * 100,
                1,
            )
            if budget_seconds
            else 0
        )

        modules = [
            PreparationModuleSummary(
                module=module,
                spent_seconds=seconds,
                percentage_of_spent=(
                    round(
                        (
                            seconds
                            / spent_seconds
                        )
                        * 100,
                        1,
                    )
                    if spent_seconds
                    else 0
                ),
            )
            for module, seconds in sorted(
                module_seconds.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        ]

        return WeeklyPreparationSummary(
            week_start=week_start,
            week_end=week_end,
            budget_seconds=budget_seconds,
            spent_seconds=spent_seconds,
            remaining_seconds=remaining_seconds,
            used_percent=used_percent,
            modules=modules,
        )

    @staticmethod
    def _to_read(
        activity: PreparationActivity,
    ) -> PreparationActivityRead:
        return PreparationActivityRead(
            id=activity.id,
            module=activity.module,
            activity_type=activity.activity_type,
            source_id=activity.source_id,
            started_at=activity.started_at,
            ended_at=activity.ended_at,
            planned_duration_seconds=(
                activity.planned_duration_seconds
            ),
            duration_seconds=activity.duration_seconds,
        )