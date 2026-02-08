from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from app.core.config import settings
from app.models.voicemail import AnalysisExtraction

class IntelligenceService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview", 
            temperature=0, 
            openai_api_key=settings.OPENAI_API_KEY
        )
        self.parser = PydanticOutputParser(pydantic_object=AnalysisExtraction)

    def analyze_transcript(self, transcript: str) -> dict:
        if not settings.OPENAI_API_KEY:
             return {"intent": "Error", "summary": "Missing API Key"}

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert medical triage AI. Analyze the voicemail transcript and extract structured data. 
            
            Key Guidelines:
            1. Extract `symptoms` and `appointment_time` if mentioned.
            2. specific extraction:
               - `treatment_mode`: 'In-clinic' or 'Telehealth'. Infer based on context (e.g. "come in", "see doctor" -> In-clinic vs "video call" -> Telehealth). Default to 'Telehealth' if unsure but generally assume In-clinic if they ask to see a doctor physically.
               - `visit_type`: 'First time' or 'Follow-up'
               - `referral_plan`: true if they mention a referral letter.
            3. If critical info is missing, set `urgency` to "NEED_VALIDATION".
            4. Otherwise, use RED/YELLOW/GREEN based on medical urgency.
            
            Format instructions: {format_instructions}"""),
            ("user", "Transcript: {transcript}")
        ])
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = chain.invoke({
                "transcript": transcript,
                "format_instructions": self.parser.get_format_instructions()
            })
            return result.model_dump()
        except Exception as e:
            return {
                "intent": "Error", 
                "urgency": "YELLOW", 
                "summary": f"Analysis failed: {str(e)}"
            }

intelligence_service = IntelligenceService()
