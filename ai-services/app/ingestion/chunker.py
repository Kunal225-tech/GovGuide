from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class SchemeChunk:
    chunk_id: str
    scheme_id: str
    name: str
    category: str
    level: str
    state: str
    official_url: str
    chunk_type: str
    text: str
    metadata: Dict[str, Any]


class SchemeChunker:
    """Chunks structured scheme documents into semantically rich passages for RAG."""

    @staticmethod
    def chunk_scheme(scheme: Dict[str, Any]) -> List[SchemeChunk]:
        chunks: List[SchemeChunk] = []
        scheme_id = str(scheme.get("_id", scheme.get("id", "")))
        name = scheme.get("name", "Unnamed Scheme")
        category = scheme.get("category", "General")
        level = scheme.get("level", "central")
        state = scheme.get("state", "All")
        description = scheme.get("description", "")
        official_url = scheme.get("officialUrl", "")

        # 1. Overview Chunk
        overview_text = (
            f"Scheme Name: {name}\n"
            f"Sector / Category: {category}\n"
            f"Government Level: {level.upper()} ({'Pan-India' if state == 'All' else state})\n"
            f"Official Portal: {official_url}\n"
            f"Summary: {description}"
        )
        chunks.append(
            SchemeChunk(
                chunk_id=f"{scheme_id}_overview",
                scheme_id=scheme_id,
                name=name,
                category=category,
                level=level,
                state=state,
                official_url=official_url,
                chunk_type="overview",
                text=overview_text,
                metadata={
                    "scheme_id": scheme_id,
                    "name": name,
                    "category": category,
                    "level": level,
                    "state": state,
                    "official_url": official_url,
                    "chunk_type": "overview",
                },
            )
        )

        # 2. Eligibility Chunk
        eligibility_list = scheme.get("eligibility", [])
        if eligibility_list:
            elig_text = (
                f"Scheme Name: {name}\n"
                f"Eligibility Criteria and Qualifications:\n"
                + "\n".join([f"- {item}" for item in eligibility_list])
            )
            chunks.append(
                SchemeChunk(
                    chunk_id=f"{scheme_id}_eligibility",
                    scheme_id=scheme_id,
                    name=name,
                    category=category,
                    level=level,
                    state=state,
                    official_url=official_url,
                    chunk_type="eligibility",
                    text=elig_text,
                    metadata={
                        "scheme_id": scheme_id,
                        "name": name,
                        "category": category,
                        "level": level,
                        "state": state,
                        "official_url": official_url,
                        "chunk_type": "eligibility",
                    },
                )
            )

        # 3. Benefits & Financial Assistance Chunk
        benefits_list = scheme.get("benefits", [])
        if benefits_list:
            benefits_text = (
                f"Scheme Name: {name}\n"
                f"Key Benefits & Financial Assistance:\n"
                + "\n".join([f"- {item}" for item in benefits_list])
            )
            chunks.append(
                SchemeChunk(
                    chunk_id=f"{scheme_id}_benefits",
                    scheme_id=scheme_id,
                    name=name,
                    category=category,
                    level=level,
                    state=state,
                    official_url=official_url,
                    chunk_type="benefits",
                    text=benefits_text,
                    metadata={
                        "scheme_id": scheme_id,
                        "name": name,
                        "category": category,
                        "level": level,
                        "state": state,
                        "official_url": official_url,
                        "chunk_type": "benefits",
                    },
                )
            )

        # 4. Documents & Application Process Chunk
        docs_list = scheme.get("requiredDocuments", [])
        process_list = scheme.get("applicationProcess", [])
        if docs_list or process_list:
            doc_proc_text = (
                f"Scheme Name: {name}\n"
                f"Required Documents:\n"
                + "\n".join([f"- {d}" for d in docs_list])
                + "\n\nApplication Process / How to Apply:\n"
                + "\n".join([f"{idx+1}. {p}" for idx, p in enumerate(process_list)])
            )
            chunks.append(
                SchemeChunk(
                    chunk_id=f"{scheme_id}_process",
                    scheme_id=scheme_id,
                    name=name,
                    category=category,
                    level=level,
                    state=state,
                    official_url=official_url,
                    chunk_type="process",
                    text=doc_proc_text,
                    metadata={
                        "scheme_id": scheme_id,
                        "name": name,
                        "category": category,
                        "level": level,
                        "state": state,
                        "official_url": official_url,
                        "chunk_type": "process",
                    },
                )
            )

        return chunks

