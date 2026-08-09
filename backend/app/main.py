from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.db.session import close_database


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield

    await close_database()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend API for the AI Placement Preparation Platform.",
    lifespan=lifespan,
)


register_exception_handlers(app)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    api_router,
    prefix=settings.api_v1_prefix,
)


@app.get(
    "/",
    include_in_schema=False,
)
async def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "documentation": "/docs",
    }
