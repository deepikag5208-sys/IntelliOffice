from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import AIChatRequest, AIChatResponse
from app.auth import get_current_user
from app.services.ai_service import OfficeAIService

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])

@router.post("/query", response_model=AIChatResponse)
def query_ai_assistant(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Query message cannot be empty")

    ai_response, context_used = OfficeAIService.generate_ai_response(db, current_user, request.message.strip())

    return {
        "response": ai_response,
        "context_used": context_used
    }
