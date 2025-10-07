"""
SQLAlchemy Database Models
Mirrors the existing TypeScript Sequelize models to enable Python services to access the same PostgreSQL database
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import Enum as SQLEnum
from core.database import Base
from core.enum_types import create_enum_column, EnumConfig
import enum
from datetime import datetime
from typing import Dict, Any, List, Optional
import os

# Enums matching TypeScript models

class FacilityType(enum.Enum):
    AGRICULTURE = "agriculture"
    MOBILITY = "mobility"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    ICT = "ict"
    PUBLIC_INSTITUTIONS = "public_institutions"
    SMALL_SCALE_BUSINESSES = "small_scale_businesses"
    OTHER = "other"

class FacilityStatus(enum.Enum):
    SURVEY = "survey"
    DESIGN = "design"
    INSTALLED = "installed"
    MAINTENANCE = "maintenance"

class EquipmentTimeOfDay(enum.Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    NIGHT = "night"
    ALL_DAY = "all_day"

class SystemType(enum.Enum):
    PV = "PV"
    HYBRID = "HYBRID"
    STANDALONE = "STANDALONE"

class MaintenanceType(enum.Enum):
    ROUTINE = "ROUTINE"
    CORRECTIVE = "CORRECTIVE"
    PREVENTIVE = "PREVENTIVE"

class MaintenanceStatus(enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class MaintenanceFrequency(enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"

class SolarSystemStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    DECOMMISSIONED = "DECOMMISSIONED"

# Database Models

class Facility(Base):
    """
    Facility model - mirrors backend/src/models/facility.ts
    Uses proper enum handling that works with database constraints
    """
    __tablename__ = 'facilities'
    
    # Get environment-specific enum configuration
    _env = os.getenv('ENVIRONMENT', 'development')
    _enum_config = (EnumConfig.get_development_config() if _env == 'development' 
                   else EnumConfig.get_production_config())
    
    # Filter config to only include parameters that create_enum_column accepts
    _column_config = {k: v for k, v in _enum_config.items() if k in ['flexible', 'allow_invalid']}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    type = Column(create_enum_column(FacilityType, **_column_config), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(create_enum_column(FacilityStatus, default=FacilityStatus.SURVEY, **_column_config))
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    surveys = relationship("Survey", back_populates="facility")
    solar_systems = relationship("SolarSystem", back_populates="facility")

class Survey(Base):
    """
    Survey model - mirrors backend/src/models/survey.ts
    """
    __tablename__ = 'surveys'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column('externalId', String, nullable=False, unique=True, 
                        comment='External system identifier for this survey')
    facility_id = Column('facilityId', Integer, ForeignKey('facilities.id'), nullable=False)
    facility_data = Column('facilityData', JSON, nullable=False, 
                          comment='Processed facility data in JSON format')
    raw_data = Column('rawData', JSON, nullable=True, 
                     comment='Original raw survey data from KoboToolbox for preserving all question responses')
    collection_date = Column('collectionDate', DateTime, nullable=False, 
                           comment='Date when the survey was collected')
    respondent_id = Column('respondentId', String, nullable=True, 
                          comment='Identifier for the person who completed the survey')
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    facility = relationship("Facility", back_populates="surveys")
    images = relationship("SurveyImage", back_populates="survey", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Survey(id={self.id}, external_id='{self.external_id}', facility_id={self.facility_id})>"

class Equipment(Base):
    """
    Equipment model - mirrors actual database schema
    """
    __tablename__ = 'equipment'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column('surveyId', Integer, nullable=False)  # References surveys table
    name = Column(String, nullable=False)
    power_rating = Column('powerRating', Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    hours_per_day = Column('hoursPerDay', Float, nullable=False, default=0)
    hours_per_night = Column('hoursPerNight', Float, nullable=False, default=0)
    time_of_day = Column('timeOfDay', create_enum_column(EquipmentTimeOfDay), nullable=False, default=EquipmentTimeOfDay.MORNING)
    weekly_usage = Column('weeklyUsage', Integer, nullable=False, default=7)
    category = Column(String, nullable=False)
    critical = Column(Boolean, nullable=False, default=False)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Equipment(id={self.id}, name='{self.name}', power_rating={self.power_rating})>"

class SolarSystem(Base):
    """
    Solar System model - mirrors backend/src/models/solarSystem.ts
    """
    __tablename__ = 'solar_systems'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column('facilityId', Integer, ForeignKey('facilities.id'), nullable=False)
    system_type = Column('systemType', SQLEnum(SystemType), nullable=False)
    capacity_kw = Column('capacityKw', Float, nullable=False)
    installation_date = Column('installationDate', DateTime, nullable=False)
    commissioning_date = Column('commissioningDate', DateTime, nullable=False)
    manufacturer = Column(String, nullable=False)
    model = Column(String, nullable=False)
    serial_number = Column('serialNumber', String, nullable=False)
    warranty_period = Column('warrantyPeriod', Integer, nullable=False)
    maintenance_schedule = Column('maintenanceSchedule', String, nullable=False)
    maintenance_frequency = Column('maintenanceFrequency', SQLEnum(MaintenanceFrequency), nullable=False)
    status = Column(SQLEnum(SolarSystemStatus), nullable=False)
    last_maintenance_date = Column('lastMaintenanceDate', DateTime, nullable=True)
    next_maintenance_date = Column('nextMaintenanceDate', DateTime, nullable=True)
    performance_metrics = Column('performanceMetrics', JSON, nullable=True, 
                                comment='Performance metrics including generation, efficiency, costs')
    funding_source = Column('fundingSource', String, nullable=True)
    grant_amount = Column('grantAmount', Float, nullable=True)
    grant_expiry_date = Column('grantExpiryDate', DateTime, nullable=True)
    installation_cost = Column('installationCost', Float, nullable=True)
    maintenance_cost = Column('maintenanceCost', Float, nullable=True)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    facility = relationship("Facility", back_populates="solar_systems")
    maintenance_records = relationship("MaintenanceRecord", back_populates="solar_system")
    
    def __repr__(self):
        return f"<SolarSystem(id={self.id}, facility_id={self.facility_id}, capacity_kw={self.capacity_kw})>"

class MaintenanceRecord(Base):
    """
    Maintenance Record model - mirrors backend/src/models/maintenanceRecord.ts
    """
    __tablename__ = 'maintenance_records'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column('userId', Integer, nullable=False)  # Foreign key to users table
    maintenance_id = Column('maintenanceId', Integer, nullable=False)
    solar_system_id = Column('solarSystemId', Integer, ForeignKey('solar_systems.id'), nullable=True)
    maintenance_date = Column('maintenanceDate', DateTime, nullable=False)
    maintenance_type = Column('maintenanceType', SQLEnum(MaintenanceType), nullable=False)
    maintenance_status = Column('maintenanceStatus', SQLEnum(MaintenanceStatus), default=MaintenanceStatus.PENDING)
    maintenance_description = Column('maintenanceDescription', Text, nullable=True)
    maintenance_cost = Column('maintenanceCost', Float, nullable=True)
    parts_replaced = Column('partsReplaced', JSON, nullable=True, comment='Array of replaced parts')
    labor_hours = Column('laborHours', Float, nullable=True)
    next_maintenance_date = Column('nextMaintenanceDate', DateTime, nullable=True)
    maintenance_report = Column('maintenanceReport', Text, nullable=True)
    attachments = Column(JSON, nullable=True, comment='Array of attachment file paths')
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    solar_system = relationship("SolarSystem", back_populates="maintenance_records")
    
    def __repr__(self):
        return f"<MaintenanceRecord(id={self.id}, maintenance_type={self.maintenance_type}, status={self.maintenance_status})>"

class User(Base):
    """
    User model - basic structure for user references
    """
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=True)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"

# Additional models that might be referenced

class Asset(Base):
    """
    Asset model - basic structure
    """
    __tablename__ = 'assets'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column('facilityId', Integer, ForeignKey('facilities.id'), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)
    value = Column(Float, nullable=True)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())

class TechnoEconomicAnalysis(Base):
    """
    Techno Economic Analysis model - basic structure
    """
    __tablename__ = 'techno_economic_analyses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column('facilityId', Integer, ForeignKey('facilities.id'), nullable=False)
    analysis_data = Column('analysisData', JSON, nullable=True)
    results = Column(JSON, nullable=True)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())

class SurveyImage(Base):
    """
    Survey Image model - stores metadata for images attached to surveys
    """
    __tablename__ = 'survey_images'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column('surveyId', Integer, ForeignKey('surveys.id'), nullable=False)
    original_url = Column('originalUrl', String, nullable=True)
    local_path = Column('localPath', String, nullable=False)
    mime_type = Column('mimeType', String, nullable=True)
    file_name = Column('fileName', String, nullable=False)
    question_field = Column('questionField', String, nullable=True)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    survey = relationship("Survey", back_populates="images")
    
    def __repr__(self):
        return f"<SurveyImage(id={self.id}, survey_id={self.survey_id}, file_name='{self.file_name}')>"

class SurveyVersion(Base):
    """
    Survey Version model - mirrors backend/src/models/surveyVersion.ts
    """
    __tablename__ = 'survey_versions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column('surveyId', Integer, ForeignKey('surveys.id'), nullable=False)
    version = Column(Integer, nullable=False)
    status = Column(SQLEnum(enum.Enum('SurveyVersionStatus', 'draft completed archived')), nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column('createdBy', String, nullable=False)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<SurveyVersion(id={self.id}, survey_id={self.survey_id}, version={self.version})>"

class RawImport(Base):
    """
    Raw Import model - mirrors backend/src/models/rawImport.ts
    """
    __tablename__ = 'raw_imports'
    
    id = Column(String, primary_key=True)  # UUID in TypeScript
    source = Column(String, nullable=False)
    data = Column(JSON, nullable=False)
    status = Column(SQLEnum(enum.Enum('ImportStatus', 'pending processing processed failed')), 
                   nullable=False, default='pending')
    error = Column(Text, nullable=True)
    import_metadata = Column('metadata', JSON, nullable=True)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<RawImport(id='{self.id}', source='{self.source}', status={self.status})>"

class WhatsApp(Base):
    """
    WhatsApp model - mirrors backend/src/models/whatsapp.ts
    """
    __tablename__ = 'whatsapp_messages'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column('facilityId', Integer, ForeignKey('facilities.id'), nullable=False)
    phone_number = Column('phoneNumber', String, nullable=False)
    message = Column(Text, nullable=False)
    direction = Column(SQLEnum(enum.Enum('MessageDirection', 'in out')), nullable=False)
    status = Column(SQLEnum(enum.Enum('MessageStatus', 'sent delivered read failed')), nullable=False)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<WhatsApp(id={self.id}, facility_id={self.facility_id}, direction={self.direction})>"

class Maintenance(Base):
    """
    Maintenance model - mirrors backend/src/models/maintenance.ts
    Simple maintenance tracking (different from MaintenanceRecord)
    """
    __tablename__ = 'maintenance'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    system_id = Column('systemId', Integer, ForeignKey('solar_systems.id'), nullable=False)
    date = Column(DateTime, nullable=False)
    issue = Column(Text, nullable=False)
    resolution = Column(Text, nullable=False)
    technician = Column(String, nullable=False)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Maintenance(id={self.id}, system_id={self.system_id}, technician='{self.technician}')>"

# Helper functions for data access

def get_survey_by_external_id(db_session, external_id: str) -> Optional[Survey]:
    """Get survey by external ID"""
    return db_session.query(Survey).filter(Survey.external_id == external_id).first()

def get_surveys_by_facility_id(db_session, facility_id: int) -> List[Survey]:
    """Get all surveys for a facility"""
    return db_session.query(Survey).filter(Survey.facility_id == facility_id).all()

def get_latest_survey_for_facility(db_session, facility_id: int) -> Optional[Survey]:
    """Get the most recent survey for a facility"""
    return db_session.query(Survey).filter(Survey.facility_id == facility_id)\
                    .order_by(Survey.created_at.desc()).first()

def get_facility_with_surveys(db_session, facility_id: int) -> Optional[Facility]:
    """Get facility with all its surveys"""
    return db_session.query(Facility).filter(Facility.id == facility_id).first()
