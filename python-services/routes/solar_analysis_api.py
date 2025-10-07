"""
Solar Analysis API - Routes for solar PV component analysis
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from fastapi.responses import JSONResponse
import uuid
import logging
from typing import Dict, Any, List, Optional
from io import BytesIO
import json
import os
from datetime import datetime

from core.auth import verify_token
from core.database import get_db_session
from models.solar_analysis_models import (
    SolarSystemAssessment, SolarComponentDetected, SystemCapacityAnalysis,
    DetectedIssue, UpgradeRecommendation, ComponentType, AnalysisStatus
)
from services.solar_vision_service import SolarVisionService
from services.solar_photo_service import SolarPhotoService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/solar-analysis", tags=["Solar Analysis"])

# Initialize services
vision_service = SolarVisionService()
photo_service = SolarPhotoService()

@router.post("/assessments")
async def create_assessment(
    facility_id: int = Form(...),
    submission_id: str = Form(...),
    surveyor_name: str = Form(None),
    submission_source: str = Form("manual_upload"),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Create a new solar system assessment
    """
    try:
        logger.info(f"User {current_user['id']} creating assessment for facility {facility_id}")
        
        # Create assessment record
        db_session = next(get_db_session())
        assessment = SolarSystemAssessment(
            facility_id=facility_id,
            submission_id=submission_id,
            surveyor_name=surveyor_name,
            submission_source=submission_source,
            analysis_status=AnalysisStatus.PENDING
        )
        db_session.add(assessment)
        db_session.commit()
        
        return {
            "success": True,
            "assessment_id": str(assessment.id),
            "facility_id": facility_id,
            "status": assessment.analysis_status.value
        }
    
    except Exception as e:
        logger.error(f"Error creating assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating assessment: {str(e)}")

@router.post("/assessments/{assessment_id}/upload")
async def upload_component_photo(
    assessment_id: str,
    component_type: str = Form(...),
    photo: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Upload a photo for a component
    """
    try:
        logger.info(f"User {current_user['id']} uploading {component_type} photo for assessment {assessment_id}")
        
        # Validate component type
        try:
            component_type_enum = ComponentType(component_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid component type: {component_type}")
        
        # Validate assessment exists
        db_session = next(get_db_session())
        assessment = db_session.query(SolarSystemAssessment).filter(
            SolarSystemAssessment.id == assessment_id
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail=f"Assessment not found: {assessment_id}")
        
        # Read file content
        contents = await photo.read()
        
        # Store photo
        image_data = BytesIO(contents)
        stored_path = photo_service.store_photo(image_data, photo.filename)
        
        # Create full URL
        photo_url = f"/storage/solar_images/{stored_path}"
        
        # Create component in database
        component = SolarComponentDetected(
            assessment_id=assessment_id,
            component_type=component_type_enum,
            photo_url=photo_url,
            original_photo_url=photo_url,
            detection_confidence=0.0,
            analysis_results={}
        )
        db_session.add(component)
        db_session.commit()
        
        # Analyze component in background if requested
        if background_tasks:
            background_tasks.add_task(
                _analyze_component,
                component_id=str(component.id)
            )
        
        return {
            "success": True,
            "assessment_id": assessment_id,
            "component_id": str(component.id),
            "component_type": component_type,
            "photo_url": photo_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading component photo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading component photo: {str(e)}")

@router.post("/assessments/{assessment_id}/analyze")
async def analyze_assessment(
    assessment_id: str,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Analyze a solar system assessment
    """
    try:
        logger.info(f"User {current_user['id']} requesting analysis for assessment {assessment_id}")
        
        # Validate assessment exists
        db_session = next(get_db_session())
        assessment = db_session.query(SolarSystemAssessment).filter(
            SolarSystemAssessment.id == assessment_id
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail=f"Assessment not found: {assessment_id}")
        
        # Check if assessment has components
        components = db_session.query(SolarComponentDetected).filter(
            SolarComponentDetected.assessment_id == assessment_id
        ).all()
        
        if not components:
            raise HTTPException(status_code=400, detail="Assessment has no components to analyze")
        
        # Update status to processing
        assessment.analysis_status = AnalysisStatus.PROCESSING
        db_session.commit()
        
        # Start analysis in background
        background_tasks.add_task(
            _process_assessment,
            assessment_id=assessment_id
        )
        
        return {
            "success": True,
            "assessment_id": assessment_id,
            "status": "processing",
            "message": "Assessment analysis started"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting assessment analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting assessment analysis: {str(e)}")

@router.get("/assessments/{assessment_id}")
async def get_assessment(
    assessment_id: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Get assessment details
    """
    try:
        logger.info(f"User {current_user['id']} getting assessment {assessment_id}")
        
        # Get assessment from database
        db_session = next(get_db_session())
        assessment = db_session.query(SolarSystemAssessment).filter(
            SolarSystemAssessment.id == assessment_id
        ).first()
        
        if not assessment:
            raise HTTPException(status_code=404, detail=f"Assessment not found: {assessment_id}")
        
        # Get components
        components = db_session.query(SolarComponentDetected).filter(
            SolarComponentDetected.assessment_id == assessment_id
        ).all()
        
        # Get capacity analysis
        capacity = db_session.query(SystemCapacityAnalysis).filter(
            SystemCapacityAnalysis.assessment_id == assessment_id
        ).first()
        
        # Get issues
        issues = db_session.query(DetectedIssue).filter(
            DetectedIssue.assessment_id == assessment_id
        ).order_by(DetectedIssue.severity).all()
        
        # Get recommendations
        recommendations = db_session.query(UpgradeRecommendation).filter(
            UpgradeRecommendation.assessment_id == assessment_id
        ).order_by(UpgradeRecommendation.priority).all()
        
        # Build response
        response = {
            "id": str(assessment.id),
            "facility_id": assessment.facility_id,
            "submission_id": assessment.submission_id,
            "assessment_date": assessment.assessment_date.isoformat(),
            "surveyor_name": assessment.surveyor_name,
            "submission_source": assessment.submission_source.value,
            "analysis_status": assessment.analysis_status.value,
            "overall_confidence_score": assessment.overall_confidence_score,
            "created_at": assessment.created_at.isoformat(),
            "components": [
                {
                    "id": str(component.id),
                    "component_type": component.component_type.value,
                    "photo_url": component.photo_url,
                    "annotated_photo_url": component.annotated_photo_url,
                    "detection_confidence": component.detection_confidence,
                    "analysis_results": component.analysis_results
                }
                for component in components
            ]
        }
        
        # Add capacity analysis if available
        if capacity:
            response["capacity"] = {
                "id": str(capacity.id),
                "solar_capacity_kw": capacity.solar_capacity_kw,
                "panel_count": capacity.panel_count,
                "individual_panel_watts": capacity.individual_panel_watts,
                "battery_capacity_kwh": capacity.battery_capacity_kwh,
                "battery_count": capacity.battery_count,
                "battery_voltage": capacity.battery_voltage,
                "battery_ah": capacity.battery_ah,
                "inverter_capacity_kw": capacity.inverter_capacity_kw,
                "inverter_type": capacity.inverter_type,
                "mppt_capacity_kw": capacity.mppt_capacity_kw,
                "estimated_backup_hours": capacity.estimated_backup_hours,
                "system_balance_status": capacity.system_balance_status,
                "total_system_summary": capacity.total_system_summary,
                "is_balanced": capacity.is_balanced
            }
        
        # Add issues if available
        response["issues"] = [
            {
                "id": str(issue.id),
                "component_type": issue.component_type.value,
                "issue_type": issue.issue_type,
                "severity": issue.severity.value,
                "description": issue.description,
                "impact_description": issue.impact_description,
                "estimated_power_loss_percent": issue.estimated_power_loss_percent,
                "photo_evidence_url": issue.photo_evidence_url,
                "confidence_score": issue.confidence_score
            }
            for issue in issues
        ]
        
        # Add recommendations if available
        response["recommendations"] = [
            {
                "id": str(rec.id),
                "recommendation_type": rec.recommendation_type.value,
                "priority": rec.priority.value,
                "title": rec.title,
                "description": rec.description,
                "current_value": rec.current_value,
                "recommended_value": rec.recommended_value,
                "estimated_cost_usd": rec.estimated_cost_usd,
                "estimated_annual_savings_usd": rec.estimated_annual_savings_usd,
                "payback_period_months": rec.payback_period_months,
                "implementation_notes": rec.implementation_notes,
                "roi_calculation": rec.roi_calculation
            }
            for rec in recommendations
        ]
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting assessment: {str(e)}")

@router.get("/assessments")
async def list_assessments(
    facility_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    List solar system assessments
    """
    try:
        logger.info(f"User {current_user['id']} listing assessments")
        
        # Build query
        db_session = next(get_db_session())
        query = db_session.query(SolarSystemAssessment)
        
        # Apply filters
        if facility_id is not None:
            query = query.filter(SolarSystemAssessment.facility_id == facility_id)
        
        if status is not None:
            try:
                status_enum = AnalysisStatus(status)
                query = query.filter(SolarSystemAssessment.analysis_status == status_enum)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        # Count total
        total = query.count()
        
        # Apply pagination
        query = query.order_by(SolarSystemAssessment.assessment_date.desc())
        query = query.limit(limit).offset(offset)
        
        # Execute query
        assessments = query.all()
        
        # Build response
        response = {
            "total": total,
            "limit": limit,
            "offset": offset,
            "assessments": [
                {
                    "id": str(assessment.id),
                    "facility_id": assessment.facility_id,
                    "assessment_date": assessment.assessment_date.isoformat(),
                    "surveyor_name": assessment.surveyor_name,
                    "analysis_status": assessment.analysis_status.value,
                    "overall_confidence_score": assessment.overall_confidence_score,
                    "created_at": assessment.created_at.isoformat()
                }
                for assessment in assessments
            ]
        }
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing assessments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing assessments: {str(e)}")

@router.post("/webhooks/kobo")
async def kobo_webhook(
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any]
):
    """
    Handle KoboToolbox webhook
    """
    try:
        logger.info("Received KoboToolbox webhook")
        
        # Verify webhook signature
        # TODO: Implement signature verification
        
        # Extract metadata
        facility_id = payload.get("facility_id")
        submission_id = payload.get("_id")
        surveyor_name = payload.get("surveyor_name", "Unknown")
        
        # Validate required fields
        if not facility_id or not submission_id:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: facility_id or submission_id"
            )
        
        # Extract photo attachments
        attachments = payload.get("_attachments", [])
        photo_mapping = _map_photos_to_components(attachments, payload)
        
        if not photo_mapping:
            raise HTTPException(
                status_code=400,
                detail="No solar component photos found in submission"
            )
        
        # Create assessment record
        db_session = next(get_db_session())
        assessment = SolarSystemAssessment(
            facility_id=facility_id,
            submission_id=submission_id,
            surveyor_name=surveyor_name,
            submission_source="kobocollect",
            analysis_status=AnalysisStatus.PENDING
        )
        db_session.add(assessment)
        db_session.commit()
        
        # Process photos in background
        background_tasks.add_task(
            _process_kobo_submission,
            assessment_id=str(assessment.id),
            photo_mapping=photo_mapping,
            submission_data=payload
        )
        
        return {
            "success": True,
            "assessment_id": str(assessment.id),
            "message": "Assessment created and queued for processing"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Internal server error: {str(e)}"}
        )

# Helper functions
def _map_photos_to_components(attachments: List[Dict[str, Any]], submission_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Map photo filenames to component types"""
    component_mapping = {
        "solar_panels_overview": "solar_panel",
        "solar_panels_closeup": "solar_panel",
        "battery_bank_complete": "battery",
        "battery_labels": "battery",
        "inverter_complete": "inverter",
        "inverter_label": "inverter",
        "mppt_controller": "mppt",
        "mppt_label": "mppt"
    }
    
    photo_mapping = {}
    for field_name, component_type in component_mapping.items():
        filename = submission_data.get(field_name)
        if filename:
            attachment = next(
                (a for a in attachments if a.get("filename") == filename),
                None
            )
            if attachment:
                photo_mapping[field_name] = {
                    "component_type": component_type,
                    "download_url": attachment.get("download_url") or attachment.get("download_large_url"),
                    "filename": filename
                }
    
    return photo_mapping

async def _process_kobo_submission(assessment_id: str, photo_mapping: Dict[str, Dict[str, Any]], submission_data: Dict[str, Any]):
    """Process KoboToolbox submission"""
    try:
        logger.info(f"Processing KoboToolbox submission for assessment {assessment_id}")
        
        # Process photos
        result = await photo_service.process_kobo_submission(
            assessment_id=assessment_id,
            photo_mapping=photo_mapping
        )
        
        # Update assessment status
        db_session = next(get_db_session())
        assessment = db_session.query(SolarSystemAssessment).filter(
            SolarSystemAssessment.id == assessment_id
        ).first()
        
        if assessment:
            if result.get("failed"):
                logger.warning(f"Some photos failed processing: {len(result['failed'])}")
            
            if result.get("processed"):
                # Start analysis
                await vision_service.process_assessment(assessment_id)
            else:
                assessment.analysis_status = AnalysisStatus.FAILED
                db_session.commit()
                logger.error(f"No photos processed for assessment {assessment_id}")
        
    except Exception as e:
        logger.error(f"Error processing KoboToolbox submission: {str(e)}")
        
        # Update assessment status to failed
        try:
            db_session = next(get_db_session())
            assessment = db_session.query(SolarSystemAssessment).filter(
                SolarSystemAssessment.id == assessment_id
            ).first()
            
            if assessment:
                assessment.analysis_status = AnalysisStatus.FAILED
                db_session.commit()
        except Exception:
            pass

async def _analyze_component(component_id: str):
    """Analyze a single component"""
    try:
        logger.info(f"Analyzing component {component_id}")
        
        # Get component from database
        db_session = next(get_db_session())
        component = db_session.query(SolarComponentDetected).filter(
            SolarComponentDetected.id == component_id
        ).first()
        
        if not component:
            logger.error(f"Component not found: {component_id}")
            return
        
        # Analyze component
        if component.component_type == ComponentType.SOLAR_PANEL:
            analysis = await vision_service.analyze_solar_panels(component.photo_url)
        elif component.component_type == ComponentType.BATTERY:
            analysis = await vision_service.analyze_batteries(component.photo_url)
        elif component.component_type == ComponentType.INVERTER:
            analysis = await vision_service.analyze_inverter(component.photo_url)
        elif component.component_type == ComponentType.MPPT:
            analysis = await vision_service.analyze_mppt(component.photo_url)
        else:
            logger.warning(f"Unknown component type: {component.component_type}")
            return
        
        # Update component
        component.analysis_results = analysis
        component.detection_confidence = analysis.get("confidence", 0.0)
        db_session.commit()
        
        logger.info(f"Component {component_id} analysis completed")
    
    except Exception as e:
        logger.error(f"Error analyzing component: {str(e)}")

async def _process_assessment(assessment_id: str):
    """Process a complete assessment"""
    try:
        logger.info(f"Processing assessment {assessment_id}")
        
        # Process assessment
        result = await vision_service.process_assessment(assessment_id)
        
        if "error" in result:
            logger.error(f"Assessment processing error: {result['error']}")
        else:
            logger.info(f"Assessment {assessment_id} processing completed successfully")
    
    except Exception as e:
        logger.error(f"Error processing assessment: {str(e)}")
        
        # Update assessment status to failed
        try:
            db_session = next(get_db_session())
            assessment = db_session.query(SolarSystemAssessment).filter(
                SolarSystemAssessment.id == assessment_id
            ).first()
            
            if assessment:
                assessment.analysis_status = AnalysisStatus.FAILED
                db_session.commit()
        except Exception:
            pass
