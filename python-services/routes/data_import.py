"""
Data Import API Routes - Python Implementation
Advanced data import, cleaning, and validation endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any, Union
import pandas as pd
import io
import json
import logging
from datetime import datetime

from core.auth import verify_token
from services.data_import import DataImportService, ImportSummary
from services.data_validation import DataValidator
from services.survey_analysis import SurveyAnalysisService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/data-import", tags=["Data Import"])

# Initialize services
data_import_service = DataImportService()
data_validator = DataValidator()
survey_analyzer = SurveyAnalysisService()

@router.post("/import-json")
async def import_json_data(
    data: Union[Dict[str, Any], List[Dict[str, Any]]],
    source: str = "api",
    validate_data: bool = True,
    clean: bool = True,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Import survey data from JSON format
    
    Args:
        data: Survey data as JSON (dict or list of dicts)
        source: Data source identifier
        validate: Whether to perform data validation
        clean: Whether to perform data cleaning
    
    Returns:
        Import results with statistics and analysis
    """
    try:
        logger.info(f"User {current_user.id} importing JSON data from {source}")
        
        result = await data_import_service.import_survey_data(
            raw_data=data,
            source=source,
            validate=validate_data,
            clean=clean
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Data imported successfully",
                "data": result
            }
        )
        
    except Exception as e:
        logger.error(f"JSON import failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Data import failed: {str(e)}"
        )

@router.post("/import-csv")
async def import_csv_file(
    file: UploadFile = File(...),
    source: Optional[str] = Form("csv_upload"),
    validate_data: bool = Form(True),
    clean: bool = Form(True),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Import survey data from CSV file
    
    Args:
        file: CSV file upload
        source: Data source identifier
        validate: Whether to perform data validation
        clean: Whether to perform data cleaning
    
    Returns:
        Import results with statistics and analysis
    """
    try:
        logger.info(f"User {current_user.id} importing CSV file: {file.filename}")
        
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="File must be a CSV file"
            )
        
        # Read CSV content
        content = await file.read()
        csv_string = content.decode('utf-8')
        
        # Convert to DataFrame
        df = pd.read_csv(io.StringIO(csv_string))
        
        # Import data
        result = await data_import_service.import_survey_data(
            raw_data=df,
            source=f"csv:{file.filename}",
            validate=validate_data,
            clean=clean
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"CSV file '{file.filename}' imported successfully",
                "data": result
            }
        )
        
    except Exception as e:
        logger.error(f"CSV import failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"CSV import failed: {str(e)}"
        )

@router.post("/import-excel")
async def import_excel_file(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    source: Optional[str] = Form("excel_upload"),
    validate_data: bool = Form(True),
    clean: bool = Form(True),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Import survey data from Excel file
    
    Args:
        file: Excel file upload
        sheet_name: Specific sheet name (optional)
        source: Data source identifier
        validate: Whether to perform data validation
        clean: Whether to perform data cleaning
    
    Returns:
        Import results with statistics and analysis
    """
    try:
        logger.info(f"User {current_user.id} importing Excel file: {file.filename}")
        
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="File must be an Excel file (.xlsx or .xls)"
            )
        
        # Read Excel content
        content = await file.read()
        
        # Convert to DataFrame
        df = pd.read_excel(io.BytesIO(content), sheet_name=sheet_name)
        
        # Import data
        result = await data_import_service.import_survey_data(
            raw_data=df,
            source=f"excel:{file.filename}",
            validate=validate_data,
            clean=clean
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Excel file '{file.filename}' imported successfully",
                "data": result
            }
        )
        
    except Exception as e:
        logger.error(f"Excel import failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Excel import failed: {str(e)}"
        )

@router.post("/validate-data")
async def validate_data(
    data: Union[Dict[str, Any], List[Dict[str, Any]]],
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Validate survey data without importing
    
    Args:
        data: Survey data to validate
    
    Returns:
        Validation results and recommendations
    """
    try:
        logger.info(f"User {current_user.id} validating data")
        
        # Convert to DataFrame
        df = data_import_service._to_dataframe(data)
        
        # Perform validation
        validation_results = await data_validator.validate_dataframe(df)
        
        # Generate validation report
        validation_report = data_validator.generate_validation_report(validation_results)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Data validation completed",
                "validation_report": validation_report,
                "validation_details": [
                    {
                        "field": result.field,
                        "issue_type": result.issue_type,
                        "severity": result.severity,
                        "count": result.count,
                        "message": result.message,
                        "suggested_fix": result.suggested_fix
                    }
                    for result in validation_results
                ]
            }
        )
        
    except Exception as e:
        logger.error(f"Data validation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Data validation failed: {str(e)}"
        )

@router.post("/analyze-data")
async def analyze_data(
    data: Union[Dict[str, Any], List[Dict[str, Any]]],
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Analyze survey data without importing
    
    Args:
        data: Survey data to analyze
    
    Returns:
        Comprehensive data analysis results
    """
    try:
        logger.info(f"User {current_user.id} analyzing data")
        
        # Convert to DataFrame
        df = data_import_service._to_dataframe(data)
        
        # Perform analysis
        analysis_results = await survey_analyzer.analyze_imported_data(df)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Data analysis completed",
                "analysis": analysis_results
            }
        )
        
    except Exception as e:
        logger.error(f"Data analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Data analysis failed: {str(e)}"
        )

@router.post("/clean-data")
async def clean_data(
    data: Union[Dict[str, Any], List[Dict[str, Any]]],
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Clean survey data without importing
    
    Args:
        data: Survey data to clean
    
    Returns:
        Cleaned data and cleaning statistics
    """
    try:
        logger.info(f"User {current_user.id} cleaning data")
        
        # Convert to DataFrame
        df = data_import_service._to_dataframe(data)
        original_count = len(df)
        
        # Clean data
        cleaned_df = await data_import_service._clean_survey_data(df)
        cleaned_count = len(cleaned_df)
        
        # Convert back to JSON format
        cleaned_data = cleaned_df.to_dict('records')
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Data cleaning completed",
                "original_record_count": original_count,
                "cleaned_record_count": cleaned_count,
                "records_removed": original_count - cleaned_count,
                "cleaning_efficiency": round((cleaned_count / original_count) * 100, 2) if original_count > 0 else 0,
                "cleaned_data": cleaned_data
            }
        )
        
    except Exception as e:
        logger.error(f"Data cleaning failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Data cleaning failed: {str(e)}"
        )

@router.get("/import-status/{import_id}")
async def get_import_status(
    import_id: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Get status of a data import operation
    
    Args:
        import_id: Import operation ID
    
    Returns:
        Import status and progress
    """
    # This would typically check a database or cache for import status
    # For now, return a placeholder response
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "import_id": import_id,
            "status": "completed",
            "message": "Import status endpoint - implementation pending"
        }
    )

@router.get("/supported-formats")
async def get_supported_formats():
    """
    Get list of supported data import formats
    
    Returns:
        List of supported formats and their specifications
    """
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "supported_formats": {
                "json": {
                    "description": "JSON format (single object or array of objects)",
                    "mime_types": ["application/json"],
                    "max_size_mb": 50,
                    "features": ["validation", "cleaning", "analysis"]
                },
                "csv": {
                    "description": "Comma-separated values",
                    "mime_types": ["text/csv"],
                    "max_size_mb": 100,
                    "features": ["validation", "cleaning", "analysis", "automatic_type_detection"]
                },
                "excel": {
                    "description": "Microsoft Excel files",
                    "mime_types": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
                    "max_size_mb": 100,
                    "features": ["validation", "cleaning", "analysis", "multi_sheet_support"]
                }
            },
            "required_fields": ["facility_name", "facility_type"],
            "optional_fields": [
                "latitude", "longitude", "operational_hours", "staff_count",
                "population_served", "electricity_source", "monthly_electricity_cost"
            ],
            "equipment_fields": [
                "equipment_*_power", "equipment_*_hours", "equipment_*_quantity"
            ]
        }
    )

@router.get("/data-quality-metrics")
async def get_data_quality_metrics(
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Get data quality metrics for imported data
    
    Returns:
        Overall data quality statistics
    """
    try:
        # This would typically query the database for quality metrics
        # For now, return placeholder metrics
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Data quality metrics endpoint - implementation pending",
                "metrics": {
                    "total_records": 0,
                    "average_quality_score": 0,
                    "records_with_coordinates": 0,
                    "complete_records_percentage": 0,
                    "last_import_date": None
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to get data quality metrics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get data quality metrics: {str(e)}"
        )

# ==================== KOBO TOOLBOX INTEGRATION ROUTES ====================

@router.post("/kobo/import-by-date-range")
async def import_kobo_surveys_by_date_range(
    start_date: str,
    end_date: str,
    form_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Import surveys from KoboToolbox by date range
    Replaces TypeScript importSurveysByDateRange functionality
    """
    try:
        logger.info(f"User {current_user['id']} importing KoboToolbox surveys from {start_date} to {end_date}")
        
        # Parse dates
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Import from KoboToolbox
        result = await data_import_service.import_from_kobo_by_date_range(
            start_date=start_dt,
            end_date=end_dt,
            form_id=form_id
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": result.success,
                "message": result.message,
                "data": {
                    "imported": result.imported,
                    "failed": result.failed,
                    "processing_time_seconds": result.processing_time,
                    "data_quality_score": result.data_quality_score,
                    "source": "kobo_toolbox",
                    "date_range": {
                        "start": start_date,
                        "end": end_date
                    }
                }
            }
        )
        
    except Exception as e:
        logger.error(f"KoboToolbox date range import failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"KoboToolbox import failed: {str(e)}"
        )

@router.post("/kobo/import-by-id")
async def import_kobo_survey_by_id(
    survey_id: str,
    form_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Import specific survey from KoboToolbox by ID
    Replaces TypeScript importSurveyById functionality
    """
    try:
        logger.info(f"User {current_user['id']} importing KoboToolbox survey {survey_id}")
        
        # Import specific survey
        result = await data_import_service.import_from_kobo_by_id(
            survey_id=survey_id,
            form_id=form_id
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": result.success,
                "message": result.message,
                "data": {
                    "imported": result.imported,
                    "failed": result.failed,
                    "processing_time_seconds": result.processing_time,
                    "data_quality_score": result.data_quality_score,
                    "source": "kobo_toolbox",
                    "survey_id": survey_id
                }
            }
        )
        
    except Exception as e:
        logger.error(f"KoboToolbox survey import failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"KoboToolbox survey import failed: {str(e)}"
        )

@router.get("/kobo/connection-test")
async def test_kobo_connection(
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Test connection to KoboToolbox API
    Replaces TypeScript testConnection functionality
    """
    try:
        logger.info(f"User {current_user['id']} testing KoboToolbox connection")
        
        # Test KoboToolbox API connection
        session = await data_import_service._get_session()
        headers = {
            "Authorization": f"Token {data_import_service.kobo_api_token}",
            "Content-Type": "application/json"
        }
        
        # Test API access
        url = f"{data_import_service.kobo_base_url}/api/v2/assets/"
        
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "message": "KoboToolbox connection successful",
                        "data": {
                            "api_url": data_import_service.kobo_base_url,
                            "assets_count": len(data.get("results", [])),
                            "connection_status": "healthy"
                        }
                    }
                )
            else:
                error_text = await response.text()
                return JSONResponse(
                    status_code=response.status,
                    content={
                        "success": False,
                        "message": f"KoboToolbox API error: {response.status}",
                        "error": error_text
                    }
                )
                
    except Exception as e:
        logger.error(f"KoboToolbox connection test failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Connection test failed: {str(e)}"
        )
