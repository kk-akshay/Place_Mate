import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_liveness(client: TestClient) -> None:
    response = client.get("/api/v1/health/live")

    assert response.status_code == 200

    assert response.json() == {
        "status": "ok",
    }


def test_readiness(client: TestClient) -> None:
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200

    assert response.json() == {
        "status": "ok",
        "checks": {
            "database": "ok",
        },
    }