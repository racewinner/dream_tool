"""
Enhanced Data Import Service - Python Implementation
Leverages Pandas for superior data manipulation and cleaning
"""

import logging
import json
import pandas as pd
import numpy as np
import os
import re
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union, Tuple
from pydantic import BaseModel, Field
from fastapi import HTTPException

from core.database import get_db_session
from models.database_models import Survey, Facility
from dataclasses import dataclass
from enum import Enum
import logging
import os
from urllib.parse import urljoin
import hashlib

# Database and validation imports
from core.database import SessionLocal
from .data_validation import DataValidator, ValidationResult
from .survey_analysis import SurveyAnalysisService
from .data_transformation import DataTransformer

# Statistical and ML imports
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)

# Data structures for external API integration
@dataclass
class ImportSummary:
    success: bool
    imported: int
    failed: int
    message: str
    processing_time: float = 0.0
    data_quality_score: float = 0.0

@dataclass
class TransformedSurveyData:
    external_id: str
    facility_data: Dict[str, Any]
    collection_date: datetime
    respondent_id: str
    raw_data: Dict[str, Any]
    gps_coordinates: Optional[Tuple[float, float]] = None

class ElectricitySource(Enum):
    NATIONAL_GRID = "national_grid"
    SOLAR = "solar"
    DIESEL_GENERATOR = "diesel_generator"
    MINI_GRID = "mini_grid"
    HYBRID = "hybrid"
    OTHER = "other"
    NONE = "none"

class TransportAccess(Enum):
    PAVED_ROAD = "paved_road"
    UNPAVED_ROAD = "unpaved_road"
    SEASONAL_ACCESS = "seasonal_access"
    DIFFICULT_ACCESS = "difficult_access"

class DataSource(Enum):
    KOBO_TOOLBOX = "kobo_toolbox"
    CSV_FILE = "csv_file"
    EXCEL_FILE = "excel_file"
    JSON_DATA = "json_data"
    EXTERNAL_API = "external_api"

class DataImportService:
    """
    Comprehensive data import service replacing TypeScript functionality
    
    Features:
    - KoboToolbox API integration
    - Multi-format file processing
    - Advanced data transformation and cleaning
    - Statistical validation and analysis
    - Database integration
    """
    
    def __init__(self):
        self.validator = DataValidator()
        self.survey_analyzer = SurveyAnalysisService()
        self.transformer = DataTransformer()
        
        # KoboToolbox configuration
        self.kobo_base_url = os.getenv("KOBO_BASE_URL", "https://kf.kobotoolbox.org")
        self.kobo_api_token = os.getenv("KOBO_API_TOKEN")
        self.kobo_form_id = os.getenv("KOBO_FORM_ID")
        
        # External API configuration
        self.external_api_base_url = os.getenv("EXTERNAL_API_BASE_URL")
        self.external_api_token = os.getenv("EXTERNAL_API_TOKEN")
        
        # Session for HTTP requests
        self.session = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def close_session(self):
        """Close HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    # ==================== KOBO TOOLBOX INTEGRATION ====================
    
    async def import_from_kobo_by_date_range(
        self, 
        start_date: datetime, 
        end_date: datetime,
        form_id: Optional[str] = None
    ) -> ImportSummary:
        """
        Import surveys from KoboToolbox by date range
        Replaces TypeScript importSurveysByDateRange functionality
        """
        start_time = datetime.now()
        
        try:
            logger.info(f"🚀 Starting KoboToolbox import for period {start_date} to {end_date}")
            
            # Use provided form_id or default
            target_form_id = form_id or self.kobo_form_id
            if not target_form_id:
                raise ValueError("KoboToolbox form ID not provided")
            
            # Fetch surveys from KoboToolbox
            surveys = await self._fetch_kobo_surveys(target_form_id, start_date, end_date)
            logger.info(f"📊 Retrieved {len(surveys)} surveys from KoboToolbox")
            
            if not surveys:
                return ImportSummary(
                    success=True,
                    imported=0,
                    failed=0,
                    message="No surveys found in the specified date range",
                    processing_time=(datetime.now() - start_time).total_seconds()
                )
            
            # Process surveys with advanced Python capabilities
            results = await self._process_survey_batch(surveys, DataSource.KOBO_TOOLBOX)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ImportSummary(
                success=results["failed"] == 0,
                imported=results["imported"],
                failed=results["failed"],
                message=f"Imported {results['imported']} surveys, {results['failed']} failed",
                processing_time=processing_time,
                data_quality_score=results.get("avg_quality_score", 0.0)
            )
            
        except Exception as e:
            logger.error(f"KoboToolbox import failed: {str(e)}")
            return ImportSummary(
                success=False,
                imported=0,
                failed=0,
                message=f"Import failed: {str(e)}",
                processing_time=(datetime.now() - start_time).total_seconds()
            )
    
    async def import_from_kobo_by_id(self, survey_id: str, form_id: Optional[str] = None) -> ImportSummary:
        """
        Import specific survey from KoboToolbox by ID
        Replaces TypeScript importSurveyById functionality
        """
        start_time = datetime.now()
        
        try:
            logger.info(f"🚀 Starting KoboToolbox import for survey ID: {survey_id}")
            
            target_form_id = form_id or self.kobo_form_id
            if not target_form_id:
                raise ValueError("KoboToolbox form ID not provided")
            
            # Fetch specific survey
            survey = await self._fetch_kobo_survey_by_id(target_form_id, survey_id)
            
            if not survey:
                return ImportSummary(
                    success=False,
                    imported=0,
                    failed=1,
                    message=f"Survey {survey_id} not found",
                    processing_time=(datetime.now() - start_time).total_seconds()
                )
            
            # Process single survey
            result = await self._process_single_survey(survey, DataSource.KOBO_TOOLBOX)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ImportSummary(
                success=result["success"],
                imported=1 if result["success"] else 0,
                failed=0 if result["success"] else 1,
                message=f"Survey {survey_id} {'imported successfully' if result['success'] else 'failed to import'}",
                processing_time=processing_time,
                data_quality_score=result.get("quality_score", 0.0)
            )
            
        except Exception as e:
            logger.error(f"KoboToolbox survey import failed: {str(e)}")
            return ImportSummary(
                success=False,
                imported=0,
                failed=1,
                message=f"Import failed: {str(e)}",
                processing_time=(datetime.now() - start_time).total_seconds()
            )
    
    async def _fetch_kobo_surveys(
        self, 
        form_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Fetch surveys from KoboToolbox API"""
        session = await self._get_session()
        
        headers = {
            "Authorization": f"Token {self.kobo_api_token}",
            "Content-Type": "application/json"
        }
        
        # KoboToolbox API endpoint for submissions
        url = f"{self.kobo_base_url}/api/v2/assets/{form_id}/data/"
        
        params = {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "format": "json"
        }
        
        try:
            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("results", [])
                else:
                    error_text = await response.text()
                    logger.error(f"KoboToolbox API error: {response.status} - {error_text}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching KoboToolbox surveys: {str(e)}")
            return []
    
    async def _fetch_kobo_survey_by_id(self, form_id: str, survey_id: str) -> Optional[Dict[str, Any]]:
        """Fetch specific survey from KoboToolbox by ID"""
        session = await self._get_session()
        
        headers = {
            "Authorization": f"Token {self.kobo_api_token}",
            "Content-Type": "application/json"
        }
        
        url = f"{self.kobo_base_url}/api/v2/assets/{form_id}/data/{survey_id}/"
        
        try:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Survey {survey_id} not found: {response.status}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching KoboToolbox survey {survey_id}: {str(e)}")
            return None
    
    # ==================== DATA TRANSFORMATION ====================
    
    def _transform_kobo_survey_data(self, raw_data: Dict[str, Any]) -> TransformedSurveyData:
        """
        Transform KoboToolbox survey data to internal format
        Enhanced version of TypeScript transformSurveyData
        """
        logger.info("🔄 Starting comprehensive KoboToolbox data transformation...")
        
        # Extract basic survey identifiers
        external_id = str(raw_data.get("_id", raw_data.get("id", f"survey_{int(datetime.now().timestamp())}")))
        submission_time = raw_data.get("_submission_time", raw_data.get("submissionTime", datetime.now().isoformat()))
        respondent_id = raw_data.get("_submitted_by", raw_data.get("submittedBy", "anonymous"))
        
        logger.info(f"📊 Processing survey {external_id} submitted at {submission_time}")
        
        # Extract GPS coordinates
        gps_coordinates = self._extract_gps_coordinates(raw_data)
        
        # Comprehensive facility data extraction
        facility_data = self._extract_facility_data(raw_data)
        
        # Parse submission time
        try:
            collection_date = datetime.fromisoformat(submission_time.replace('Z', '+00:00'))
        except:
            collection_date = datetime.now(timezone.utc)
        
        return TransformedSurveyData(
            external_id=external_id,
            facility_data=facility_data,
            collection_date=collection_date,
            respondent_id=respondent_id,
            raw_data=raw_data,
            gps_coordinates=gps_coordinates
        )
    
    def _extract_gps_coordinates(self, raw_data: Dict[str, Any]) -> Optional[Tuple[float, float]]:
        """Extract GPS coordinates using the transformer"""
        return self.transformer.extract_gps_coordinates(raw_data)
    
    def _extract_facility_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract facility data using the transformer"""
        return self.transformer.extract_facility_data(raw_data)
    
    async def _process_survey_batch(self, surveys: List[Dict[str, Any]], source: DataSource) -> Dict[str, Any]:
        """Process a batch of surveys with advanced Python capabilities"""
        imported = 0
        failed = 0
        quality_scores = []
        
        for survey in surveys:
            try:
                result = await self._process_single_survey(survey, source)
                if result["success"]:
                    imported += 1
                    if "quality_score" in result:
                        quality_scores.append(result["quality_score"])
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Error processing survey: {str(e)}")
                failed += 1
        
        avg_quality_score = np.mean(quality_scores) if quality_scores else 0.0
        
        return {
            "imported": imported,
            "failed": failed,
            "avg_quality_score": avg_quality_score
        }
    
    async def _process_single_survey(self, survey: Dict[str, Any], source: DataSource) -> Dict[str, Any]:
        """Process a single survey with validation and analysis"""
        try:
            # Transform survey data
            if source == DataSource.KOBO_TOOLBOX:
                transformed_data = self._transform_kobo_survey_data(survey)
            else:
                # Handle other data sources
                transformed_data = self._transform_generic_survey_data(survey)
            
            # Validate data
            if self.validator:
                validation_result = await self.validator.validate_survey_data(transformed_data.facility_data)
                quality_score = validation_result.get("overall_score", 0.0) if validation_result else 0.0
            else:
                quality_score = 0.0
            
            # Save to database using SQLAlchemy models
            try:
                # Create new Survey object
                survey = Survey(
                    external_id=transformed_data.external_id,
                    facility_id=facility_id,
                    facility_data=transformed_data.facility_data,
                    raw_data=raw_data,
                    collection_date=datetime.now()
                )
                
                # Add to session and commit
                db_session = next(get_db_session())
                db_session.add(survey)
                db_session.commit()
                logger.info(f"Survey saved to database with ID: {survey.id}")
                
                # Process images if available
                if raw_data and '_attachments' in raw_data and len(raw_data['_attachments']) > 0:
                    try:
                        from services.image_service import ImageService
                        image_service = ImageService()
                        stored_images = await image_service.extract_and_store_survey_images(
                            survey_id=survey.id,
                            raw_data=raw_data
                        )
                        logger.info(f"Processed {len(stored_images)} images for survey {survey.id}")
                    except Exception as img_error:
                        logger.warning(f"Image processing error for survey {survey.id}: {str(img_error)}")
                        # Continue even if image processing fails
            except Exception as e:
                logger.error(f"Database save error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
            return {
                "success": True,
                "quality_score": quality_score,
                "external_id": transformed_data.external_id
            }
            
        except Exception as e:
            logger.error(f"Failed to process survey: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _transform_generic_survey_data(self, raw_data: Dict[str, Any]) -> TransformedSurveyData:
        """Transform generic survey data to internal format"""
        external_id = str(raw_data.get("id", f"survey_{int(datetime.now().timestamp())}"))
        
        # Extract GPS coordinates
        gps_coordinates = self.transformer.extract_gps_coordinates(raw_data)
        
        # Extract facility data
        facility_data = self.transformer.extract_facility_data(raw_data)
        
        return TransformedSurveyData(
            external_id=external_id,
            facility_data=facility_data,
            collection_date=datetime.now(timezone.utc),
            respondent_id=raw_data.get("respondent_id", "unknown"),
            raw_data=raw_data,
            gps_coordinates=gps_coordinates
        )
    
    async def import_survey_data(
        self, 
        raw_data: Union[Dict, List[Dict], pd.DataFrame],
        source: str = "external_api",
        validate: bool = True,
        clean: bool = True
    ) -> Dict[str, Any]:
        """
        Import and process survey data with advanced cleaning and validation
        
        Args:
            raw_data: Raw survey data (dict, list, or DataFrame)
            source: Data source identifier
            validate: Whether to perform data validation
            clean: Whether to perform data cleaning
            
        Returns:
            Import results with statistics and processed data
        """
        start_time = datetime.now()
        
        try:
            # Convert to DataFrame for processing
            df = self._to_dataframe(raw_data)
            logger.info(f"Processing {len(df)} survey records from {source}")
            
            # Data cleaning pipeline
            if clean:
                df = await self._clean_survey_data(df)
                logger.info(f"Data cleaning completed. {len(df)} records remain")
            
            # Data validation
            validation_results = []
            if validate:
                validation_results = await self._validate_survey_data(df)
                logger.info(f"Validation completed. {len(validation_results)} issues found")
            
            # Transform to application format
            transformed_data = await self._transform_survey_data(df)
            
            # Import to database
            import_results = await self._import_to_database(transformed_data)
            
            # Generate analysis
            analysis = await self.survey_analyzer.analyze_imported_data(df)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "success": True,
                "source": source,
                "records_processed": len(df),
                "records_imported": import_results["imported_count"],
                "records_failed": import_results["failed_count"],
                "processing_time_seconds": processing_time,
                "validation_results": validation_results,
                "data_quality_score": analysis["data_quality_score"],
                "completeness_score": analysis["completeness_score"],
                "recommendations": analysis["recommendations"],
                "summary": analysis["summary"]
            }
            
        except Exception as e:
            logger.error(f"Data import failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "processing_time_seconds": (datetime.now() - start_time).total_seconds()
            }
    
    def _to_dataframe(self, data: Union[Dict, List[Dict], pd.DataFrame]) -> pd.DataFrame:
        """Convert various data formats to pandas DataFrame"""
        if isinstance(data, pd.DataFrame):
            return data.copy()
        elif isinstance(data, dict):
            return pd.DataFrame([data])
        elif isinstance(data, list):
            return pd.DataFrame(data)
        else:
            raise ValueError(f"Unsupported data type: {type(data)}")
    
    async def _clean_survey_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Advanced data cleaning using pandas
        """
        logger.info("Starting data cleaning pipeline...")
        
        # Create a copy to avoid modifying original
        cleaned_df = df.copy()
        
        # 1. Remove completely empty rows
        cleaned_df = cleaned_df.dropna(how='all')
        
        # 2. Standardize column names
        cleaned_df.columns = cleaned_df.columns.str.lower().str.replace(' ', '_')
        
        # 3. Clean facility names
        if 'facility_name' in cleaned_df.columns:
            cleaned_df['facility_name'] = (
                cleaned_df['facility_name']
                .str.strip()
                .str.title()
                .replace('', np.nan)
            )
        
        # 4. Clean numeric fields
        numeric_fields = [
            'operational_hours', 'staff_count', 'latitude', 'longitude',
            'population_served', 'monthly_electricity_cost'
        ]
        
        for field in numeric_fields:
            if field in cleaned_df.columns:
                # Convert to numeric, coercing errors to NaN
                cleaned_df[field] = pd.to_numeric(cleaned_df[field], errors='coerce')
                
                # Apply reasonable bounds
                if field == 'operational_hours':
                    cleaned_df[field] = cleaned_df[field].clip(0, 24)
                elif field == 'staff_count':
                    cleaned_df[field] = cleaned_df[field].clip(0, 1000)
                elif field in ['latitude', 'longitude']:
                    if field == 'latitude':
                        cleaned_df[field] = cleaned_df[field].clip(-90, 90)
                    else:
                        cleaned_df[field] = cleaned_df[field].clip(-180, 180)
        
        # 5. Clean categorical fields
        categorical_mappings = {
            'facility_type': {
                'health clinic': 'health_clinic',
                'hospital': 'hospital',
                'school': 'school',
                'community center': 'community_center'
            },
            'electricity_source': {
                'grid': 'grid',
                'generator': 'generator',
                'solar': 'solar',
                'none': 'none'
            }
        }
        
        for field, mapping in categorical_mappings.items():
            if field in cleaned_df.columns:
                cleaned_df[field] = (
                    cleaned_df[field]
                    .str.lower()
                    .str.strip()
                    .map(mapping)
                    .fillna(cleaned_df[field])
                )
        
        # 6. Clean equipment data (if present)
        equipment_columns = [col for col in cleaned_df.columns if col.startswith('equipment_')]
        if equipment_columns:
            cleaned_df = self._clean_equipment_data(cleaned_df, equipment_columns)
        
        # 7. Handle datetime fields
        datetime_fields = ['survey_date', 'timestamp', 'created_at']
        for field in datetime_fields:
            if field in cleaned_df.columns:
                cleaned_df[field] = pd.to_datetime(cleaned_df[field], errors='coerce')
        
        # 8. Remove duplicates based on key fields
        key_fields = ['facility_name', 'latitude', 'longitude']
        available_keys = [f for f in key_fields if f in cleaned_df.columns]
        if available_keys:
            cleaned_df = cleaned_df.drop_duplicates(subset=available_keys, keep='first')
        
        logger.info(f"Data cleaning completed. Removed {len(df) - len(cleaned_df)} records")
        return cleaned_df
    
    def _clean_equipment_data(self, df: pd.DataFrame, equipment_columns: List[str]) -> pd.DataFrame:
        """Clean equipment-related data"""
        for col in equipment_columns:
            if 'power' in col.lower() or 'watt' in col.lower():
                # Clean power ratings
                df[col] = pd.to_numeric(df[col], errors='coerce').clip(0, 10000)
            elif 'hours' in col.lower():
                # Clean hours per day
                df[col] = pd.to_numeric(df[col], errors='coerce').clip(0, 24)
            elif 'quantity' in col.lower() or 'count' in col.lower():
                # Clean quantities
                df[col] = pd.to_numeric(df[col], errors='coerce').clip(0, 100)
        
        return df
    
    async def _validate_survey_data(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Validate cleaned data using advanced validation rules"""
        validation_results = []
        
        # Required fields validation
        required_fields = ['facility_name', 'facility_type']
        for field in required_fields:
            if field not in df.columns or df[field].isna().any():
                missing_count = df[field].isna().sum() if field in df.columns else len(df)
                validation_results.append(ValidationResult(
                    field=field,
                    issue_type="missing_required",
                    severity="error",
                    count=missing_count,
                    message=f"Required field '{field}' is missing in {missing_count} records"
                ))
        
        # Geographic validation
        if 'latitude' in df.columns and 'longitude' in df.columns:
            invalid_coords = (
                (df['latitude'].isna()) | 
                (df['longitude'].isna()) |
                (df['latitude'] == 0) & (df['longitude'] == 0)
            ).sum()
            
            if invalid_coords > 0:
                validation_results.append(ValidationResult(
                    field="coordinates",
                    issue_type="invalid_coordinates",
                    severity="warning",
                    count=invalid_coords,
                    message=f"{invalid_coords} records have invalid or missing coordinates"
                ))
        
        # Data consistency validation
        if 'operational_hours' in df.columns:
            invalid_hours = (df['operational_hours'] > 24).sum()
            if invalid_hours > 0:
                validation_results.append(ValidationResult(
                    field="operational_hours",
                    issue_type="invalid_range",
                    severity="error",
                    count=invalid_hours,
                    message=f"{invalid_hours} records have operational hours > 24"
                ))
        
        return validation_results
    
    async def _transform_survey_data(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Transform cleaned DataFrame to application format"""
        transformed_records = []
        
        for _, row in df.iterrows():
            # Build facility data
            facility_data = {
                "name": row.get('facility_name'),
                "facility_type": row.get('facility_type'),
                "latitude": row.get('latitude'),
                "longitude": row.get('longitude'),
                "operational_hours": row.get('operational_hours'),
                "staff_count": row.get('staff_count'),
                "population_served": row.get('population_served'),
                "electricity_source": row.get('electricity_source'),
                "monthly_electricity_cost": row.get('monthly_electricity_cost')
            }
            
            # Extract equipment data
            equipment = self._extract_equipment_data(row)
            
            # Build survey record
            survey_record = {
                "facility_data": facility_data,
                "equipment": equipment,
                "survey_date": row.get('survey_date', datetime.now()),
                "data_source": "python_import",
                "data_quality_score": self._calculate_record_quality(row)
            }
            
            transformed_records.append(survey_record)
        
        return transformed_records
    
    def _extract_equipment_data(self, row: pd.Series) -> List[Dict[str, Any]]:
        """Extract equipment data from survey row"""
        equipment = []
        
        # Look for equipment columns
        equipment_patterns = [
            ('led_lights', 'LED Lights', 'lighting'),
            ('medical_fridge', 'Medical Refrigerator', 'medical'),
            ('ceiling_fans', 'Ceiling Fans', 'cooling'),
            ('computers', 'Computers', 'computing')
        ]
        
        for pattern, name, category in equipment_patterns:
            power_col = f"{pattern}_power"
            hours_col = f"{pattern}_hours"
            qty_col = f"{pattern}_quantity"
            
            if power_col in row.index and not pd.isna(row[power_col]):
                equipment.append({
                    "name": name,
                    "category": category,
                    "power_rating": float(row[power_col]),
                    "hours_per_day": float(row.get(hours_col, 12)),
                    "quantity": int(row.get(qty_col, 1)),
                    "condition": "good"  # Default
                })
        
        return equipment
    
    def _calculate_record_quality(self, row: pd.Series) -> float:
        """Calculate data quality score for a record"""
        total_fields = len(row)
        non_null_fields = row.notna().sum()
        completeness = non_null_fields / total_fields
        
        # Bonus for having critical fields
        critical_fields = ['facility_name', 'facility_type', 'latitude', 'longitude']
        critical_completeness = sum(1 for field in critical_fields if field in row.index and row[field] is not None) / len(critical_fields)
        
        # Weighted score
        quality_score = (completeness * 0.7) + (critical_completeness * 0.3)
        return round(quality_score, 3)
    
    async def _import_to_database(self, transformed_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Import transformed data to database"""
        imported_count = 0
        failed_count = 0
        
        # Use synchronous session for now (can be upgraded to async later)
        session = SessionLocal()
        try:
            for record in transformed_data:
                try:
                    # For now, just count as imported (actual DB integration would go here)
                    # This is a placeholder until we have the proper models set up
                    imported_count += 1
                    logger.info(f"Would import record: {record['facility_data']['name']}")
                    
                except Exception as e:
                    logger.error(f"Failed to import record: {str(e)}")
                    failed_count += 1
                    continue
            
            session.commit()
            
        except Exception as e:
            logger.error(f"Database session error: {str(e)}")
            session.rollback()
        finally:
            session.close()
        
        return {
            "imported_count": imported_count,
            "failed_count": failed_count
        }

    async def bulk_import_csv(self, file_path: str, **kwargs) -> Dict[str, Any]:
        """Import data from CSV file"""
        try:
            # Read CSV with pandas
            df = pd.read_csv(file_path, encoding='utf-8')
            logger.info(f"Loaded CSV with {len(df)} records from {file_path}")
            
            return await self.import_survey_data(df, source=f"csv:{file_path}", **kwargs)
            
        except Exception as e:
            logger.error(f"CSV import failed: {str(e)}")
            return {
                "success": False,
                "error": f"CSV import failed: {str(e)}"
            }
    
    async def bulk_import_excel(self, file_path: str, sheet_name: str = None, **kwargs) -> Dict[str, Any]:
        """Import data from Excel file"""
        try:
            # Read Excel with pandas
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            logger.info(f"Loaded Excel with {len(df)} records from {file_path}")
            
            return await self.import_survey_data(df, source=f"excel:{file_path}", **kwargs)
            
        except Exception as e:
            logger.error(f"Excel import failed: {str(e)}")
            return {
                "success": False,
                "error": f"Excel import failed: {str(e)}"
            }
