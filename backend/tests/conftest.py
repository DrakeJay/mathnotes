"""Test configuration: point the app at a throwaway SQLite database BEFORE
any app module is imported, so `pytest` needs no running Postgres."""

import os
import tempfile

_db_path = os.path.join(tempfile.mkdtemp(prefix="mathnotes-test-"), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["ADMIN_PASSWORD"] = "test-password"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    # Entering the context runs the lifespan: create_all, seed, admin user.
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def admin(client):
    """A client with a fresh admin session cookie."""
    res = client.post("/api/auth/login", json={"password": "test-password"})
    assert res.status_code == 200
    return client
