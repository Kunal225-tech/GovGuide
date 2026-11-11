import os
import logging
from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.config import get_settings

logger = logging.getLogger(__name__)

# Dimension for Google's text-embedding-004
EMBEDDING_DIM = 768


class VectorStoreManager:
    """Manages Qdrant client connection and collection initialization."""

    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[QdrantClient] = None

    def get_client(self) -> QdrantClient:
        """Initialize or return existing Qdrant client singleton.
        
        Supports:
        1. Remote Qdrant (Docker or Cloud) when QDRANT_URL is provided.
        2. Local disk storage mode (no Docker required) when QDRANT_URL is empty.
        """
        if self._client is None:
            if self.settings.QDRANT_URL:
                logger.info(f"Connecting to remote Qdrant at {self.settings.QDRANT_URL}")
                self._client = QdrantClient(
                    url=self.settings.QDRANT_URL,
                    api_key=self.settings.QDRANT_API_KEY or None,
                    timeout=10.0,
                )
            else:
                storage_path = os.path.abspath(self.settings.QDRANT_STORAGE_PATH)
                os.makedirs(storage_path, exist_ok=True)
                logger.info(f"Using local disk-persisted Qdrant storage at {storage_path}")
                self._client = QdrantClient(path=storage_path)

        return self._client

    def ensure_collection(self, recreate: bool = False) -> str:
        """Create or verify the scheme collection with cosine similarity."""
        client = self.get_client()
        collection_name = self.settings.QDRANT_COLLECTION

        collections = [c.name for c in client.get_collections().collections]

        if recreate and collection_name in collections:
            logger.info(f"Recreating Qdrant collection: {collection_name}")
            try:
                # Explicitly purge all existing points first so Windows SQLite handles never retain stale records
                while True:
                    existing_pts, next_offset = client.scroll(
                        collection_name=collection_name,
                        limit=256,
                        with_payload=False,
                        with_vectors=False,
                    )
                    if not existing_pts:
                        break
                    client.delete(
                        collection_name=collection_name,
                        points_selector=qmodels.PointIdsList(
                            points=[pt.id for pt in existing_pts]
                        ),
                    )
                    if next_offset is None:
                        break
            except Exception as e:
                logger.warning(f"Failed pre-purge of collection points: {e}")

            client.delete_collection(collection_name=collection_name)
            collections.remove(collection_name)

        if collection_name not in collections:
            logger.info(f"Creating Qdrant collection: {collection_name} (dim={EMBEDDING_DIM})")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=qmodels.VectorParams(
                    size=EMBEDDING_DIM,
                    distance=qmodels.Distance.COSINE,
                ),
            )
            # Create payload indexes on remote Qdrant only (not supported/needed in local embedded mode)
            if self.settings.QDRANT_URL:
                client.create_payload_index(
                    collection_name=collection_name,
                    field_name="category",
                    field_schema=qmodels.PayloadSchemaType.KEYWORD,
                )
                client.create_payload_index(
                    collection_name=collection_name,
                    field_name="state",
                    field_schema=qmodels.PayloadSchemaType.KEYWORD,
                )
                client.create_payload_index(
                    collection_name=collection_name,
                    field_name="level",
                    field_schema=qmodels.PayloadSchemaType.KEYWORD,
                )
        else:
            logger.info(f"Qdrant collection '{collection_name}' already exists.")

        return collection_name


vector_store = VectorStoreManager()
