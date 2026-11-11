import logging
from fastapi import APIRouter, HTTPException
from app.schemas.ingestion import IngestionRequest, IngestionStatusResponse
from app.ingestion.indexer import indexer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["Scheme Ingestion & Indexing"])


@router.post("/schemes", response_model=IngestionStatusResponse, summary="Ingest and index MongoDB schemes into vector store")
def ingest_schemes_endpoint(request: IngestionRequest) -> IngestionStatusResponse:
    """Reads schemes from MongoDB, generates semantic chunks, embeds them,
    and updates the Qdrant vector database collection.
    """
    try:
        response = indexer.run_ingestion(
            recreate_collection=request.recreate_collection,
            categories=request.categories,
        )
        return response
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scheme ingestion error: {str(e)}")
