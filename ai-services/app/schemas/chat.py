from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class UserDemographics(BaseModel):
    """Demographics passed from GovGuide User Profile to ground RAG answers."""
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    annualIncome: Optional[float] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    category: Optional[str] = None


class ChatMessage(BaseModel):
    role: str = Field(description="Role: 'user', 'assistant', or 'system'")
    content: str = Field(description="Text message content")


class SchemeCitation(BaseModel):
    """Citation linking an AI answer back to a verified database Scheme."""
    scheme_id: str
    name: str
    category: str
    level: str
    state: Optional[str] = None
    official_url: Optional[str] = None
    relevance_snippet: Optional[str] = None


class ChatRequest(BaseModel):
    query: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=1000,
        description="The citizen's question or message",
    )
    message: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=1000,
        description="Alternative alias for query",
    )
    conversation_history: List[ChatMessage] = Field(default_factory=list, description="Prior conversation context")
    user_profile: Optional[UserDemographics] = Field(default=None, description="Current user profile demographics")
    language: str = Field(default="en", description="Preferred response language: 'en' or 'hi'")
    top_k: int = Field(default=4, ge=1, le=10, description="Number of scheme chunks to retrieve")

    @model_validator(mode="before")
    @classmethod
    def sync_query_message(cls, data: Any) -> Any:
        if isinstance(data, dict):
            msg = data.get("message")
            qry = data.get("query")
            if msg is not None and (qry is None or qry == ""):
                data["query"] = msg
            elif qry is not None and (msg is None or msg == ""):
                data["message"] = qry
            elif qry is None and msg is None:
                data["query"] = ""
                data["message"] = ""
        return data


class ChatResponse(BaseModel):
    answer: str = Field(..., description="The assistant's grounded answer in Markdown")
    citations: List[SchemeCitation] = Field(default_factory=list, description="Referenced official schemes")
    language: str = Field(default="en")
    metadata: Dict[str, Any] = Field(default_factory=dict)

