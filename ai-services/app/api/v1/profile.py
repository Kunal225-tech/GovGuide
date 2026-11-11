import logging
from fastapi import APIRouter, HTTPException
from app.schemas.profile import (
    ProfileExtractRequest,
    ProfileExtractResponse,
    ExtractedProfile,
)
from app.core.llm import llm_service
from app.rag.prompt_templates import PROFILE_EXTRACTION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["Profile Extraction"])


@router.post("/extract", response_model=ProfileExtractResponse, summary="Extract structured demographics from text")
def extract_demographic_profile(request: ProfileExtractRequest) -> ProfileExtractResponse:
    """Extracts structured citizen demographics (age, state, income, category, etc.)
    from conversational natural language input.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    try:
        user_prompt = f"Extract citizen demographics from this message:\n\"\"\"{request.text.strip()}\"\"\""
        result_json = llm_service.generate_json(
            prompt=user_prompt,
            system_instruction=PROFILE_EXTRACTION_SYSTEM_PROMPT,
        )

        if "error" in result_json and result_json.get("error"):
            # If API key missing or error occurred
            return ProfileExtractResponse(
                success=False,
                profile=ExtractedProfile(),
                message=result_json.get("message", result_json.get("error", "Extraction failed")),
            )

        extracted = ExtractedProfile(
            age=result_json.get("age"),
            gender=result_json.get("gender"),
            state=result_json.get("state"),
            district=result_json.get("district"),
            annualIncome=result_json.get("annualIncome"),
            occupation=result_json.get("occupation"),
            education=result_json.get("education"),
            category=result_json.get("category"),
            confidence_notes=result_json.get("confidence_notes"),
            missing_fields=result_json.get("missing_fields", []),
        )

        return ProfileExtractResponse(
            success=True,
            profile=extracted,
            message="Demographics successfully extracted.",
        )
    except Exception as e:
        logger.error(f"Error extracting profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Profile extraction error: {str(e)}")
