from functools import lru_cache

from app.ai.providers.base import (
    AIProvider,
    AIProviderError,
)
from app.core.config import settings


@lru_cache
def get_ai_provider() -> AIProvider:
    """
    Return the AI provider selected by the AI_PROVIDER environment
    variable ("groq" or "gemini"). Cached so the same provider
    instance is reused across requests within one running process.
    """

    provider_name = settings.ai_provider.strip().lower()

    if provider_name == "groq":
        from app.ai.providers.groq import GroqProvider

        return GroqProvider(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
        )

    if provider_name == "gemini":
        from app.ai.providers.gemini import GeminiProvider

        return GeminiProvider(
            api_key=settings.gemini_api_key,
            model=settings.gemini_model,
        )

    raise AIProviderError(
        f"Unsupported AI_PROVIDER '{provider_name}'. "
        "Use 'groq' or 'gemini'."
    )

