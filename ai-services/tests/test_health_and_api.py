from unittest.mock import MagicMock, patch
from app.schemas.chat import ChatResponse, SchemeCitation


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "GovGuide AI Services"
    assert data["status"] == "operational"


def test_health_endpoint_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "collection" in data
    assert "environment" in data
    assert "gemini_configured" in data


def test_chat_endpoint_valid_query(client):
    mock_response = ChatResponse(
        answer="Bihar Student Credit Card Scheme provides education loans up to Rs 4 lakh.",
        citations=[
            SchemeCitation(
                scheme_id="scheme-1",
                name="Bihar Student Credit Card Scheme",
                category="Education",
                level="state",
                state="Bihar",
                official_url="https://www.7nishchay-yuvaupmission.bihar.gov.in/",
                relevance_snippet="Education loan up to 4 lakh...",
            )
        ],
        language="en",
        metadata={"retrieved_passages": 1, "out_of_scope_blocked": False},
    )

    with patch("app.api.v1.chat.rag_generator.generate_response", return_value=mock_response) as mock_gen:
        response = client.post(
            "/api/v1/chat",
            json={
                "query": "Tell me about Bihar Student Credit Card",
                "language": "en",
                "user_profile": {"age": 20, "state": "Bihar", "occupation": "Student"},
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert "Student Credit Card" in data["answer"]
    assert len(data["citations"]) == 1
    assert data["citations"][0]["scheme_id"] == "scheme-1"
    mock_gen.assert_called_once()


def test_chat_endpoint_accepts_message_alias(client):
    mock_response = ChatResponse(
        answer="PM-KISAN provides Rs 6000 annual income support.",
        citations=[],
        language="en",
        metadata={},
    )

    with patch("app.api.v1.chat.rag_generator.generate_response", return_value=mock_response) as mock_gen:
        response = client.post(
            "/api/v1/chat",
            json={"message": "What is PM Kisan?", "language": "en"},
        )

    assert response.status_code == 200
    called_request = mock_gen.call_args[0][0]
    assert called_request.query == "What is PM Kisan?"


def test_chat_endpoint_rejects_empty_query(client):
    response = client.post("/api/v1/chat", json={"query": ""})
    assert response.status_code == 422


def test_chat_endpoint_handles_internal_error(client):
    with patch("app.api.v1.chat.rag_generator.generate_response", side_effect=RuntimeError("Qdrant timeout")):
        response = client.post("/api/v1/chat", json={"query": "Tell me about schemes"})

    assert response.status_code == 500
    assert "Failed to generate answer" in response.json()["detail"]


def test_profile_extract_with_mocked_llm(client):
    mock_llm_output = {
        "age": 22,
        "gender": "Female",
        "state": "Bihar",
        "district": "Patna",
        "annualIncome": 150000,
        "occupation": "Student",
        "education": "Graduate",
        "category": "OBC",
    }

    with patch("app.api.v1.profile.llm_service.generate_json", return_value=mock_llm_output):
        response = client.post(
            "/api/v1/profile/extract",
            json={
                "text": "I am a 22 year old female OBC student from Patna, Bihar with family income 1.5 lakh.",
                "language": "en",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["extraction_source"] == "llm"
    assert data["profile"]["age"] == 22
    assert data["profile"]["district"] == "Patna"
    assert data["profile"]["occupation"] == "Student"


def test_profile_extract_uses_fallback_when_llm_unavailable(client):
    with patch(
        "app.api.v1.profile.llm_service.generate_json",
        return_value={"error": "GEMINI_API_KEY not configured"},
    ):
        response = client.post(
            "/api/v1/profile/extract",
            json={
                "text": "I am a 25 year old farmer from Gaya Bihar earning 120000 per year.",
                "language": "en",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["extraction_source"] == "fallback"
    assert data["profile"]["age"] == 25
    assert data["profile"]["district"] == "Gaya"
    assert data["profile"]["occupation"] == "Farmer"


def test_profile_extract_rejects_short_text(client):
    response = client.post("/api/v1/profile/extract", json={"text": "hi"})
    assert response.status_code == 422

    response_spaces = client.post("/api/v1/profile/extract", json={"text": "   "})
    assert response_spaces.status_code == 400


def test_ingest_schemes_enforces_api_key_and_runs(client):
    mock_settings = MagicMock()
    mock_settings.ENVIRONMENT = "production"
    mock_settings.INGEST_API_KEY = "super-secret-ingest-key"

    from app.config import get_settings

    client.app.dependency_overrides[get_settings] = lambda: mock_settings
    try:
        # Missing key -> 403
        forbidden_res = client.post("/api/v1/ingest/schemes", json={"recreate_collection": False})
        assert forbidden_res.status_code == 403

        # Wrong key -> 403
        wrong_res = client.post(
            "/api/v1/ingest/schemes",
            json={"recreate_collection": False},
            headers={"X-Ingest-Key": "wrong-key"},
        )
        assert wrong_res.status_code == 403

        # Valid key -> 200
        mock_ingest_result = {
            "success": True,
            "schemes_processed": 5,
            "chunks_created": 20,
            "points_indexed": 20,
            "collection_name": "govguide_schemes",
            "message": "Indexed successfully",
        }
        with patch("app.api.v1.ingest.indexer.run_ingestion", return_value=mock_ingest_result):
            ok_res = client.post(
                "/api/v1/ingest/schemes",
                json={"recreate_collection": False},
                headers={"X-Ingest-Key": "super-secret-ingest-key"},
            )
        assert ok_res.status_code == 200
        assert ok_res.json()["schemes_processed"] == 5
    finally:
        client.app.dependency_overrides.clear()
