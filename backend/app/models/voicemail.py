from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, String, JSON, DateTime
from app.db.session import Base

# SQLAlchemy Model
class Voicemail(Base):
    __tablename__ = "voicemails"

    id = Column(String, primary_key=True, index=True)
    status = Column(String, default="PROCESSING")
    file_path = Column(String)
    created_at = Column(String) # Storing as string for simplicity in this migration, or DateTime
    transcript = Column(String, nullable=True)
    urgency = Column(String, nullable=True)
    category = Column(String, nullable=True)
    analysis = Column(JSON, nullable=True)

# Pydantic Models (Schemas)
class VoicemailMetadata(BaseModel):
    id: str
    status: str
    file_path: str
    created_at: str
    transcript: Optional[str] = None
    urgency: Optional[str] = None
    category: Optional[str] = None
    analysis: Optional[dict] = None

    class Config:
        from_attributes = True

class AnalysisExtraction(BaseModel):
    """
    Schema for LLM extraction.
    """
    intent: str = Field(..., description="The primary intent of the voicemail (e.g., 'Appointment Request', 'Prescription Refill', 'Emergency').")
    urgency: str = Field(..., description="Calculated urgency level: RED (Critical), YELLOW (Urgent), GREEN (Routine). If unsure or missing info, mark as NEED_VALIDATION.")
    patient_name: Optional[str] = Field(None, description="Name of the patient if mentioned.")
    symptoms: Optional[str] = Field(None, description="Symptoms mentioned by the caller.")
    appointment_time: Optional[str] = Field(None, description="Requested appointment time if mentioned.")
    booking_request: Optional[bool] = Field(False, description="True if the caller wants to book an appointment.")
    treatment_mode: Optional[str] = Field(None, description="Preferred mode if booking: 'In-clinic' or 'Telehealth'.")
    visit_type: Optional[str] = Field(None, description="Type of visit: 'First time' or 'Follow-up'.")
    referral_plan: Optional[bool] = Field(None, description="True if the patient mentions having a referral or care plan.")
    summary: str = Field(..., description="Brief summary of the voicemail.")
    missing_info: List[str] = Field(default_factory=list, description="List of missing critical information (e.g., 'Patient Name', 'Symptoms', 'Appointment Time') if the intent requires them.")
