# ── FILE: backend/app/routes/analytics.py ──
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas

router = APIRouter()


@router.get("/summary", response_model=schemas.AnalyticsSummary | None)
def get_summary(db: Session = Depends(get_db)):
    return crud.get_analytics_summary(db)


@router.get("/forecast/{instance_id}", response_model=schemas.ForecastResponse)
def get_forecast(instance_id: int, db: Session = Depends(get_db)):
    result = crud.get_forecast(db, instance_id)
    if not result:
        raise HTTPException(status_code=404, detail="Instance not found")
    return result
