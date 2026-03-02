"""
5-dimension scoring and tier generation for Automated Server Recommender.
"""

from dataclasses import dataclass
from typing import Any

# Priority -> weights for Cost, Performance, Reliability, Value, Scalability
PRIORITY_WEIGHTS = {
    "cost": {"cost": 0.60, "performance": 0.10, "reliability": 0.15, "value": 0.10, "scalability": 0.05},
    "speed": {"cost": 0.10, "performance": 0.60, "reliability": 0.15, "value": 0.10, "scalability": 0.05},
    "reliability": {"cost": 0.15, "performance": 0.20, "reliability": 0.50, "value": 0.10, "scalability": 0.05},
    "scalability": {"cost": 0.10, "performance": 0.20, "reliability": 0.15, "value": 0.15, "scalability": 0.40},
    "balanced": {"cost": 0.20, "performance": 0.20, "reliability": 0.20, "value": 0.20, "scalability": 0.20},
}


@dataclass
class ScoredInstance:
    instance: Any
    cost_score: float
    performance_score: float
    reliability_score: float
    value_score: float
    scalability_score: float
    overall_score: float
    upgrade_paths: list[Any]


def _norm(value: float, min_val: float, max_val: float) -> float:
    """Normalize value to 0-100. If min==max, return 50."""
    if max_val <= min_val:
        return 50.0
    return max(0, min(100, (value - min_val) / (max_val - min_val) * 100))


def _cost_score(monthly: float, min_monthly: float, max_monthly: float, budget: float | None) -> float:
    """Lower price = higher score. (Max - Price) / (Max - Min) * 100"""
    if max_monthly <= min_monthly:
        return 80.0
    # Cheaper is better: invert so high price -> low score
    return _norm(max_monthly - monthly, 0, max_monthly - min_monthly)


def _performance_score(cpu: float, ram: float, storage: int, max_cpu: float, max_ram: float, max_storage: int) -> float:
    """Higher specs = higher score, normalized across instances."""
    if max_cpu <= 0 and max_ram <= 0 and max_storage <= 0:
        return 70.0
    parts = []
    if max_cpu > 0:
        parts.append(_norm(cpu, 0, max_cpu))
    if max_ram > 0:
        parts.append(_norm(ram, 0, max_ram))
    if max_storage > 0:
        parts.append(_norm(storage, 0, max_storage))
    return sum(parts) / len(parts) if parts else 70.0


def _reliability_score(provider_name: str) -> float:
    """Placeholder: provider-based. AWS/GCP/Azure ~95, others ~85."""
    high = {"AWS", "GCP", "Azure", "Google"}
    return 95.0 if provider_name in high else 85.0


def _value_score(performance_score: float, cost_score: float, monthly: float) -> float:
    """Performance/cost ratio. High perf + low cost = high value."""
    if monthly <= 0:
        return 80.0
    # Simple: (perf + (100-cost)) / 2, so cheap + powerful = high
    return (performance_score + cost_score) / 2


def _scalability_score(upgrade_count: int) -> float:
    """More upgrade paths = higher scalability."""
    return min(100, 50 + upgrade_count * 20)


def score_instances(
    instances: list,
    upgrade_paths_map: dict[int, list],
    budget_max: float | None,
    priority: str = "balanced",
) -> list[ScoredInstance]:
    """
    Score each instance on 5 dimensions and compute weighted overall score.
    """
    if not instances:
        return []

    weights = PRIORITY_WEIGHTS.get(priority.lower(), PRIORITY_WEIGHTS["balanced"])

    monthlies = [i.hourly_price * 24 * 30 for i in instances]
    min_monthly = min(monthlies)
    max_monthly = max(monthlies)
    max_cpu = max(i.cpu for i in instances)
    max_ram = max(i.ram for i in instances)
    max_storage = max(i.storage for i in instances) or 1

    scored = []
    for inst in instances:
        monthly = inst.hourly_price * 24 * 30
        upgrades = upgrade_paths_map.get(inst.id, [])

        cost_s = _cost_score(monthly, min_monthly, max_monthly, budget_max)
        perf_s = _performance_score(inst.cpu, inst.ram, inst.storage, max_cpu, max_ram, max_storage)
        rel_s = _reliability_score(inst.provider.name if inst.provider else "")
        val_s = _value_score(perf_s, cost_s, monthly)
        scale_s = _scalability_score(len(upgrades))

        overall = (
            weights["cost"] * cost_s
            + weights["performance"] * perf_s
            + weights["reliability"] * rel_s
            + weights["value"] * val_s
            + weights["scalability"] * scale_s
        )

        scored.append(
            ScoredInstance(
                instance=inst,
                cost_score=round(cost_s, 1),
                performance_score=round(perf_s, 1),
                reliability_score=round(rel_s, 1),
                value_score=round(val_s, 1),
                scalability_score=round(scale_s, 1),
                overall_score=round(overall, 1),
                upgrade_paths=upgrades,
            )
        )

    return sorted(scored, key=lambda x: x.overall_score, reverse=True)


def generate_tiers(scored: list[ScoredInstance]) -> dict[str, ScoredInstance | None]:
    """
    Generate 4 tiers: Top Pick, Budget Alternative, Premium Option, Growth Path.
    """
    tiers = {
        "top_pick": None,
        "budget": None,
        "premium": None,
        "growth": None,
    }
    if not scored:
        return tiers

    # Tier 1: Highest overall score
    tiers["top_pick"] = scored[0]

    # Tier 2: Best cost (lowest monthly among scored)
    budget_sorted = sorted(scored, key=lambda x: x.instance.hourly_price * 24 * 30)
    tiers["budget"] = budget_sorted[0] if budget_sorted else None

    # Tier 3: Best performance (highest performance_score)
    perf_sorted = sorted(scored, key=lambda x: x.performance_score, reverse=True)
    tiers["premium"] = perf_sorted[0] if perf_sorted else None

    # Tier 4: Growth path = first upgrade of top pick, or next size up
    top = tiers["top_pick"]
    if top and top.upgrade_paths:
        upgrade_inst = top.upgrade_paths[0]
        # Score the upgrade instance for display
        upgrade_scored = score_instances(
            [upgrade_inst],
            {upgrade_inst.id: []},
            None,
            "scalability",
        )
        tiers["growth"] = upgrade_scored[0] if upgrade_scored else None
    elif len(scored) > 1:
        # Fallback: second-best overall
        tiers["growth"] = scored[1]

    return tiers
