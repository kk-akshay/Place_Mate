from typing import Literal
from uuid import UUID

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.exceptions import (
    ResourceNotFoundError,
)
from app.models.coding import (
    CodingQuestion,
    CodingTestCase,
)
from app.models.coding_submission import (
    CodingSubmission,
)
from app.models.user import User
from app.repositories.coding import (
    CodingRepository,
)
from app.schemas.coding import (
    CodingExecutionRead,
    CodingExecutionRequest,
    CodingProgressRead,
    CodingQuestionListRead,
    CodingQuestionRead,
    CodingQuestionSummary,
    CodingSampleTestCaseRead,
    CodingVisibleTestResult,
)
from app.services.coding_runner import (
    DockerCodingRunner,
    RunnerResult,
)


class CodingService:
    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

        self.repository = (
            CodingRepository(
                session,
            )
        )

        self.runner = (
            DockerCodingRunner()
        )

    async def list_questions(
        self,
        *,
        difficulty: str | None = None,
        topic: str | None = None,
    ) -> CodingQuestionListRead:
        questions = (
            await self.repository
            .list_questions(
                difficulty=(
                    self
                    ._normalize_filter(
                        difficulty
                    )
                ),
                topic=(
                    self
                    ._normalize_filter(
                        topic
                    )
                ),
            )
        )

        summaries = [
            self._build_summary(
                question
            )
            for question
            in questions
        ]

        return CodingQuestionListRead(
            questions=summaries,
            total=len(summaries),
        )

    async def get_question(
        self,
        question_id: UUID,
    ) -> CodingQuestionRead:
        question = (
            await self._get_question(
                question_id
            )
        )

        return self._build_question(
            question
        )

    async def run_code(
        self,
        question_id: UUID,
        payload: CodingExecutionRequest,
    ) -> CodingExecutionRead:
        question = (
            await self._get_question(
                question_id
            )
        )

        visible_cases = [
            test_case
            for test_case
            in question.test_cases
            if not test_case.is_hidden
        ]

        return await self._execute_cases(
            code=payload.code,
            test_cases=visible_cases,
            mode="run",
        )

    async def submit_code(
        self,
        user: User,
        question_id: UUID,
        payload: CodingExecutionRequest,
    ) -> CodingExecutionRead:
        question = (
            await self._get_question(
                question_id
            )
        )

        result = (
            await self._execute_cases(
                code=payload.code,
                test_cases=list(
                    question.test_cases
                ),
                mode="submit",
            )
        )

        submission = CodingSubmission(
            user_id=user.id,
            question_id=question.id,
            code=payload.code,
            passed_tests=(
                result.passed_tests
            ),
            total_tests=(
                result.total_tests
            ),
            hidden_passed=(
                result.hidden_passed
            ),
            hidden_total=(
                result.hidden_total
            ),
            all_passed=(
                result.all_passed
            ),
            execution_time_ms=(
                result.execution_time_ms
            ),
        )

        await self.repository.add_submission(
            submission
        )

        await self.session.commit()

        return result

    async def get_progress(
        self,
        user: User,
    ) -> CodingProgressRead:
        (
            total,
            attempted,
            solved,
            submissions,
        ) = (
            await self.repository
            .get_progress_counts(
                user.id
            )
        )

        solve_percent = (
            round(
                (
                    solved
                    / total
                )
                * 100,
                2,
            )
            if total
            else 0
        )

        return CodingProgressRead(
            total_questions=total,
            attempted_questions=(
                attempted
            ),
            solved_questions=solved,
            submissions=submissions,
            solve_percent=(
                solve_percent
            ),
        )

    async def _get_question(
        self,
        question_id: UUID,
    ) -> CodingQuestion:
        question = (
            await self.repository
            .get_question(
                question_id
            )
        )

        if question is None:
            raise ResourceNotFoundError(
                "The coding question "
                "was not found."
            )

        return question

    async def _execute_cases(
        self,
        *,
        code: str,
        test_cases: list[
            CodingTestCase
        ],
        mode: Literal[
            "run",
            "submit",
        ],
    ) -> CodingExecutionRead:
        passed_tests = 0
        hidden_passed = 0
        total_execution_time_ms = 0

        hidden_total = sum(
            1
            for test_case
            in test_cases
            if test_case.is_hidden
        )

        visible_results: list[
            CodingVisibleTestResult
        ] = []

        message: str | None = None

        for test_case in test_cases:
            runner_result = (
                await self.runner
                .run_case(
                    code=code,
                    input_data=(
                        test_case.input_data
                    ),
                )
            )

            total_execution_time_ms += (
                runner_result
                .execution_time_ms
            )

            passed = (
                runner_result.status
                == "ok"
                and self._outputs_match(
                    runner_result.stdout,
                    test_case
                    .expected_output,
                )
            )

            if passed:
                passed_tests += 1

                if test_case.is_hidden:
                    hidden_passed += 1

            if (
                not test_case.is_hidden
            ):
                visible_results.append(
                    self
                    ._build_visible_result(
                        test_case=(
                            test_case
                        ),
                        runner_result=(
                            runner_result
                        ),
                        passed=passed,
                    )
                )

            if (
                runner_result.status
                == "runner_error"
            ):
                message = (
                    runner_result.error
                    or (
                        "The isolated "
                        "runner failed."
                    )
                )
                break

        total_tests = len(
            test_cases
        )

        return CodingExecutionRead(
            mode=mode,
            passed_tests=passed_tests,
            total_tests=total_tests,
            all_passed=(
                total_tests > 0
                and passed_tests
                == total_tests
            ),
            visible_tests=(
                visible_results
            ),
            hidden_passed=(
                hidden_passed
            ),
            hidden_total=hidden_total,
            execution_time_ms=(
                total_execution_time_ms
            ),
            message=message,
        )

    @classmethod
    def _build_visible_result(
        cls,
        *,
        test_case: CodingTestCase,
        runner_result: RunnerResult,
        passed: bool,
    ) -> CodingVisibleTestResult:
        if passed:
            status = "passed"

        elif (
            runner_result.status
            == "ok"
        ):
            status = "failed"

        else:
            status = (
                runner_result.status
            )

        return CodingVisibleTestResult(
            position=(
                test_case.position
            ),
            passed=passed,
            status=status,
            input_data=(
                test_case.input_data
            ),
            expected_output=(
                test_case
                .expected_output
            ),
            actual_output=(
                runner_result.stdout
            ),
            error=(
                runner_result.error
                or (
                    runner_result.stderr
                    .strip()
                    or None
                )
            ),
            execution_time_ms=(
                runner_result
                .execution_time_ms
            ),
        )

    @staticmethod
    def _outputs_match(
        actual: str,
        expected: str,
    ) -> bool:
        return (
            CodingService
            ._normalize_output(
                actual
            )
            == CodingService
            ._normalize_output(
                expected
            )
        )

    @staticmethod
    def _normalize_output(
        value: str,
    ) -> str:
        normalized = (
            value
            .replace(
                "\r\n",
                "\n",
            )
            .replace(
                "\r",
                "\n",
            )
        )

        lines = [
            line.rstrip()
            for line
            in normalized.split(
                "\n"
            )
        ]

        while (
            lines
            and not lines[-1]
        ):
            lines.pop()

        return "\n".join(
            lines
        )

    @staticmethod
    def _normalize_filter(
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        normalized = (
            value.strip()
        )

        return (
            normalized
            if normalized
            else None
        )

    @staticmethod
    def _build_summary(
        question: CodingQuestion,
    ) -> CodingQuestionSummary:
        return CodingQuestionSummary(
            id=question.id,
            slug=question.slug,
            title=question.title,
            difficulty=(
                question.difficulty
            ),
            topic=question.topic,
        )

    @staticmethod
    def _build_question(
        question: CodingQuestion,
    ) -> CodingQuestionRead:
        samples = [
            CodingSampleTestCaseRead(
                position=(
                    test_case.position
                ),
                input_data=(
                    test_case.input_data
                ),
                expected_output=(
                    test_case
                    .expected_output
                ),
            )
            for test_case
            in question.test_cases
            if not test_case.is_hidden
        ]

        return CodingQuestionRead(
            id=question.id,
            slug=question.slug,
            title=question.title,
            difficulty=(
                question.difficulty
            ),
            topic=question.topic,
            problem_statement=(
                question
                .problem_statement
            ),
            input_format=(
                question.input_format
            ),
            output_format=(
                question.output_format
            ),
            constraints=(
                question.constraints
            ),
            starter_code=(
                question.starter_code
            ),
            sample_test_cases=samples,
        )