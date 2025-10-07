"""
Advanced Data Validation Service - Python Implementation
Leverages pandas and numpy for sophisticated data quality checks
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass
from enum import Enum
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ValidationSeverity(str, Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

@dataclass
class ValidationResult:
    field: str
    issue_type: str
    severity: ValidationSeverity
    count: int
    message: str
    affected_records: Optional[List[int]] = None
    suggested_fix: Optional[str] = None

class DataValidator:
    """
    Advanced data validation using pandas and statistical methods
    """
    
    def __init__(self):
        self.validation_rules = self._initialize_validation_rules()
    
    def _initialize_validation_rules(self) -> Dict[str, Dict]:
        """Initialize validation rules for different field types"""
        return {
            "facility_name": {
                "required": True,
                "min_length": 2,
                "max_length": 100,
                "pattern": r"^[a-zA-Z0-9\s\-_.,()]+$"
            },
            "facility_type": {
                "required": True,
                "allowed_values": ["health_clinic", "hospital", "school", "community_center", "other"]
            },
            "latitude": {
                "required": False,
                "type": "numeric",
                "min_value": -90,
                "max_value": 90
            },
            "longitude": {
                "required": False,
                "type": "numeric",
                "min_value": -180,
                "max_value": 180
            },
            "operational_hours": {
                "required": False,
                "type": "numeric",
                "min_value": 0,
                "max_value": 24
            },
            "staff_count": {
                "required": False,
                "type": "integer",
                "min_value": 0,
                "max_value": 1000
            },
            "population_served": {
                "required": False,
                "type": "integer",
                "min_value": 0,
                "max_value": 1000000
            },
            "monthly_electricity_cost": {
                "required": False,
                "type": "numeric",
                "min_value": 0,
                "max_value": 100000
            }
        }
    
    async def validate_dataframe(self, df: pd.DataFrame) -> List[ValidationResult]:
        """
        Comprehensive validation of a pandas DataFrame
        """
        validation_results = []
        
        # Basic structure validation
        validation_results.extend(self._validate_structure(df))
        
        # Field-level validation
        validation_results.extend(self._validate_fields(df))
        
        # Cross-field validation
        validation_results.extend(self._validate_relationships(df))
        
        # Statistical validation
        validation_results.extend(self._validate_statistical_patterns(df))
        
        # Data consistency validation
        validation_results.extend(self._validate_consistency(df))
        
        return validation_results
    
    def _validate_structure(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Validate DataFrame structure"""
        results = []
        
        # Check if DataFrame is empty
        if df.empty:
            results.append(ValidationResult(
                field="dataframe",
                issue_type="empty_dataset",
                severity=ValidationSeverity.ERROR,
                count=0,
                message="Dataset is empty"
            ))
            return results
        
        # Check for completely empty rows
        empty_rows = df.isnull().all(axis=1).sum()
        if empty_rows > 0:
            results.append(ValidationResult(
                field="dataframe",
                issue_type="empty_rows",
                severity=ValidationSeverity.WARNING,
                count=empty_rows,
                message=f"{empty_rows} completely empty rows found",
                suggested_fix="Remove empty rows during cleaning"
            ))
        
        # Check for duplicate columns
        duplicate_cols = df.columns[df.columns.duplicated()].tolist()
        if duplicate_cols:
            results.append(ValidationResult(
                field="columns",
                issue_type="duplicate_columns",
                severity=ValidationSeverity.ERROR,
                count=len(duplicate_cols),
                message=f"Duplicate columns found: {duplicate_cols}",
                suggested_fix="Rename or remove duplicate columns"
            ))
        
        return results
    
    def _validate_fields(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Validate individual fields against rules"""
        results = []
        
        for field, rules in self.validation_rules.items():
            if field not in df.columns:
                if rules.get("required", False):
                    results.append(ValidationResult(
                        field=field,
                        issue_type="missing_required_field",
                        severity=ValidationSeverity.ERROR,
                        count=len(df),
                        message=f"Required field '{field}' is missing from dataset"
                    ))
                continue
            
            series = df[field]
            
            # Check for required field nulls
            if rules.get("required", False):
                null_count = series.isnull().sum()
                if null_count > 0:
                    results.append(ValidationResult(
                        field=field,
                        issue_type="missing_required_values",
                        severity=ValidationSeverity.ERROR,
                        count=null_count,
                        message=f"Required field '{field}' has {null_count} missing values",
                        affected_records=series[series.isnull()].index.tolist()
                    ))
            
            # Type validation
            if "type" in rules:
                results.extend(self._validate_field_type(field, series, rules))
            
            # Range validation
            if "min_value" in rules or "max_value" in rules:
                results.extend(self._validate_field_range(field, series, rules))
            
            # Length validation
            if "min_length" in rules or "max_length" in rules:
                results.extend(self._validate_field_length(field, series, rules))
            
            # Pattern validation
            if "pattern" in rules:
                results.extend(self._validate_field_pattern(field, series, rules))
            
            # Allowed values validation
            if "allowed_values" in rules:
                results.extend(self._validate_allowed_values(field, series, rules))
        
        return results
    
    def _validate_field_type(self, field: str, series: pd.Series, rules: Dict) -> List[ValidationResult]:
        """Validate field data type"""
        results = []
        expected_type = rules["type"]
        
        if expected_type == "numeric":
            non_numeric = pd.to_numeric(series, errors='coerce').isnull() & series.notnull()
            if non_numeric.any():
                invalid_count = non_numeric.sum()
                results.append(ValidationResult(
                    field=field,
                    issue_type="invalid_type",
                    severity=ValidationSeverity.ERROR,
                    count=invalid_count,
                    message=f"Field '{field}' has {invalid_count} non-numeric values",
                    affected_records=series[non_numeric].index.tolist(),
                    suggested_fix="Convert to numeric or remove invalid values"
                ))
        
        elif expected_type == "integer":
            # Check if values are integers
            numeric_series = pd.to_numeric(series, errors='coerce')
            non_integer = (numeric_series != numeric_series.astype('Int64', errors='ignore')) & series.notnull()
            if non_integer.any():
                invalid_count = non_integer.sum()
                results.append(ValidationResult(
                    field=field,
                    issue_type="invalid_type",
                    severity=ValidationSeverity.WARNING,
                    count=invalid_count,
                    message=f"Field '{field}' has {invalid_count} non-integer values",
                    affected_records=series[non_integer].index.tolist(),
                    suggested_fix="Round to nearest integer"
                ))
        
        return results
    
    def _validate_field_range(self, field: str, series: pd.Series, rules: Dict) -> List[ValidationResult]:
        """Validate field value ranges"""
        results = []
        
        # Convert to numeric for range checking
        numeric_series = pd.to_numeric(series, errors='coerce')
        
        if "min_value" in rules:
            min_val = rules["min_value"]
            below_min = (numeric_series < min_val) & numeric_series.notnull()
            if below_min.any():
                invalid_count = below_min.sum()
                results.append(ValidationResult(
                    field=field,
                    issue_type="value_below_minimum",
                    severity=ValidationSeverity.ERROR,
                    count=invalid_count,
                    message=f"Field '{field}' has {invalid_count} values below minimum ({min_val})",
                    affected_records=series[below_min].index.tolist(),
                    suggested_fix=f"Set values below {min_val} to {min_val}"
                ))
        
        if "max_value" in rules:
            max_val = rules["max_value"]
            above_max = (numeric_series > max_val) & numeric_series.notnull()
            if above_max.any():
                invalid_count = above_max.sum()
                results.append(ValidationResult(
                    field=field,
                    issue_type="value_above_maximum",
                    severity=ValidationSeverity.ERROR,
                    count=invalid_count,
                    message=f"Field '{field}' has {invalid_count} values above maximum ({max_val})",
                    affected_records=series[above_max].index.tolist(),
                    suggested_fix=f"Set values above {max_val} to {max_val}"
                ))
        
        return results
    
    def _validate_field_length(self, field: str, series: pd.Series, rules: Dict) -> List[ValidationResult]:
        """Validate string field lengths"""
        results = []
        
        # Convert to string and get lengths
        str_series = series.astype(str)
        lengths = str_series.str.len()
        
        if "min_length" in rules:
            min_len = rules["min_length"]
            too_short = (lengths < min_len) & series.notnull()
            if too_short.any():
                invalid_count = too_short.sum()
                results.append(ValidationResult(
                    field=field,
                    issue_type="value_too_short",
                    severity=ValidationSeverity.WARNING,
                    count=invalid_count,
                    message=f"Field '{field}' has {invalid_count} values shorter than {min_len} characters",
                    affected_records=series[too_short].index.tolist()
                ))
        
        if "max_length" in rules:
            max_len = rules["max_length"]
            too_long = (lengths > max_len) & series.notnull()
            if too_long.any():
                invalid_count = too_long.sum()
                results.append(ValidationResult(
                    field=field,
                    issue_type="value_too_long",
                    severity=ValidationSeverity.WARNING,
                    count=invalid_count,
                    message=f"Field '{field}' has {invalid_count} values longer than {max_len} characters",
                    affected_records=series[too_long].index.tolist(),
                    suggested_fix=f"Truncate values to {max_len} characters"
                ))
        
        return results
    
    def _validate_field_pattern(self, field: str, series: pd.Series, rules: Dict) -> List[ValidationResult]:
        """Validate field patterns using regex"""
        results = []
        pattern = rules["pattern"]
        
        # Check pattern matching
        str_series = series.astype(str)
        pattern_match = str_series.str.match(pattern, na=False)
        invalid_pattern = ~pattern_match & series.notnull()
        
        if invalid_pattern.any():
            invalid_count = invalid_pattern.sum()
            results.append(ValidationResult(
                field=field,
                issue_type="invalid_pattern",
                severity=ValidationSeverity.WARNING,
                count=invalid_count,
                message=f"Field '{field}' has {invalid_count} values not matching expected pattern",
                affected_records=series[invalid_pattern].index.tolist(),
                suggested_fix="Clean values to match expected pattern"
            ))
        
        return results
    
    def _validate_allowed_values(self, field: str, series: pd.Series, rules: Dict) -> List[ValidationResult]:
        """Validate against allowed values"""
        results = []
        allowed_values = rules["allowed_values"]
        
        # Check for values not in allowed list
        invalid_values = ~series.isin(allowed_values) & series.notnull()
        
        if invalid_values.any():
            invalid_count = invalid_values.sum()
            unique_invalid = series[invalid_values].unique().tolist()
            results.append(ValidationResult(
                field=field,
                issue_type="invalid_value",
                severity=ValidationSeverity.ERROR,
                count=invalid_count,
                message=f"Field '{field}' has {invalid_count} invalid values: {unique_invalid}",
                affected_records=series[invalid_values].index.tolist(),
                suggested_fix=f"Map to allowed values: {allowed_values}"
            ))
        
        return results
    
    def _validate_relationships(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Validate relationships between fields"""
        results = []
        
        # Coordinate validation
        if 'latitude' in df.columns and 'longitude' in df.columns:
            # Check for (0,0) coordinates (likely invalid)
            zero_coords = (df['latitude'] == 0) & (df['longitude'] == 0)
            if zero_coords.any():
                invalid_count = zero_coords.sum()
                results.append(ValidationResult(
                    field="coordinates",
                    issue_type="suspicious_coordinates",
                    severity=ValidationSeverity.WARNING,
                    count=invalid_count,
                    message=f"{invalid_count} records have coordinates at (0,0)",
                    affected_records=df[zero_coords].index.tolist(),
                    suggested_fix="Verify if (0,0) coordinates are intentional"
                ))
        
        # Staff count vs operational hours relationship
        if 'staff_count' in df.columns and 'operational_hours' in df.columns:
            # Flag facilities with many staff but few operational hours
            suspicious = (df['staff_count'] > 10) & (df['operational_hours'] < 8)
            if suspicious.any():
                count = suspicious.sum()
                results.append(ValidationResult(
                    field="staff_operations",
                    issue_type="suspicious_relationship",
                    severity=ValidationSeverity.INFO,
                    count=count,
                    message=f"{count} facilities have high staff count but low operational hours",
                    affected_records=df[suspicious].index.tolist()
                ))
        
        return results
    
    def _validate_statistical_patterns(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Validate using statistical methods"""
        results = []
        
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_columns:
            if col in df.columns:
                series = df[col].dropna()
                if len(series) > 0:
                    # Detect outliers using IQR method
                    Q1 = series.quantile(0.25)
                    Q3 = series.quantile(0.75)
                    IQR = Q3 - Q1
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    outliers = (df[col] < lower_bound) | (df[col] > upper_bound)
                    outlier_count = outliers.sum()
                    
                    if outlier_count > 0:
                        results.append(ValidationResult(
                            field=col,
                            issue_type="statistical_outliers",
                            severity=ValidationSeverity.INFO,
                            count=outlier_count,
                            message=f"Field '{col}' has {outlier_count} statistical outliers",
                            affected_records=df[outliers].index.tolist(),
                            suggested_fix="Review outliers for data entry errors"
                        ))
        
        return results
    
    def _validate_consistency(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Validate data consistency"""
        results = []
        
        # Check for duplicate facilities (same name and location)
        if all(col in df.columns for col in ['facility_name', 'latitude', 'longitude']):
            # Group by facility identifiers
            facility_groups = df.groupby(['facility_name', 'latitude', 'longitude'])
            duplicates = facility_groups.size()
            duplicate_facilities = duplicates[duplicates > 1]
            
            if len(duplicate_facilities) > 0:
                total_duplicates = duplicate_facilities.sum() - len(duplicate_facilities)
                results.append(ValidationResult(
                    field="facility_duplicates",
                    issue_type="duplicate_facilities",
                    severity=ValidationSeverity.WARNING,
                    count=total_duplicates,
                    message=f"{total_duplicates} duplicate facility records found",
                    suggested_fix="Merge or remove duplicate facility records"
                ))
        
        return results
    
    def generate_validation_report(self, validation_results: List[ValidationResult]) -> Dict[str, Any]:
        """Generate a comprehensive validation report"""
        if not validation_results:
            return {
                "overall_status": "PASSED",
                "total_issues": 0,
                "summary": "No validation issues found"
            }
        
        # Categorize by severity
        errors = [r for r in validation_results if r.severity == ValidationSeverity.ERROR]
        warnings = [r for r in validation_results if r.severity == ValidationSeverity.WARNING]
        info = [r for r in validation_results if r.severity == ValidationSeverity.INFO]
        
        # Determine overall status
        if errors:
            overall_status = "FAILED"
        elif warnings:
            overall_status = "PASSED_WITH_WARNINGS"
        else:
            overall_status = "PASSED"
        
        return {
            "overall_status": overall_status,
            "total_issues": len(validation_results),
            "errors": len(errors),
            "warnings": len(warnings),
            "info": len(info),
            "issues_by_field": self._group_issues_by_field(validation_results),
            "critical_issues": [r for r in errors if r.count > 0],
            "recommendations": self._generate_recommendations(validation_results),
            "summary": self._generate_summary(validation_results)
        }
    
    def _group_issues_by_field(self, validation_results: List[ValidationResult]) -> Dict[str, List[Dict]]:
        """Group validation issues by field"""
        grouped = {}
        for result in validation_results:
            if result.field not in grouped:
                grouped[result.field] = []
            grouped[result.field].append({
                "issue_type": result.issue_type,
                "severity": result.severity,
                "count": result.count,
                "message": result.message,
                "suggested_fix": result.suggested_fix
            })
        return grouped
    
    def _generate_recommendations(self, validation_results: List[ValidationResult]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # High-priority recommendations
        errors = [r for r in validation_results if r.severity == ValidationSeverity.ERROR]
        if errors:
            recommendations.append("Address all ERROR-level validation issues before proceeding")
        
        # Field-specific recommendations
        field_issues = {}
        for result in validation_results:
            if result.field not in field_issues:
                field_issues[result.field] = []
            field_issues[result.field].append(result)
        
        for field, issues in field_issues.items():
            if len(issues) > 1:
                recommendations.append(f"Field '{field}' has multiple issues - consider comprehensive cleanup")
        
        return recommendations
    
    def _generate_summary(self, validation_results: List[ValidationResult]) -> str:
        """Generate validation summary"""
        total_issues = len(validation_results)
        errors = sum(1 for r in validation_results if r.severity == ValidationSeverity.ERROR)
        warnings = sum(1 for r in validation_results if r.severity == ValidationSeverity.WARNING)
        
        if errors > 0:
            return f"Validation failed with {errors} errors and {warnings} warnings out of {total_issues} total issues"
        elif warnings > 0:
            return f"Validation passed with {warnings} warnings out of {total_issues} total issues"
        else:
            return "All validation checks passed successfully"
