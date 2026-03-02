from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas

router = APIRouter()


@router.get("/instances", response_model=list[schemas.InstanceOut])
def list_instances(
    db: Session = Depends(get_db),
    min_cpu: float | None = Query(None),
    min_ram: float | None = Query(None),
    provider_id: int | None = Query(None),
    region: str | None = Query(None),
    max_monthly_price: float | None = Query(None),
):
    return crud.get_instances(db, min_cpu=min_cpu, min_ram=min_ram, provider_id=provider_id, region=region, max_monthly_price=max_monthly_price)


@router.post("/instances", response_model=schemas.InstanceOut)
def create_instance(data: schemas.InstanceCreate, db: Session = Depends(get_db)):
    return crud.create_instance(db, data)


@router.get("/instances/{instance_id}/history", response_model=list[schemas.PriceHistoryOut])
def get_instance_history(instance_id: int, db: Session = Depends(get_db)):
    return crud.get_price_history(db, instance_id)


@router.get("/comparisons", response_model=list[schemas.SavedComparisonOut])
def list_comparisons(db: Session = Depends(get_db)):
    return crud.get_saved_comparisons(db)


@router.post("/comparisons", response_model=schemas.SavedComparisonOut)
def create_comparison(data: schemas.SavedComparisonCreate, db: Session = Depends(get_db)):
    return crud.save_comparison(db, data)
