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

        # 2. Build filters (Strict Bihar-only portal scope: Bihar state schemes + Central schemes)
        filter_conditions = [
            qmodels.FieldCondition(
                key="state",
                match=qmodels.MatchAny(any=["All", "all", "central", "Central", "Bihar", "bihar"]),
            )
        ]
        q_lower = clean_query.lower()

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

            # Bilingual keyword mapping for hybrid boosting across Bihar State and Central schemes
            bilingual_scheme_boost_map = {
                "kisan": ["kisan", "pm-kisan", "pmkisan", "किसान", "पीएम-किसान", "पीएम किसान"],
                "mudra": ["mudra", "pmmy", "मुद्रा", "पीएमएमवाई"],
                "awas": ["awas", "pmay", "pmayg", "आवास", "पीएमएवाई", "मकान"],
                "ayushman": ["ayushman", "pm-jay", "pmjay", "jan arogya", "arogya", "आयुष्मान", "पीएम-जय", "आरोग्य", "स्वास्थ्य कार्ड"],
                "sukanya": ["sukanya", "samriddhi", "ssy", "सुकन्या", "समृद्धि"],
                "svanidhi": ["svanidhi", "vendor", "hawker", "स्वनिधि", "वेंडर", "रेहड़ी", "पटरी"],
                "bsccs": ["bsccs", "student credit card", "credit card", "स्टूडेंट क्रेडिट कार्ड", "क्रेडिट कार्ड", "शिक्षा ऋण"],
                "kanya": ["kanya utthan", "kanya vivah", "kanya", "कन्या उत्थान", "कन्या विवाह", "कन्या"],
                "udyami": ["udyami", "laghu udyami", "bluy", "2 lakh", "entrepreneur", "उद्यमी", "लघु उद्यमी", "मुख्यमंत्री उद्यमी"],
                "laghu udyami": ["laghu udyami", "bluy", "2 lakh", "लघु उद्यमी", "दो लाख"],
                "bhatta": ["mnssby", "bhatta", "swayam sahayata", "स्वयं सहायता भत्ता", "भत्ता"],
                "kyp": ["kyp", "kushal yuva", "कुशल युवा"],
                "protsahan": ["protsahan", "medhasoft", "balak", "balika", "bpsc", "upsc", "civil seva protsahan", "प्रोत्साहन", "सिविल सेवा प्रोत्साहन", "मेधासॉफ्ट"],
                "civil seva": ["civil seva", "bpsc", "upsc", "prelims", "सिविल सेवा", "बीपीएससी", "यूपीएससी"],
                "scholarship": ["scholarship", "post-matric", "pms", "छात्रवृत्ति", "पोस्ट मैट्रिक", "स्कॉलरशिप"],
                "pension": ["pension", "vridhajan", "vridhjan", "mvpy", "laxmi bai", "laxmibai", "vidhwa", "divyangjan", "वृद्धजन", "पेंशन", "लक्ष्मीबाई", "लक्ष्मी बाई", "दिव्यांगजन"],
                "krishi": ["krishi", "diesel", "yantrikikaran", "कृषि इनपुट", "डीजल", "यांत्रिकीकरण"],
                "fasal sahayata": ["fasal sahayata", "brfsy", "crop", "raiyat", "फसल सहायता", "रैयत"],
                "jeevika": ["jeevika", "shg", "जीविका", "स्वयं सहायता समूह"],
                "satat jeevikoparjan": ["satat", "sjy", "jeevikoparjan", "ultra-poor", "सतत जीविकोपार्जन", "जीविकोपार्जन"],
                "parivahan": ["parivahan", "mgpy", "mppy", "gram parivahan", "prakhand parivahan", "ग्राम परिवहन", "प्रखंड परिवहन", "परिवहन"],
                "alpsankhyak": ["alpsankhyak", "minority", "rozgar rin", "अल्पसंख्यक", "रोजगार ऋण"],
                "nal ka jal": ["nal ka jal", "tap water", "peeyjal", "peyjal", "नल का जल", "पेयजल"],
                "bijli": ["bijli", "electricity", "हर घर बिजली", "बिजली"],
                "gali-nali": ["gali nali", "gali-nali", "pakkikaran", "गली नाली", "पक्की गली"],
                "lohia swachh": ["swachh bihar", "lsba", "toilet", "latrine", "लोहिया स्वच्छ", "शौचालय"],
                "chikitsa": ["chikitsa", "bal hriday", "heart", "चिकित्सा", "बाल हृदय"],
                "pravasi": ["pravasi", "mazdoor", "migrant", "प्रवासी मजदूर", "मजदूर"],
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
