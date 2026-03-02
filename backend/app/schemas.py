from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, computed_field


class ProviderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    website: str
    logo_url: Optional[str] = None
    last_scraped: Optional[datetime] = None
    scrape_status: Optional[str] = None
    instance_count: Optional[int] = None
    regions: Optional[list[str]] = None


class InstanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    cpu: float
    ram: float
    storage: int
    region: str
    hourly_price: float
    last_synced: Optional[datetime] = None
    provider: ProviderOut

    @computed_field
    @property
    def monthly_price(self) -> float:
        return round(self.hourly_price * 24 * 30, 2)

    @computed_field
    @property
    def yearly_price(self) -> float:
        return round(self.hourly_price * 24 * 365, 2)


class InstanceCreate(BaseModel):
    name: str
    cpu: float
    ram: float
    storage: int
    region: str
    hourly_price: float
    provider_id: int


class PriceHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    instance_id: int
    hourly_price: float
    recorded_at: datetime


class SavedComparisonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    instance_ids: list[int]
    created_at: datetime


class SavedComparisonCreate(BaseModel):
    name: str
    instance_ids: list[int]


class ProviderBreakdown(BaseModel):
    provider: ProviderOut
    count: int
    avg_monthly: float
    min_monthly: float
    max_monthly: float


class AnalyticsSummary(BaseModel):
    total_instances: int
    cheapest_instance: "InstanceOut"
    most_expensive: "InstanceOut"
    avg_hourly_price: float
    avg_monthly_price: float
    provider_breakdown: list[ProviderBreakdown]


class ForecastPoint(BaseModel):
    month: str
    cost: float


class ForecastResponse(BaseModel):
    instance_id: int
    instance_name: str
    forecast: list[ForecastPoint]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    suggested_filters: Optional[dict] = None


class RecommendRequest(BaseModel):
    workload_type: str = "web app"
    max_monthly_budget: float = 0.0
    min_cpu: int = 0
    min_ram: int = 0
    natural_language: Optional[str] = None
    provider_ids: list[int] = []


class InstanceRecommendation(BaseModel):
    instance: InstanceOut
    match_score: float
    verdict: str
    pros: list[str]
    cons: list[str]
    use_case_fit: str


class RecommendResponse(BaseModel):
    recommendations: list[InstanceRecommendation]
    summary: str
    requirements_understood: str


class ScrapeLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    provider_name: str
    status: str
    instances_found: int
    error_message: Optional[str] = None
    scraped_at: datetime


# ── Automate / Quick Recommend schemas ──────────────────────────────────────

class AutomateOptionalParams(BaseModel):
    min_cpu: Optional[int] = None
    min_ram: Optional[int] = None
    gpu_required: Optional[bool] = None
    auto_scaling: Optional[bool] = None
    compliance: Optional[list[str]] = None
    storage_type: Optional[str] = None


class AutomateRequirementsRequest(BaseModel):
    workload_type: str = "web_app"
    budget_monthly: float = 100.0
    budget_max_monthly: Optional[float] = None
    commitment_type: str = "on_demand"
    performance_priority: str = "balanced"
    regions: list[str] = []
    optional: Optional[AutomateOptionalParams] = None


class WorkloadMappedSpecsOut(BaseModel):
    min_cpu: int
    recommended_ram: int
    storage_min: int
    bandwidth_priority: str
    gpu_required: bool
    auto_scaling_recommended: bool


class TierScoreBreakdown(BaseModel):
    cost: float
    performance: float
    reliability: float
    value: float
    scalability: float


class TierItem(BaseModel):
    rank: int
    tier_name: str
    instance_id: int
    instance_name: str
    provider: str
    hourly_price: float
    monthly_price: float
    annual_price: float
    cpu: float
    ram: float
    storage: int
    region: str
    score: float
    score_breakdown: TierScoreBreakdown
    why_recommended: str
    upgrade_path: list[str]


class CostProjectionOut(BaseModel):
    selected_tier: int
    monthly_cost: float
    annual_cost: float
    three_year_cost: float
    potential_savings_vs_budget: Optional[str] = None


class AutomateRequirementsResponse(BaseModel):
    recommendation_id: str
    timestamp: str
    workload_mapped_specs: WorkloadMappedSpecsOut
    tiers: list[TierItem]
    cost_projection: CostProjectionOut
    confidence_score: float
    reasoning: str


class AutomateRefineRequest(BaseModel):
    recommendation_id: str
    question: Optional[str] = None
    adjustment: Optional[dict] = None


class AutomateRefineResponse(BaseModel):
    new_recommendation: list[TierItem]
    adjustment_cost_impact: Optional[str] = None
    explanation: str


InstanceOut.model_rebuild()
