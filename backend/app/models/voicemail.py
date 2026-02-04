from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class VoicemailMetadata(BaseModel):
    id: str
    status: str
    file_path: str
    created_at: str
    transcript: Optional[str] = None
    urgency: Optional[str] = None
    category: Optional[str] = None
    analysis: Optional[dict] = None

class AnalysisExtraction(BaseModel):
    """
    Schema for LLM extraction.
    """
    intent: str = Field(..., description="The primary intent of the voicemail (e.g., 'Appointment Request', 'Prescription Refill', 'Emergency').")
    urgency: str = Field(..., description="Calculated urgency level: RED (Critical), YELLOW (Urgent), GREEN (Routine).")
    patient_name: Optional[str] = Field(None, description="Name of the patient if mentioned.")
    booking_request: Optional[bool] = Field(False, description="True if the caller wants to book an appointment.")
    appointment_mode: Optional[str] = Field(None, description="Preferred mode if booking: 'Telehealth' or 'Onsite'.")
    summary: str = Field(..., description="Brief summary of the voicemail.")
