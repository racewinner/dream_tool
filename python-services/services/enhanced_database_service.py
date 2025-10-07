#!/usr/bin/env python3
"""
Enhanced Database Service with Proper Enum Handling
Provides comprehensive database operations with proper object lifecycle management
"""

import logging
from typing import Dict, Any, List, Optional, Type, Union
from datetime import datetime, timezone
from contextlib import contextmanager
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from sqlalchemy.orm import Session

from core.database import SessionLocal
from models.database_models import (
    Facility, Survey, Equipment, SolarSystem, 
    FacilityType, FacilityStatus, SolarSystemStatus, EquipmentTimeOfDay
)
from core.enum_types import validate_enum_data, normalize_enum_value, denormalize_enum_value

logger = logging.getLogger(__name__)
class EnhancedDatabaseService:
    """
    Enhanced database service with proper enum handling and object lifecycle management
    """
    
    def __init__(self):
        self.enum_mappings = {
            'facility': {
                'type': FacilityType,
                'status': FacilityStatus
            },
            'equipment': {
                'time_of_day': EquipmentTimeOfDay
            },
            'solar_system': {
                'status': SolarSystemStatus
            }
        }
    
    @contextmanager
    def get_session(self) -> Session:
        """Get database session with proper error handling"""
        session = SessionLocal()
        try:
            yield session
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    def _normalize_data(self, data: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
        """Normalize enum values in data dictionary"""
        if entity_type in self.enum_mappings:
            return validate_enum_data(data, self.enum_mappings[entity_type])
        return data.copy()
    
    def _create_object_with_proper_lifecycle(self, 
                                           model_class: Type,
                                           data: Dict[str, Any],
                                           entity_type: str) -> Any:
        """
        Create database object with proper lifecycle management.
        This is the comprehensive solution to the refresh() problem.
        """
        with self.get_session() as db:
            try:
                # Step 1: Normalize enum data
                normalized_data = self._normalize_data(data, entity_type)
                logger.debug(f"Creating {model_class.__name__} with normalized data: {normalized_data}")
                
                # Step 2: Create object
                obj = model_class(**normalized_data)
                db.add(obj)
                
                # Step 3: Flush to get database-generated values (ID, timestamps)
                db.flush()
                
                # Step 4: Capture essential data while object is still in session
                obj_id = obj.id
                created_at = getattr(obj, 'created_at', None)
                updated_at = getattr(obj, 'updated_at', None)
                
                # Step 5: Commit the transaction
                db.commit()
                
                # Step 6: Create a fresh session and reload the object with relationships
                # This ensures proper enum conversion without the refresh() issues
                with self.get_session() as fresh_db:
                    from sqlalchemy.orm import joinedload
                    
                    # Build query with appropriate eager loading
                    query = fresh_db.query(model_class).filter(model_class.id == obj_id)
                    
                    # Add eager loading for known relationships
                    if hasattr(model_class, 'facility'):
                        query = query.options(joinedload(model_class.facility))
                    if hasattr(model_class, 'surveys'):
                        query = query.options(joinedload(model_class.surveys))
                    
                    fresh_obj = query.first()
                    
                    if fresh_obj:
                        # Force load relationships to avoid lazy loading issues
                        if hasattr(fresh_obj, 'facility') and fresh_obj.facility:
                            # Access facility attributes to ensure it's loaded
                            _ = fresh_obj.facility.name
                        if hasattr(fresh_obj, 'surveys'):
                            # Access surveys to ensure they're loaded
                            _ = len(fresh_obj.surveys)
                        
                        # Detach from session but keep relationships loaded
                        fresh_db.expunge(fresh_obj)
                        if hasattr(fresh_obj, 'facility') and fresh_obj.facility:
                            fresh_db.expunge(fresh_obj.facility)
                        
                        logger.info(f"Successfully created {model_class.__name__} with ID: {obj_id}")
                        return fresh_obj
                    else:
                        raise SQLAlchemyError(f"Failed to reload {model_class.__name__} with ID: {obj_id}")
                        
            except Exception as e:
                logger.error(f"Failed to create {model_class.__name__}: {e}")
                raise
    
    # Facility Operations
    
    def create_facility(self, facility_data: Dict[str, Any]) -> Facility:
        """Create facility with proper enum handling"""
        return self._create_object_with_proper_lifecycle(Facility, facility_data, 'facility')
    
    def get_facility_by_id(self, facility_id: int) -> Optional[Facility]:
        """Get facility by ID with proper enum conversion"""
        with self.get_session() as db:
            return db.query(Facility).filter(Facility.id == facility_id).first()
    
    def get_facility_by_name_and_location(self, name: str, latitude: float, longitude: float, 
                                        tolerance: float = 0.001) -> Optional[Facility]:
        """Get facility by name and approximate location"""
        with self.get_session() as db:
            return db.query(Facility).filter(
                Facility.name == name,
                Facility.latitude.between(latitude - tolerance, latitude + tolerance),
                Facility.longitude.between(longitude - tolerance, longitude + tolerance)
            ).first()
    
    def get_facilities_with_surveys(self) -> List[Facility]:
        """Get all facilities that have surveys"""
        with self.get_session() as db:
            return db.query(Facility).join(Survey).distinct().all()
    
    def update_facility(self, facility_id: int, update_data: Dict[str, Any]) -> Optional[Facility]:
        """Update facility with proper enum handling"""
        with self.get_session() as db:
            facility = db.query(Facility).filter(Facility.id == facility_id).first()
            if facility:
                # Normalize enum data before update
                normalized_data = self._normalize_data(update_data, 'facility')
                
                for key, value in normalized_data.items():
                    setattr(facility, key, value)
                
                facility.updated_at = datetime.now(timezone.utc)
                db.commit()
                
                # Return fresh object to ensure proper enum conversion
                db.expunge(facility)
                return facility
            return None
    
    # Survey Operations
    
    def create_survey(self, survey_data: Dict[str, Any]) -> Survey:
        """Create survey with proper object lifecycle"""
        return self._create_object_with_proper_lifecycle(Survey, survey_data, 'survey')
    
    def get_survey_by_id(self, survey_id: int) -> Optional[Survey]:
        """Get survey by ID with facility relationship loaded"""
        with self.get_session() as db:
            from sqlalchemy.orm import joinedload
            survey = db.query(Survey).options(joinedload(Survey.facility)).filter(Survey.id == survey_id).first()
            if survey:
                # Detach from session but keep relationships loaded
                db.expunge(survey)
                if survey.facility:
                    db.expunge(survey.facility)
            return survey
    
    def get_survey_by_external_id(self, external_id: str) -> Optional[Survey]:
        """Get survey by external ID with facility relationship loaded"""
        with self.get_session() as db:
            from sqlalchemy.orm import joinedload
            survey = db.query(Survey).options(joinedload(Survey.facility)).filter(Survey.external_id == external_id).first()
            if survey:
                # Detach from session but keep relationships loaded
                db.expunge(survey)
                if survey.facility:
                    db.expunge(survey.facility)
            return survey
    
    def get_surveys_by_facility(self, facility_id: int) -> List[Survey]:
        """Get all surveys for a facility"""
        with self.get_session() as db:
            return db.query(Survey).filter(Survey.facility_id == facility_id).all()
    
    def get_latest_survey_for_facility(self, facility_id: int) -> Optional[Survey]:
        """Get the most recent survey for a facility"""
        with self.get_session() as db:
            return db.query(Survey).filter(Survey.facility_id == facility_id)\
                    .order_by(Survey.collection_date.desc()).first()
    
    # Equipment Operations
    
    def create_equipment(self, equipment_data: Dict[str, Any]) -> Equipment:
        """Create equipment record"""
        return self._create_object_with_proper_lifecycle(Equipment, equipment_data, 'equipment')
    
    def bulk_create_equipment(self, equipment_list: List[Dict[str, Any]]) -> List[Equipment]:
        """Create multiple equipment records using individual object lifecycle management"""
        created_equipment = []
        
        # Use individual creation to ensure proper enum handling
        for eq_data in equipment_list:
            try:
                equipment = self._create_object_with_proper_lifecycle(Equipment, eq_data, 'equipment')
                created_equipment.append(equipment)
            except Exception as e:
                logger.error(f"Failed to create equipment: {e}")
                # Continue with other equipment instead of failing completely
                continue
        
        logger.info(f"Successfully created {len(created_equipment)} equipment records")
        return created_equipment
    
    def get_equipment_by_survey(self, survey_id: int) -> List[Equipment]:
        """Get all equipment from a survey"""
        with self.get_session() as db:
            return db.query(Equipment).filter(Equipment.survey_id == survey_id).all()
    
    # Solar System Operations
    
    def create_solar_system(self, system_data: Dict[str, Any]) -> SolarSystem:
        """Create solar system with proper enum handling"""
        return self._create_object_with_proper_lifecycle(SolarSystem, system_data, 'solar_system')
    
    def get_solar_systems_by_facility(self, facility_id: int) -> List[SolarSystem]:
        """Get all solar systems for a facility"""
        with self.get_session() as db:
            return db.query(SolarSystem).filter(SolarSystem.facility_id == facility_id).all()
    
    # Analytics and Reporting
    
    def get_survey_statistics(self) -> Dict[str, Any]:
        """Get comprehensive survey statistics"""
        with self.get_session() as db:
            try:
                # Use raw SQL to avoid enum conversion issues in aggregations
                result = db.execute(text("""
                    SELECT 
                        COUNT(DISTINCT s.id) as total_surveys,
                        COUNT(DISTINCT f.id) as total_facilities,
                        COUNT(DISTINCT e.id) as total_equipment,
                        COUNT(DISTINCT CASE WHEN s."createdAt" >= NOW() - INTERVAL '30 days' THEN s.id END) as recent_surveys,
                        COUNT(DISTINCT CASE WHEN f.type = 'healthcare' THEN f.id END) as healthcare_facilities,
                        COUNT(DISTINCT CASE WHEN f.type = 'education' THEN f.id END) as education_facilities
                    FROM surveys s
                    LEFT JOIN facilities f ON s."facilityId" = f.id
                    LEFT JOIN equipment e ON e."surveyId" = s.id
                """)).fetchone()
                
                if result:
                    return {
                        'total_surveys': result[0] or 0,
                        'total_facilities': result[1] or 0,
                        'total_equipment': result[2] or 0,
                        'recent_surveys_30_days': result[3] or 0,
                        'healthcare_facilities': result[4] or 0,
                        'education_facilities': result[5] or 0,
                        'last_updated': datetime.now(timezone.utc).isoformat()
                    }
                else:
                    return self._empty_statistics()
                    
            except Exception as e:
                logger.error(f"Failed to get survey statistics: {e}")
                return self._empty_statistics()
    
    def _empty_statistics(self) -> Dict[str, Any]:
        """Return empty statistics structure"""
        return {
            'total_surveys': 0,
            'total_facilities': 0,
            'total_equipment': 0,
            'recent_surveys_30_days': 0,
            'healthcare_facilities': 0,
            'education_facilities': 0,
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
    
    # Health Check Operations
    
    def health_check(self) -> Dict[str, Any]:
        """Comprehensive database health check"""
        try:
            with self.get_session() as db:
                # Test basic connectivity
                db.execute(text("SELECT 1"))
                
                # Test enum handling
                facility_count = db.query(Facility).count()
                
                return {
                    'status': 'healthy',
                    'database_connected': True,
                    'enum_handling': 'operational',
                    'facility_count': facility_count,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                'status': 'unhealthy',
                'database_connected': False,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    # Data Validation and Cleanup
    
    def validate_enum_consistency(self) -> Dict[str, Any]:
        """Validate that all enum values in database are consistent with Python enums"""
        issues = []
        
        try:
            with self.get_session() as db:
                # Check facility types
                result = db.execute(text("""
                    SELECT DISTINCT type, COUNT(*) 
                    FROM facilities 
                    WHERE type IS NOT NULL 
                    GROUP BY type
                """)).fetchall()
                
                valid_facility_types = {e.value for e in FacilityType}
                for type_value, count in result:
                    if type_value not in valid_facility_types:
                        issues.append({
                            'table': 'facilities',
                            'column': 'type',
                            'invalid_value': type_value,
                            'count': count,
                            'valid_values': list(valid_facility_types)
                        })
                
                # Check facility status
                result = db.execute(text("""
                    SELECT DISTINCT status, COUNT(*) 
                    FROM facilities 
                    WHERE status IS NOT NULL 
                    GROUP BY status
                """)).fetchall()
                
                valid_facility_status = {e.value for e in FacilityStatus}
                for status_value, count in result:
                    if status_value not in valid_facility_status:
                        issues.append({
                            'table': 'facilities',
                            'column': 'status',
                            'invalid_value': status_value,
                            'count': count,
                            'valid_values': list(valid_facility_status)
                        })
                
                return {
                    'status': 'completed',
                    'issues_found': len(issues),
                    'issues': issues,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            logger.error(f"Enum validation failed: {e}")
            return {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }

# Global instance
enhanced_db_service = EnhancedDatabaseService()
