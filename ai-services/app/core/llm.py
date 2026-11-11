import logging
import json
from typing import Optional, Dict, Any
from app.config import get_settings

logger = logging.getLogger(__name__)

# Fallback sequence of available Gemini models to guarantee high availability when quota limits hit
FALLBACK_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-flash",
]


class LLMService:
    """Manages LLM completions and structured outputs via the official Google GenAI SDK."""

    def __init__(self):
        self.settings = get_settings()
        self._client = None

    def _get_client(self):
        if not self.settings.GEMINI_API_KEY:
            return None

        if self._client is None:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.settings.GEMINI_API_KEY)
                logger.info("Initialized Google GenAI client.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")
                self._client = None

        return self._client

    def _get_candidate_models(self) -> list[str]:
        preferred = self.settings.GEMINI_MODEL
        candidates = [preferred] if preferred else []
        for m in FALLBACK_MODELS:
            if m not in candidates:
                candidates.append(m)
        return candidates

    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        """Generate text completion with automatic multi-model fallback on rate/quota limits."""
        client = self._get_client()
        if client is None:
            return (
                "⚠️ **GovGuide AI Notice**: `GEMINI_API_KEY` is not yet configured in `ai-services/.env`. "
                "Please add your API key from Google AI Studio (https://aistudio.google.com/) to enable live conversational generation."
            )

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=1500,
            )
            if system_instruction:
                config.system_instruction = system_instruction

            candidate_models = self._get_candidate_models()
            last_error = ""

            for model_name in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=config,
                    )
                    if response.text:
                        return response.text
                except Exception as e:
                    last_error = str(e)
                    if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
                        logger.warning(
                            f"Free-tier quota limit hit for '{model_name}'. Automatically attempting fallback model..."
                        )
                        continue
                    logger.error(f"Generation error with model '{model_name}': {e}")
                    continue

            # If all candidates exhausted due to 429 quota exhaustion
            if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
                return (
                    "⚠️ **GovGuide Saathi Notice**: The free-tier daily request quota for Google Gemini has been temporarily exhausted. "
                    "Please wait a brief moment, or generate a fresh free API key from Google AI Studio (https://aistudio.google.com/) and update `ai-services/.env`."
                )

            return f"Error communicating with AI service: {last_error}"
        except Exception as e:
            logger.error(f"Gemini generation critical error: {e}")
            return f"Error communicating with AI service: {str(e)}"

    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON output with automatic multi-model fallback."""
        client = self._get_client()
        if client is None:
            return {
                "error": "GEMINI_API_KEY not configured",
                "message": "Add GEMINI_API_KEY to ai-services/.env to enable structured extraction",
            }

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            )
            if system_instruction:
                config.system_instruction = system_instruction

            candidate_models = self._get_candidate_models()
            last_error = ""

            for model_name in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=config,
                    )
                    if response.text:
                        return json.loads(response.text)
                except Exception as e:
                    last_error = str(e)
                    if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
                        logger.warning(
                            f"Free-tier quota limit hit for JSON extraction with '{model_name}'. Trying fallback model..."
                        )
                        continue
                    logger.error(f"JSON extraction error with model '{model_name}': {e}")
                    continue

            return {"error": last_error}
        except Exception as e:
            logger.error(f"Gemini JSON generation error: {e}")
            return {"error": str(e)}


llm_service = LLMService()
