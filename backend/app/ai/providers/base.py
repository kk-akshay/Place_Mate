from abc import ABC, abstractmethod
from typing import Any


class AIProviderError(Exception):
    """
    Raised whenever the configured AI provider cannot produce a
    usable JSON response - unreachable API, rejected key, rate
    limit, malformed response, etc.

    Callers only ever need to catch this one exception type; each
    provider implementation is responsible for translating its own
    failure modes (network errors, HTTP status codes, bad JSON) into
    an AIProviderError with a clear, user-safe message.
    """


class AIProvider(ABC):
    """
    Common interface every AI provider (Groq, Gemini, ...) must
    implement so the rest of the app never needs to know which
    provider is actually configured.
    """

    @abstractmethod
    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Ask the model for a JSON object and return it as a parsed
        dict. `schema` is a JSON Schema (as produced by Pydantic's
        `model_json_schema()`) describing the expected shape; it is
        used to instruct the model, not to strictly enforce the
        response - callers must still validate the result themselves
        (the resume service does this with Pydantic).

        Must raise AIProviderError for any failure instead of
        letting provider-specific exceptions escape.
        """
        raise NotImplementedError

