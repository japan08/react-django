"""
Automated Server Recommender API.
"""

import time
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.config.regions import expand_macro_regions
from app.services.workload_service import get_workload_specs
from app.services.automate_scoring import score_instances, generate_tiers

router = APIRouter()


def _make_recommendation_id() -> str:
    return f"auto_rec_{uuid.uuid4().hex[:12]}"


def _tier_why_recommended(tier_name: str, score: float, monthly: float, budget: float | None) -> str:
    if tier_name == "Top Pick":
        return f"Best overall match (score {score:.1f}/100). Suitable for your workload with strong value."
    if tier_name == "Budget Option":
        return f"Cheapest option at ${monthly:.2f}/mo. Best cost-to-performance ratio."
    if tier_name == "Performance Option":
        return f"Best performance option. Highest CPU/RAM specs in your budget."
    if tier_name == "Growth Path":
        return "Recommended upgrade path when you need to scale. Same provider and region."
    return "Good fit for your requirements."


def _build_tier_item(
    scored,
    rank: int,
    tier_name: str,
    budget: float | None,
) -> schemas.TierItem:
    inst = scored.instance
    monthly = inst.hourly_price * 24 * 30
    annual = inst.hourly_price * 24 * 365
    upgrade_names = [
        f"{u.provider.name}:{u.name}" if u.provider else u.name
        for u in scored.upgrade_paths[:3]
    ]
    return schemas.TierItem(
        rank=rank,
        tier_name=tier_name,
        instance_id=inst.id,
        instance_name=inst.name,
        provider=inst.provider.name if inst.provider else "Unknown",
        hourly_price=round(inst.hourly_price, 4),
        monthly_price=round(monthly, 2),
        annual_price=round(annual, 2),
        cpu=inst.cpu,
        ram=inst.ram,
        storage=inst.storage,
        region=inst.region,
        score=scored.overall_score,
        score_breakdown=schemas.TierScoreBreakdown(
            cost=scored.cost_score,
            performance=scored.performance_score,
            reliability=scored.reliability_score,
            value=scored.value_score,
            scalability=scored.scalability_score,
        ),
        why_recommended=_tier_why_recommended(tier_name, scored.overall_score, monthly, budget),
        upgrade_path=upgrade_names,
    )


@router.post("/requirements", response_model=schemas.AutomateRequirementsResponse)
def submit_requirements(
    req: schemas.AutomateRequirementsRequest,
    db: Session = Depends(get_db),
):
    """Submit simplified requirements and get 4-tier recommendations."""
    start = time.time()

    # 1. Workload interpretation
    opt = req.optional
    specs = get_workload_specs(
        db,
        workload_type=req.workload_type,
        optional_min_cpu=opt.min_cpu if opt else None,
        optional_min_ram=opt.min_ram if opt else None,
    )
    if not specs:
        raise HTTPException(status_code=400, detail=f"Unknown workload type: {req.workload_type}")

    # 2. Region expansion
    region_patterns = expand_macro_regions(req.regions)
    budget_max = req.budget_max_monthly or req.budget_monthly or None
    if budget_max and budget_max <= 0:
        budget_max = None

    # 3. Query instances
    instances = crud.get_instances(
        db,
        min_cpu=specs.min_cpu,
        min_ram=specs.recommended_ram,
        max_monthly_price=budget_max,
        region_patterns=region_patterns,
    )
    if not instances:
        raise HTTPException(
            status_code=404,
            detail="No instances match your criteria. Try relaxing budget or region filters.",
        )

    # 4. Get upgrade paths for each instance
    upgrade_map = {}
    for inst in instances:
        upgrade_map[inst.id] = crud.get_upgrade_paths(db, inst, limit=3)

    # 5. Score and tier
    scored = score_instances(
        instances,
        upgrade_map,
        budget_max=budget_max,
        priority=req.performance_priority,
    )
    tiers_dict = generate_tiers(scored)

    # 6. Build response tiers
    tier_items = []
    tier_order = [
        ("top_pick", "Top Pick", 1),
        ("budget", "Budget Option", 2),
        ("premium", "Performance Option", 3),
        ("growth", "Growth Path", 4),
    ]
    for key, label, rank in tier_order:
        s = tiers_dict.get(key)
        if not s:
            continue
        tier_items.append(
            _build_tier_item(s, rank, label, budget_max)
        )

    # 7. Cost projection (from top pick)
    top = tiers_dict.get("top_pick")
    monthly_cost = top.instance.hourly_price * 24 * 30 if top else 0
    annual_cost = monthly_cost * 12
    three_year = monthly_cost * 36
    savings = None
    if budget_max and budget_max > 0 and monthly_cost < budget_max:
        pct = ((budget_max - monthly_cost) / budget_max) * 100
        savings = f"{pct:.0f}%"

    # 8. Save recommendation
    rec_id = _make_recommendation_id()
    rec_json = {
        "tiers": [t.model_dump() for t in tier_items],
        "workload_type": req.workload_type,
        "budget_monthly": req.budget_monthly,
        "priority": req.performance_priority,
        "regions": req.regions,
    }
    saved = models.SavedRecommendation(
        recommendation_id=rec_id,
        recommendation_json=rec_json,
        workload_type=req.workload_type,
        budget_monthly=req.budget_monthly,
        priority=req.performance_priority,
    )
    db.add(saved)
    db.commit()

    elapsed_ms = int((time.time() - start) * 1000)

    return schemas.AutomateRequirementsResponse(
        recommendation_id=rec_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        workload_mapped_specs=schemas.WorkloadMappedSpecsOut(
            min_cpu=specs.min_cpu,
            recommended_ram=specs.recommended_ram,
            storage_min=specs.storage_min,
            bandwidth_priority=specs.bandwidth_priority,
            gpu_required=specs.gpu_required,
            auto_scaling_recommended=specs.auto_scaling_recommended,
        ),
        tiers=tier_items,
        cost_projection=schemas.CostProjectionOut(
            selected_tier=1,
            monthly_cost=round(monthly_cost, 2),
            annual_cost=round(annual_cost, 2),
            three_year_cost=round(three_year, 2),
            potential_savings_vs_budget=savings,
        ),
        confidence_score=0.92,
        reasoning=f"Analysis determined {req.workload_type} requires {specs.min_cpu}+ vCPU, {specs.recommended_ram}+ GB RAM. Found {len(instances)} matching instances. Top recommendation scored in {elapsed_ms}ms.",
    )


@router.post("/refine", response_model=schemas.AutomateRefineResponse)
def refine_recommendation(
    req: schemas.AutomateRefineRequest,
    db: Session = Depends(get_db),
):
    """Refine a previous recommendation with adjustments or questions."""
    saved = (
        db.query(models.SavedRecommendation)
        .filter(models.SavedRecommendation.recommendation_id == req.recommendation_id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    # If adjustment provided, re-run with adjusted params
    if req.adjustment:
        min_cpu = req.adjustment.get("min_cpu")
        min_ram = req.adjustment.get("min_ram")
        regions = req.adjustment.get("regions", saved.recommendation_json.get("regions", []))
        budget = req.adjustment.get("budget_monthly", saved.budget_monthly)

        region_patterns = expand_macro_regions(regions) if regions else None
        instances = crud.get_instances(
            db,
            min_cpu=min_cpu,
            min_ram=min_ram,
            max_monthly_price=budget if budget and budget > 0 else None,
            region_patterns=region_patterns,
        )
        if not instances:
            return schemas.AutomateRefineResponse(
                new_recommendation=[],
                adjustment_cost_impact="No instances match the adjusted criteria.",
                explanation="Try relaxing min CPU, min RAM, or budget.",
            )

        upgrade_map = {i.id: crud.get_upgrade_paths(db, i, limit=3) for i in instances}
        scored = score_instances(instances, upgrade_map, budget, "balanced")
        tiers_dict = generate_tiers(scored)

        tier_items = []
        for key, label, rank in [("top_pick", "Top Pick", 1), ("budget", "Budget", 2), ("premium", "Premium", 3), ("growth", "Growth", 4)]:
            s = tiers_dict.get(key)
            if s:
                tier_items.append(_build_tier_item(s, rank, label, budget))

        cost_impact = ""
        if tier_items:
            new_monthly = tier_items[0].monthly_price
            old_monthly = saved.recommendation_json.get("tiers", [{}])[0].get("monthly_price", 0)
            if old_monthly:
                diff = new_monthly - old_monthly
                cost_impact = f"{'+' if diff >= 0 else ''}${diff:.2f}/month for rank 1"

        return schemas.AutomateRefineResponse(
            new_recommendation=tier_items,
            adjustment_cost_impact=cost_impact or None,
            explanation=req.question or "Recommendations updated based on your adjustments.",
        )

    # Question only: return explanation
    return schemas.AutomateRefineResponse(
        new_recommendation=[],  # Keep existing; could re-fetch from saved
        explanation=req.question or "No adjustment provided. Use the adjustment field to change min CPU, min RAM, regions, or budget.",
    )


@router.get("/recommendations/{recommendation_id}")
def get_recommendation(recommendation_id: str, db: Session = Depends(get_db)):
    """Retrieve a saved recommendation by ID."""
    saved = (
        db.query(models.SavedRecommendation)
        .filter(models.SavedRecommendation.recommendation_id == recommendation_id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {
        "recommendation_id": saved.recommendation_id,
        "workload_type": saved.workload_type,
        "budget_monthly": saved.budget_monthly,
        "created_at": saved.created_at.isoformat(),
        **saved.recommendation_json,
    }
