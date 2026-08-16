from fastapi import (
    APIRouter,
)

from app.api.routes import (
    aptitude,
    auth,
    health,
    preparation,
    profiles,
    users,
)

api_router = (
    APIRouter()
)


api_router.include_router(
    health.router,
)

api_router.include_router(
    auth.router,
)

api_router.include_router(
    users.router,
)

api_router.include_router(
    profiles.router,
)

api_router.include_router(
    aptitude.router,
)

api_router.include_router(
    preparation.router,
)