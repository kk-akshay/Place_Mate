import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


def build_error_response(
    *,
    code: str,
    message: str,
    details: Any | None = None,
) -> dict[str, Any]:
    error: dict[str, Any] = {
        "code": code,
        "message": message,
    }

    if details is not None:
        error["details"] = details

    return {
        "error": error,
    }


async def app_exception_handler(
    _: Request,
    exc: AppException,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_response(
            code=exc.code,
            message=exc.message,
            details=exc.details,
        ),
    )


async def validation_exception_handler(
    _: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = []

    for error in exc.errors():
        location = [
            str(part)
            for part in error["loc"]
            if part != "body"
        ]

        errors.append(
            {
                "field": ".".join(location),
                "message": error["msg"],
                "type": error["type"],
            }
        )

    return JSONResponse(
        status_code=422,
        content=build_error_response(
            code="VALIDATION_ERROR",
            message="The request contains invalid data.",
            details=errors,
        ),
    )


async def unexpected_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    logger.exception(
        "Unhandled application exception",
        extra={
            "method": request.method,
            "path": request.url.path,
        },
        exc_info=exc,
    )

    return JSONResponse(
        status_code=500,
        content=build_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred.",
        ),
    )


def register_exception_handlers(
    app: FastAPI,
) -> None:
    app.add_exception_handler(
        AppException,
        app_exception_handler,
    )

    app.add_exception_handler(
        RequestValidationError,
        validation_exception_handler,
    )

    app.add_exception_handler(
        Exception,
        unexpected_exception_handler,
    )