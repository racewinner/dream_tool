"""
Data Transformation Module - Python Implementation
Comprehensive data transformation and cleaning utilities
Replaces TypeScript transformation logic with enhanced Python capabilities
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime
import logging
import re

from .department_equipment_validator import department_equipment_validator, ValidationResult

logger = logging.getLogger(__name__)

class DataTransformer:
    """
    Advanced data transformation service with comprehensive field mapping
    """
    
    def __init__(self):
        # Field mapping dictionaries for various data sources
        self.kobo_field_mappings = self._create_kobo_field_mappings()
        self.standard_field_mappings = self._create_standard_field_mappings()
    
    def _create_kobo_field_mappings(self) -> Dict[str, List[str]]:
        """Create comprehensive field mappings for KoboToolbox data"""
        return {
            # Basic facility information
            "facility_name": [
                "facility_name", "facilityName", "name_facility", 
                "general_information/Name_HF", "Name_HF", "facility/name"
            ],
            "region": [
                "region", "facility_region", "location_region",
                "general_information/region", "location/region"
            ],
            "district": [
                "district", "facility_district", "location_district",
                "general_information/district", "location/district"
            ],
            "facility_type": [
                "facility_type", "type_facility", "facilityType",
                "general_information/facility_type", "type"
            ],
            
            # Location data
            "latitude": [
                "latitude", "lat", "facility_latitude", "gps_latitude",
                "location/latitude", "_geolocation[0]"
            ],
            "longitude": [
                "longitude", "lon", "facility_longitude", "gps_longitude", 
                "location/longitude", "_geolocation[1]"
            ],
            
            # Operational information
            "operational_days": [
                "operational_days", "days_per_week", "working_days",
                "operations/operational_days", "facility_operations/days"
            ],
            "operational_hours_day": [
                "hours_per_day", "daily_hours", "day_hours",
                "operations/hours_per_day", "operational_hours/day"
            ],
            "operational_hours_night": [
                "night_hours", "emergency_hours", "after_hours",
                "operations/night_hours", "operational_hours/night"
            ],
            
            # Population and services
            "catchment_population": [
                "catchment_population", "population_served", "served_population",
                "demographics/catchment_population", "population"
            ],
            "monthly_patients": [
                "patients_per_month", "monthly_patients", "avg_monthly_patients",
                "services/monthly_patients", "patient_volume"
            ],
            "number_of_beds": [
                "number_of_beds", "beds_count", "total_beds",
                "infrastructure/beds", "facility_beds"
            ],
            
            # Staff information
            "support_staff": [
                "support_staff", "staff_admin", "administrative_staff",
                "staffing/support_staff", "staff/support"
            ],
            "technical_staff": [
                "technical_staff", "staff_technicians", "clinical_staff",
                "staffing/technical_staff", "staff/technical"
            ],
            "night_staff": [
                "night_staff", "has_night_staff", "overnight_staff",
                "staffing/night_staff", "staff/night"
            ],
            
            # Electricity and power
            "electricity_source": [
                "electricity_source", "power_source", "main_power_source",
                "power/electricity_source", "energy/source"
            ],
            "electricity_reliability": [
                "electricity_reliability", "power_reliability", "grid_reliability",
                "power/reliability", "energy/reliability"
            ],
            "secondary_power_source": [
                "secondary_power_source", "backup_power", "alternative_power",
                "power/secondary_source", "energy/backup"
            ],
            "monthly_diesel_cost": [
                "monthly_diesel_cost", "fuel_cost", "generator_cost",
                "costs/diesel", "power/fuel_cost"
            ],
            
            # Infrastructure
            "water_access": [
                "water_access", "has_water", "water_source",
                "infrastructure/water", "utilities/water"
            ],
            "national_grid": [
                "national_grid", "grid_connection", "connected_to_grid",
                "power/grid_connection", "utilities/grid"
            ],
            "transport_access": [
                "transportation_access", "transport_access", "road_access",
                "infrastructure/transport", "access/transport"
            ]
        }
    
    def _create_standard_field_mappings(self) -> Dict[str, str]:
        """Create standard field name mappings"""
        return {
            "name": "facility_name",
            "type": "facility_type", 
            "lat": "latitude",
            "lng": "longitude",
            "lon": "longitude",
            "population": "catchment_population",
            "staff": "total_staff",
            "power": "electricity_source"
        }
    
    def extract_gps_coordinates(self, raw_data: Dict[str, Any]) -> Optional[Tuple[float, float]]:
        """Extract GPS coordinates from various data formats"""
        try:
            # KoboToolbox stores GPS in _geolocation array format
            if "_geolocation" in raw_data and isinstance(raw_data["_geolocation"], list):
                geo_location = raw_data["_geolocation"]
                if len(geo_location) >= 2:
                    lat = self._safe_float_conversion(geo_location[0])
                    lon = self._safe_float_conversion(geo_location[1])
                    if lat is not None and lon is not None:
                        logger.info(f"📍 GPS extracted from _geolocation: [{lat}, {lon}]")
                        return (lat, lon)
            
            # Try mapped field locations
            lat = self._extract_field_value(raw_data, "latitude")
            lon = self._extract_field_value(raw_data, "longitude")
            
            if lat is not None and lon is not None:
                lat_float = self._safe_float_conversion(lat)
                lon_float = self._safe_float_conversion(lon)
                if lat_float is not None and lon_float is not None:
                    logger.info(f"📍 GPS extracted from fields: [{lat_float}, {lon_float}]")
                    return (lat_float, lon_float)
            
        except Exception as e:
            logger.warning(f"Failed to extract GPS coordinates: {str(e)}")
        
        return None
    
    def extract_facility_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract comprehensive facility data from raw survey data
        Enhanced version of TypeScript facility data extraction
        """
        logger.info("🏥 Extracting comprehensive facility data...")
        
        facility_data = {
            # Basic information
            "name": self._extract_field_value(raw_data, "facility_name") or "Unknown Facility",
            "region": self._extract_field_value(raw_data, "region") or "Unknown",
            "district": self._extract_field_value(raw_data, "district") or "Unknown", 
            "facility_type": self._extract_field_value(raw_data, "facility_type") or "Health Post",
            "ownership": self._extract_field_value(raw_data, "ownership"),
            
            # Location
            "latitude": self._safe_float_conversion(self._extract_field_value(raw_data, "latitude")),
            "longitude": self._safe_float_conversion(self._extract_field_value(raw_data, "longitude")),
            
            # Population and services
            "catchment_population": self._safe_int_conversion(
                self._extract_field_value(raw_data, "catchment_population")
            ) or 0,
            "monthly_patients": self._safe_int_conversion(
                self._extract_field_value(raw_data, "monthly_patients")
            ),
            "number_of_beds": self._safe_int_conversion(
                self._extract_field_value(raw_data, "number_of_beds")
            ),
            
            # Operational information
            "operational_days": self._safe_int_conversion(
                self._extract_field_value(raw_data, "operational_days")
            ) or 7,
            "operational_hours": {
                "day": self._safe_float_conversion(
                    self._extract_field_value(raw_data, "operational_hours_day")
                ) or 8.0,
                "night": self._safe_float_conversion(
                    self._extract_field_value(raw_data, "operational_hours_night")
                ) or 0.0
            },
            
            # Staff information
            "support_staff": self._safe_int_conversion(
                self._extract_field_value(raw_data, "support_staff")
            ) or 0,
            "technical_staff": self._safe_int_conversion(
                self._extract_field_value(raw_data, "technical_staff")
            ) or 0,
            "night_staff": self._extract_boolean_value(raw_data, "night_staff"),
            
            # Power and electricity
            "electricity_source": self._map_electricity_source(
                self._extract_field_value(raw_data, "electricity_source")
            ),
            "electricity_reliability": self._extract_field_value(raw_data, "electricity_reliability"),
            "secondary_power_source": self._extract_field_value(raw_data, "secondary_power_source"),
            "monthly_diesel_cost": self._safe_float_conversion(
                self._extract_field_value(raw_data, "monthly_diesel_cost")
            ),
            
            # Infrastructure
            "infrastructure": {
                "water_access": self._extract_boolean_value(raw_data, "water_access"),
                "national_grid": self._extract_boolean_value(raw_data, "national_grid"),
                "transport_access": self._map_transport_access(
                    self._extract_field_value(raw_data, "transport_access")
                )
            },
            
            # Equipment data
            "equipment": self._extract_equipment_data(raw_data),
            
            # Services
            "core_services": self._extract_array_from_string(
                self._extract_field_value(raw_data, "core_services")
            ),
            "critical_needs": self._extract_array_from_string(
                self._extract_field_value(raw_data, "critical_needs")
            )
        }
        
        logger.info(f"✅ Extracted facility data for: {facility_data['name']}")
        return facility_data
    
    def _extract_field_value(self, raw_data: Dict[str, Any], field_key: str) -> Any:
        """Extract field value using comprehensive field mapping"""
        if field_key not in self.kobo_field_mappings:
            # Try direct field access
            return raw_data.get(field_key)
        
        # Try all possible field names for this key
        for field_name in self.kobo_field_mappings[field_key]:
            if field_name in raw_data and raw_data[field_name] is not None:
                value = raw_data[field_name]
                if value != "" and value != "null":
                    return value
            
            # Try nested field access (e.g., "general_information/Name_HF")
            if "/" in field_name:
                try:
                    parts = field_name.split("/")
                    current = raw_data
                    for part in parts:
                        if isinstance(current, dict) and part in current:
                            current = current[part]
                        else:
                            current = None
                            break
                    if current is not None and current != "" and current != "null":
                        return current
                except:
                    continue
        
        return None
    
    def _extract_boolean_value(self, raw_data: Dict[str, Any], field_key: str) -> bool:
        """Extract boolean value from various formats"""
        value = self._extract_field_value(raw_data, field_key)
        if value is None:
            return False
        
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            return value.lower() in ["yes", "true", "1", "on", "enabled"]
        
        if isinstance(value, (int, float)):
            return value > 0
        
        return False
    
    def _extract_equipment_data(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract equipment data from repeat groups"""
        equipment = []
        
        # Common KoboToolbox repeat group field names for equipment
        equipment_groups = [
            raw_data.get("group_electric_equipment", []),
            raw_data.get("equipment_list", []),
            raw_data.get("medical_equipment", []),
            raw_data.get("electrical_equipment", []),
            raw_data.get("group_equipment", [])
        ]
        
        for group in equipment_groups:
            if isinstance(group, list):
                for item in group:
                    if isinstance(item, dict):
                        equipment.append({
                            "name": item.get("equipment_name", item.get("name", "Unknown Equipment")),
                            "type": item.get("equipment_type", item.get("type", "Medical")),
                            "quantity": self._safe_int_conversion(
                                item.get("quantity", item.get("equipment_quantity", 1))
                            ),
                            "power_rating": self._safe_float_conversion(
                                item.get("power_rating", item.get("wattage", 0))
                            ),
                            "hours_per_day": self._safe_float_conversion(
                                item.get("hours_per_day", item.get("usage_hours", 8))
                            ),
                            "critical": item.get("critical", "").lower() == "yes",
                            "condition": item.get("condition", "Good")
                        })
        
        logger.info(f"📊 Extracted {len(equipment)} equipment items")
        return equipment
    
    def _extract_array_from_string(self, value: Any) -> List[str]:
        """Extract array from comma-separated string or existing array"""
        if not value:
            return []
        
        if isinstance(value, list):
            return [str(item).strip() for item in value if item]
        
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        
        return []
    
    def _map_electricity_source(self, source: Any) -> str:
        """Map electricity source to standardized values"""
        if not source:
            return "none"
        
        source_str = str(source).lower()
        
        if "solar" in source_str:
            return "solar"
        elif "diesel" in source_str or "generator" in source_str:
            return "diesel_generator"
        elif "grid" in source_str and "mini" not in source_str:
            return "national_grid"
        elif "mini" in source_str and "grid" in source_str:
            return "mini_grid"
        elif "hybrid" in source_str:
            return "hybrid"
        elif source_str in ["none", "no electricity"]:
            return "none"
        else:
            return "other"
    
    def _map_transport_access(self, access: Any) -> str:
        """Map transport access to standardized values"""
        if not access:
            return "difficult_access"
        
        access_str = str(access).lower()
        
        if "paved" in access_str:
            return "paved_road"
        elif "unpaved" in access_str or "dirt" in access_str:
            return "unpaved_road"
        elif "seasonal" in access_str:
            return "seasonal_access"
        else:
            return "difficult_access"
    
    def _safe_int_conversion(self, value: Any) -> Optional[int]:
        """Safely convert value to integer"""
        if value is None or value == "":
            return None
        
        try:
            if isinstance(value, str):
                # Remove non-numeric characters except decimal point
                cleaned = re.sub(r'[^\d.-]', '', value)
                if cleaned:
                    return int(float(cleaned))
            elif isinstance(value, (int, float)):
                return int(value)
        except (ValueError, TypeError):
            pass
        
        return None
    
    def _safe_float_conversion(self, value: Any) -> Optional[float]:
        """Safely convert value to float"""
        if value is None or value == "":
            return None
        
        try:
            if isinstance(value, str):
                # Remove non-numeric characters except decimal point
                cleaned = re.sub(r'[^\d.-]', '', value)
                if cleaned:
                    return float(cleaned)
            elif isinstance(value, (int, float)):
                return float(value)
        except (ValueError, TypeError):
            pass
        
        return None
    
    def validate_and_fix_department_equipment_relationships(
        self, 
        survey_data: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], ValidationResult]:
        """
        Validate and fix department-equipment relationships in survey data
        
        This is the main integration point for Point 3: Data Validation
        """
        logger.info("🔍 Starting department-equipment relationship validation...")
        
        try:
            # Step 1: Validate the survey data structure
            validation_result = department_equipment_validator.validate_survey_data(survey_data)
            
            # Step 2: Apply fixes if validation found issues
            if validation_result.fixed_relationships or not validation_result.is_valid:
                fixed_data = department_equipment_validator.fix_department_equipment_relationships(
                    survey_data, validation_result
                )
                
                # Log the validation report
                report = department_equipment_validator.generate_validation_report(validation_result)
                logger.info(f"📋 Validation Report:\n{report}")
                
                return fixed_data, validation_result
            else:
                logger.info("✅ No department-equipment relationship issues found")
                return survey_data, validation_result
                
        except Exception as e:
            logger.error(f"❌ Error during department-equipment validation: {e}")
            # Return original data with error in validation result
            error_result = ValidationResult(
                is_valid=False,
                warnings=[],
                errors=[f"Validation process failed: {str(e)}"],
                fixed_relationships=[],
                department_equipment_map={}
            )
            return survey_data, error_result
    
    def extract_comprehensive_facility_data_with_validation(
        self, 
        raw_data: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], ValidationResult]:
        """
        Enhanced facility data extraction with department-equipment validation
        
        This combines the existing facility data extraction with the new validation system
        """
        logger.info("🏥 Extracting comprehensive facility data with validation...")
        
        # Step 1: Extract basic facility data using existing method
        facility_data = self.extract_facility_data(raw_data)
        
        # Step 2: Validate and fix department-equipment relationships
        validated_data, validation_result = self.validate_and_fix_department_equipment_relationships(raw_data)
        
        # Step 3: Merge validation results into facility data
        if '_validation_metadata' in validated_data:
            facility_data['validation_metadata'] = validated_data['_validation_metadata']
        
        # Step 4: Add department-equipment mapping to facility data
        if validation_result.department_equipment_map:
            facility_data['department_equipment_map'] = validation_result.department_equipment_map
        
        # Step 5: Add validation status to facility data
        facility_data['data_quality'] = {
            'validation_passed': validation_result.is_valid,
            'warnings_count': len(validation_result.warnings),
            'errors_count': len(validation_result.errors),
            'fixes_applied_count': len(validation_result.fixed_relationships)
        }
        
        return facility_data, validation_result
