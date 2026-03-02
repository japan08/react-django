# ── FILE: backend/app/routes/admin.py ──
import time
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models, crud, schemas
from app.services.pricing_sync import sync_all_prices, sync_single_provider
from app.services.ai_service import fetch_openrouter_models

router = APIRouter()


class ScrapeRequestBody(BaseModel):
    provider: str | None = None


@router.post("/scrape")
def trigger_scrape(body: ScrapeRequestBody = ScrapeRequestBody(), db: Session = Depends(get_db)):
    start = time.time()
    if body.provider and body.provider.strip():
        count, status = sync_single_provider(db, body.provider.strip())
        elapsed = time.time() - start
        return {
            "status": status,
            "providers_synced": 1,
            "instances_updated": count,
            "duration_seconds": round(elapsed, 2),
        }
    sync_all_prices(db)
    elapsed = time.time() - start
    total = db.query(models.Instance).count()
    return {
        "status": "ok",
        "providers_synced": db.query(models.Provider).count(),
        "instances_updated": total,
        "duration_seconds": round(elapsed, 2),
    }


@router.get("/scrape-logs", response_model=list[schemas.ScrapeLogOut])
def get_scrape_logs(limit: int = Query(50, le=100), provider: str | None = Query(None), db: Session = Depends(get_db)):
    return crud.get_scrape_logs(db, provider=provider, limit=limit)


@router.get("/scrape-logs/{provider_name}", response_model=list[schemas.ScrapeLogOut])
def get_scrape_logs_by_provider(provider_name: str, db: Session = Depends(get_db)):
    return crud.get_scrape_logs(db, provider=provider_name, limit=10)


@router.get("/openrouter-models")
def get_openrouter_models():
    """Return list of {id, name, context_length} for OpenRouter model dropdown."""
    models_list = fetch_openrouter_models()
    return [{"id": m.get("id"), "name": m.get("name"), "context": m.get("context_length", 0)} for m in models_list]
