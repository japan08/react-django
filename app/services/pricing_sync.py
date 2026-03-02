# ── FILE: backend/app/services/pricing_sync.py ──
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models
from app.services import scraper

PROVIDER_LOGO_URLS = scraper.PROVIDER_LOGO_URLS


def _get_or_create_provider(db: Session, pname: str) -> models.Provider | None:
    p = db.query(models.Provider).filter(models.Provider.name == pname).first()
    if p:
        return p
    website = scraper.PROVIDER_WEBSITES.get(pname, "https://example.com")
    logo_url = scraper.PROVIDER_LOGO_URLS.get(pname)
    p = models.Provider(name=pname, website=website, logo_url=logo_url)
    db.add(p)
    db.flush()
    return p


def sync_all_prices(db: Session | None = None):
    if db is None:
        db = SessionLocal()
        own_session = True
    else:
        own_session = False
    try:
        start = datetime.utcnow()
        provider_results = scraper.scrape_all_providers()
        name_to_provider: dict[str, models.Provider] = {}
        for p in db.query(models.Provider).all():
            name_to_provider[p.name] = p
        instances_updated = 0
        now = datetime.utcnow()
        for pname, records, status in provider_results:
            if pname not in name_to_provider:
                prov = _get_or_create_provider(db, pname)
                if prov:
                    name_to_provider[pname] = prov
            provider = name_to_provider.get(pname)
            if not provider:
                continue
            count = 0
            for rec in records:
                inst = (
                    db.query(models.Instance)
                    .filter(
                        models.Instance.provider_id == provider.id,
                        models.Instance.name == rec["instance_name"],
                        models.Instance.region == rec["region"],
                    )
                    .first()
                )
                hourly = rec["hourly_price"]
                yearly = round(hourly * 24 * 365, 2)
                if inst:
                    inst.hourly_price = hourly
                    inst.yearly_price = yearly
                    inst.last_synced = now
                    db.add(inst)
                else:
                    inst = models.Instance(
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
                    db.flush()
                instances_updated += 1
                count += 1
                db.add(models.PriceHistory(instance_id=inst.id, hourly_price=hourly, recorded_at=now))
            provider.last_scraped = now
            provider.scrape_status = status
            db.add(provider)
            db.add(models.ScrapeLog(provider_name=pname, status=status, instances_found=count))
        db.commit()
        print(f"Synced {instances_updated} instances across {len(provider_results)} providers")
    except Exception as e:
        db.rollback()
        db.add(models.ScrapeLog(provider_name="system", status="error", instances_found=0, error_message=str(e)))
        db.commit()
        raise
    finally:
        if own_session:
            db.close()


def sync_single_provider(db: Session, provider_name: str) -> tuple[int, str]:
    start = datetime.utcnow()
    data = scraper.scrape_single_provider(provider_name)
    if not data:
        db.add(models.ScrapeLog(provider_name=provider_name, status="error", instances_found=0, error_message="No data"))
        db.commit()
        return 0, "error"
    provider = db.query(models.Provider).filter(models.Provider.name.ilike(provider_name)).first()
    if not provider:
        db.add(models.ScrapeLog(provider_name=provider_name, status="error", instances_found=0, error_message="Provider not found"))
        db.commit()
        return 0, "error"
    now = datetime.utcnow()
    count = 0
    for rec in data:
        inst = (
            db.query(models.Instance)
            .filter(
                models.Instance.provider_id == provider.id,
                models.Instance.name == rec["instance_name"],
                models.Instance.region == rec["region"],
            )
            .first()
        )
        hourly = rec["hourly_price"]
        yearly = round(hourly * 24 * 365, 2)
        if inst:
            inst.hourly_price = hourly
            inst.yearly_price = yearly
            inst.last_synced = now
            db.add(inst)
        else:
            inst = models.Instance(
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
            db.flush()
        count += 1
        db.add(models.PriceHistory(instance_id=inst.id, hourly_price=hourly, recorded_at=now))
    provider.last_scraped = now
    provider.scrape_status = "success"
    db.add(models.ScrapeLog(provider_name=provider.name, status="success", instances_found=count))
    db.commit()
    return count, "success"
