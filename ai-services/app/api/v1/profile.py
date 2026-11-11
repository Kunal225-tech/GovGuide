import logging
from fastapi import APIRouter, HTTPException
from app.schemas.profile import (
    ProfileExtractRequest,
    ProfileExtractResponse,
    ExtractedProfile,
)
from app.core.llm import llm_service
from app.rag.prompt_templates import PROFILE_EXTRACTION_SYSTEM_PROMPT
from app.services.profile_normalizer import (
    sanitize_profile_input,
    normalize_extracted_profile,
    fallback_extract_profile,
    ALL_PROFILE_FIELDS,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["Profile Extraction"])


@router.post("/extract", response_model=ProfileExtractResponse, summary="Extract structured demographics from text")
def extract_demographic_profile(request: ProfileExtractRequest) -> ProfileExtractResponse:
    """Extracts and canonicalizes citizen demographics (age, state, district, income, category, etc.)
    from natural English, Hindi, or Hinglish text with deterministic normalization and fallback.
    """
    if not request.text or len(request.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please enter a short description of your details.")

    sanitized_text, privacy_warning = sanitize_profile_input(request.text)
    extraction_source = "llm"

    try:
        user_prompt = (
            f"Preferred UI language: {request.language or 'en'}\n"
            f"Extract citizen demographics from this message:\n\"\"\"{sanitized_text}\"\"\""
        )
        result_json = llm_service.generate_json(
            prompt=user_prompt,
            system_instruction=PROFILE_EXTRACTION_SYSTEM_PROMPT,
        )
        if isinstance(result_json, list):
            result_json = result_json[0] if result_json and isinstance(result_json[0], dict) else {}
        if not isinstance(result_json, dict):
            result_json = {"error": "Unexpected non-object extraction response"}

        if "error" in result_json and result_json.get("error"):
            logger.warning(f"LLM extraction unavailable ({result_json.get('error')}); using deterministic fallback parser.")
            result_json = fallback_extract_profile(sanitized_text)
            extraction_source = "fallback"

        normalized = normalize_extracted_profile(
            result_json,
            original_text=sanitized_text,
            privacy_warning=privacy_warning,
        )

        has_any_field = any(normalized.get(f) is not None for f in ALL_PROFILE_FIELDS)
        if not has_any_field and extraction_source == "llm":
            # Try deterministic parser once before giving up
            fallback_raw = fallback_extract_profile(sanitized_text)
            fallback_norm = normalize_extracted_profile(
                fallback_raw,
                original_text=sanitized_text,
                privacy_warning=privacy_warning,
            )
            if any(fallback_norm.get(f) is not None for f in ALL_PROFILE_FIELDS):
                normalized = fallback_norm
                extraction_source = "fallback"

        extracted = ExtractedProfile(**normalized)
        found_any = any(getattr(extracted, f) is not None for f in ALL_PROFILE_FIELDS)

        if not found_any:
            return ProfileExtractResponse(
                success=False,
                profile=extracted,
                message="Could not detect clear demographic details. Try mentioning your age, district in Bihar, education, occupation, category, or annual income.",
                extraction_source=extraction_source,
            )

        return ProfileExtractResponse(
            success=True,
            profile=extracted,
            message=(
                "Demographics extracted using offline parser (AI quota limit reached). Please review before applying."
                if extraction_source == "fallback"
                else "Demographics extracted and matched to Bihar profile options."
            ),
            extraction_source=extraction_source,
        )
    except Exception as e:
        logger.error(f"Error extracting profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Profile extraction error: {str(e)}")
