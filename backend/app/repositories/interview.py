from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)
from sqlalchemy.orm import selectinload

from app.models.interview import (
    InterviewSession,
)


class InterviewRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def add_session(
        self,
        interview_session: InterviewSession,
    ) -> None:
        self.session.add(
            interview_session,
        )

        await self.session.flush()

    async def count_sessions_since(
        self,
        *,
        user_id: UUID,
        since: datetime,
    ) -> int:
        result = await self.session.execute(
            select(
                func.count(
                    InterviewSession.id,
                ),
            ).where(
                InterviewSession.user_id
                == user_id,
                InterviewSession.created_at
                >= since,
            )
        )

        return int(
            result.scalar_one(),
        )

    async def get_session(
        self,
        *,
        session_id: UUID,
        user_id: UUID,
        refresh: bool = False,
    ) -> InterviewSession | None:
        statement = (
            select(InterviewSession)
            .options(
                selectinload(
                    InterviewSession.questions,
                ),
            )
            .where(
                InterviewSession.id
                == session_id,
                InterviewSession.user_id
                == user_id,
            )
        )

        if refresh:
            statement = (
                statement.execution_options(
                    populate_existing=True,
                )
            )

        result = await self.session.execute(
            statement,
        )

        return result.scalar_one_or_none()

    async def list_sessions(
        self,
        *,
        user_id: UUID,
        kind: str | None = None,
        limit: int = 20,
    ) -> list[InterviewSession]:
        statement = select(
            InterviewSession,
        ).where(
            InterviewSession.user_id
            == user_id,
        )

        if kind:
            statement = statement.where(
                InterviewSession.kind
                == kind,
            )

        statement = (
            statement.order_by(
                InterviewSession
                .created_at
                .desc(),
            )
            .limit(limit)
        )

        result = await self.session.execute(
            statement,
        )

        return list(
            result.scalars().all(),
        )