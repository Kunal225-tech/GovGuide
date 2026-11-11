import logging
from typing import List, Dict, Any
from app.core.llm import llm_service
from app.rag.retriever import scheme_retriever
from app.rag.prompt_templates import (
    SYSTEM_INSTRUCTION_EN,
    SYSTEM_INSTRUCTION_HI,
    format_demographics_prompt,
)
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    SchemeCitation,
)

logger = logging.getLogger(__name__)


# Alias / bilingual mappings for accurate scheme citation grounding
SCHEME_ALIASES_MAP = {
    "kisan": ["pm-kisan", "pm kisan", "kisan samman", "किसान", "पीएम-किसान", "पीएम किसान"],
    "mudra": ["mudra", "pmmy", "मुद्रा", "पीएमएमवाई"],
    "awas": ["pmay-g", "pmay", "awas yojana", "rural housing", "आवास", "पीएमएवाई"],
    "ayushman": ["ayushman", "pm-jay", "pmjay", "jan arogya", "आयुष्मान", "पीएम-जय", "जन आरोग्य"],
    "sukanya": ["sukanya", "samriddhi", "ssy", "सुकन्या", "समृद्धि"],
    "svanidhi": ["svanidhi", "street vendor", "स्वनिधि", "वेंडर"],
    "lakshmi": ["gruha lakshmi", "gruhalakshmi", "गृह लक्ष्मी", "गृहलक्ष्मी"],
    "yuva": ["yuva nidhi", "yuvanidhi", "युवा निधि", "युवानिधि"],
    "ladki": ["majhi ladki", "ladki bahin", "माझी लाड़की", "लाड़की बहिन", "माझी लड़की", "लड़की बहिन"],
    "sumangala": ["kanya sumangala", "sumangala", "mksy", "कन्या सुमंगला", "सुमंगला"],
    "startup": ["startup india", "sisfs", "seed fund", "स्टार्टअप इंडिया"],
    "scholarship": ["pm scholarship", "scholarship scheme", "छात्रवृत्ति"],
    "pension": ["old age pension", "ignoaps", "पेंशन योजना", "वृद्धावस्था पेंशन"],
}

REFUSAL_MARKERS = [
    # English refusal markers
    "dedicated exclusively",
    "cannot assist with",
    "cannot help with",
    "outside my scope",
    "outside this domain",
    "i am specialized exclusively",
    "i am an ai assistant dedicated",
    "i can only assist with",
    "unable to assist with",
    "unable to help with",
    "decline to answer",
    "not within my scope",
    "such as agriculture support, education scholarships",
    # Hindi refusal markers
    "केवल सरकारी योजनाओं",
    "कल्याणकारी योजनाओं के लिए समर्पित",
    "कल्याणकारी योजनाओं (जैसे",
    "(जैसे किसान सहायता",
    "दायरे से बाहर",
    "सहायता करने में असमर्थ",
    "मदद करने में असमर्थ",
    "उत्तर देने में असमर्थ",
    "नहीं कर सकता",
    "नहीं कर सकती",
    "केवल भारतीय सरकारी",
    "यदि आप किसी सरकारी योजना के बारे में जानना चाहते हैं",
    "सहायता करने में प्रसन्न हूँ",
    "सहायता करने में प्रसन्न हूं",
]


class RAGGenerator:
    """Orchestrates retrieval, prompt construction, and LLM generation."""

    def generate_response(self, request: ChatRequest) -> ChatResponse:
        # Normalize and trim input: strip leading/trailing whitespace and surrounding quotation marks/backticks
        clean_query = request.query.strip().strip('"\'“”‘’`')

        user_state = request.user_profile.state if request.user_profile else None

        # Enrich retrieval query with conversational context for referential/follow-up queries ("this", "that", "it", "eligible")
        retrieval_query = clean_query
        referential_tokens = [
            "this", "that", "it", "here", "the scheme", "these", "eligib", "document",
            "apply", "age", "criteria", "income", "योजना", "यह", "इस", "इसके", "इसमें", "पात्रता", "दस्तावेज"
        ]
        q_lower = clean_query.lower()
        is_follow_up = len(clean_query.split()) <= 10 or any(t in q_lower for t in referential_tokens)

        if is_follow_up and request.conversation_history:
            found_scheme_context = ""
            # Scan backwards through conversation history to find the active scheme being discussed
            for msg in reversed(request.conversation_history):
                content_lower = msg.content.lower()
                for key_token, aliases in SCHEME_ALIASES_MAP.items():
                    if any(alias in content_lower for alias in aliases):
                        # Found active scheme keyword in conversation
                        found_scheme_context = f"{aliases[0]} {aliases[1] if len(aliases) > 1 else ''}"
                        break
                if found_scheme_context:
                    break

            # Fallback to the first user question if no alias matched
            if not found_scheme_context:
                user_msgs = [m.content.strip() for m in request.conversation_history if m.role.lower() == "user"]
                if user_msgs:
                    found_scheme_context = user_msgs[0]

            if found_scheme_context:
                retrieval_query = f"{found_scheme_context} {clean_query}"

        # 1. Retrieve top-k relevant scheme passages
        passages = scheme_retriever.retrieve(
            query=retrieval_query,
            user_state=user_state,
            top_k=request.top_k,
        )

        # 2. Select system instruction by language
        lang = request.language.lower()
        system_instruction = SYSTEM_INSTRUCTION_HI if lang == "hi" else SYSTEM_INSTRUCTION_EN

        # 3. Format context from retrieved passages
        if passages:
            context_blocks = []
            seen_schemes = {}

            for idx, p in enumerate(passages):
                context_blocks.append(
                    f"[Document {idx+1}] Scheme: {p['name']} ({p['category']})\n{p['text']}"
                )
                if p["scheme_id"] and p["scheme_id"] not in seen_schemes:
                    seen_schemes[p["scheme_id"]] = SchemeCitation(
                        scheme_id=p["scheme_id"],
                        name=p["name"],
                        category=p["category"],
                        level=p["level"],
                        state=p["state"],
                        official_url=p["official_url"],
                        relevance_snippet=p["text"][:160] + "...",
                    )

            context_str = "\n\n".join(context_blocks)
            citations = list(seen_schemes.values())
        else:
            context_str = "No specific scheme documents were found in the database for this query."
            citations = []

        # 4. Format conversation history
        history_str = ""
        if request.conversation_history:
            history_lines = [
                f"{msg.role.capitalize()}: {msg.content}"
                for msg in request.conversation_history[-6:]
            ]
            history_str = "Recent Conversation:\n" + "\n".join(history_lines) + "\n\n"

        # 5. Format demographics
        demographics_str = format_demographics_prompt(request.user_profile)

        # 6. Build final prompt
        prompt = (
            f"=== VERIFIED SCHEME DATABASE CONTEXT ===\n"
            f"{context_str}\n\n"
            f"=== CITIZEN INFORMATION ===\n"
            f"{demographics_str}\n\n"
            f"{history_str}"
            f"=== CITIZEN QUESTION ===\n"
            f"Question: {clean_query}\n\n"
            f"Please provide an accurate, empathetic, and actionable response following the principles above."
        )

        # 7. Generate answer via LLM
        answer_text = llm_service.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.2,
        )

        # 8. Filter citations: Only include citations for schemes genuinely discussed in the response
        answer_lower = answer_text.lower()
        is_refusal = any(marker in answer_lower for marker in REFUSAL_MARKERS)

        matched_citations = []
        if not is_refusal:
            for cit in citations:
                name_lower = cit.name.lower()

                # A. Direct scheme name match
                if name_lower in answer_lower:
                    matched_citations.append(cit)
                    continue

                # B. Match against known aliases & bilingual Devanagari/Hindi names
                matched = False
                for key_token, aliases in SCHEME_ALIASES_MAP.items():
                    if key_token in name_lower:
                        if any(alias in answer_lower for alias in aliases):
                            matched_citations.append(cit)
                            matched = True
                            break
                if matched:
                    continue

                # C. Match significant keywords (require distinctive multi-word match, excluding broad stopwords)
                generic_stopwords = {
                    "yojana", "scheme", "pradhan", "mantri", "national",
                    "state", "karnataka", "mukhyamantri", "central", "mission",
                    "india", "indian", "bharat", "gramin", "awas", "fund", "seed",
                    "general", "service", "development", "assistance"
                }
                key_words = [w for w in name_lower.split() if len(w) > 3 and w not in generic_stopwords]
                matched_kw_count = sum(1 for kw in key_words if kw in answer_lower)
                acronyms = {"sisfs", "pmmy", "pmjay", "pmkisan", "pmayg", "ssy", "mksy"}
                has_acronym_match = any(ac in answer_lower for ac in acronyms if ac in name_lower)
                if has_acronym_match or matched_kw_count >= 2:
                    matched_citations.append(cit)

        # Citations are ONLY returned if explicitly referenced and not a refusal.
        # NEVER fall back to all retrieved vector-search citations.
        final_citations = matched_citations if not is_refusal else []

        return ChatResponse(
            answer=answer_text,
            citations=final_citations,
            language=request.language,
            metadata={
                "retrieved_passages": len(passages),
                "model": llm_service.settings.GEMINI_MODEL,
                "out_of_scope_blocked": is_refusal,
            },
        )


rag_generator = RAGGenerator()

