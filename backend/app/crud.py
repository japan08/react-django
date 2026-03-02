from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app import models, schemas


def get_providers(db: Session):
    return db.query(models.Provider).all()


def get_providers_with_stats(db: Session) -> list[schemas.ProviderOut]:
    providers = db.query(models.Provider).all()
    result = []
    for p in providers:
        insts = db.query(models.Instance).filter(models.Instance.provider_id == p.id).all()
        count = len(insts)
        regions = sorted(set(i.region for i in insts))
        out = schemas.ProviderOut.model_validate(p).model_copy(update={"instance_count": count, "regions": regions})
        result.append(out)
    return result


def get_instances(
    db: Session,
    min_cpu: float | int | None = None,
    min_ram: float | int | None = None,
    provider_id: int | None = None,
    region: str | None = None,
    region_patterns: list[str] | None = None,
    max_monthly_price: float | None = None,
):
    q = db.query(models.Instance).join(models.Provider)
    if min_cpu is not None:
        q = q.filter(models.Instance.cpu >= min_cpu)
    if min_ram is not None:
        q = q.filter(models.Instance.ram >= min_ram)
    if provider_id is not None:
        q = q.filter(models.Instance.provider_id == provider_id)
    if region:
        q = q.filter(models.Instance.region.ilike(f"%{region}%"))
    if region_patterns:
        q = q.filter(
            or_(*[models.Instance.region.ilike(f"%{p}%") for p in region_patterns])
        )
    if max_monthly_price is not None:
        q = q.filter(models.Instance.hourly_price * 24 * 30 <= max_monthly_price)
    return q.all()


def create_instance(db: Session, data: schemas.InstanceCreate) -> models.Instance:
    yearly = round(data.hourly_price * 24 * 365, 2)
    obj = models.Instance(
        name=data.name,
        cpu=data.cpu,
        ram=data.ram,
        storage=data.storage,
        region=data.region,
        hourly_price=data.hourly_price,
        yearly_price=yearly,
        provider_id=data.provider_id,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_analytics_summary(db: Session) -> schemas.AnalyticsSummary | None:
    instances = db.query(models.Instance).all()
    if not instances:
        return None
    from app.schemas import InstanceOut, ProviderOut, ProviderBreakdown
    instance_outs = [InstanceOut.model_validate(i) for i in instances]
    cheapest = min(instance_outs, key=lambda x: x.monthly_price)
    most_expensive = max(instance_outs, key=lambda x: x.monthly_price)
    avg_hourly = sum(i.hourly_price for i in instances) / len(instances)
    avg_monthly = avg_hourly * 24 * 30
    providers = db.query(models.Provider).all()
    breakdown = []
    for p in providers:
        insts = [i for i in instance_outs if i.provider.id == p.id]
        if not insts:
            continue
        monthly_prices = [x.monthly_price for x in insts]
        breakdown.append(
            ProviderBreakdown(
                provider=ProviderOut.model_validate(p),
                count=len(insts),
                avg_monthly=round(sum(monthly_prices) / len(monthly_prices), 2),
                min_monthly=min(monthly_prices),
                max_monthly=max(monthly_prices),
            )
        )
    return schemas.AnalyticsSummary(
        total_instances=len(instances),
        cheapest_instance=cheapest,
        most_expensive=most_expensive,
        avg_hourly_price=round(avg_hourly, 4),
        avg_monthly_price=round(avg_monthly, 2),
        provider_breakdown=breakdown,
    )


def get_price_history(db: Session, instance_id: int) -> list[models.PriceHistory]:
    return (
        db.query(models.PriceHistory)
        .filter(models.PriceHistory.instance_id == instance_id)
        .order_by(models.PriceHistory.recorded_at.desc())
        .all()
    )


def get_forecast(db: Session, instance_id: int) -> schemas.ForecastResponse | None:
    instance = db.query(models.Instance).filter(models.Instance.id == instance_id).first()
    if not instance:
        return None
    history = (
        db.query(models.PriceHistory)
        .filter(models.PriceHistory.instance_id == instance_id)
        .order_by(models.PriceHistory.recorded_at.desc())
        .limit(6)
        .all()
    )
    history = list(reversed(history))
    if len(history) < 2:
        base = instance.hourly_price * 24 * 30
        months = []
        d = datetime.utcnow()
        for i in range(12):
            d = d + timedelta(days=30)
            months.append(schemas.ForecastPoint(month=d.strftime("%b %Y"), cost=round(base, 2)))
        return schemas.ForecastResponse(instance_id=instance.id, instance_name=instance.name, forecast=months)
    prices = [h.hourly_price * 24 * 30 for h in history]
    x = list(range(len(prices)))
    n = len(x)
    sum_x = sum(x)
    sum_y = sum(prices)
    sum_xy = sum(xi * yi for xi, yi in zip(x, prices))
    sum_xx = sum(xi * xi for xi in x)
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x) if (n * sum_xx - sum_x * sum_x) != 0 else 0
    intercept = (sum_y - slope * sum_x) / n
    d = datetime.utcnow()
    forecast = []
    for i in range(12):
        d = d + timedelta(days=30)
        projected = intercept + slope * (len(prices) + i)
        projected = max(0.01, projected)
        forecast.append(schemas.ForecastPoint(month=d.strftime("%b %Y"), cost=round(projected, 2)))
    return schemas.ForecastResponse(instance_id=instance.id, instance_name=instance.name, forecast=forecast)


def save_comparison(db: Session, data: schemas.SavedComparisonCreate) -> models.SavedComparison:
    obj = models.SavedComparison(name=data.name, instance_ids=data.instance_ids)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_saved_comparisons(db: Session) -> list[models.SavedComparison]:
    return db.query(models.SavedComparison).order_by(models.SavedComparison.created_at.desc()).all()


def get_scrape_logs(db: Session, provider: str | None = None, limit: int = 50) -> list[models.ScrapeLog]:
    q = db.query(models.ScrapeLog).order_by(models.ScrapeLog.scraped_at.desc())
    if provider:
        q = q.filter(models.ScrapeLog.provider_name.ilike(provider))
    return q.limit(limit).all()


def get_instances_by_ids(db: Session, instance_ids: list[int]) -> list[models.Instance]:
    if not instance_ids:
        return []
    return db.query(models.Instance).filter(models.Instance.id.in_(instance_ids)).all()


def get_upgrade_paths(
    db: Session, instance: models.Instance, limit: int = 3
) -> list[models.Instance]:
    """Get larger instances (more CPU or RAM) from same provider and region."""
    return (
        db.query(models.Instance)
        .filter(
            models.Instance.provider_id == instance.provider_id,
            models.Instance.region == instance.region,
            models.Instance.id != instance.id,
            or_(
                models.Instance.cpu > instance.cpu,
                models.Instance.ram > instance.ram,
            ),
        )
        .order_by(models.Instance.hourly_price.asc())
        .limit(limit)
        .all()
    )


def get_distinct_regions(db: Session) -> list[str]:
    """Get distinct region values from instances for region dropdown."""
    rows = db.query(models.Instance.region).distinct().order_by(models.Instance.region).all()
    return [r[0] for r in rows]
