from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class IngestionRequest(BaseModel):
    recreate_collection: bool = Field(
        default=False,
        description="If True, drops the existing collection and re-indexes all schemes from scratch."
    )
    categories: Optional[List[str]] = Field(
        default=None,
        description="Optional list of categories to filter for indexing. If None, indexes all."
    )


class IngestionStatusResponse(BaseModel):
    success: bool
    schemes_processed: int
    chunks_created: int
    points_indexed: int
    collection_name: str
    message: str
    errors: List[str] = Field(default_factory=list)

