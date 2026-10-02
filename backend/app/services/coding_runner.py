import asyncio
import ctypes
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from app.core.config import settings

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


# ---------------------------------------------------------------------
# Subprocess runner - TEMPORARY, FOR A COLLEGE DEMO ONLY.
#
# This is NOT a fully isolated sandbox. Submitted code runs as the same
# OS user as the API, on the same machine, with network access. The
# mitigations below reduce risk; they do not remove it.
# ---------------------------------------------------------------------

MAX_CODE_CHARACTERS = 20_000
MAX_INPUT_CHARACTERS = 20_000
MAX_OUTPUT_CHARACTERS = 16_000
EXECUTION_TIMEOUT_SECONDS = 2.0

# Hard cap on how much a child may write to its stdout/stderr files.
OUTPUT_FILE_LIMIT_BYTES = 128 * 1024
MEMORY_LIMIT_BYTES = 256 * 1024 * 1024
CPU_LIMIT_SECONDS = 3
SLOT_WAIT_SECONDS = 10.0

_SAFE_ENVIRONMENT = {
    "PATH": "/usr/local/bin:/usr/bin:/bin",
    "LANG": "C.UTF-8",
}

# Executed as `python -I -B -c LAUNCHER solution.py cpu mem fsize`.
# Limits are applied inside the child before user code starts. Soft and
# hard limits are both set so user code cannot raise them again.
_LAUNCHER = """
import resource, runpy, sys

def _limit(name, value):
    try:
        resource.setrlimit(
            getattr(resource, name), (value, value)
        )
    except (AttributeError, ValueError, OSError):
        pass

_path = sys.argv[1]
_cpu, _mem, _fsize = (int(v) for v in sys.argv[2:5])

_limit("RLIMIT_CORE", 0)
_limit("RLIMIT_CPU", _cpu)
_limit("RLIMIT_AS", _mem)
_limit("RLIMIT_FSIZE", _fsize)
_limit("RLIMIT_NOFILE", 32)
# Blocks fork/exec of further processes for non-root users.
_limit("RLIMIT_NPROC", 1)

sys.argv = [_path]
runpy.run_path(_path, run_name="__main__")
"""

_SLOTS = threading.BoundedSemaphore(
    max(
        1,
        int(
            settings
            .coding_subprocess_max_concurrency
        ),
    )
)

_hardening_lock = threading.Lock()
_hardening_done = False


def _harden_parent_process() -> None:
    """
    Mark the API process as non-dumpable (PR_SET_DUMPABLE = 0).

    On Linux this makes /proc/<pid>/environ and /proc/<pid>/mem of this
    process unreadable to other processes of the same user, which stops
    submitted code from reading the API's environment variables
    (JWT secret, DATABASE_URL, API keys) through /proc.

    Limitation: it only protects THIS process. Parent/wrapper processes
    (for example a shell or process manager that started uvicorn) keep
    their own environment readable, so the start command should exec
    uvicorn directly.
    """

    global _hardening_done

    with _hardening_lock:
        if _hardening_done:
            return

        _hardening_done = True

        if not sys.platform.startswith(
            "linux"
        ):
            return

        try:
            libc = ctypes.CDLL(
                None,
                use_errno=True,
            )

            libc.prctl(
                4,
                0,
                0,
                0,
                0,
            )
        except (OSError, AttributeError):
            pass


def _runner_error(
    message: str,
) -> RunnerResult:
    return RunnerResult(
        status="runner_error",
        stdout="",
        stderr="",
        execution_time_ms=0,
        error=message,
    )


def _read_limited(
    path: Path,
) -> str:
    try:
        with open(
            path,
            "rb",
        ) as handle:
            data = handle.read(
                MAX_OUTPUT_CHARACTERS * 4
                + 1
            )
    except OSError:
        return ""

    text = data.decode(
        "utf-8",
        errors="replace",
    )

    if len(text) <= MAX_OUTPUT_CHARACTERS:
        return text

    return (
        text[:MAX_OUTPUT_CHARACTERS]
        + "\n...[output truncated]"
    )


def _kill_process_group(
    pid: int,
) -> None:
    try:
        os.killpg(
            pid,
            signal.SIGKILL,
        )
    except (
        ProcessLookupError,
        PermissionError,
        OSError,
    ):
        pass


class SubprocessCodingRunner:
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
        if os.name != "posix":
            return _runner_error(
                "The subprocess runner "
                "is only supported on "
                "Linux."
            )

        if not code.strip():
            return _runner_error(
                "Submitted code "
                "cannot be empty."
            )

        if len(code) > MAX_CODE_CHARACTERS:
            return _runner_error(
                "Submitted code "
                "is too large."
            )

        if (
            len(input_data)
            > MAX_INPUT_CHARACTERS
        ):
            return _runner_error(
                "Test input "
                "is too large."
            )

        _harden_parent_process()

        if not _SLOTS.acquire(
            timeout=SLOT_WAIT_SECONDS,
        ):
            return _runner_error(
                "The code runner is "
                "busy. Please try "
                "again shortly."
            )

        work_dir: Path | None = None
        process_pid: int | None = None

        try:
            work_dir = Path(
                tempfile.mkdtemp(
                    prefix=(
                        "place_mate_run_"
                    ),
                )
            )

            os.chmod(
                work_dir,
                0o700,
            )

            solution_path = (
                work_dir
                / "solution.py"
            )
            stdin_path = (
                work_dir
                / "stdin.txt"
            )
            stdout_path = (
                work_dir
                / "stdout.txt"
            )
            stderr_path = (
                work_dir
                / "stderr.txt"
            )

            solution_path.write_text(
                code,
                encoding="utf-8",
            )
            stdin_path.write_text(
                input_data,
                encoding="utf-8",
            )

            command = [
                sys.executable,
                "-I",
                "-B",
                "-c",
                _LAUNCHER,
                str(solution_path),
                str(CPU_LIMIT_SECONDS),
                str(MEMORY_LIMIT_BYTES),
                str(
                    OUTPUT_FILE_LIMIT_BYTES
                ),
            ]

            timed_out = False

            started_at = (
                time.monotonic()
            )

            with (
                open(
                    stdin_path,
                    "rb",
                ) as stdin_file,
                open(
                    stdout_path,
                    "wb",
                ) as stdout_file,
                open(
                    stderr_path,
                    "wb",
                ) as stderr_file,
            ):
                process = subprocess.Popen(
                    command,
                    stdin=stdin_file,
                    stdout=stdout_file,
                    stderr=stderr_file,
                    cwd=str(work_dir),
                    env=dict(
                        _SAFE_ENVIRONMENT
                    ),
                    shell=False,
                    close_fds=True,
                    start_new_session=True,
                )

                process_pid = process.pid

                try:
                    process.wait(
                        timeout=(
                            EXECUTION_TIMEOUT_SECONDS
                        ),
                    )
                except subprocess.TimeoutExpired:
                    timed_out = True

                    _kill_process_group(
                        process.pid,
                    )

                    process.wait()

            elapsed_ms = int(
                (
                    time.monotonic()
                    - started_at
                )
                * 1000
            )

            stdout = _read_limited(
                stdout_path
            )
            stderr = _read_limited(
                stderr_path
            )

            if timed_out:
                return RunnerResult(
                    status="timeout",
                    stdout=stdout,
                    stderr=stderr,
                    execution_time_ms=(
                        elapsed_ms
                    ),
                    error=(
                        "Execution exceeded "
                        "the time limit."
                    ),
                )

            output_too_large = any(
                path.stat().st_size
                >= OUTPUT_FILE_LIMIT_BYTES
                for path in (
                    stdout_path,
                    stderr_path,
                )
            )

            if output_too_large:
                return RunnerResult(
                    status=(
                        "runtime_error"
                    ),
                    stdout=stdout,
                    stderr=stderr,
                    execution_time_ms=(
                        elapsed_ms
                    ),
                    error=(
                        "Output exceeded "
                        "the size limit."
                    ),
                )

            if process.returncode != 0:
                return RunnerResult(
                    status=(
                        "runtime_error"
                    ),
                    stdout=stdout,
                    stderr=stderr,
                    execution_time_ms=(
                        elapsed_ms
                    ),
                    error=(
                        "The program exited "
                        "with a runtime error."
                    ),
                )

            return RunnerResult(
                status="ok",
                stdout=stdout,
                stderr=stderr,
                execution_time_ms=(
                    elapsed_ms
                ),
                error=None,
            )

        except OSError:
            return _runner_error(
                "The code runner could "
                "not execute the program."
            )

        finally:
            if process_pid is not None:
                _kill_process_group(
                    process_pid,
                )

            if work_dir is not None:
                shutil.rmtree(
                    work_dir,
                    ignore_errors=True,
                )

            _SLOTS.release()


def get_coding_runner() -> (
    DockerCodingRunner
    | SubprocessCodingRunner
):
    """
    CODING_RUNNER=docker      -> local Docker runner
    CODING_RUNNER=subprocess  -> temporary subprocess runner (demo)
    CODING_RUNNER=auto        -> subprocess when ENVIRONMENT=production,
                                 Docker otherwise
    """

    choice = settings.coding_runner

    if choice == "auto":
        choice = (
            "subprocess"
            if settings.environment
            == "production"
            else "docker"
        )

    if choice == "subprocess":
        return SubprocessCodingRunner()

    return DockerCodingRunner()