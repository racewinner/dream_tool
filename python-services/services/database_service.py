"""
Database Service for Python Models
Provides high-level database operations using SQLAlchemy models
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import and_, or_, desc, asc, func
from datetime import datetime, timedelta
import logging

from core.database import engine, get_db_session
from models.database_models import (
    Facility, Survey, Equipment, SolarSystem, MaintenanceRecord, 
    User, Asset, TechnoEconomicAnalysis, SurveyImage
)

logger = logging.getLogger(__name__)

class DatabaseService:
    """High-level database service for Python models"""
    
    def __init__(self):
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
    
    # Survey Operations
    
    def get_survey_by_id(self, survey_id: int) -> Optional[Survey]:
        """Get survey by ID"""
        with self.get_session() as db:
            return db.query(Survey).filter(Survey.id == survey_id).first()
    
    def get_survey_by_external_id(self, external_id: str) -> Optional[Survey]:
        """Get survey by external ID"""
        with self.get_session() as db:
            return db.query(Survey).filter(Survey.external_id == external_id).first()
    
    def get_surveys_by_facility(self, facility_id: int, limit: int = None) -> List[Survey]:
        """Get all surveys for a facility"""
        with self.get_session() as db:
            query = db.query(Survey).filter(Survey.facility_id == facility_id)\
                     .order_by(desc(Survey.collection_date))
            if limit:
                query = query.limit(limit)
            return query.all()
    
    def get_latest_survey_for_facility(self, facility_id: int) -> Optional[Survey]:
        """Get the most recent survey for a facility"""
        with self.get_session() as db:
            return db.query(Survey).filter(Survey.facility_id == facility_id)\
                    .order_by(desc(Survey.collection_date)).first()
    
    def create_survey(self, survey_data: Dict[str, Any]) -> Survey:
        """Create a new survey"""
        with self.get_session() as db:
            survey = Survey(**survey_data)
            db.add(survey)
            db.flush()  # This populates the ID without committing
            survey_id = survey.id  # Get the ID while still in session
            db.commit()
            # Manually set the ID on the object since we can't refresh
            survey.id = survey_id
            return survey
    
    def update_survey(self, survey_id: int, update_data: Dict[str, Any]) -> Optional[Survey]:
        """Update survey data"""
        with self.get_session() as db:
            survey = db.query(Survey).filter(Survey.id == survey_id).first()
            if survey:
                for key, value in update_data.items():
                    setattr(survey, key, value)
                survey.updated_at = datetime.utcnow()
                db.commit()
                # Skip db.refresh() to avoid enum conversion issues
            return survey
    
    # Facility Operations
    
    def get_facility_by_id(self, facility_id: int) -> Optional[Facility]:
        """Get facility by ID"""
        with self.get_session() as db:
            return db.query(Facility).filter(Facility.id == facility_id).first()
    
    def get_facilities_with_surveys(self) -> List[Facility]:
        """Get all facilities that have surveys"""
        with self.get_session() as db:
            return db.query(Facility).join(Survey).distinct().all()
    
    def create_facility(self, facility_data: Dict[str, Any]) -> Facility:
        """Create a new facility"""
        with self.get_session() as db:
            facility = Facility(**facility_data)
            db.add(facility)
            db.flush()  # This populates the ID without committing
            facility_id = facility.id  # Get the ID while still in session
            db.commit()
            # Manually set the ID on the object since we can't refresh
            facility.id = facility_id
            return facility
    
    # Equipment Operations
    
    def get_equipment_by_facility(self, facility_id: int) -> List[Equipment]:
        """Get all equipment for a facility (via surveys)"""
        with self.get_session() as db:
            # Equipment is linked to surveys, not directly to facilities
            return db.query(Equipment).join(Survey).filter(Survey.facility_id == facility_id).all()
    
    def get_equipment_by_survey(self, survey_id: int) -> List[Equipment]:
        """Get all equipment from a survey"""
        with self.get_session() as db:
            return db.query(Equipment).filter(Equipment.survey_id == survey_id).all()
    
    def create_equipment(self, equipment_data: Dict[str, Any]) -> Equipment:
        """Create new equipment record"""
        with self.get_session() as db:
            equipment = Equipment(**equipment_data)
            db.add(equipment)
            db.commit()
            # Skip db.refresh() to avoid enum conversion issues
            return equipment
    
    def bulk_create_equipment(self, equipment_list: List[Dict[str, Any]]) -> List[Equipment]:
        """Create multiple equipment records"""
        with self.get_session() as db:
            equipment_objects = [Equipment(**eq_data) for eq_data in equipment_list]
            db.add_all(equipment_objects)
            db.commit()
            # Skip db.refresh() to avoid enum conversion issues
            return equipment_objects
    
    # Solar System Operations
    
    def get_solar_systems_by_facility(self, facility_id: int) -> List[SolarSystem]:
        """Get all solar systems for a facility"""
        with self.get_session() as db:
            return db.query(SolarSystem).filter(SolarSystem.facility_id == facility_id).all()
    
    def create_solar_system(self, system_data: Dict[str, Any]) -> SolarSystem:
        """Create new solar system"""
        with self.get_session() as db:
            system = SolarSystem(**system_data)
            db.add(system)
            db.commit()
            # Skip db.refresh() to avoid enum conversion issues
            return system
    
    # Analytics and Reporting
    
    def get_survey_statistics(self) -> Dict[str, Any]:
        """Get survey statistics"""
        with self.get_session() as db:
            total_surveys = db.query(Survey).count()
            total_facilities = db.query(Facility).count()
            
            # Surveys by month
            surveys_by_month = db.query(
                func.date_trunc('month', Survey.collection_date).label('month'),
                func.count(Survey.id).label('count')
            ).group_by('month').order_by('month').all()
            
            # Facilities by type
            facilities_by_type = db.query(
                Facility.type,
                func.count(Facility.id).label('count')
            ).group_by(Facility.type).all()
            
            return {
                'total_surveys': total_surveys,
                'total_facilities': total_facilities,
                'surveys_by_month': [{'month': str(row.month), 'count': row.count} for row in surveys_by_month],
                'facilities_by_type': [{'type': row.type.value, 'count': row.count} for row in facilities_by_type]
            }
    
    def get_facility_summary(self, facility_id: int) -> Dict[str, Any]:
        """Get comprehensive facility summary"""
        with self.get_session() as db:
            facility = db.query(Facility).filter(Facility.id == facility_id).first()
            if not facility:
                return None
            
            surveys_count = db.query(Survey).filter(Survey.facility_id == facility_id).count()
            latest_survey = db.query(Survey).filter(Survey.facility_id == facility_id)\
                           .order_by(desc(Survey.collection_date)).first()
            
            equipment_count = db.query(Equipment).join(Survey).filter(Survey.facility_id == facility_id).count()
            solar_systems_count = db.query(SolarSystem).filter(SolarSystem.facility_id == facility_id).count()
            
            return {
                'facility': {
                    'id': facility.id,
                    'name': facility.name,
                    'type': facility.type.value,
                    'latitude': facility.latitude,
                    'longitude': facility.longitude,
                    'status': facility.status.value
                },
                'surveys_count': surveys_count,
                'latest_survey_date': latest_survey.collection_date if latest_survey else None,
                'equipment_count': equipment_count,
                'solar_systems_count': solar_systems_count
            }
    
    # Data Quality and Validation
    
    def validate_survey_data(self, survey_id: int) -> Dict[str, Any]:
        """Validate survey data quality"""
        with self.get_session() as db:
            survey = db.query(Survey).filter(Survey.id == survey_id).first()
            if not survey:
                return {'error': 'Survey not found'}
            
            issues = []
            
            # Check if rawData exists
            if not survey.raw_data:
                issues.append('Missing raw survey data')
            
            # Check if facility_data exists
            if not survey.facility_data:
                issues.append('Missing facility data')
            
            # Check if collection_date is set
            if not survey.collection_date:
                issues.append('Missing collection date')
            
            # Check if external_id is set
            if not survey.external_id:
                issues.append('Missing external ID')
            
            return {
                'survey_id': survey_id,
                'is_valid': len(issues) == 0,
                'issues': issues,
                'has_raw_data': bool(survey.raw_data),
                'has_facility_data': bool(survey.facility_data),
                'collection_date': survey.collection_date
            }
    
    def get_surveys_needing_repair(self) -> List[Dict[str, Any]]:
        """Get surveys that need data repair"""
        with self.get_session() as db:
            surveys = db.query(Survey).all()
            needing_repair = []
            
            for survey in surveys:
                validation = self.validate_survey_data(survey.id)
                if not validation['is_valid']:
                    needing_repair.append(validation)
            
            return needing_repair

# Global instance
db_service = DatabaseService()

# Convenience functions for backward compatibility
def get_survey_by_external_id(external_id: str) -> Optional[Survey]:
    return db_service.get_survey_by_external_id(external_id)

def get_surveys_by_facility_id(facility_id: int) -> List[Survey]:
    return db_service.get_surveys_by_facility(facility_id)

def get_latest_survey_for_facility(facility_id: int) -> Optional[Survey]:
    return db_service.get_latest_survey_for_facility(facility_id)

def get_facility_with_surveys(facility_id: int) -> Optional[Facility]:
    return db_service.get_facility_by_id(facility_id)
