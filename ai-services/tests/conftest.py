from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture()
def client():
    """FastAPI TestClient with vector store startup initialization mocked."""
    with patch("app.main.vector_store.ensure_collection", return_value=None):
        app = create_app()
        with TestClient(app) as test_client:
            yield test_client
