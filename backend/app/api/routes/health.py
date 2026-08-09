import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("/live")
async def liveness() -> dict[str, str]:
    """
    Confirms that the API process itself is running.
    """

    return {
        "status": "ok",
    }


@router.get("/ready")
async def readiness():
    """
    Confirms that the API is running and PostgreSQL is reachable.
    """

    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))

    except SQLAlchemyError:
        logger.exception("Database readiness check failed")

        return JSONResponse(
            status_code=503,
            content={
                "error": {
                    "code": "DATABASE_UNAVAILABLE",
                    "message": "The database is currently unavailable.",
                }
            },
        )

    return {
        "status": "ok",
        "checks": {
            "database": "ok",
        },
    }