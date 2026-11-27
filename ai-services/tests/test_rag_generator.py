from unittest.mock import patch

from app.rag.generator import RAGGenerator
from app.rag.prompt_templates import SYSTEM_INSTRUCTION_HI
from app.schemas.chat import ChatMessage, ChatRequest, UserDemographics
from app.services.profile_normalizer import sanitize_profile_input


def _sample_passages():
    return [
        {
            "score": 0.95,
            "scheme_id": "s-bsccs",
            "name": "Bihar Student Credit Card Scheme",
            "category": "Education",
            "level": "state",
            "state": "Bihar",
            "official_url": "https://www.7nishchay-yuvaupmission.bihar.gov.in/",
            "text": "Provides up to Rs 4 lakh loan for higher education in Bihar.",
        },
        {
            "score": 0.80,
            "scheme_id": "s-pmkisan",
            "name": "PM-KISAN",
            "category": "Agriculture",
            "level": "central",
            "state": "All",
            "official_url": "https://pmkisan.gov.in/",
            "text": "Provides Rs 6000 per year to eligible farmer families.",
        },
    ]


def test_rag_generator_grounds_only_mentioned_citations():
    generator = RAGGenerator()
    request = ChatRequest(query="Tell me about Student Credit Card", language="en")

    with (
        patch("app.rag.generator.scheme_retriever.retrieve", return_value=_sample_passages()),
        patch(
            "app.rag.generator.llm_service.generate",
            return_value="You can apply for the Bihar Student Credit Card Scheme for higher education loans.",
        ),
    ):
        res = generator.generate_response(request)

    assert len(res.citations) == 1
    assert res.citations[0].scheme_id == "s-bsccs"
    assert res.metadata["out_of_scope_blocked"] is False


def test_rag_generator_strips_citations_on_refusal():
    generator = RAGGenerator()
    request = ChatRequest(query="Write a Python sorting algorithm", language="en")

    with (
        patch("app.rag.generator.scheme_retriever.retrieve", return_value=_sample_passages()),
        patch(
            "app.rag.generator.llm_service.generate",
            return_value="I am dedicated exclusively to Indian government welfare schemes and cannot assist with programming.",
        ),
    ):
        res = generator.generate_response(request)

    assert res.citations == []
    assert res.metadata["out_of_scope_blocked"] is True


def test_rag_generator_enriches_follow_up_query_from_history():
    generator = RAGGenerator()
    request = ChatRequest(
        query="What documents are required for this?",
        language="en",
        conversation_history=[
            ChatMessage(role="user", content="Tell me about PM-KISAN scheme"),
            ChatMessage(role="assistant", content="PM-KISAN supports farmers with Rs 6000 per year."),
        ],
    )

    with (
        patch("app.rag.generator.scheme_retriever.retrieve", return_value=_sample_passages()) as mock_retrieve,
        patch("app.rag.generator.llm_service.generate", return_value="PM-KISAN requires Aadhaar and land records."),
    ):
        generator.generate_response(request)

    retrieve_query = mock_retrieve.call_args.kwargs["query"]
    assert "pm-kisan" in retrieve_query.lower()
    assert "documents" in retrieve_query.lower()


def test_rag_generator_selects_hindi_instruction():
    generator = RAGGenerator()
    request = ChatRequest(
        query="बिहार स्टूडेंट क्रेडिट कार्ड योजना क्या है?",
        language="hi",
        user_profile=UserDemographics(state="Bihar", age=19),
    )

    with (
        patch("app.rag.generator.scheme_retriever.retrieve", return_value=[]),
        patch("app.rag.generator.llm_service.generate", return_value="यह एक शिक्षा ऋण योजना है।") as mock_llm,
    ):
        res = generator.generate_response(request)

    assert res.language == "hi"
    assert mock_llm.call_args.kwargs["system_instruction"] == SYSTEM_INSTRUCTION_HI


def test_sanitize_profile_input_masks_sensitive_ids():
    raw_text = "My Aadhaar is 1234 5678 9012 and PAN is ABCDE1234F, I am 24 from Patna."
    sanitized, warning = sanitize_profile_input(raw_text)

    assert "1234 5678 9012" not in sanitized
    assert "ABCDE1234F" not in sanitized
    assert warning is not None
