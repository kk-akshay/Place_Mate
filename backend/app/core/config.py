from functools import lru_cache
from typing import Literal

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    app_name: str = "AI Placement Preparation Platform API"

    jwt_secret_key: str

    jwt_algorithm: str = "HS256"

    jwt_issuer: str = "place-mate-api"

    jwt_audience: str = "place-mate-web"

    access_token_expire_minutes: int = 15

    refresh_token_expire_days: int = 7

    refresh_cookie_name: str = (
        "place_mate_refresh_token"
    )

    refresh_cookie_secure: bool = False

    refresh_cookie_samesite: Literal[
        "lax",
        "strict",
        "none",
    ] = "lax"

    environment: Literal[
        "development",
        "test",
        "production",
    ] = "development"

    api_v1_prefix: str = "/api/v1"

    database_url: str

    frontend_url: str = "http://localhost:3000"

    ai_provider: str = "groq"

    groq_api_key: str = ""

    groq_model: str = "openai/gpt-oss-120b"

    gemini_api_key: str = ""

    gemini_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
