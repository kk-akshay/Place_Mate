from uuid import UUID

from sqlalchemy import (
    distinct,
    func,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)
from sqlalchemy.orm import (
    selectinload,
)

from app.models.coding import (
    CodingQuestion,
)
from app.models.coding_submission import (
    CodingSubmission,
)


class CodingRepository:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def list_questions(
        self,
        *,
        difficulty: str | None = None,
        topic: str | None = None,
    ) -> list[CodingQuestion]:
        statement = (
            select(
                CodingQuestion,
            )
            .where(
                CodingQuestion
                .is_active
                .is_(True),
            )
        )

        if difficulty:
            statement = (
                statement.where(
                    func.lower(
                        CodingQuestion
                        .difficulty,
                    )
                    == difficulty.lower()
                )
            )

        if topic:
            statement = (
                statement.where(
                    func.lower(
                        CodingQuestion
                        .topic,
                    )
                    == topic.lower()
                )
            )

        statement = (
            statement.order_by(
                CodingQuestion
                .difficulty
                .asc(),
                CodingQuestion
                .title
                .asc(),
            )
        )

        result = (
            await self.session.execute(
                statement,
            )
        )

        return list(
            result
            .scalars()
            .all()
        )

    async def get_question(
        self,
        question_id: UUID,
    ) -> CodingQuestion | None:
        statement = (
            select(
                CodingQuestion,
            )
            .options(
                selectinload(
                    CodingQuestion
                    .test_cases,
                )
            )
            .where(
                CodingQuestion.id
                == question_id,
                CodingQuestion
                .is_active
                .is_(True),
            )
        )

        result = (
            await self.session.execute(
                statement,
            )
        )

        return (
            result
            .scalars()
            .unique()
            .one_or_none()
        )

    async def add_submission(
        self,
        submission: CodingSubmission,
    ) -> None:
        self.session.add(
            submission
        )

        await self.session.flush()

    async def get_progress_counts(
        self,
        user_id: UUID,
    ) -> tuple[
        int,
        int,
        int,
        int,
    ]:
        total_result = (
            await self.session.execute(
                select(
                    func.count(
                        CodingQuestion.id,
                    )
                ).where(
                    CodingQuestion
                    .is_active
                    .is_(True),
                )
            )
        )

        total_questions = int(
            total_result.scalar_one()
        )

        submission_result = (
            await self.session.execute(
                select(
                    func.count(
                        CodingSubmission.id,
                    )
                ).where(
                    CodingSubmission.user_id
                    == user_id,
                )
            )
        )

        submissions = int(
            submission_result
            .scalar_one()
        )

        attempted_result = (
            await self.session.execute(
                select(
                    func.count(
                        distinct(
                            CodingSubmission
                            .question_id
                        )
                    )
                ).where(
                    CodingSubmission.user_id
                    == user_id,
                )
            )
        )

        attempted = int(
            attempted_result
            .scalar_one()
        )

        solved_result = (
            await self.session.execute(
                select(
                    func.count(
                        distinct(
                            CodingSubmission
                            .question_id
                        )
                    )
                ).where(
                    CodingSubmission.user_id
                    == user_id,
                    CodingSubmission
                    .all_passed
                    .is_(True),
                )
            )
        )

        solved = int(
            solved_result.scalar_one()
        )

        return (
            total_questions,
            attempted,
            solved,
            submissions,
        )