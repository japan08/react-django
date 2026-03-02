# ── FILE: backend/app/routes/recommender.py ──
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas
from app.services.ai_service import get_recommendations, DEFAULT_OPENROUTER_MODEL

router = APIRouter()


@router.post("/recommend", response_model=schemas.RecommendResponse)
def recommend(request: schemas.RecommendRequest, req: Request, db: Session = Depends(get_db)):
    instances = crud.get_instances(db)
    if not instances:
        raise HTTPException(status_code=503, detail="No instances available in the database.")
    provider = (req.headers.get("X-AI-Provider") or "openrouter").lower()
    model = (req.headers.get("X-AI-Model") or DEFAULT_OPENROUTER_MODEL).strip()
    return get_recommendations(request, instances, provider=provider, model=model)
