import json
from typing import Any

import httpx

from app.ai.providers.base import (
    AIProvider,
    AIProviderError,
)

GEMINI_GENERATE_CONTENT_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/{model}:generateContent"
)


class GeminiProvider(AIProvider):
    """
    Cloud AI provider backed by Google's Gemini API. Implements the
    same interface as GroqProvider so `AI_PROVIDER=gemini` in the
    environment is the only change needed to switch providers - no
    code changes anywhere else in the app.
    """

    def __init__(self, *, api_key: str, model: str) -> None:
        if not api_key:
            raise AIProviderError(
                "GEMINI_API_KEY is not configured on the server."
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
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            f"{system_prompt}\n\n"
                            f"{schema_instructions}"
                        ),
                    },
                ],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": user_prompt},
                    ],
                },
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.3,
            },
        }

        url = GEMINI_GENERATE_CONTENT_URL.format(
            model=self._model,
        )

        try:
            async with httpx.AsyncClient(
                timeout=60.0,
            ) as client:
                response = await client.post(
                    url,
                    params={"key": self._api_key},
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise AIProviderError(
                "Could not reach the Gemini API."
            ) from exc

        if response.status_code in (400, 401, 403):
            raise AIProviderError(
                "The Gemini API key was rejected. "
                "Check the GEMINI_API_KEY value."
            )

        if response.status_code == 429:
            raise AIProviderError(
                "The Gemini API rate limit was reached. "
                "Please try again shortly."
            )

        if response.status_code >= 400:
            raise AIProviderError(
                "The Gemini API returned an error "
                f"(HTTP {response.status_code})."
            )

        try:
            body = response.json()
            content = (
                body["candidates"][0]["content"]
                ["parts"][0]["text"]
            )
        except (
            KeyError,
            IndexError,
            ValueError,
        ) as exc:
            raise AIProviderError(
                "The Gemini API returned an unexpected "
                "response shape."
            ) from exc

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise AIProviderError(
                "The Gemini API did not return valid JSON."
            ) from exc

