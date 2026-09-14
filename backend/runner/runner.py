import json
import os
import resource
import subprocess
import sys
import tempfile
import time
from typing import Any

MAX_CODE_CHARACTERS = 20_000
MAX_INPUT_CHARACTERS = 20_000
MAX_OUTPUT_CHARACTERS = 16_000
EXECUTION_TIMEOUT_SECONDS = 2.0


def truncate_text(
    value: str,
) -> str:
    if (
        len(value)
        <= MAX_OUTPUT_CHARACTERS
    ):
        return value

    return (
        value[
            :MAX_OUTPUT_CHARACTERS
        ]
        + "\n...[output truncated]"
    )


def safe_text(
    value: Any,
) -> str:
    if value is None:
        return ""

    if isinstance(
        value,
        bytes,
    ):
        return value.decode(
            "utf-8",
            errors="replace",
        )

    return str(
        value,
    )


def emit_result(
    *,
    status: str,
    stdout: str = "",
    stderr: str = "",
    execution_time_ms: int = 0,
    error: str | None = None,
) -> None:
    result = {
        "status":
            status,
        "stdout":
            truncate_text(
                stdout,
            ),
        "stderr":
            truncate_text(
                stderr,
            ),
        "execution_time_ms":
            max(
                execution_time_ms,
                0,
            ),
        "error":
            error,
    }

    sys.stdout.write(
        json.dumps(
            result,
        )
    )

    sys.stdout.flush()


def apply_resource_limits() -> None:
    resource.setrlimit(
        resource.RLIMIT_CORE,
        (
            0,
            0,
        ),
    )

    resource.setrlimit(
        resource.RLIMIT_NOFILE,
        (
            64,
            64,
        ),
    )


def main() -> None:
    try:
        raw_payload = (
            sys.stdin.read()
        )

        payload = json.loads(
            raw_payload,
        )

    except (
        json.JSONDecodeError,
        TypeError,
    ):
        emit_result(
            status="runner_error",
            error=(
                "The execution payload "
                "was invalid."
            ),
        )

        return

    code = payload.get(
        "code",
    )

    input_data = payload.get(
        "input_data",
        "",
    )

    if not isinstance(
        code,
        str,
    ):
        emit_result(
            status="runner_error",
            error=(
                "Submitted code must "
                "be text."
            ),
        )

        return

    if not isinstance(
        input_data,
        str,
    ):
        emit_result(
            status="runner_error",
            error=(
                "Test input must "
                "be text."
            ),
        )

        return

    if not code.strip():
        emit_result(
            status="runner_error",
            error=(
                "Submitted code "
                "cannot be empty."
            ),
        )

        return

    if (
        len(code)
        > MAX_CODE_CHARACTERS
    ):
        emit_result(
            status="runner_error",
            error=(
                "Submitted code "
                "is too large."
            ),
        )

        return

    if (
        len(input_data)
        > MAX_INPUT_CHARACTERS
    ):
        emit_result(
            status="runner_error",
            error=(
                "Test input "
                "is too large."
            ),
        )

        return

    apply_resource_limits()

    file_path: str | None = (
        None
    )

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            prefix="solution_",
            dir="/tmp",
            encoding="utf-8",
            delete=False,
        ) as code_file:
            code_file.write(
                code,
            )

            file_path = (
                code_file.name
            )

        environment = {
            "PATH":
                (
                    "/usr/local/bin:"
                    "/usr/bin:"
                    "/bin"
                ),
            "LANG":
                "C.UTF-8",
        }

        started_at = (
            time.monotonic()
        )

        try:
            completed = (
                subprocess.run(
                    [
                        sys.executable,
                        "-I",
                        "-B",
                        file_path,
                    ],
                    input=
                        input_data,
                    capture_output=
                        True,
                    timeout=
                        EXECUTION_TIMEOUT_SECONDS,
                    cwd=
                        "/tmp",
                    env=
                        environment,
                    encoding=
                        "utf-8",
                    errors=
                        "replace",
                    check=
                        False,
                )
            )

        except subprocess.TimeoutExpired as exc:
            elapsed_ms = int(
                (
                    time.monotonic()
                    - started_at
                )
                * 1000
            )

            emit_result(
                status=
                    "timeout",
                stdout=
                    safe_text(
                        exc.stdout,
                    ),
                stderr=
                    safe_text(
                        exc.stderr,
                    ),
                execution_time_ms=
                    elapsed_ms,
                error=(
                    "Execution exceeded "
                    "the time limit."
                ),
            )

            return

        elapsed_ms = int(
            (
                time.monotonic()
                - started_at
            )
            * 1000
        )

        if (
            completed.returncode
            != 0
        ):
            emit_result(
                status=
                    "runtime_error",
                stdout=
                    completed.stdout,
                stderr=
                    completed.stderr,
                execution_time_ms=
                    elapsed_ms,
                error=(
                    "The program exited "
                    "with a runtime error."
                ),
            )

            return

        emit_result(
            status=
                "ok",
            stdout=
                completed.stdout,
            stderr=
                completed.stderr,
            execution_time_ms=
                elapsed_ms,
        )

    except Exception as exc:  # noqa: BLE001 - top-level guard: any unexpected
        # failure while writing/running the submission must still produce a
        # clean JSON result instead of crashing the runner process.
        sys.stderr.write(f"runner_error: {exc!r}\n")

        emit_result(
            status="runner_error",
            error=(
                "The isolated runner "
                "could not execute "
                "the program."
            ),
        )

    finally:
        if (
            file_path
            is not None
        ):
            try:
                os.unlink(
                    file_path,
                )
            except OSError:
                pass


if __name__ == "__main__":
    main()