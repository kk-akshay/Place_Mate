import threading
import time
from collections import deque

from app.core.exceptions import AppException


class SlidingWindowRateLimiter:
    """
    Simple in-memory, per-process sliding-window limiter.

    Fine for a single-instance demo deployment. State is lost on
    restart and is not shared between multiple workers/instances.
    """

    def __init__(self) -> None:
        self._events: dict[
            str,
            deque[float],
        ] = {}

        self._lock = threading.Lock()

    def check(
        self,
        key: str,
        *,
        limit: int,
        window_seconds: float = 60.0,
    ) -> None:
        if limit <= 0:
            return

        now = time.monotonic()

        with self._lock:
            events = (
                self._events.setdefault(
                    key,
                    deque(),
                )
            )

            while (
                events
                and now - events[0]
                >= window_seconds
            ):
                events.popleft()

            if len(events) >= limit:
                retry_after = int(
                    window_seconds
                    - (now - events[0])
                ) + 1

                raise AppException(
                    code="RATE_LIMITED",
                    message=(
                        "Too many requests. "
                        "Please wait about "
                        f"{retry_after} "
                        "seconds and try again."
                    ),
                    status_code=429,
                )

            events.append(now)


coding_rate_limiter = (
    SlidingWindowRateLimiter()
)