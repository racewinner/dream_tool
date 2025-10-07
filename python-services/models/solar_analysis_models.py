"""
Solar PV Component Analysis Models
SQLAlchemy models for storing solar PV photo analysis data
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime
from typing import Optional, Dict, Any, List

from core.database import Base

# Enums for model choices
class SubmissionSource(enum.Enum):
    KOBOCOLLECT = "kobocollect"
    MANUAL_UPLOAD = "manual_upload"

class AnalysisStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ComponentType(enum.Enum):
    SOLAR_PANEL = "solar_panel"
    BATTERY = "battery"
    INVERTER = "inverter"
    MPPT = "mppt"

class IssueSeverity(enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class RecommendationType(enum.Enum):
    CAPACITY_EXPANSION = "capacity_expansion"
    REPLACEMENT = "replacement"
    MAINTENANCE = "maintenance"
    INSTALLATION_IMPROVEMENT = "installation_improvement"

class SolarSystemAssessment(Base):
    """
    Solar system assessment model for storing assessment metadata
    """
    __tablename__ = 'solar_system_assessments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id = Column(Integer, ForeignKey('facilities.id'), nullable=False)
    submission_id = Column(String, nullable=False, comment='External submission ID from KoBoCollect')
    assessment_date = Column(DateTime, nullable=False, default=func.now())
    surveyor_name = Column(String, nullable=True)
    submission_source = Column(SQLEnum(SubmissionSource), nullable=False, default=SubmissionSource.KOBOCOLLECT)
    analysis_status = Column(SQLEnum(AnalysisStatus), nullable=False, default=AnalysisStatus.PENDING)
    overall_confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    facility = relationship("Facility")
    components = relationship("SolarComponentDetected", back_populates="assessment", cascade="all, delete-orphan")
    capacity_analysis = relationship("SystemCapacityAnalysis", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    detected_issues = relationship("DetectedIssue", back_populates="assessment", cascade="all, delete-orphan")
    upgrade_recommendations = relationship("UpgradeRecommendation", back_populates="assessment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<SolarSystemAssessment(id={self.id}, facility_id={self.facility_id}, status={self.analysis_status})>"

class SolarComponentDetected(Base):
    """
    Detected solar component model for storing component photos and analysis
    """
    __tablename__ = 'solar_components_detected'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('solar_system_assessments.id'), nullable=False)
    component_type = Column(SQLEnum(ComponentType), nullable=False)
    photo_url = Column(String, nullable=False)
    original_photo_url = Column(String, nullable=False)
    annotated_photo_url = Column(String, nullable=True)
    detection_confidence = Column(Float, nullable=False, default=0.0)
    analysis_results = Column(JSON, nullable=False, default={})
    ocr_extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    
    # Relationships
    assessment = relationship("SolarSystemAssessment", back_populates="components")
    
    def __repr__(self):
        return f"<SolarComponentDetected(id={self.id}, type={self.component_type})>"

class SystemCapacityAnalysis(Base):
    """
    System capacity analysis model for storing calculated system capacity
    """
    __tablename__ = 'system_capacity_analyses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('solar_system_assessments.id'), nullable=False, unique=True)
    solar_capacity_kw = Column(Float, nullable=True)
    panel_count = Column(Integer, nullable=True)
    individual_panel_watts = Column(Integer, nullable=True)
    battery_capacity_kwh = Column(Float, nullable=True)
    battery_count = Column(Integer, nullable=True)
    battery_voltage = Column(Integer, nullable=True)
    battery_ah = Column(Integer, nullable=True)
    inverter_capacity_kw = Column(Float, nullable=True)
    inverter_type = Column(String, nullable=True)
    mppt_capacity_kw = Column(Float, nullable=True)
    estimated_backup_hours = Column(Float, nullable=True)
    system_balance_status = Column(String, nullable=False, default="unknown")
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    assessment = relationship("SolarSystemAssessment", back_populates="capacity_analysis")
    
    @property
    def total_system_summary(self):
        """Generate a summary of the total system capacity"""
        summary = {}
        
        if self.solar_capacity_kw:
            summary["solar_capacity"] = f"{self.solar_capacity_kw:.1f} kW"
        
        if self.battery_capacity_kwh:
            summary["battery_capacity"] = f"{self.battery_capacity_kwh:.1f} kWh"
        
        if self.inverter_capacity_kw:
            summary["inverter_capacity"] = f"{self.inverter_capacity_kw:.1f} kW"
        
        if self.estimated_backup_hours:
            summary["estimated_backup"] = f"{self.estimated_backup_hours:.1f} hours"
        
        return summary
    
    @property
    def is_balanced(self):
        """Check if the system components are properly balanced"""
        if not all([self.solar_capacity_kw, self.inverter_capacity_kw]):
            return False
        
        # Basic balance check: inverter should be sized appropriately for solar capacity
        inverter_to_solar_ratio = self.inverter_capacity_kw / self.solar_capacity_kw if self.solar_capacity_kw else 0
        
        if 0.8 <= inverter_to_solar_ratio <= 1.2:
            return True
        return False
    
    def __repr__(self):
        return f"<SystemCapacityAnalysis(id={self.id}, solar={self.solar_capacity_kw}kW, battery={self.battery_capacity_kwh}kWh)>"

class DetectedIssue(Base):
    """
    Detected issue model for storing issues found during analysis
    """
    __tablename__ = 'detected_issues'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('solar_system_assessments.id'), nullable=False)
    component_type = Column(SQLEnum(ComponentType), nullable=False)
    issue_type = Column(String, nullable=False)
    severity = Column(SQLEnum(IssueSeverity), nullable=False)
    description = Column(Text, nullable=False)
    impact_description = Column(Text, nullable=True)
    estimated_power_loss_percent = Column(Float, nullable=True)
    photo_evidence_url = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, nullable=False, default=func.now())
    
    # Relationships
    assessment = relationship("SolarSystemAssessment", back_populates="detected_issues")
    
    def __repr__(self):
        return f"<DetectedIssue(id={self.id}, type={self.issue_type}, severity={self.severity})>"

class UpgradeRecommendation(Base):
    """
    Upgrade recommendation model for storing recommended improvements
    """
    __tablename__ = 'upgrade_recommendations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('solar_system_assessments.id'), nullable=False)
    recommendation_type = Column(SQLEnum(RecommendationType), nullable=False)
    priority = Column(SQLEnum(IssueSeverity), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    current_value = Column(String, nullable=True)
    recommended_value = Column(String, nullable=True)
    estimated_cost_usd = Column(Float, nullable=True)
    estimated_annual_savings_usd = Column(Float, nullable=True)
    payback_period_months = Column(Integer, nullable=True)
    implementation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    
    # Relationships
    assessment = relationship("SolarSystemAssessment", back_populates="upgrade_recommendations")
    
    @property
    def roi_calculation(self):
        """Calculate return on investment"""
        if not self.estimated_cost_usd or not self.estimated_annual_savings_usd or self.estimated_annual_savings_usd == 0:
            return None
        
        roi = (self.estimated_annual_savings_usd / self.estimated_cost_usd) * 100
        return f"{roi:.1f}%"
    
    def __repr__(self):
        return f"<UpgradeRecommendation(id={self.id}, type={self.recommendation_type}, priority={self.priority})>"
