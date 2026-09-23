import json
from typing import Any

import httpx

from app.ai.providers.base import (
    AIProvider,
    AIProviderError,
)

GROQ_CHAT_COMPLETIONS_URL = (
    "https://api.groq.com/openai/v1/chat/completions"
)


class GroqProvider(AIProvider):
    """
    Cloud AI provider backed by Groq's OpenAI-compatible chat
    completions API. No local process, no laptop dependency - this
    is a plain HTTPS call using the existing `httpx` dependency.
    """

    def __init__(self, *, api_key: str, model: str) -> None:
        if not api_key:
            raise AIProviderError(
                "GROQ_API_KEY is not configured on the server."
            )

        self._api_key = api_key
        self._model = model

    async def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        schema_instructions = (
            "Respond with a single JSON object only. "
            "Do not include markdown, code fences, or any text "
            "before or after the JSON object. "
            "The JSON object must conform to this JSON Schema:\n"
            f"{json.dumps(schema)}"
        )

        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        f"{system_prompt}\n\n{schema_instructions}"
                    ),
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            "response_format": {
                "type": "json_object",
            },
            "temperature": 0.3,
        }

        try:
            async with httpx.AsyncClient(
                timeout=60.0,
            ) as client:
                response = await client.post(
                    GROQ_CHAT_COMPLETIONS_URL,
                    headers={
                        "Authorization": (
                            f"Bearer {self._api_key}"
                        ),
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise AIProviderError(
                "Could not reach the Groq API."
            ) from exc

        if response.status_code in (401, 403):
            raise AIProviderError(
                "The Groq API key was rejected. "
                "Check the GROQ_API_KEY value."
            )

        if response.status_code == 429:
            raise AIProviderError(
                "The Groq API rate limit was reached. "
                "Please try again shortly."
            )

        if response.status_code >= 400:
            raise AIProviderError(
                "The Groq API returned an error "
                f"(HTTP {response.status_code})."
            )

        try:
            body = response.json()
            content = (
                body["choices"][0]["message"]["content"]
            )
        except (
            KeyError,
            IndexError,
            ValueError,
        ) as exc:
            raise AIProviderError(
                "The Groq API returned an unexpected "
                "response shape."
            ) from exc

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise AIProviderError(
                "The Groq API did not return valid JSON."
            ) from exc

