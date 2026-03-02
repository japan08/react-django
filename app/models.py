from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    website = Column(String(512), nullable=False)
    logo_url = Column(String(512), nullable=True)
    last_scraped = Column(DateTime, nullable=True)
    scrape_status = Column(String(32), nullable=True)
    instances = relationship("Instance", back_populates="provider")


class Instance(Base):
    __tablename__ = "instances"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    name = Column(String(255), nullable=False)
    cpu = Column(Float, nullable=False)
    ram = Column(Float, nullable=False)
    storage = Column(Integer, nullable=False)
    region = Column(String(128), nullable=False)
    hourly_price = Column(Float, nullable=False)
    yearly_price = Column(Float, nullable=True)
    last_synced = Column(DateTime, nullable=True)
    provider = relationship("Provider", back_populates="instances")
    price_history = relationship("PriceHistory", back_populates="instance", order_by="PriceHistory.recorded_at.desc()")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("instances.id"), nullable=False)
    hourly_price = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    instance = relationship("Instance", back_populates="price_history")


class ScrapeLog(Base):
    __tablename__ = "scrape_logs"

    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String(255), nullable=False)
    status = Column(String(32), nullable=False)
    instances_found = Column(Integer, nullable=False)
    error_message = Column(String(1024), nullable=True)
    scraped_at = Column(DateTime, default=datetime.utcnow)


class SavedComparison(Base):
    __tablename__ = "saved_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    instance_ids = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecommendationTemplate(Base):
    __tablename__ = "recommendation_templates"

    id = Column(Integer, primary_key=True, index=True)
    workload_type = Column(String(50), unique=True, nullable=False)
    min_cpu = Column(Integer, nullable=False)
    recommended_ram = Column(Integer, nullable=False)
    storage_min = Column(Integer, nullable=False)
    bandwidth_priority = Column(String(20), nullable=False)  # low, moderate, high
    gpu_required = Column(Integer, nullable=False, default=0)  # 0=no, 1=yes
    auto_scaling = Column(Integer, nullable=False, default=0)  # 0=no, 1=yes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SavedRecommendation(Base):
    __tablename__ = "saved_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=True)
    recommendation_json = Column(JSON, nullable=False)
    workload_type = Column(String(50), nullable=False)
    budget_monthly = Column(Float, nullable=False)
    priority = Column(String(50), nullable=True)
    selected_instance_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String(1024), nullable=True)


class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String(100), nullable=False, index=True)
    user_feedback = Column(String(20), nullable=True)  # helpful, not_helpful, deployed
    deployment_status = Column(String(50), nullable=True)
    actual_usage = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
