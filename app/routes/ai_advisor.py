# ── FILE: backend/app/routes/ai_advisor.py ──
import json
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas
from app.services.ai_service import get_ai_advice, DEFAULT_OPENROUTER_MODEL

router = APIRouter()


@router.post("/chat", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest, req: Request, db: Session = Depends(get_db)):
    provider = (req.headers.get("X-AI-Provider") or "openrouter").lower()
    model = (req.headers.get("X-AI-Model") or DEFAULT_OPENROUTER_MODEL).strip()
    summary = crud.get_analytics_summary(db)
    context = request.context or ""
    if summary:
        context = context + "\n" + json.dumps({
            "total_instances": summary.total_instances,
            "avg_monthly_price": summary.avg_monthly_price,
            "cheapest_monthly": summary.cheapest_instance.monthly_price,
            "most_expensive_monthly": summary.most_expensive.monthly_price,
        }, indent=2)
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    return get_ai_advice(messages, context, provider=provider, model=model)
