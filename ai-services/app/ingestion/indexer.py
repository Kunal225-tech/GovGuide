import logging
import uuid
from typing import List, Optional
from pymongo import MongoClient
from qdrant_client.http import models as qmodels

from app.config import get_settings
from app.core.vector_store import vector_store
from app.core.embeddings import embedding_service
from app.ingestion.chunker import SchemeChunker, SchemeChunk
from app.schemas.ingestion import IngestionStatusResponse

logger = logging.getLogger(__name__)


class SchemeIndexer:
    """Ingests schemes from MongoDB, chunks them, and indexes them into Qdrant."""

    def __init__(self):
        self.settings = get_settings()

    def run_ingestion(
        self,
        recreate_collection: bool = False,
        categories: Optional[List[str]] = None,
    ) -> IngestionStatusResponse:
        collection_name = vector_store.ensure_collection(recreate=recreate_collection)
        client = vector_store.get_client()

        errors: List[str] = []
        schemes_processed = 0
        chunks_created = 0
        points_indexed = 0

        # 1. Connect to MongoDB and fetch schemes
        try:
            mongo_client = MongoClient(self.settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
            try:
                db = mongo_client.get_default_database()
            except Exception:
                db = None
            if db is None:
                db = mongo_client["govguide"]
            query = {}
            if categories:
                query["category"] = {"$in": categories}

            schemes = list(db["schemes"].find(query))
            logger.info(f"Retrieved {len(schemes)} schemes from MongoDB for indexing.")
        except Exception as e:
            msg = f"Failed to connect to MongoDB at {self.settings.MONGODB_URI}: {e}"
            logger.error(msg)
            return IngestionStatusResponse(
                success=False,
                schemes_processed=0,
                chunks_created=0,
                points_indexed=0,
                collection_name=collection_name,
                message=msg,
                errors=[msg],
            )

        if not schemes:
            return IngestionStatusResponse(
                success=True,
                schemes_processed=0,
                chunks_created=0,
                points_indexed=0,
                collection_name=collection_name,
                message="No schemes found in MongoDB to index.",
                errors=[],
            )

        # 2. Chunk schemes
        all_chunks: List[SchemeChunk] = []
        for scheme in schemes:
            try:
                chunks = SchemeChunker.chunk_scheme(scheme)
                all_chunks.extend(chunks)
                schemes_processed += 1
            except Exception as e:
                err = f"Failed to chunk scheme {scheme.get('name')}: {e}"
                logger.error(err)
                errors.append(err)

        chunks_created = len(all_chunks)
        logger.info(f"Generated {chunks_created} semantic chunks across {schemes_processed} schemes.")

        # 3. Embed & Upload to Qdrant in batches
        BATCH_SIZE = 32
        for i in range(0, len(all_chunks), BATCH_SIZE):
            batch = all_chunks[i : i + BATCH_SIZE]
            texts = [c.text for c in batch]

            try:
                embeddings = embedding_service.embed_batch(texts)
                points = []
                for chunk, vector in zip(batch, embeddings):
                    # Deterministic UUID based on chunk_id
                    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.chunk_id))
                    payload = dict(chunk.metadata)
                    payload["text"] = chunk.text

                    points.append(
                        qmodels.PointStruct(
                            id=point_id,
                            vector=vector,
                            payload=payload,
                        )
                    )

                client.upsert(
                    collection_name=collection_name,
                    points=points,
                )
                points_indexed += len(points)
                logger.info(f"Indexed {points_indexed}/{chunks_created} chunks into Qdrant.")
            except Exception as e:
                err = f"Error embedding/upserting batch {i}-{i+len(batch)}: {e}"
                logger.error(err)
                errors.append(err)

        success = points_indexed > 0 or chunks_created == 0
        message = (
            f"Successfully indexed {points_indexed} scheme passages into '{collection_name}'."
            if success
            else "Ingestion finished with errors."
        )

        return IngestionStatusResponse(
            success=success,
            schemes_processed=schemes_processed,
            chunks_created=chunks_created,
            points_indexed=points_indexed,
            collection_name=collection_name,
            message=message,
            errors=errors,
        )


indexer = SchemeIndexer()

