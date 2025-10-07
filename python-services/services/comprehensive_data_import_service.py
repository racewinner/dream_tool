#!/usr/bin/env python3
"""
Comprehensive Data Import Service
Integrates the enhanced enum handling with survey data import from KoboToolbox
This replaces the problematic TypeScript import system with a robust Python solution
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import json

from services.enhanced_database_service import enhanced_db_service
from models.database_models import (
    Facility, Survey, Equipment, 
    FacilityType, FacilityStatus, EquipmentTimeOfDay
)
from core.enum_types import validate_enum_data, normalize_enum_value

logger = logging.getLogger(__name__)

class ComprehensiveDataImportService:
    """
    Comprehensive data import service that solves the original refresh() problem
    by using proper enum handling and object lifecycle management
    """
    
    def __init__(self):
        self.facility_enum_mappings = {
            'type': FacilityType,
            'status': FacilityStatus
        }
        
        # KoboToolbox field mappings
        self.kobo_facility_mappings = {
            'facility_name': 'name',
            'facility_type': 'type',
            '_geolocation': ['latitude', 'longitude'],
            'region': 'region',
            'district': 'district'
        }
    
    def import_survey_from_kobo_data(self, kobo_data: Dict[str, Any]) -> Tuple[Optional[Survey], List[str]]:
        """
        Import survey data from KoboToolbox with proper enum handling.
        This is the comprehensive solution to the original data import problems.
        
        Returns:
            Tuple of (Survey object or None, list of error messages)
        """
        errors = []
        
        try:
            # Step 1: Extract and validate facility data
            facility_data = self._extract_facility_data(kobo_data)
            if not facility_data:
                errors.append("Failed to extract facility data from KoboToolbox response")
                return None, errors
            
            # Step 2: Create or get facility with proper enum handling
            facility = self._create_or_get_facility(facility_data)
            if not facility:
                errors.append("Failed to create or retrieve facility")
                return None, errors
            
            # Step 3: Extract survey data
            survey_data = self._extract_survey_data(kobo_data, facility.id)
            if not survey_data:
                errors.append("Failed to extract survey data")
                return None, errors
            
            # Step 4: Create survey with proper object lifecycle
            try:
                survey = enhanced_db_service.create_survey(survey_data)
                if not survey:
                    errors.append("Failed to create survey")
                    return None, errors
            except Exception as e:
                if "duplicate key value violates unique constraint" in str(e):
                    # Survey already exists, try to get existing one
                    existing_survey = enhanced_db_service.get_survey_by_external_id(survey_data['external_id'])
                    if existing_survey:
                        logger.info(f"Using existing survey with external_id: {survey_data['external_id']}")
                        survey = existing_survey
                    else:
                        errors.append(f"Survey with external_id {survey_data['external_id']} already exists but could not be retrieved")
                        return None, errors
                else:
                    errors.append(f"Failed to create survey: {str(e)}")
                    return None, errors
            
            # Step 4.5: Reload survey with facility relationship
            survey_with_facility = enhanced_db_service.get_survey_by_id(survey.id)
            if survey_with_facility:
                survey = survey_with_facility
            
            # Step 5: Extract and create equipment data
            equipment_list = self._extract_equipment_data(kobo_data, survey.id)
            if equipment_list:
                created_equipment = enhanced_db_service.bulk_create_equipment(equipment_list)
                logger.info(f"Created {len(created_equipment)} equipment records for survey {survey.id}")
            
            logger.info(f"Successfully imported survey {survey.id} for facility {facility.name}")
            return survey, errors
            
        except Exception as e:
            error_msg = f"Survey import failed: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
            return None, errors
    
    def _extract_facility_data(self, kobo_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract facility data from KoboToolbox response with proper field mapping"""
        try:
            facility_data = {}
            
            # Extract basic facility information
            if 'facility_name' in kobo_data:
                facility_data['name'] = kobo_data['facility_name']
            elif 'name' in kobo_data:
                facility_data['name'] = kobo_data['name']
            else:
                logger.warning("No facility name found in KoboToolbox data")
                return None
            
            # Extract facility type with enum handling
            facility_type_raw = kobo_data.get('facility_type', kobo_data.get('type'))
            if facility_type_raw:
                try:
                    # Normalize facility type to match our enum values
                    facility_type_normalized = self._normalize_facility_type(facility_type_raw)
                    facility_data['type'] = facility_type_normalized
                except ValueError as e:
                    logger.warning(f"Invalid facility type '{facility_type_raw}': {e}")
                    facility_data['type'] = FacilityType.OTHER  # Default fallback
            else:
                facility_data['type'] = FacilityType.OTHER
            
            # Extract GPS coordinates
            coordinates = self._extract_gps_coordinates(kobo_data)
            if coordinates:
                facility_data['latitude'] = coordinates['latitude']
                facility_data['longitude'] = coordinates['longitude']
            else:
                logger.warning("No GPS coordinates found, using default location")
                facility_data['latitude'] = 0.0
                facility_data['longitude'] = 0.0
            
            # Set default status
            facility_data['status'] = FacilityStatus.SURVEY
            
            # Validate enum data
            validated_data = validate_enum_data(facility_data, self.facility_enum_mappings)
            
            logger.debug(f"Extracted facility data: {validated_data}")
            return validated_data
            
        except Exception as e:
            logger.error(f"Failed to extract facility data: {e}")
            return None
    
    def _normalize_facility_type(self, facility_type_raw: str) -> str:
        """Normalize facility type string to match enum values"""
        # Common mappings from KoboToolbox to our enum values
        type_mappings = {
            'health': 'healthcare',
            'health_center': 'healthcare',
            'hospital': 'healthcare',
            'clinic': 'healthcare',
            'medical': 'healthcare',
            'school': 'education',
            'university': 'education',
            'college': 'education',
            'learning': 'education',
            'farm': 'agriculture',
            'farming': 'agriculture',
            'agricultural': 'agriculture',
            'transport': 'mobility',
            'transportation': 'mobility',
            'vehicle': 'mobility',
            'computer': 'ict',
            'technology': 'ict',
            'internet': 'ict',
            'communication': 'ict',
            'government': 'public_institutions',
            'public': 'public_institutions',
            'office': 'public_institutions',
            'business': 'small_scale_businesses',
            'shop': 'small_scale_businesses',
            'store': 'small_scale_businesses',
            'market': 'small_scale_businesses'
        }
        
        # Normalize to lowercase and check mappings
        normalized = facility_type_raw.lower().strip()
        
        # Direct match with enum values
        valid_types = {e.value for e in FacilityType}
        if normalized in valid_types:
            return normalized
        
        # Check mappings
        for key, value in type_mappings.items():
            if key in normalized:
                return value
        
        # Default fallback
        logger.warning(f"Unknown facility type '{facility_type_raw}', using 'other'")
        return FacilityType.OTHER.value
    
    def _extract_gps_coordinates(self, kobo_data: Dict[str, Any]) -> Optional[Dict[str, float]]:
        """Extract GPS coordinates from various KoboToolbox formats"""
        try:
            # Try _geolocation field (most common)
            if '_geolocation' in kobo_data:
                geolocation = kobo_data['_geolocation']
                
                # Handle array format [latitude, longitude]
                if isinstance(geolocation, list) and len(geolocation) >= 2:
                    return {
                        'latitude': float(geolocation[0]),
                        'longitude': float(geolocation[1])
                    }
                
                # Handle string format "latitude longitude"
                if isinstance(geolocation, str):
                    parts = geolocation.split()
                    if len(parts) >= 2:
                        return {
                            'latitude': float(parts[0]),
                            'longitude': float(parts[1])
                        }
            
            # Try separate latitude/longitude fields
            if 'latitude' in kobo_data and 'longitude' in kobo_data:
                return {
                    'latitude': float(kobo_data['latitude']),
                    'longitude': float(kobo_data['longitude'])
                }
            
            # Try GPS field
            if 'gps' in kobo_data:
                gps = kobo_data['gps']
                if isinstance(gps, str):
                    parts = gps.split()
                    if len(parts) >= 2:
                        return {
                            'latitude': float(parts[0]),
                            'longitude': float(parts[1])
                        }
            
            logger.warning("No valid GPS coordinates found in KoboToolbox data")
            return None
            
        except (ValueError, TypeError) as e:
            logger.error(f"Failed to parse GPS coordinates: {e}")
            return None
    
    def _create_or_get_facility(self, facility_data: Dict[str, Any]) -> Optional[Facility]:
        """Create new facility or get existing one"""
        try:
            # Check if facility already exists by name and location
            existing_facility = enhanced_db_service.get_facility_by_name_and_location(
                facility_data['name'],
                facility_data['latitude'],
                facility_data['longitude']
            )
            
            if existing_facility:
                logger.info(f"Using existing facility: {existing_facility.name} (ID: {existing_facility.id})")
                return existing_facility
            
            # Create new facility with proper enum handling
            facility = enhanced_db_service.create_facility(facility_data)
            logger.info(f"Created new facility: {facility.name} (ID: {facility.id})")
            return facility
            
        except Exception as e:
            logger.error(f"Failed to create or get facility: {e}")
            return None
    
    def _extract_survey_data(self, kobo_data: Dict[str, Any], facility_id: int) -> Optional[Dict[str, Any]]:
        """Extract survey data from KoboToolbox response"""
        try:
            survey_data = {
                'facility_id': facility_id,
                'external_id': kobo_data.get('_id', kobo_data.get('id')),
                'collection_date': self._parse_collection_date(kobo_data),
                'facility_data': self._extract_facility_json_data(kobo_data),
                'raw_data': kobo_data  # Store complete raw data for analysis
            }
            
            return survey_data
            
        except Exception as e:
            logger.error(f"Failed to extract survey data: {e}")
            return None
    
    def _parse_collection_date(self, kobo_data: Dict[str, Any]) -> datetime:
        """Parse collection date from KoboToolbox data"""
        try:
            # Try various date fields
            date_fields = ['_submission_time', 'submission_time', 'date', 'collection_date']
            
            for field in date_fields:
                if field in kobo_data:
                    date_str = kobo_data[field]
                    if isinstance(date_str, str):
                        # Parse ISO format date
                        try:
                            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        except ValueError:
                            continue
            
            # Default to current time
            return datetime.now(timezone.utc)
            
        except Exception as e:
            logger.warning(f"Failed to parse collection date: {e}")
            return datetime.now(timezone.utc)
    
    def _extract_facility_json_data(self, kobo_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract facility-specific data for JSON storage"""
        facility_json = {}
        
        # Extract key facility information
        facility_fields = [
            'facility_name', 'name', 'region', 'district', 'ward',
            'facility_type', 'type', 'population_served', 'staff_count',
            'operating_hours', 'services_offered'
        ]
        
        for field in facility_fields:
            if field in kobo_data:
                facility_json[field] = kobo_data[field]
        
        return facility_json
    
    def _extract_equipment_data(self, kobo_data: Dict[str, Any], survey_id: int) -> List[Dict[str, Any]]:
        """Extract equipment data from KoboToolbox repeat groups"""
        equipment_list = []
        
        try:
            # Look for equipment repeat groups
            equipment_groups = [
                'equipment', 'medical_equipment', 'devices', 'appliances'
            ]
            
            for group_name in equipment_groups:
                if group_name in kobo_data:
                    equipment_data = kobo_data[group_name]
                    
                    # Handle both single items and arrays
                    if isinstance(equipment_data, list):
                        for item in equipment_data:
                            equipment = self._process_equipment_item(item, survey_id)
                            if equipment:
                                equipment_list.append(equipment)
                    elif isinstance(equipment_data, dict):
                        equipment = self._process_equipment_item(equipment_data, survey_id)
                        if equipment:
                            equipment_list.append(equipment)
            
            logger.debug(f"Extracted {len(equipment_list)} equipment items")
            return equipment_list
            
        except Exception as e:
            logger.error(f"Failed to extract equipment data: {e}")
            return []
    
    def _process_equipment_item(self, item: Dict[str, Any], survey_id: int) -> Optional[Dict[str, Any]]:
        """Process individual equipment item to match actual Equipment model"""
        try:
            # Parse usage hours for day/night distribution
            total_usage = self._parse_usage_hours(item.get('usage_hours', item.get('hours'))) or 12.0
            
            # Default to daytime usage unless specified
            hours_per_day = total_usage
            hours_per_night = 0.0
            
            # Check if it's 24/7 equipment
            if total_usage >= 20:
                hours_per_day = 12.0
                hours_per_night = 12.0
            
            equipment = {
                'survey_id': survey_id,
                'name': item.get('equipment_name', item.get('name', 'Unknown Equipment')),
                'power_rating': self._parse_power_rating(item.get('power_rating', item.get('power'))) or 0.0,
                'quantity': int(item.get('quantity', 1)),
                'hours_per_day': hours_per_day,
                'hours_per_night': hours_per_night,
                'time_of_day': EquipmentTimeOfDay.MORNING,  # Default time of day
                'weekly_usage': 7,  # Default to daily usage
                'category': item.get('equipment_type', item.get('category', 'other')),  # Fixed: use 'category' not 'type'
                'critical': self._parse_boolean(item.get('is_critical', item.get('critical', False)))
            }
            
            return equipment
            
        except Exception as e:
            logger.error(f"Failed to process equipment item: {e}")
            return None
    
    def _parse_power_rating(self, power_str: Any) -> Optional[float]:
        """Parse power rating from various formats"""
        try:
            if power_str is None:
                return None
            
            if isinstance(power_str, (int, float)):
                return float(power_str)
            
            if isinstance(power_str, str):
                # Remove units and parse number
                power_clean = power_str.lower().replace('w', '').replace('watts', '').strip()
                return float(power_clean)
            
            return None
            
        except (ValueError, TypeError):
            return None
    
    def _parse_usage_hours(self, hours_str: Any) -> Optional[float]:
        """Parse usage hours from various formats"""
        try:
            if hours_str is None:
                return None
            
            if isinstance(hours_str, (int, float)):
                return float(hours_str)
            
            if isinstance(hours_str, str):
                # Remove units and parse number
                hours_clean = hours_str.lower().replace('hours', '').replace('h', '').strip()
                return float(hours_clean)
            
            return None
            
        except (ValueError, TypeError):
            return None
    
    def _parse_boolean(self, value: Any) -> bool:
        """Parse boolean from various formats"""
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            return value.lower() in ['true', 'yes', '1', 'on', 'critical']
        
        if isinstance(value, (int, float)):
            return bool(value)
        
        return False
    
    def bulk_import_surveys(self, kobo_data_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Import multiple surveys with comprehensive error handling"""
        results = {
            'successful_imports': 0,
            'failed_imports': 0,
            'surveys': [],
            'errors': []
        }
        
        for i, kobo_data in enumerate(kobo_data_list):
            try:
                survey, errors = self.import_survey_from_kobo_data(kobo_data)
                
                if survey:
                    results['successful_imports'] += 1
                    results['surveys'].append({
                        'survey_id': survey.id,
                        'facility_name': survey.facility.name if survey.facility else 'Unknown',
                        'collection_date': survey.collection_date.isoformat()
                    })
                else:
                    results['failed_imports'] += 1
                    results['errors'].extend([f"Survey {i+1}: {error}" for error in errors])
                
            except Exception as e:
                results['failed_imports'] += 1
                results['errors'].append(f"Survey {i+1}: Unexpected error - {str(e)}")
        
        logger.info(f"Bulk import completed: {results['successful_imports']} successful, {results['failed_imports']} failed")
        return results

# Global instance
comprehensive_import_service = ComprehensiveDataImportService()
