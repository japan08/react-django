"""
Workload interpretation: maps workload type + optional params to hardware specs.
Uses recommendation_templates for deterministic lookup; AI can be added for "custom" type.
"""

from dataclasses import dataclass
from sqlalchemy.orm import Session

from app.models import RecommendationTemplate


@dataclass
class WorkloadMappedSpecs:
    min_cpu: int
    recommended_ram: int
    storage_min: int
    bandwidth_priority: str
    gpu_required: bool
    auto_scaling_recommended: bool
    reasoning: str


def get_workload_specs(
    db: Session,
    workload_type: str,
    optional_min_cpu: int | None = None,
    optional_min_ram: int | None = None,
    budget_monthly: float | None = None,
    performance_priority: str | None = None,
) -> WorkloadMappedSpecs | None:
    """
    Get workload-mapped specs from recommendation_templates.
    Optional overrides from user (min_cpu, min_ram) take precedence.
    Budget and performance_priority can adjust specs (simplified: use template defaults for now).
    """
    template = (
        db.query(RecommendationTemplate)
        .filter(RecommendationTemplate.workload_type == workload_type)
        .first()
    )
    if not template:
        # Fallback for unknown workload
        template = (
            db.query(RecommendationTemplate)
            .filter(RecommendationTemplate.workload_type == "web_app")
            .first()
        )
    if not template:
        return None

    min_cpu = optional_min_cpu if optional_min_cpu is not None else template.min_cpu
    rec_ram = optional_min_ram if optional_min_ram is not None else template.recommended_ram
    storage_min = template.storage_min
    bandwidth = template.bandwidth_priority
    gpu = bool(template.gpu_required)
    auto_scaling = bool(template.auto_scaling)

    # Budget adjustment: if budget is tight, could reduce specs (simplified: no change for now)
    # Performance priority: if "performance" or "speed", could bump specs (simplified: no change)

    return WorkloadMappedSpecs(
        min_cpu=min_cpu,
        recommended_ram=rec_ram,
        storage_min=storage_min,
        bandwidth_priority=bandwidth,
        gpu_required=gpu,
        auto_scaling_recommended=auto_scaling,
        reasoning=f"Workload '{workload_type}' typically requires {min_cpu}+ vCPU, {rec_ram}+ GB RAM, {storage_min}+ GB storage.",
    )
