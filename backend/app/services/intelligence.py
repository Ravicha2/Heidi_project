from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langgraph.graph import StateGraph, END
from app.core.config import settings
from app.models.voicemail import AnalysisExtraction

# --- Graph State ---
class AgentState(Dict):
    transcript: str
    extraction: dict

# --- Service Class ---
class IntelligenceService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview", 
            temperature=0, 
            openai_api_key=settings.OPENAI_API_KEY
        )
        self.parser = PydanticOutputParser(pydantic_object=AnalysisExtraction)
    
    def _extract_node(self, state: AgentState) -> AgentState:
        transcript = state["transcript"]
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert medical triage AI. Analyze the voicemail transcript and extract structured data. \nFormat instructions: {format_instructions}"),
            ("user", "Transcript: {transcript}")
        ])
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = chain.invoke({
                "transcript": transcript,
                "format_instructions": self.parser.get_format_instructions()
            })
            return {"extraction": result.model_dump()}
        except Exception as e:
            # Fallback for error
            return {"extraction": {
                "intent": "Error", 
                "urgency": "YELLOW", 
                "summary": f"Analysis failed: {str(e)}"
            }}

    def analyze_transcript(self, transcript: str) -> dict:
        if not settings.OPENAI_API_KEY:
            return {
                "intent": "Mock Intent",
                "urgency": "GREEN",
                "summary": "OpenAI Key missing, returning mock data."
            }

        # Build Graph
        workflow = StateGraph(AgentState)
        workflow.add_node("extract", self._extract_node)
        workflow.set_entry_point("extract")
        workflow.add_edge("extract", END)
        
        app = workflow.compile()
        
        # Invoke
        result = app.invoke({"transcript": transcript})
        return result.get("extraction", {})

intelligence_service = IntelligenceService()
