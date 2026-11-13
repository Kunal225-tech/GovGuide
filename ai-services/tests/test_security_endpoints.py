import os
import unittest
from unittest.mock import patch
from pydantic import ValidationError
from starlette.testclient import TestClient

from app.schemas.chat import ChatRequest
from app.schemas.profile import ProfileExtractRequest
from app.main import create_app
from app.config import Settings


class TestSecurityEndpointsAndSchemas(unittest.TestCase):
    """Verifies pre-deployment security controls across AI schemas, auth, and rate limits."""

    def test_chat_request_valid_query_and_message(self):
        """ChatRequest accepts query or message and synchronizes both within bounds."""
        req1 = ChatRequest(query="Tell me about scholarships", top_k=4)
        self.assertEqual(req1.query, "Tell me about scholarships")
        self.assertEqual(req1.message, "Tell me about scholarships")
        self.assertEqual(req1.top_k, 4)

        req2 = ChatRequest(message="छात्रवृत्ति के बारे में बताएं", top_k=6)
        self.assertEqual(req2.query, "छात्रवृत्ति के बारे में बताएं")
        self.assertEqual(req2.message, "छात्रवृत्ति के बारे में बताएं")
        self.assertEqual(req2.top_k, 6)

    def test_chat_request_message_bounds_rejection(self):
        """ChatRequest rejects empty message or message exceeding 1000 characters."""
        with self.assertRaises(ValidationError):
            ChatRequest(message="")

        with self.assertRaises(ValidationError):
            ChatRequest(query="")

        # Over 1000 chars
        with self.assertRaises(ValidationError):
            ChatRequest(message="x" * 1001)

        # top_k bounds: ge=1, le=10
        with self.assertRaises(ValidationError):
            ChatRequest(message="Valid query", top_k=0)

        with self.assertRaises(ValidationError):
            ChatRequest(message="Valid query", top_k=11)

    def test_profile_extract_request_text_cap(self):
        """ProfileExtractRequest caps text at 2000 characters."""
        valid_req = ProfileExtractRequest(text="A" * 1999)
        self.assertEqual(len(valid_req.text), 1999)

        valid_max = ProfileExtractRequest(text="A" * 2000)
        self.assertEqual(len(valid_max.text), 2000)

        with self.assertRaises(ValidationError):
            ProfileExtractRequest(text="A" * 2001)

    def test_ingest_endpoint_auth_enforcement(self):
        """POST /api/v1/ingest/schemes rejects unauthorized access when key is set or in production."""
        test_settings = Settings(
            ENVIRONMENT="production",
            INGEST_API_KEY="super-secret-ingest-token-12345",
        )

        app = create_app()
        from app.config import get_settings
        app.dependency_overrides[get_settings] = lambda: test_settings
        client = TestClient(app)

        # 1. Missing header in production
        resp_no_key = client.post(
            "/api/v1/ingest/schemes",
            json={"recreate_collection": False},
        )
        self.assertEqual(resp_no_key.status_code, 403)
        self.assertIn("Forbidden", resp_no_key.json().get("detail", ""))

        # 2. Invalid header in production
        resp_wrong_key = client.post(
            "/api/v1/ingest/schemes",
            headers={"X-Ingest-Key": "wrong-token"},
            json={"recreate_collection": False},
        )
        self.assertEqual(resp_wrong_key.status_code, 403)

        # Clean up overrides
        app.dependency_overrides.clear()

    def test_rate_limiting_middleware_429(self):
        """Rate limiting returns HTTP 429 when max requests per window is exceeded."""
        app = create_app()
        client = TestClient(app)

        # We simulate 21 requests to /api/v1/profile/extract
        # The 21st request from the same IP must receive HTTP 429
        got_429 = False
        payload = {"text": "I am a 25 year old farmer living in Patna Bihar."}

        for i in range(25):
            resp = client.post(
                "/api/v1/profile/extract",
                headers={"X-Forwarded-For": "203.0.113.195"},
                json=payload,
            )
            if resp.status_code == 429:
                got_429 = True
                self.assertIn("Rate limit of 20 requests per minute exceeded", resp.json().get("detail", ""))
                self.assertIn("Retry-After", resp.headers)
                break

        self.assertTrue(got_429, "Expected HTTP 429 Too Many Requests after 20 calls")


if __name__ == "__main__":
    unittest.main()
