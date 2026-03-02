from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import engine, Base, SessionLocal
from app.routes.providers import router as providers_router
from app.routes.instances import router as instances_router
from app.routes.analytics import router as analytics_router
from app.routes.ai_advisor import router as ai_advisor_router
from app.routes.recommender import router as recommender_router
from app.routes.admin import router as admin_router
from app.routes.automate import router as automate_router
from app.services.pricing_sync import sync_all_prices


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        sync_all_prices(db)
    finally:
        db.close()
    scheduler = BackgroundScheduler()
    scheduler.add_job(lambda: sync_all_prices(), "interval", hours=6)
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="CloudPrice — SaaS Pricing Comparator",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers_router, prefix="/providers")
app.include_router(instances_router)
app.include_router(analytics_router, prefix="/analytics")
app.include_router(ai_advisor_router, prefix="/ai")
app.include_router(recommender_router)
app.include_router(automate_router, prefix="/automate")
app.include_router(admin_router, prefix="/admin")


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0"}
