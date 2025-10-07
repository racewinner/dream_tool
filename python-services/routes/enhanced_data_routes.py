"""
Enhanced Data Routes with Database Integration
Uses real database data instead of mock data
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Dict, Any, Optional
import logging
import json

from services.data_import_enhanced import enhanced_import_service
from services.survey_analysis_enhanced import enhanced_analysis_service
from core.auth import verify_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/python/enhanced", tags=["Enhanced Data Services"])

# Data Import Endpoints

@router.post("/import/kobo-survey")
async def import_kobo_survey(
    survey_data: Dict[str, Any],
    current_user: dict = Depends(verify_token)
):
    """Import a single KoboToolbox survey with database persistence"""
    try:
        result = await enhanced_import_service.import_kobo_survey(survey_data)
        
        if result.success:
            return {
                "success": True,
                "survey_id": result.survey_id,
                "external_id": result.external_id,
                "facility_id": result.facility_id,
                "quality_score": result.quality_score,
                "message": f"Successfully imported survey {result.external_id}"
            }
        else:
            raise HTTPException(status_code=400, detail=result.error)
            
    except Exception as e:
        logger.error(f"Failed to import KoboToolbox survey: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import/batch-surveys")
async def import_batch_surveys(
    surveys: List[Dict[str, Any]],
    source: str = "kobo",
    current_user: dict = Depends(verify_token)
):
    """Import multiple surveys in batch"""
    try:
        result = await enhanced_import_service.import_batch_surveys(surveys, source)
        
        return {
            "success": True,
            "imported": result["imported"],
            "failed": result["failed"],
            "avg_quality_score": result["avg_quality_score"],
            "message": f"Imported {result['imported']} surveys, {result['failed']} failed"
        }
        
    except Exception as e:
        logger.error(f"Failed to import batch surveys: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import/file-upload")
async def import_file_upload(
    file: UploadFile = File(...),
    source: str = "generic",
    current_user: dict = Depends(verify_token)
):
    """Import surveys from uploaded file (CSV, JSON, Excel)"""
    try:
        # Read file content
        content = await file.read()
        
        # Parse based on file type
        if file.filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
            if isinstance(data, dict):
                data = [data]  # Single survey
        elif file.filename.endswith('.csv'):
            import pandas as pd
            import io
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            data = df.to_dict('records')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Import data
        result = await enhanced_import_service.import_batch_surveys(data, source)
        
        return {
            "success": True,
            "filename": file.filename,
            "imported": result["imported"],
            "failed": result["failed"],
            "avg_quality_score": result["avg_quality_score"]
        }
        
    except Exception as e:
        logger.error(f"Failed to import file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Survey Analysis Endpoints

@router.get("/analysis/survey/{survey_id}")
async def analyze_survey(
    survey_id: int,
    current_user: dict = Depends(verify_token)
):
    """Analyze a single survey using real database data"""
    try:
        result = await enhanced_analysis_service.analyze_survey(survey_id)
        
        return {
            "success": True,
            "survey_id": result.survey_id,
            "facility_name": result.facility_name,
            "facility_type": result.facility_type,
            "equipment_count": result.equipment_count,
            "total_power_rating": result.total_power_rating,
            "daily_energy_demand": result.daily_energy_demand,
            "data_quality_score": result.data_quality_score,
            "completeness_score": result.completeness_score,
            "critical_equipment_count": result.critical_equipment_count,
            "recommendations": result.recommendations,
            "statistical_insights": result.statistical_insights
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to analyze survey {survey_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis/batch")
async def analyze_batch_surveys(
    facility_ids: Optional[List[int]] = None,
    current_user: dict = Depends(verify_token)
):
    """Analyze multiple surveys/facilities"""
    try:
        result = await enhanced_analysis_service.analyze_batch_surveys(facility_ids)
        
        return {
            "success": True,
            "total_surveys": result.total_surveys,
            "total_facilities": result.total_facilities,
            "avg_data_quality": result.avg_data_quality,
            "facility_type_distribution": result.facility_type_distribution,
            "regional_distribution": result.regional_distribution,
            "equipment_patterns": result.equipment_patterns,
            "energy_demand_stats": result.energy_demand_stats,
            "recommendations": result.recommendations
        }
        
    except Exception as e:
        logger.error(f"Failed to analyze batch surveys: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/facility-distribution")
async def get_facility_distribution(
    current_user: dict = Depends(verify_token)
):
    """Get real facility distribution from database"""
    try:
        result = await enhanced_analysis_service.get_facility_distribution()
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Failed to get facility distribution: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Database Statistics Endpoints

@router.get("/stats/import-statistics")
async def get_import_statistics(
    current_user: dict = Depends(verify_token)
):
    """Get import statistics"""
    try:
        stats = await enhanced_import_service.get_import_statistics()
        
        return {
            "success": True,
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get import statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/database-health")
async def get_database_health(
    current_user: dict = Depends(verify_token)
):
    """Get database health and connectivity status"""
    try:
        from services.database_service import db_service
        from core.database import test_connection
        
        # Test connection
        connection_ok = test_connection()
        
        # Get basic stats
        stats = db_service.get_survey_statistics()
        
        # Check for data quality issues
        quality_issues = db_service.get_surveys_needing_repair()
        
        return {
            "success": True,
            "database_connected": connection_ok,
            "total_surveys": stats["total_surveys"],
            "total_facilities": stats["total_facilities"],
            "data_quality_issues": len(quality_issues),
            "health_status": "healthy" if connection_ok and len(quality_issues) == 0 else "needs_attention"
        }
        
    except Exception as e:
        logger.error(f"Failed to get database health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Data Management Endpoints

@router.get("/data/surveys")
async def list_surveys(
    limit: int = 50,
    offset: int = 0,
    facility_id: Optional[int] = None,
    current_user: dict = Depends(verify_token)
):
    """List surveys with pagination"""
    try:
        from services.database_service import db_service
        
        if facility_id:
            surveys = db_service.get_surveys_by_facility(facility_id)
        else:
            with db_service.get_session() as db:
                surveys = db.query(Survey).offset(offset).limit(limit).all()
        
        survey_data = []
        for survey in surveys:
            survey_data.append({
                "id": survey.id,
                "external_id": survey.external_id,
                "facility_id": survey.facility_id,
                "collection_date": survey.collection_date.isoformat() if survey.collection_date else None,
                "created_at": survey.created_at.isoformat() if survey.created_at else None,
                "has_raw_data": bool(survey.raw_data),
                "has_facility_data": bool(survey.facility_data)
            })
        
        return {
            "success": True,
            "surveys": survey_data,
            "total": len(survey_data),
            "offset": offset,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Failed to list surveys: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/facilities")
async def list_facilities(
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(verify_token)
):
    """List facilities with pagination"""
    try:
        from services.database_service import db_service
        
        with db_service.get_session() as db:
            facilities = db.query(Facility).offset(offset).limit(limit).all()
        
        facility_data = []
        for facility in facilities:
            # Get survey count for this facility
            surveys_count = len(db_service.get_surveys_by_facility(facility.id))
            
            facility_data.append({
                "id": facility.id,
                "name": facility.name,
                "type": facility.type.value if facility.type else None,
                "region": facility.region,
                "district": facility.district,
                "latitude": facility.latitude,
                "longitude": facility.longitude,
                "status": facility.status.value if facility.status else None,
                "surveys_count": surveys_count,
                "created_at": facility.created_at.isoformat() if facility.created_at else None
            })
        
        return {
            "success": True,
            "facilities": facility_data,
            "total": len(facility_data),
            "offset": offset,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Failed to list facilities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
