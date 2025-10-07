"""
Enhanced Data Import Service with Database Integration
Uses SQLAlchemy models for data persistence
"""

import logging
import json
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass

from services.database_service import db_service
from models.database_models import Survey, Facility, Equipment
from services.data_transformation import DataTransformer
from services.data_validation import DataValidator

logger = logging.getLogger(__name__)

@dataclass
class ImportResult:
    success: bool
    survey_id: Optional[int] = None
    external_id: Optional[str] = None
    facility_id: Optional[int] = None
    quality_score: float = 0.0
    error: Optional[str] = None

class EnhancedDataImportService:
    """Enhanced data import service with full database integration"""
    
    def __init__(self):
        self.transformer = DataTransformer()
        self.validator = DataValidator()
    
    async def import_kobo_survey(self, raw_data: Dict[str, Any]) -> ImportResult:
        """Import a single KoboToolbox survey with full database persistence"""
        try:
            # Transform raw KoboToolbox data
            transformed = self._transform_kobo_data(raw_data)
            
            # Validate data quality
            try:
                # Convert facility data to DataFrame for validation
                df = pd.DataFrame([transformed['facility_data']])
                validation_results = await self.validator.validate_dataframe(df)
                
                # Calculate quality score based on validation results
                error_count = sum(1 for r in validation_results if r.severity == 'error')
                warning_count = sum(1 for r in validation_results if r.severity == 'warning')
                
                # Simple quality scoring: start at 100, subtract points for issues
                quality_score = 100.0
                quality_score -= error_count * 20  # 20 points per error
                quality_score -= warning_count * 5  # 5 points per warning
                quality_score = max(0.0, quality_score)  # Don't go below 0
                
            except Exception as e:
                logger.warning(f"Validation failed: {e}")
                quality_score = 50.0  # Default score if validation fails
            
            # Create or get facility
            facility = await self._create_or_get_facility(transformed['facility_data'])
            
            # Create survey record
            survey_data = {
                'external_id': transformed['external_id'],
                'facility_id': facility.id,
                'facility_data': transformed['facility_data'],
                'raw_data': raw_data,
                'collection_date': transformed['collection_date'],
                'respondent_id': transformed.get('respondent_id')
            }
            
            survey = db_service.create_survey(survey_data)
            logger.info(f"Created survey {survey.id} for facility {facility.id}")
            
            # Import equipment data
            if 'equipment' in transformed['facility_data']:
                equipment_count = await self._import_equipment_data(
                    survey.id, 
                    transformed['facility_data']['equipment']
                )
                logger.info(f"Imported {equipment_count} equipment records for survey {survey.id}")
            
            return ImportResult(
                success=True,
                survey_id=survey.id,
                external_id=survey.external_id,
                facility_id=facility.id,
                quality_score=quality_score
            )
            
        except Exception as e:
            logger.error(f"Failed to import KoboToolbox survey: {str(e)}")
            return ImportResult(
                success=False,
                error=str(e)
            )
    
    async def import_batch_surveys(self, surveys: List[Dict[str, Any]], source: str = "kobo") -> Dict[str, Any]:
        """Import multiple surveys in batch"""
        results = []
        imported_count = 0
        failed_count = 0
        
        for survey_data in surveys:
            if source == "kobo":
                result = await self.import_kobo_survey(survey_data)
            else:
                result = await self.import_generic_survey(survey_data)
            
            results.append(result)
            if result.success:
                imported_count += 1
            else:
                failed_count += 1
        
        # Calculate statistics
        quality_scores = [r.quality_score for r in results if r.success]
        avg_quality = np.mean(quality_scores) if quality_scores else 0.0
        
        return {
            'success': True,
            'imported': imported_count,
            'failed': failed_count,
            'avg_quality_score': avg_quality,
            'results': results
        }
    
    async def import_generic_survey(self, raw_data: Dict[str, Any]) -> ImportResult:
        """Import generic survey data"""
        try:
            # Transform generic data
            transformed = self._transform_generic_data(raw_data)
            
            # Validate data
            try:
                df = pd.DataFrame([transformed['facility_data']])
                validation_results = await self.validator.validate_dataframe(df)
                
                error_count = sum(1 for r in validation_results if r.severity == 'error')
                warning_count = sum(1 for r in validation_results if r.severity == 'warning')
                
                quality_score = 100.0 - (error_count * 20) - (warning_count * 5)
                quality_score = max(0.0, quality_score)
                
            except Exception as e:
                logger.warning(f"Validation failed: {e}")
                quality_score = 50.0
            
            # Create or get facility
            facility = await self._create_or_get_facility(transformed['facility_data'])
            
            # Create survey
            survey_data = {
                'external_id': transformed['external_id'],
                'facility_id': facility.id,
                'facility_data': transformed['facility_data'],
                'raw_data': raw_data,
                'collection_date': transformed['collection_date'],
                'respondent_id': transformed.get('respondent_id')
            }
            
            survey = db_service.create_survey(survey_data)
            
            return ImportResult(
                success=True,
                survey_id=survey.id,
                external_id=survey.external_id,
                facility_id=facility.id,
                quality_score=quality_score
            )
            
        except Exception as e:
            logger.error(f"Failed to import generic survey: {str(e)}")
            return ImportResult(
                success=False,
                error=str(e)
            )
    
    def _transform_kobo_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform KoboToolbox data to internal format"""
        # Generate external ID
        external_id = str(raw_data.get('_id', f"kobo_{int(datetime.now().timestamp())}"))
        
        # Extract collection date
        collection_date = self._parse_collection_date(raw_data)
        
        # Transform facility data using existing transformer
        facility_data = self.transformer.extract_facility_data(raw_data)
        
        # Ensure facility name is extracted correctly
        if not facility_data.get('facility_name') and raw_data.get('facility_name'):
            facility_data['facility_name'] = raw_data['facility_name']
        
        # Extract GPS coordinates
        gps_coords = self._extract_gps_coordinates(raw_data)
        if gps_coords:
            facility_data['latitude'] = gps_coords.get('latitude')
            facility_data['longitude'] = gps_coords.get('longitude')
        
        return {
            'external_id': external_id,
            'facility_data': facility_data,
            'collection_date': collection_date,
            'respondent_id': raw_data.get('_submitted_by', 'unknown')
        }
    
    def _transform_generic_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform generic survey data"""
        external_id = str(raw_data.get('id', f"survey_{int(datetime.now().timestamp())}"))
        
        # Basic facility data extraction
        facility_data = {
            'facility_name': raw_data.get('facility_name', 'Unknown Facility'),
            'facility_type': raw_data.get('facility_type', 'unknown'),
            'region': raw_data.get('region'),
            'district': raw_data.get('district'),
            'latitude': raw_data.get('latitude'),
            'longitude': raw_data.get('longitude')
        }
        
        # Extract equipment if available
        if 'equipment' in raw_data:
            facility_data['equipment'] = raw_data['equipment']
        
        return {
            'external_id': external_id,
            'facility_data': facility_data,
            'collection_date': datetime.now(timezone.utc),
            'respondent_id': raw_data.get('respondent_id', 'unknown')
        }
    
    async def _create_or_get_facility(self, facility_data: Dict[str, Any]) -> Facility:
        """Create or retrieve existing facility"""
        facility_name = facility_data.get('facility_name', 'Unknown Facility')
        
        # Try to find existing facility by name and location using raw SQL to avoid enum issues
        with db_service.get_session() as db:
            from sqlalchemy import text
            result = db.execute(text("""
                SELECT id, name, type, latitude, longitude, status 
                FROM facilities 
                WHERE name = :facility_name 
                LIMIT 1
            """), {"facility_name": facility_name})
            
            existing_row = result.fetchone()
            if existing_row:
                logger.info(f"Found existing facility: {existing_row[0]}")
                # Create a simple facility object with the data we need
                existing_facility = type('Facility', (), {
                    'id': existing_row[0],
                    'name': existing_row[1],
                    'type': existing_row[2],
                    'latitude': existing_row[3],
                    'longitude': existing_row[4],
                    'status': existing_row[5]
                })()
                return existing_facility
        
        # Map facility types to valid enum values (Complete DREAM Tool taxonomy)
        facility_type_raw = facility_data.get('facility_type', 'other')
        facility_type_mapping = {
            # Agriculture facilities
            'solar_powered_irrigation': 'agriculture',
            'cold_storage': 'agriculture',
            'agri_processing': 'agriculture',
            'aquaculture': 'agriculture',
            'agriculture_other': 'agriculture',
            
            # Mobility facilities
            'electric_mobility': 'mobility',
            'mobility_other': 'mobility',
            
            # Healthcare facilities (current KoboToolbox data)
            'health_post': 'healthcare',
            'dispensary': 'healthcare',
            'health_center': 'healthcare',
            'district_hospital': 'healthcare',
            'regional_hospital': 'healthcare',
            'pharmacy': 'healthcare',
            'drug_store': 'healthcare',
            'healthcare_other': 'healthcare',
            # Legacy mappings for current sample data
            'health_clinic': 'healthcare',
            'hospital': 'healthcare',
            'medical_clinic': 'healthcare',
            'maternity_ward': 'healthcare',
            'clinic': 'healthcare',
            
            # Education facilities
            'primary_school': 'education',
            'secondary_school': 'education',
            'education_other': 'education',
            # Legacy mappings
            'school': 'education',
            'university': 'education',
            'college': 'education',
            
            # ICT facilities
            'datacenter': 'ict',
            'ict_other': 'ict',
            
            # Public institutions
            'mosque': 'public_institutions',
            'church': 'public_institutions',
            'temple': 'public_institutions',
            'community_center': 'public_institutions',
            'office_building': 'public_institutions',
            'public_institution_other': 'public_institutions',
            
            # Small-scale businesses
            'sundry_shop': 'small_scale_businesses',
            'carpentry_shop': 'small_scale_businesses',
            'metal_welding': 'small_scale_businesses',
            'cafe': 'small_scale_businesses',
            'restaurant': 'small_scale_businesses',
            'entertainment_center': 'small_scale_businesses',
            'furniture_shop': 'small_scale_businesses',
            'motor_vehicle_workshop': 'small_scale_businesses',
            'bicycle_repair_workshop': 'small_scale_businesses',
            'hair_salon': 'small_scale_businesses',
            'popcorn_maker': 'small_scale_businesses',
            'milk_chilling': 'small_scale_businesses',
            'icemaking': 'small_scale_businesses',
            'small_scale_business_other': 'small_scale_businesses',
            
            # Other
            'other': 'other'
        }
        
        # Map to valid enum value and use enum objects directly
        facility_type_str = facility_type_mapping.get(facility_type_raw, 'healthcare')
        
        # Import enum classes
        from models.database_models import FacilityType, FacilityStatus
        
        # Map string to enum object
        facility_type_enum_mapping = {
            'agriculture': FacilityType.AGRICULTURE,
            'mobility': FacilityType.MOBILITY,
            'healthcare': FacilityType.HEALTHCARE,
            'education': FacilityType.EDUCATION,
            'ict': FacilityType.ICT,
            'public_institutions': FacilityType.PUBLIC_INSTITUTIONS,
            'small_scale_businesses': FacilityType.SMALL_SCALE_BUSINESSES,
            'other': FacilityType.OTHER
        }
        
        facility_type_enum = facility_type_enum_mapping.get(facility_type_str, FacilityType.HEALTHCARE)
        
        # Create new facility - use enum values (strings) not enum objects
        new_facility_data = {
            'name': facility_name,
            'type': facility_type_enum.value,  # Use .value to get the string
            'latitude': float(facility_data.get('latitude', 0.0)),
            'longitude': float(facility_data.get('longitude', 0.0)),
            'status': FacilityStatus.SURVEY.value  # Use .value to get the string
        }
        
        facility = db_service.create_facility(new_facility_data)
        logger.info(f"Created new facility: {facility.id}")
        return facility
    
    async def _import_equipment_data(self, survey_id: int, equipment_list: List[Dict[str, Any]]) -> int:
        """Import equipment data for a survey"""
        equipment_records = []
        
        for eq_data in equipment_list:
            equipment_record = {
                'survey_id': survey_id,
                'name': eq_data.get('name', 'Unknown Equipment'),
                'power_rating': float(eq_data.get('power_rating', 0)),
                'quantity': int(eq_data.get('quantity', 1)),
                'hours_per_day': float(eq_data.get('hours_per_day', 0)),
                'hours_per_night': float(eq_data.get('hours_per_night', 0)),
                'category': eq_data.get('category', 'general'),
                'critical': eq_data.get('critical', False)
            }
            equipment_records.append(equipment_record)
        
        if equipment_records:
            created_equipment = db_service.bulk_create_equipment(equipment_records)
            return len(created_equipment)
        
        return 0
    
    def _extract_gps_coordinates(self, raw_data: Dict[str, Any]) -> Optional[Dict[str, float]]:
        """Extract GPS coordinates from various KoboToolbox formats"""
        try:
            # Try _geolocation field (common in KoboToolbox)
            if '_geolocation' in raw_data:
                geolocation = raw_data['_geolocation']
                
                # Handle list/tuple format [lat, lon]
                if isinstance(geolocation, (list, tuple)) and len(geolocation) >= 2:
                    return {
                        'latitude': float(geolocation[0]),
                        'longitude': float(geolocation[1])
                    }
                
                # Handle dict format
                elif isinstance(geolocation, dict):
                    lat = geolocation.get('latitude') or geolocation.get('lat')
                    lon = geolocation.get('longitude') or geolocation.get('lon')
                    if lat is not None and lon is not None:
                        return {
                            'latitude': float(lat),
                            'longitude': float(lon)
                        }
            
            # Try separate latitude/longitude fields
            if 'latitude' in raw_data and 'longitude' in raw_data:
                return {
                    'latitude': float(raw_data['latitude']),
                    'longitude': float(raw_data['longitude'])
                }
            
            # Try GPS field
            if 'gps' in raw_data:
                gps = raw_data['gps']
                if isinstance(gps, (list, tuple)) and len(gps) >= 2:
                    return {
                        'latitude': float(gps[0]),
                        'longitude': float(gps[1])
                    }
            
            return None
            
        except Exception as e:
            logger.warning(f"Failed to extract GPS coordinates: {e}")
            return None
    
    def _parse_collection_date(self, raw_data: Dict[str, Any]) -> datetime:
        """Parse collection date from various formats"""
        # Try different date fields
        date_fields = ['_submission_time', 'collection_date', 'date', '_submitted_at']
        
        for field in date_fields:
            if field in raw_data:
                try:
                    date_str = raw_data[field]
                    if isinstance(date_str, str):
                        # Parse ISO format
                        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    elif isinstance(date_str, datetime):
                        return date_str
                except Exception as e:
                    logger.warning(f"Failed to parse date from {field}: {e}")
                    continue
        
        # Default to current time
        return datetime.now(timezone.utc)
    
    async def get_import_statistics(self) -> Dict[str, Any]:
        """Get import statistics"""
        stats = db_service.get_survey_statistics()
        
        # Add additional statistics using raw SQL to avoid enum issues
        with db_service.get_session() as db:
            from sqlalchemy import text
            result = db.execute(text("""
                SELECT COUNT(*) FROM surveys 
                WHERE "createdAt" >= NOW() - INTERVAL '7 days'
            """))
            recent_imports = result.scalar() or 0
            
            stats['recent_imports_7_days'] = recent_imports
        
        return stats

# Global instance
enhanced_import_service = EnhancedDataImportService()

# Convenience functions
async def import_kobo_survey(raw_data: Dict[str, Any]) -> ImportResult:
    """Import a single KoboToolbox survey"""
    return await enhanced_import_service.import_kobo_survey(raw_data)

async def import_batch_surveys(surveys: List[Dict[str, Any]], source: str = "kobo") -> Dict[str, Any]:
    """Import multiple surveys"""
    return await enhanced_import_service.import_batch_surveys(surveys, source)
