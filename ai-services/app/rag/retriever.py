import logging
from typing import List, Optional
from qdrant_client.http import models as qmodels

from app.config import get_settings
from app.core.vector_store import vector_store
from app.core.embeddings import embedding_service
from app.schemas.chat import SchemeCitation

logger = logging.getLogger(__name__)


class SchemeRetriever:
    """Retrieves relevant scheme passages from Qdrant vector database."""

    def __init__(self):
        self.settings = get_settings()

    def retrieve(
        self,
        query: str,
        user_state: Optional[str] = None,
        category: Optional[str] = None,
        top_k: int = 4,
    ) -> List[dict]:
        """Perform similarity search over indexed scheme passages."""
        client = vector_store.get_client()
        collection_name = self.settings.QDRANT_COLLECTION

        # Check if collection exists
        collections = [c.name for c in client.get_collections().collections]
        if collection_name not in collections:
            logger.warning(f"Collection '{collection_name}' does not exist yet. Run ingestion first.")
            return []

        # Clean and trim input query (strip outer quotes/backticks/whitespace)
        clean_query = query.strip().strip('"\'“”‘’`')

        # 1. Embed query
        query_vector = embedding_service.embed_text(clean_query)

        # 2. Build filters (State matching: scheme is "All" / Central OR matches user's state)
        filter_conditions = []
        q_lower = clean_query.lower()
        
        # Don't restrict by user_state if query explicitly mentions another state or specific scheme
        cross_state_markers = [
            "karnataka", "maharashtra", "uttar pradesh", "bihar", "rajasthan",
            "gruha", "lakshmi", "yuva", "ladki", "bahin", "sumangala"
        ]
        is_cross_state = any(m in q_lower for m in cross_state_markers)

        if user_state and user_state.strip() and user_state.lower() != "all" and not is_cross_state:
            st = user_state.strip()
            filter_conditions.append(
                qmodels.FieldCondition(
                    key="state",
                    match=qmodels.MatchAny(any=["All", "central", st, st.title(), st.lower()]),
                )
            )

        if category and category.strip():
            filter_conditions.append(
                qmodels.FieldCondition(
                    key="category",
                    match=qmodels.MatchValue(value=category.strip()),
                )
            )

        query_filter = qmodels.Filter(must=filter_conditions) if filter_conditions else None

        fetch_limit = max(top_k * 4, 25)
        try:
            # In Qdrant client 1.10+, query_points replaces search
            if hasattr(client, "query_points"):
                response = client.query_points(
                    collection_name=collection_name,
                    query=query_vector,
                    query_filter=query_filter,
                    limit=fetch_limit,
                    with_payload=True,
                )
                points = response.points
            else:
                points = client.search(
                    collection_name=collection_name,
                    query_vector=query_vector,
                    query_filter=query_filter,
                    limit=fetch_limit,
                    with_payload=True,
                )

            # Bilingual keyword mapping for hybrid boosting across English and Devanagari Hindi
            bilingual_scheme_boost_map = {
                "kisan": ["kisan", "pm-kisan", "pmkisan", "किसान", "पीएम-किसान", "पीएम किसान"],
                "mudra": ["mudra", "pmmy", "मुद्रा", "पीएमएमवाई"],
                "awas": ["awas", "pmay", "pmayg", "आवास", "पीएमएवाई", "मकान"],
                "ayushman": ["ayushman", "pm-jay", "pmjay", "jan arogya", "arogya", "आयुष्मान", "पीएम-जय", "आरोग्य", "स्वास्थ्य कार्ड"],
                "sukanya": ["sukanya", "samriddhi", "ssy", "सुकन्या", "समृद्धि"],
                "svanidhi": ["svanidhi", "vendor", "hawker", "स्वनिधि", "वेंडर", "रेहड़ी", "पटरी"],
                "gruha": ["gruha", "gruhalakshmi", "गृह लक्ष्मी", "गृहलक्ष्मी"],
                "lakshmi": ["lakshmi", "लक्ष्मी"],
                "yuva": ["yuva", "yuvanidhi", "युवा निधि", "युवानिधि", "युवा"],
                "ladki": ["ladki", "bahin", "माझी लाड़की", "लाड़की बहिन", "माझी लड़की", "लड़की बहिन"],
                "sumangala": ["sumangala", "kanya sumangala", "mksy", "कन्या सुमंगला", "सुमंगला"],
                "scholarship": ["scholarship", "fellowship", "छात्रवृत्ति", "स्कॉलरशिप"],
                "pension": ["pension", "old age", "वृद्धावस्था", "पेंशन"],
            }

            # Pre-compute matched canonical scheme keys
            matched_canonical_keys = [
                canonical
                for canonical, aliases in bilingual_scheme_boost_map.items()
                if any(alias in q_lower for alias in aliases)
            ]

            passages = []
            for hit in points:
                payload = hit.payload or {}
                raw_score = getattr(hit, "score", 0.0)
                name_lower = payload.get("name", "").lower()
                text_lower = payload.get("text", "").lower()

                # Hybrid boost: If scheme name or text directly matches query keywords
                boost = 0.0
                if matched_canonical_keys:
                    if any(key in name_lower for key in matched_canonical_keys):
                        boost += 1.5
                    elif any(key in text_lower for key in matched_canonical_keys):
                        boost += 0.4

                passages.append({
                    "score": raw_score + boost,
                    "scheme_id": payload.get("scheme_id", ""),
                    "name": payload.get("name", "Unknown Scheme"),
                    "category": payload.get("category", ""),
                    "level": payload.get("level", "central"),
                    "state": payload.get("state", "All"),
                    "chunk_type": payload.get("chunk_type", ""),
                    "official_url": payload.get("official_url", ""),
                    "text": payload.get("text", ""),
                })

            # Sort by boosted score and return top_k
            passages.sort(key=lambda x: x["score"], reverse=True)
            return passages[:top_k]
        except Exception as e:
            logger.error(f"Error querying Qdrant: {e}")
            return []


scheme_retriever = SchemeRetriever()
