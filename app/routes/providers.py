from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud import get_providers_with_stats
from app.schemas import ProviderOut

router = APIRouter()


@router.get("", response_model=list[ProviderOut])
def list_providers(db: Session = Depends(get_db)):
    return get_providers_with_stats(db)
