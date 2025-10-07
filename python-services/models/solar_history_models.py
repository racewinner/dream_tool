"""
Solar History Models
SQLAlchemy models for tracking solar system assessment history and maintenance actions
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, Text, JSON, Enum, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from core.database import Base
from models.solar_analysis_models import ComponentType

class MaintenanceActionType(enum.Enum):
    """Enum for maintenance action types"""
    CLEANING = "cleaning"
    REPAIR = "repair"
    REPLACEMENT = "replacement"
    UPGRADE = "upgrade"
    INSPECTION = "inspection"
    OTHER = "other"

class MaintenanceAction(Base):
    """
    Maintenance Action model - tracks maintenance performed on solar components
    """
    __tablename__ = 'maintenance_actions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('solar_system_assessments.id'), nullable=False)
    recommendation_id = Column(UUID(as_uuid=True), ForeignKey('upgrade_recommendations.id'), nullable=True)
    component_id = Column(UUID(as_uuid=True), ForeignKey('solar_components_detected.id'), nullable=True)
    
    action_type = Column(Enum(MaintenanceActionType, name='maintenance_action_type'), nullable=False)
    action_date = Column(DateTime, nullable=False)
    performed_by = Column(String, nullable=False)
    action_description = Column(Text, nullable=False)
    cost_usd = Column(Float, nullable=True)
    
    before_photos = Column(ARRAY(String), nullable=True)
    after_photos = Column(ARRAY(String), nullable=True)
    
    notes = Column(Text, nullable=True)
    results = Column(Text, nullable=True)
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    assessment = relationship("SolarSystemAssessment", back_populates="maintenance_actions")
    recommendation = relationship("UpgradeRecommendation", back_populates="maintenance_actions")
    component = relationship("SolarComponentDetected", back_populates="maintenance_actions")
    
    def __repr__(self):
        return f"<MaintenanceAction(id={self.id}, type={self.action_type}, date={self.action_date})>"

class AssessmentHistory(Base):
    """
    Assessment History model - tracks changes in system condition over time
    """
    __tablename__ = 'assessment_history'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id = Column(Integer, ForeignKey('facilities.id'), nullable=False)
    
    # First assessment
    first_assessment_id = Column(UUID(as_uuid=True), ForeignKey('solar_system_assessments.id'), nullable=False)
    first_assessment_date = Column(DateTime, nullable=False)
    
    # Latest assessment
    latest_assessment_id = Column(UUID(as_uuid=True), ForeignKey('solar_system_assessments.id'), nullable=False)
    latest_assessment_date = Column(DateTime, nullable=False)
    
    # Count of assessments
    assessment_count = Column(Integer, nullable=False, default=1)
    
    # System changes over time
    initial_solar_capacity_kw = Column(Float, nullable=True)
    current_solar_capacity_kw = Column(Float, nullable=True)
    capacity_change_percent = Column(Float, nullable=True)
    
    initial_battery_capacity_kwh = Column(Float, nullable=True)
    current_battery_capacity_kwh = Column(Float, nullable=True)
    battery_capacity_change_percent = Column(Float, nullable=True)
    
    # Condition changes
    condition_trend = Column(String, nullable=True)  # improving, stable, degrading
    degradation_rate_percent = Column(Float, nullable=True)  # Annual degradation rate
    
    # Maintenance summary
    maintenance_action_count = Column(Integer, nullable=False, default=0)
    total_maintenance_cost = Column(Float, nullable=False, default=0.0)
    
    # Performance metrics
    performance_trend = Column(String, nullable=True)  # improving, stable, degrading
    estimated_annual_savings = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    facility = relationship("Facility")
    first_assessment = relationship("SolarSystemAssessment", foreign_keys=[first_assessment_id])
    latest_assessment = relationship("SolarSystemAssessment", foreign_keys=[latest_assessment_id])
    
    def __repr__(self):
        return f"<AssessmentHistory(id={self.id}, facility_id={self.facility_id}, assessments={self.assessment_count})>"

class ComponentHistory(Base):
    """
    Component History model - tracks changes in individual components over time
    """
    __tablename__ = 'component_history'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id = Column(Integer, ForeignKey('facilities.id'), nullable=False)
    component_type = Column(Enum(ComponentType), nullable=False)
    
    # First detection
    first_detection_id = Column(UUID(as_uuid=True), ForeignKey('solar_components_detected.id'), nullable=False)
    first_detection_date = Column(DateTime, nullable=False)
    
    # Latest detection
    latest_detection_id = Column(UUID(as_uuid=True), ForeignKey('solar_components_detected.id'), nullable=False)
    latest_detection_date = Column(DateTime, nullable=False)
    
    # Count of detections
    detection_count = Column(Integer, nullable=False, default=1)
    
    # Component specifications
    initial_specifications = Column(JSONB, nullable=True)
    current_specifications = Column(JSONB, nullable=True)
    
    # Condition changes
    initial_condition = Column(String, nullable=True)
    current_condition = Column(String, nullable=True)
    condition_trend = Column(String, nullable=True)  # improving, stable, degrading
    
    # Issues history
    initial_issues = Column(JSONB, nullable=True)
    current_issues = Column(JSONB, nullable=True)
    resolved_issues = Column(Integer, nullable=False, default=0)
    new_issues = Column(Integer, nullable=False, default=0)
    
    # Maintenance history
    maintenance_count = Column(Integer, nullable=False, default=0)
    last_maintenance_date = Column(DateTime, nullable=True)
    total_maintenance_cost = Column(Float, nullable=False, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    facility = relationship("Facility")
    first_detection = relationship("SolarComponentDetected", foreign_keys=[first_detection_id])
    latest_detection = relationship("SolarComponentDetected", foreign_keys=[latest_detection_id])
    
    def __repr__(self):
        return f"<ComponentHistory(id={self.id}, type={self.component_type}, detections={self.detection_count})>"
