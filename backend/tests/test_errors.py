from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.exception_handlers import register_exception_handlers
from app.core.exceptions import ResourceNotFoundError


class ExamplePayload(BaseModel):
    name: str
    age: int


def create_test_app() -> FastAPI:
    app = FastAPI()

    register_exception_handlers(app)

    @app.get("/missing")
    async def missing_resource() -> None:
        raise ResourceNotFoundError()

    @app.post("/validate")
    async def validate_payload(
        payload: ExamplePayload,
    ) -> ExamplePayload:
        return payload

    return app


def test_application_exception_format() -> None:
    app = create_test_app()

    with TestClient(app) as client:
        response = client.get("/missing")

    assert response.status_code == 404

    assert response.json() == {
        "error": {
            "code": "RESOURCE_NOT_FOUND",
            "message": "The requested resource was not found.",
        }
    }


def test_validation_error_format() -> None:
    app = create_test_app()

    with TestClient(app) as client:
        response = client.post(
            "/validate",
            json={
                "name": "Joel",
                "age": "not-a-number",
            },
        )

    assert response.status_code == 422

    body = response.json()

    assert body["error"]["code"] == "VALIDATION_ERROR"

    assert body["error"]["message"] == (
        "The request contains invalid data."
    )

    assert body["error"]["details"][0]["field"] == "age"