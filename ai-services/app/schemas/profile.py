from typing import Optional, List
from pydantic import BaseModel, Field


class ProfileExtractRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="Unstructured natural language self-description in English, Hindi, or Hinglish",
    )
    language: Optional[str] = Field(
        default="en",
        description="Preferred UI language ('en' or 'hi')",
    )


class ExtractedProfile(BaseModel):
    """Structured demographic profile extracted and canonicalized to GovGuide form options."""
    age: Optional[int] = Field(default=None, description="Citizen age in years (1-120)")
    gender: Optional[str] = Field(default=None, description="Canonical gender option")
    state: Optional[str] = Field(default=None, description="State name (Bihar-focused)")
    district: Optional[str] = Field(default=None, description="Official Bihar district name")
    annualIncome: Optional[float] = Field(default=None, description="Annual household income in INR")
    occupation: Optional[str] = Field(default=None, description="Canonical employment status option")
    education: Optional[str] = Field(default=None, description="Canonical education level option")
    category: Optional[str] = Field(default=None, description="Canonical social category option")
    confidence_notes: Optional[str] = Field(default=None, description="Ambiguities, non-Bihar notice, or privacy notes")
    privacy_warning: Optional[str] = Field(default=None, description="Warning if sensitive credentials were detected and masked")
    missing_fields: List[str] = Field(default_factory=list, description="Profile fields not mentioned by citizen")


class ProfileExtractResponse(BaseModel):
    success: bool
    profile: ExtractedProfile
    message: str
    extraction_source: str = Field(default="llm", description="'llm' or 'fallback'")

