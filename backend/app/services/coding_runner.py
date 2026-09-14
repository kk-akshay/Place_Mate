import asyncio
import json
import shutil
import subprocess
from dataclasses import dataclass
from typing import Literal

RunnerStatus = Literal[
    "ok",
    "runtime_error",
    "timeout",
    "runner_error",
]


@dataclass(
    slots=True,
)
class RunnerResult:
    status: RunnerStatus
    stdout: str
    stderr: str
    execution_time_ms: int
    error: str | None


class DockerCodingRunner:
    IMAGE_NAME = (
        "place-mate-python-runner:latest"
    )

    DOCKER_TIMEOUT_SECONDS = 6

    async def run_case(
        self,
        *,
        code: str,
        input_data: str,
    ) -> RunnerResult:
        return await asyncio.to_thread(
            self._run_case_sync,
            code,
            input_data,
        )

    def _run_case_sync(
        self,
        code: str,
        input_data: str,
    ) -> RunnerResult:
        docker_path = (
            shutil.which(
                "docker",
            )
        )

        if docker_path is None:
            return RunnerResult(
                status=
                    "runner_error",
                stdout=
                    "",
                stderr=
                    "",
                execution_time_ms=
                    0,
                error=(
                    "Docker is not "
                    "available on the "
                    "backend host."
                ),
            )

        payload = json.dumps(
            {
                "code":
                    code,
                "input_data":
                    input_data,
            }
        )

        command = [
            docker_path,
            "run",
            "--rm",
            "-i",
            "--pull=never",
            "--network=none",
            "--memory=128m",
            "--memory-swap=128m",
            "--cpus=0.50",
            "--pids-limit=64",
            "--read-only",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges",
            (
                "--tmpfs="
                "/tmp:"
                "rw,nosuid,nodev,"
                "noexec,size=16m"
            ),
            "--user=65534:65534",
            self.IMAGE_NAME,
        ]

        try:
            completed = (
                subprocess.run(
                    command,
                    input=
                        payload,
                    capture_output=
                        True,
                    encoding=
                        "utf-8",
                    errors=
                        "replace",
                    timeout=
                        self
                        .DOCKER_TIMEOUT_SECONDS,
                    check=
                        False,
                )
            )

        except subprocess.TimeoutExpired:
            return RunnerResult(
                status=
                    "runner_error",
                stdout=
                    "",
                stderr=
                    "",
                execution_time_ms=
                    0,
                error=(
                    "The execution "
                    "container exceeded "
                    "its host timeout."
                ),
            )

        except OSError:
            return RunnerResult(
                status=
                    "runner_error",
                stdout=
                    "",
                stderr=
                    "",
                execution_time_ms=
                    0,
                error=(
                    "The Docker execution "
                    "process could not "
                    "be started."
                ),
            )

        if (
            completed.returncode
            != 0
        ):
            docker_error = (
                completed.stderr
                .strip()
            )

            if not docker_error:
                docker_error = (
                    "Docker returned an "
                    "execution error."
                )

            return RunnerResult(
                status=
                    "runner_error",
                stdout=
                    "",
                stderr=
                    "",
                execution_time_ms=
                    0,
                error=
                    docker_error[
                        :1000
                    ],
            )

        raw_result = (
            completed.stdout
            .strip()
        )

        try:
            result = json.loads(
                raw_result,
            )

        except json.JSONDecodeError:
            return RunnerResult(
                status=
                    "runner_error",
                stdout=
                    "",
                stderr=
                    "",
                execution_time_ms=
                    0,
                error=(
                    "The execution "
                    "container returned "
                    "an invalid response."
                ),
            )

        status = result.get(
            "status",
        )

        if status not in {
            "ok",
            "runtime_error",
            "timeout",
            "runner_error",
        }:
            return RunnerResult(
                status=
                    "runner_error",
                stdout=
                    "",
                stderr=
                    "",
                execution_time_ms=
                    0,
                error=(
                    "The execution "
                    "container returned "
                    "an unknown status."
                ),
            )

        return RunnerResult(
            status=
                status,
            stdout=
                str(
                    result.get(
                        "stdout",
                        "",
                    )
                ),
            stderr=
                str(
                    result.get(
                        "stderr",
                        "",
                    )
                ),
            execution_time_ms=
                max(
                    int(
                        result.get(
                            "execution_time_ms",
                            0,
                        )
                    ),
                    0,
                ),
            error=(
                str(
                    result["error"]
                )
                if result.get(
                    "error"
                )
                is not None
                else None
            ),
        )