from typing import Optional, List
from pydantic import BaseModel, Field


class ProfileExtractRequest(BaseModel):
    text: str = Field(..., description="Unstructured natural language input from the citizen describing themselves")


class ExtractedProfile(BaseModel):
    """Structured demographic profile extracted from natural conversation."""
    age: Optional[int] = Field(default=None, description="Citizen age in years (0-120)")
    gender: Optional[str] = Field(default=None, description="Gender: male, female, transgender, or other")
    state: Optional[str] = Field(default=None, description="Indian State or Union Territory name")
    district: Optional[str] = Field(default=None, description="District name")
    annualIncome: Optional[float] = Field(default=None, description="Annual household income in Indian Rupees (₹)")
    occupation: Optional[str] = Field(default=None, description="Primary occupation (e.g. Farmer, Student, Self-Employed)")
    education: Optional[str] = Field(default=None, description="Highest education level (e.g. 10th Pass, Graduate, Post Graduate)")
    category: Optional[str] = Field(default=None, description="Social category: General, OBC, SC, ST, EWS")
    confidence_notes: Optional[str] = Field(default=None, description="Any ambiguities or missing details flagged by LLM")
    missing_fields: List[str] = Field(default_factory=list, description="Fields not mentioned by citizen")


class ProfileExtractResponse(BaseModel):
    success: bool
    profile: ExtractedProfile
    message: str

