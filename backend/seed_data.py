# ── FILE: backend/seed_data.py ──
import os
import random
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_DATABASE = os.getenv("DB_DATABASE", "demo")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_DATABASE}"

from app.database import Base
from app.models import (
    Provider,
    Instance,
    PriceHistory,
    ScrapeLog,
    SavedComparison,
    RecommendationTemplate,
)
from app.services import scraper
from app.services.pricing_sync import PROVIDER_LOGO_URLS, _get_or_create_provider

engine = create_engine(DATABASE_URL)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
db = Session()

PROVIDER_WEBSITES = scraper.PROVIDER_WEBSITES

for name, website in PROVIDER_WEBSITES.items():
    logo = PROVIDER_LOGO_URLS.get(name)
    p = Provider(name=name, website=website, logo_url=logo)
    db.add(p)
db.commit()

provider_results = scraper.scrape_all_providers()
name_to_provider = {p.name: p for p in db.query(Provider).all()}
now = datetime.now(timezone.utc)

for pname, records, status in provider_results:
    provider = name_to_provider.get(pname)
    if not provider:
        provider = _get_or_create_provider(db, pname)
        if provider:
            name_to_provider[pname] = provider
    if not provider:
        continue
    for rec in records:
        inst = (
            db.query(Instance)
            .filter(
                Instance.provider_id == provider.id,
                Instance.name == rec["instance_name"],
                Instance.region == rec["region"],
            )
            .first()
        )
        hourly = rec["hourly_price"]
        yearly = round(hourly * 24 * 365, 2)
        if not inst:
            inst = Instance(
                provider_id=provider.id,
                name=rec["instance_name"],
                cpu=rec["cpu"],
                ram=rec["ram"],
                storage=rec["storage"],
                region=rec["region"],
                hourly_price=hourly,
                yearly_price=yearly,
                last_synced=now,
            )
            db.add(inst)
            db.commit()
            db.refresh(inst)
        count = db.query(PriceHistory).filter(PriceHistory.instance_id == inst.id).count()
        if count < 6:
            base = inst.hourly_price
            for i in range(6):
                t = now - timedelta(days=30 * (5 - i))
                drift = random.uniform(-0.05, 0.05)
                price = round(base * (1 + drift), 6)
                price = max(0.0, price)
                db.add(PriceHistory(instance_id=inst.id, hourly_price=price, recorded_at=t))
            db.commit()

# Seed recommendation templates (workload type -> specs)
RECOMMENDATION_TEMPLATES = [
    ("web_app", 2, 4, 20, "moderate", 0, 1),
    ("database", 4, 16, 200, "high", 0, 0),
    ("ml_gpu", 8, 32, 500, "high", 1, 0),
    ("data_processing", 8, 32, 500, "high", 0, 1),
    ("gaming", 4, 8, 50, "high", 0, 0),
    ("media_streaming", 2, 8, 100, "high", 0, 1),
    ("dev_test", 2, 4, 20, "low", 0, 1),
    ("hft", 4, 16, 100, "high", 0, 0),
    ("custom", 2, 4, 20, "moderate", 0, 0),
]
for wt, min_cpu, rec_ram, storage_min, bw, gpu, auto in RECOMMENDATION_TEMPLATES:
    t = db.query(RecommendationTemplate).filter(RecommendationTemplate.workload_type == wt).first()
    if not t:
        t = RecommendationTemplate(
            workload_type=wt,
            min_cpu=min_cpu,
            recommended_ram=rec_ram,
            storage_min=storage_min,
            bandwidth_priority=bw,
            gpu_required=gpu,
            auto_scaling=auto,
        )
        db.add(t)
db.commit()

for p in db.query(Provider).all():
    c = db.query(Instance).filter(Instance.provider_id == p.id).count()
    print(f"  {p.name}: {c} instances")

db.close()
print("✅ Seeded providers, instances, price history, and recommendation templates.")
