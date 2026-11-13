import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from app.config import Settings, get_settings
from app.schemas.ingestion import IngestionRequest, IngestionStatusResponse
from app.ingestion.indexer import indexer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["Scheme Ingestion & Indexing"])


@router.post("/schemes", response_model=IngestionStatusResponse, summary="Ingest and index MongoDB schemes into vector store")
def ingest_schemes_endpoint(
    request: IngestionRequest,
    x_ingest_key: Optional[str] = Header(None, alias="X-Ingest-Key"),
    settings: Settings = Depends(get_settings),
) -> IngestionStatusResponse:
    """Reads schemes from MongoDB, generates semantic chunks, embeds them,
    and updates the Qdrant vector database collection.
    """
    is_production = settings.ENVIRONMENT.lower() == "production"
    has_ingest_key = bool(settings.INGEST_API_KEY and settings.INGEST_API_KEY.strip())

    if is_production or has_ingest_key:
        if not has_ingest_key or not x_ingest_key or x_ingest_key != settings.INGEST_API_KEY:
            logger.warning("Rejected unauthorized ingestion request: invalid or missing X-Ingest-Key")
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Invalid or missing X-Ingest-Key",
            )

    try:
        response = indexer.run_ingestion(
            recreate_collection=request.recreate_collection,
            categories=request.categories,
        )
        return response
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scheme ingestion error: {str(e)}")
