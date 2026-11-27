from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.core.embeddings import DEFAULT_DIMENSION, EmbeddingService
from app.ingestion.chunker import SchemeChunker


def test_chunk_scheme_creates_all_four_semantic_chunks():
    scheme = {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Bihar Student Credit Card Scheme",
        "category": "Education",
        "level": "state",
        "state": "Bihar",
        "description": "Education loan up to Rs 4 lakh for 12th pass students.",
        "officialUrl": "https://www.7nishchay-yuvaupmission.bihar.gov.in/",
        "eligibility": ["Resident of Bihar", "12th pass", "Age below 25 years"],
        "benefits": ["Loan up to Rs 4 lakh", "Minimal interest rate"],
        "requiredDocuments": ["Aadhaar Card", "12th Marksheet"],
        "applicationProcess": ["Register online", "Upload documents", "Attend DRCC verification"],
    }

    chunks = SchemeChunker.chunk_scheme(scheme)

    assert len(chunks) == 4
    chunk_types = [c.chunk_type for c in chunks]
    assert chunk_types == ["overview", "eligibility", "benefits", "process"]
    assert chunks[0].chunk_id == "507f1f77bcf86cd799439011_overview"
    assert "Bihar Student Credit Card Scheme" in chunks[0].text
    assert "Resident of Bihar" in chunks[1].text
    assert "Loan up to Rs 4 lakh" in chunks[2].text
    assert "1. Register online" in chunks[3].text
    assert chunks[0].metadata["category"] == "Education"
    assert chunks[0].metadata["state"] == "Bihar"


def test_chunk_scheme_skips_empty_optional_sections():
    minimal_scheme = {
        "id": "min-1",
        "name": "Minimal Scheme",
        "category": "Social Welfare",
        "level": "central",
        "state": "All",
        "description": "Minimal scheme summary.",
        "officialUrl": "https://india.gov.in",
    }

    chunks = SchemeChunker.chunk_scheme(minimal_scheme)

    assert len(chunks) == 1
    assert chunks[0].chunk_type == "overview"
    assert chunks[0].metadata["scheme_id"] == "min-1"


def test_embedding_service_fallback_returns_expected_dimensions():
    service = EmbeddingService()
    service.settings = SimpleNamespace(GEMINI_API_KEY="", EMBEDDING_MODEL="gemini-embedding-001")

    vec1 = service.embed_text("Bihar Student Credit Card")
    vec2 = service.embed_text("Bihar Student Credit Card")
    vec3 = service.embed_text("Different scheme query")

    assert len(vec1) == DEFAULT_DIMENSION
    assert all(isinstance(v, float) for v in vec1)
    assert vec1 == vec2  # Deterministic for same text
    assert vec1 != vec3


def test_embedding_service_uses_genai_client_when_configured():
    service = EmbeddingService()
    service.settings = SimpleNamespace(
        GEMINI_API_KEY="fake-test-key",
        EMBEDDING_MODEL="gemini-embedding-001",
    )

    expected_vector = [0.05] * DEFAULT_DIMENSION
    mock_client = MagicMock()
    mock_client.models.embed_content.return_value = SimpleNamespace(
        embeddings=[SimpleNamespace(values=expected_vector)]
    )

    with patch.object(service, "_get_client", return_value=mock_client):
        result = service.embed_text("PM-KISAN scheme details")

    assert len(result) == DEFAULT_DIMENSION
    assert result == expected_vector
    mock_client.models.embed_content.assert_called_once()


def test_embedding_batch_returns_vector_per_input():
    service = EmbeddingService()
    service.settings = SimpleNamespace(GEMINI_API_KEY="", EMBEDDING_MODEL="gemini-embedding-001")

    vectors = service.embed_batch(["Query 1", "Query 2", "Query 3"])

    assert len(vectors) == 3
    assert all(len(v) == DEFAULT_DIMENSION for v in vectors)
