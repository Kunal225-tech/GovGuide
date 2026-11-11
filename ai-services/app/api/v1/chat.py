import logging
from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse
from app.rag.generator import rag_generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat & RAG Assistant"])


@router.post("", response_model=ChatResponse, summary="Ask GovGuide Saathi a scheme question")
def chat_with_assistant(request: ChatRequest) -> ChatResponse:
    """Conversational RAG endpoint.
    
    Retrieves matching schemes from the vector database and generates
    a personalized, grounded answer citing verified official schemes.
    """
    try:
        response = rag_generator.generate_response(request)
        return response
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")
