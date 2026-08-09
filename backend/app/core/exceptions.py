from typing import Any


class AppException(Exception):
    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int,
        details: Any | None = None,
    ) -> None:
        super().__init__(message)

        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class ResourceNotFoundError(AppException):
    def __init__(
        self,
        message: str = "The requested resource was not found.",
    ) -> None:
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=message,
            status_code=404,
        )


class ConflictError(AppException):
    def __init__(
        self,
        *,
        code: str = "RESOURCE_CONFLICT",
        message: str = "The requested operation conflicts with existing data.",
    ) -> None:
        super().__init__(
            code=code,
            message=message,
            status_code=409,
        )


class UnauthorizedError(AppException):
    def __init__(
        self,
        message: str = "Authentication is required.",
    ) -> None:
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=401,
        )


class ForbiddenError(AppException):
    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
    ) -> None:
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=403,
        )