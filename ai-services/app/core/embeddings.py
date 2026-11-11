import logging
import hashlib
from typing import List
from app.config import get_settings

logger = logging.getLogger(__name__)

DEFAULT_DIMENSION = 768


class EmbeddingService:
    """Generates dense vector embeddings using Google GenAI or local fallback."""

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
                logger.info("Configured Google GenAI embeddings client.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")
                self._client = None

        return self._client

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for a single string."""
        client = self._get_client()

        if client and self.settings.GEMINI_API_KEY:
            try:
                from google.genai import types

                result = client.models.embed_content(
                    model=self.settings.EMBEDDING_MODEL,
                    contents=text,
                    config=types.EmbedContentConfig(output_dimensionality=DEFAULT_DIMENSION),
                )
                if result.embeddings and len(result.embeddings) > 0:
                    return list(result.embeddings[0].values)
            except Exception as e:
                logger.warning(f"Google GenAI embedding failed ({e}); falling back to deterministic mock embedding.")

        return self._mock_embedding(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of strings."""
        return [self.embed_text(t) for t in texts]

    def _mock_embedding(self, text: str) -> List[float]:
        """Deterministic pseudo-embedding for testing when API key is missing."""
        hasher = hashlib.sha256(text.encode("utf-8"))
        digest = hasher.digest()
        vector = []
        for i in range(DEFAULT_DIMENSION):
            byte_val = digest[i % len(digest)]
            val = ((byte_val / 255.0) * 2.0 - 1.0) * 0.1
            vector.append(float(val))
        return vector


embedding_service = EmbeddingService()
