"""
Department-Equipment Relationship Validator
Ensures proper hierarchical data structure during survey import
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import pandas as pd

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Result of department-equipment validation"""
    is_valid: bool
    warnings: List[str]
    errors: List[str]
    fixed_relationships: List[str]
    department_equipment_map: Dict[str, List[str]]

@dataclass
class DepartmentInfo:
    """Department information structure"""
    name: str
    has_wiring: bool
    needs_sockets: bool
    equipment_count: int
    total_power_w: float

@dataclass
class EquipmentInfo:
    """Equipment with department relationship"""
    name: str
    department: Optional[str]
    category: str
    power_rating_w: float
    quantity: int
    hours_per_day: float
    priority: str
    inferred_department: Optional[str] = None

class DepartmentEquipmentValidator:
    """
    Validates and fixes department-equipment relationships during import
    """
    
    def __init__(self):
        # Standard department names for healthcare facilities (based on real survey data)
        self.standard_departments = {
            'inpatient': ['inpatient', 'ward', 'admission', 'beds', 'ipd'],
            'outpatient': ['outpatient', 'opd', 'consultation', 'clinic'],
            'laboratory': ['laboratory', 'lab', 'testing', 'diagnostics', 'pathology'],
            'maternity': ['maternity', 'delivery', 'obstetrics', 'labor', 'labour'],
            'theatre': ['theatre', 'surgery', 'operating', 'surgical', 'ot'],
            'pharmacy': ['pharmacy', 'dispensary', 'drugs', 'medication', 'store'],
            'radiology': ['radiology', 'xray', 'x-ray', 'imaging'],
            'dental': ['dental', 'dentistry', 'oral'],
            'administration': ['administration', 'office', 'reception', 'admin'],
            'emergency': ['emergency', 'er', 'casualty', 'trauma'],
            'pediatric': ['pediatric', 'children', 'child', 'paediatric'],
            'kitchen': ['kitchen', 'catering', 'food', 'dining'],
            'laundry': ['laundry', 'washing', 'cleaning'],
            'maintenance': ['maintenance', 'workshop', 'technical', 'engineering'],
            'morgue': ['morgue', 'mortuary', 'post-mortem'],
            'security': ['security', 'guard', 'surveillance']
        }
        
        # Equipment-to-department inference rules (based on real survey data)
        self.equipment_department_rules = {
            # Laboratory Equipment
            'nebulizer': 'inpatient',
            'oxygen concentrator': 'inpatient', 
            'glucometer': 'laboratory',
            'television': 'inpatient',
            'neonatal bed warmer': 'maternity',
            'delivery bed': 'maternity',
            'neonatal incubator': 'maternity',
            'ultrasound machine': 'maternity',
            'examination couch': 'outpatient',
            'cpap machine': 'inpatient',
            'refrigerator': 'pharmacy',
            'electric suction apparatus': 'inpatient',
            'anesthesia machine': 'theatre',
            'weighing scale': 'outpatient',
            'diathermy machine': 'theatre',
            'ice box': 'pharmacy',
            'autoclave': 'laboratory',
            'centrifuge': 'laboratory',
            'ata cot warmer': 'maternity',
            'ecg machine': 'outpatient',
            'microscope': 'laboratory',
            'vaccine centrifuge': 'laboratory',
            'hb meter': 'laboratory',
            'slide warmer': 'laboratory',
            'haemoglobin machine': 'laboratory',
            'chemistry analyzer': 'laboratory',
            'chemistry machine': 'laboratory',
            'booster cabinet': 'laboratory',
            'printer': 'administration',
            'computer': 'administration',
            'syringe pump': 'inpatient',
            'battery charger': 'maintenance',
            'scanner': 'administration',
            'blood pressure machine': 'outpatient',
            'pulse oximeter': 'outpatient',
            'fetal doppler': 'maternity',
            'dental chair': 'dental',
            'pulse meter': 'outpatient',
            'radiant warmer': 'maternity',
            'air conditioner': None,  # Multiple departments
            'operation table lamp': 'theatre',
            'fan': None,  # Multiple departments
            'lighting': None,  # Multiple departments
            'luggage': 'administration',
            'laminator': 'administration',
            'photocopier': 'administration',
            'thermometer': 'outpatient',
            'uv lamp': 'laboratory',
            'sterilizer': 'laboratory',
            'spirometer': 'outpatient',
            'hot air oven': 'laboratory',
            'stabilizer': 'maintenance',
            'portable x-ray machine': 'radiology',
            'thermal cycler machine': 'laboratory',
            'auto refractometer': 'outpatient',
            'urine analyzer': 'laboratory',
            'blood gas analyzer': 'laboratory',
            'ceiling fan': None,  # Multiple departments
            'pa system': 'administration',
            'weighing machine': 'outpatient',
            'standing fan': None,  # Multiple departments
            'autoclave fan': 'laboratory',
            'examination light': 'outpatient',
            'theatre light': 'theatre',
            'bench with microscope': 'laboratory',
            'ventilator': 'inpatient',
            'pcr thermal cycler machine': 'laboratory',
            'x-ray view box': 'radiology',
            'water pump': 'maintenance',
            'cooler machine': 'pharmacy',
            'vaccine refrigerator': 'pharmacy',
            'common freezer machine': 'pharmacy',
            'operating microscope': 'theatre',
            'dental unit': 'dental',
            'uv c-t machine': 'laboratory',
            'electro-pneumatic ventilator': 'inpatient',
            'blood bank refrigerator': 'laboratory',
            'laundry machine': 'laundry',
            'morgue table': 'morgue',
            'patient bed': 'inpatient',
            'electrocardiogram (ecg)': 'outpatient',
            'haemoglobin': 'laboratory',
            'ophthalmoscope': 'outpatient',
            'otoscope': 'outpatient',
            'police computer': 'administration',
            'endoscopy': 'theatre',
            'general operating table': 'theatre',
            'urea breath': 'laboratory',
            'blood chemistry machine': 'laboratory',
            'urine machine': 'laboratory',
            'refrigerator (blood)': 'laboratory',
            'freezer (blood)': 'laboratory',
            'frozen fish': 'kitchen'
        }
    
    def validate_survey_data(self, survey_data: Dict[str, Any]) -> ValidationResult:
        """
        Main validation function for survey data
        """
        logger.info("🔍 Validating department-equipment relationships...")
        
        result = ValidationResult(
            is_valid=True,
            warnings=[],
            errors=[],
            fixed_relationships=[],
            department_equipment_map={}
        )
        
        try:
            # Extract department and equipment data
            departments = self._extract_departments(survey_data)
            equipment_list = self._extract_equipment(survey_data)
            
            # Validate department structure
            dept_validation = self._validate_departments(departments)
            result.warnings.extend(dept_validation['warnings'])
            result.errors.extend(dept_validation['errors'])
            
            # Validate equipment-department relationships
            equipment_validation = self._validate_equipment_relationships(equipment_list, departments)
            result.warnings.extend(equipment_validation['warnings'])
            result.errors.extend(equipment_validation['errors'])
            result.fixed_relationships.extend(equipment_validation['fixed'])
            
            # Create department-equipment mapping
            result.department_equipment_map = self._create_department_equipment_map(equipment_list)
            
            # Check for critical issues
            if result.errors:
                result.is_valid = False
                logger.error(f"❌ Validation failed with {len(result.errors)} errors")
            else:
                logger.info(f"✅ Validation passed with {len(result.warnings)} warnings")
            
        except Exception as e:
            logger.error(f"❌ Validation error: {e}")
            result.is_valid = False
            result.errors.append(f"Validation process failed: {str(e)}")
        
        return result
    
    def _extract_departments(self, survey_data: Dict[str, Any]) -> List[DepartmentInfo]:
        """Extract department information from survey data"""
        departments = []
        
        # Look for department-related fields
        dept_fields = [
            'departments_with_wiring',
            'departmentsWithWiring', 
            'Q54. How many departments have electric wiring',
            'departments_needing_sockets',
            'departmentsNeedingSockets',
            'Q65. Which departments need electric sockets'
        ]
        
        # Extract departments needing sockets
        departments_needing_sockets = []
        for field in dept_fields:
            if field in survey_data:
                value = survey_data[field]
                if isinstance(value, str):
                    # Parse comma-separated or semicolon-separated values
                    departments_needing_sockets = [
                        dept.strip().lower() 
                        for dept in value.replace(';', ',').split(',')
                        if dept.strip()
                    ]
                elif isinstance(value, list):
                    departments_needing_sockets = [dept.lower() for dept in value if dept]
                break
        
        # Create department objects
        for dept_name in departments_needing_sockets:
            standardized_name = self._standardize_department_name(dept_name)
            departments.append(DepartmentInfo(
                name=standardized_name,
                has_wiring=True,  # Assumed if they need sockets
                needs_sockets=True,
                equipment_count=0,  # Will be calculated later
                total_power_w=0.0   # Will be calculated later
            ))
        
        # Add default departments if none found
        if not departments:
            logger.warning("⚠️ No departments found in survey data, adding default departments")
            default_departments = ['outpatient', 'administration', 'pharmacy']
            for dept_name in default_departments:
                departments.append(DepartmentInfo(
                    name=dept_name,
                    has_wiring=True,
                    needs_sockets=True,
                    equipment_count=0,
                    total_power_w=0.0
                ))
        
        return departments
    
    def _extract_equipment(self, survey_data: Dict[str, Any]) -> List[EquipmentInfo]:
        """Extract equipment information from survey data"""
        equipment_list = []
        
        # Look for equipment in repeat groups or arrays
        equipment_sources = [
            'equipment',
            'medical_equipment', 
            'facility_equipment',
            'equipment_list'
        ]
        
        for source in equipment_sources:
            if source in survey_data:
                equipment_data = survey_data[source]
                if isinstance(equipment_data, list):
                    for item in equipment_data:
                        equipment = self._parse_equipment_item(item)
                        if equipment:
                            equipment_list.append(equipment)
                break
        
        # Also look for individual equipment fields
        if not equipment_list:
            equipment_list = self._extract_individual_equipment_fields(survey_data)
        
        return equipment_list
    
    def _parse_equipment_item(self, item: Dict[str, Any]) -> Optional[EquipmentInfo]:
        """Parse individual equipment item"""
        try:
            name = item.get('name') or item.get('equipment_name') or 'Unknown Equipment'
            department = item.get('department') or item.get('dept') or item.get('location')
            
            return EquipmentInfo(
                name=name.strip(),
                department=department.strip().lower() if department else None,
                category=item.get('category', 'Other'),
                power_rating_w=float(item.get('power_rating_w', 0) or item.get('power', 0)),
                quantity=int(item.get('quantity', 1)),
                hours_per_day=float(item.get('hours_per_day', 8) or item.get('daily_hours', 8)),
                priority=item.get('priority', 'normal')
            )
        except Exception as e:
            logger.warning(f"⚠️ Failed to parse equipment item: {e}")
            return None
    
    def _extract_individual_equipment_fields(self, survey_data: Dict[str, Any]) -> List[EquipmentInfo]:
        """Extract equipment from individual survey fields"""
        equipment_list = []
        
        # Common equipment field patterns
        equipment_patterns = [
            ('xray', 'X-Ray Machine', 'radiology'),
            ('ultrasound', 'Ultrasound Machine', 'radiology'),
            ('computer', 'Computer', 'administration'),
            ('printer', 'Printer', 'administration'),
            ('refrigerator', 'Refrigerator', 'pharmacy'),
            ('fan', 'Fan', None),
            ('lighting', 'Lighting', None)
        ]
        
        for pattern, name, dept in equipment_patterns:
            # Look for fields containing the pattern
            for field_name, value in survey_data.items():
                if pattern in field_name.lower() and value:
                    # Try to extract quantity and power
                    quantity = 1
                    power = 0
                    
                    if isinstance(value, str) and value.isdigit():
                        quantity = int(value)
                    elif isinstance(value, (int, float)):
                        quantity = int(value)
                    
                    equipment_list.append(EquipmentInfo(
                        name=name,
                        department=dept,
                        category='Medical Equipment' if dept == 'radiology' else 'Other',
                        power_rating_w=power,
                        quantity=quantity,
                        hours_per_day=8.0,
                        priority='normal'
                    ))
        
        return equipment_list
    
    def _validate_departments(self, departments: List[DepartmentInfo]) -> Dict[str, List[str]]:
        """Validate department structure"""
        warnings = []
        errors = []
        
        if not departments:
            errors.append("No departments found in survey data")
            return {'warnings': warnings, 'errors': errors}
        
        # Check for duplicate departments
        dept_names = [dept.name for dept in departments]
        duplicates = [name for name in set(dept_names) if dept_names.count(name) > 1]
        if duplicates:
            warnings.append(f"Duplicate departments found: {', '.join(duplicates)}")
        
        # Check for unrecognized department names
        for dept in departments:
            if not self._is_recognized_department(dept.name):
                warnings.append(f"Unrecognized department name: '{dept.name}' - will attempt standardization")
        
        return {'warnings': warnings, 'errors': errors}
    
    def _validate_equipment_relationships(
        self, 
        equipment_list: List[EquipmentInfo], 
        departments: List[DepartmentInfo]
    ) -> Dict[str, List[str]]:
        """Validate equipment-department relationships"""
        warnings = []
        errors = []
        fixed = []
        
        dept_names = [dept.name for dept in departments]
        
        for equipment in equipment_list:
            # Check if equipment has department assignment
            if not equipment.department:
                # Try to infer department from equipment name
                inferred_dept = self._infer_department_from_equipment(equipment.name)
                if inferred_dept and inferred_dept in dept_names:
                    equipment.inferred_department = inferred_dept
                    fixed.append(f"Assigned '{equipment.name}' to '{inferred_dept}' department")
                else:
                    warnings.append(f"Equipment '{equipment.name}' has no department assignment")
            
            # Check if assigned department exists
            elif equipment.department not in dept_names:
                # Try to find similar department name
                similar_dept = self._find_similar_department(equipment.department, dept_names)
                if similar_dept:
                    equipment.inferred_department = similar_dept
                    fixed.append(f"Mapped '{equipment.department}' to '{similar_dept}' for equipment '{equipment.name}'")
                else:
                    warnings.append(f"Equipment '{equipment.name}' assigned to unknown department '{equipment.department}'")
            
            # Validate equipment specifications
            if equipment.power_rating_w <= 0:
                warnings.append(f"Equipment '{equipment.name}' has no power rating specified")
            
            if equipment.quantity <= 0:
                errors.append(f"Equipment '{equipment.name}' has invalid quantity: {equipment.quantity}")
        
        return {'warnings': warnings, 'errors': errors, 'fixed': fixed}
    
    def _standardize_department_name(self, dept_name: str) -> str:
        """Standardize department name using mapping rules"""
        dept_lower = dept_name.lower().strip()
        
        for standard_name, variations in self.standard_departments.items():
            if dept_lower in variations or any(var in dept_lower for var in variations):
                return standard_name
        
        return dept_lower
    
    def _is_recognized_department(self, dept_name: str) -> bool:
        """Check if department name is recognized"""
        return dept_name in self.standard_departments
    
    def _infer_department_from_equipment(self, equipment_name: str) -> Optional[str]:
        """Infer department from equipment name"""
        equipment_lower = equipment_name.lower()
        
        for equipment_pattern, department in self.equipment_department_rules.items():
            if equipment_pattern in equipment_lower:
                return department
        
        return None
    
    def _find_similar_department(self, dept_name: str, available_departments: List[str]) -> Optional[str]:
        """Find similar department name from available list"""
        dept_lower = dept_name.lower()
        
        # Direct match
        if dept_lower in available_departments:
            return dept_lower
        
        # Partial match
        for available_dept in available_departments:
            if dept_lower in available_dept or available_dept in dept_lower:
                return available_dept
        
        # Standardization match
        standardized = self._standardize_department_name(dept_name)
        if standardized in available_departments:
            return standardized
        
        return None
    
    def _create_department_equipment_map(self, equipment_list: List[EquipmentInfo]) -> Dict[str, List[str]]:
        """Create mapping of departments to their equipment"""
        dept_equipment_map = {}
        
        for equipment in equipment_list:
            dept = equipment.inferred_department or equipment.department or 'unassigned'
            
            if dept not in dept_equipment_map:
                dept_equipment_map[dept] = []
            
            dept_equipment_map[dept].append(equipment.name)
        
        return dept_equipment_map
    
    def fix_department_equipment_relationships(
        self, 
        survey_data: Dict[str, Any], 
        validation_result: ValidationResult
    ) -> Dict[str, Any]:
        """
        Apply fixes to survey data based on validation results
        """
        logger.info("🔧 Applying department-equipment relationship fixes...")
        
        fixed_data = survey_data.copy()
        
        # Update equipment with inferred departments
        if 'equipment' in fixed_data and isinstance(fixed_data['equipment'], list):
            for equipment_item in fixed_data['equipment']:
                equipment_name = equipment_item.get('name', '')
                
                # Find corresponding equipment in validation results
                inferred_dept = self._infer_department_from_equipment(equipment_name)
                if inferred_dept and not equipment_item.get('department'):
                    equipment_item['department'] = inferred_dept
                    logger.info(f"✅ Fixed: Assigned '{equipment_name}' to '{inferred_dept}'")
        
        # Add department-equipment mapping to metadata
        fixed_data['_validation_metadata'] = {
            'department_equipment_map': validation_result.department_equipment_map,
            'validation_warnings': validation_result.warnings,
            'fixes_applied': validation_result.fixed_relationships,
            'validation_timestamp': pd.Timestamp.now().isoformat()
        }
        
        return fixed_data
    
    def generate_validation_report(self, validation_result: ValidationResult) -> str:
        """Generate human-readable validation report"""
        report = []
        report.append("🏥 DEPARTMENT-EQUIPMENT VALIDATION REPORT")
        report.append("=" * 50)
        
        # Overall status
        status = "✅ PASSED" if validation_result.is_valid else "❌ FAILED"
        report.append(f"Status: {status}")
        report.append(f"Errors: {len(validation_result.errors)}")
        report.append(f"Warnings: {len(validation_result.warnings)}")
        report.append(f"Fixes Applied: {len(validation_result.fixed_relationships)}")
        report.append("")
        
        # Department-Equipment Mapping
        report.append("📋 DEPARTMENT-EQUIPMENT MAPPING:")
        for dept, equipment_list in validation_result.department_equipment_map.items():
            report.append(f"  {dept.upper()}:")
            for equipment in equipment_list:
                report.append(f"    - {equipment}")
        report.append("")
        
        # Errors
        if validation_result.errors:
            report.append("❌ ERRORS:")
            for error in validation_result.errors:
                report.append(f"  - {error}")
            report.append("")
        
        # Warnings
        if validation_result.warnings:
            report.append("⚠️ WARNINGS:")
            for warning in validation_result.warnings:
                report.append(f"  - {warning}")
            report.append("")
        
        # Fixes Applied
        if validation_result.fixed_relationships:
            report.append("🔧 FIXES APPLIED:")
            for fix in validation_result.fixed_relationships:
                report.append(f"  - {fix}")
        
        return "\n".join(report)

# Global validator instance
department_equipment_validator = DepartmentEquipmentValidator()
