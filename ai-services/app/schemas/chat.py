from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


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
    query: str = Field(..., description="The citizen's question or message")
    conversation_history: List[ChatMessage] = Field(default_factory=list, description="Prior conversation context")
    user_profile: Optional[UserDemographics] = Field(default=None, description="Current user profile demographics")
    language: str = Field(default="en", description="Preferred response language: 'en' or 'hi'")
    top_k: int = Field(default=4, ge=1, le=10, description="Number of scheme chunks to retrieve")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="The assistant's grounded answer in Markdown")
    citations: List[SchemeCitation] = Field(default_factory=list, description="Referenced official schemes")
    language: str = Field(default="en")
    metadata: Dict[str, Any] = Field(default_factory=dict)

