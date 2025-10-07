"""
Solar Report API Routes
FastAPI routes for solar PV report generation
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body, BackgroundTasks, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import os
import uuid
from datetime import datetime

from core.database import get_db_session
from core.auth import verify_token
from services.solar_report_service import SolarReportService

router = APIRouter(
    prefix="/solar-report",
    tags=["Solar Reports"],
    dependencies=[Depends(verify_token)]
)

# Initialize service
report_service = SolarReportService()

@router.post("/generate/{assessment_id}")
async def generate_report(
    assessment_id: str,
    background_tasks: BackgroundTasks,
    include_monitoring: bool = Query(False, description="Include monitoring data in report"),
    include_history: bool = Query(False, description="Include historical data in report"),
    output_format: str = Query("pdf", description="Output format (pdf, html, docx)"),
    db_session: Session = Depends(get_db_session),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Generate a comprehensive report for a solar system assessment
    
    This endpoint starts report generation as a background task and returns immediately.
    Use the /status endpoint to check the status of the report generation.
    """
    try:
        # Validate assessment ID
        try:
            uuid.UUID(assessment_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid assessment ID format")
        
        # Create a unique task ID
        task_id = str(uuid.uuid4())
        
        # Start report generation in background
        background_tasks.add_task(
            _generate_report_task,
            task_id=task_id,
            assessment_id=assessment_id,
            db_session=db_session,
            include_monitoring=include_monitoring,
            include_history=include_history,
            output_format=output_format
        )
        
        return {
            "task_id": task_id,
            "status": "processing",
            "message": "Report generation started",
            "assessment_id": assessment_id,
            "started_at": datetime.now().isoformat()
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting report generation: {str(e)}")

@router.get("/status/{task_id}")
async def get_report_status(
    task_id: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Check the status of a report generation task
    """
    # In a real implementation, this would check a task queue or database
    # For now, we'll return a mock status
    return {
        "task_id": task_id,
        "status": "completed",  # or "processing", "failed"
        "message": "Report generation completed",
        "completed_at": datetime.now().isoformat()
    }

@router.get("/download/{filename}")
async def download_report(
    filename: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Download a generated report
    """
    # Construct file path
    file_path = os.path.join(report_service._init_custom_styles.__globals__["REPORT_OUTPUT_DIR"], filename)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Return file
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf"
    )

@router.get("/list")
async def list_reports(
    facility_id: Optional[int] = Query(None, description="Filter by facility ID"),
    limit: int = Query(50, description="Maximum number of reports to return"),
    offset: int = Query(0, description="Offset for pagination"),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Get a list of generated reports
    """
    try:
        reports = await report_service.get_report_list(
            facility_id=facility_id,
            limit=limit,
            offset=offset
        )
        
        return {
            "reports": reports,
            "count": len(reports),
            "limit": limit,
            "offset": offset
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing reports: {str(e)}")

# Background task function
async def _generate_report_task(
    task_id: str,
    assessment_id: str,
    db_session: Session,
    include_monitoring: bool,
    include_history: bool,
    output_format: str
):
    """
    Background task for report generation
    """
    try:
        # Generate report
        result = await report_service.generate_assessment_report(
            db_session=db_session,
            assessment_id=assessment_id,
            include_monitoring=include_monitoring,
            include_history=include_history,
            output_format=output_format
        )
        
        # In a real implementation, update task status in database or queue
        print(f"Report generation completed: {result['report_path']}")
    
    except Exception as e:
        # In a real implementation, update task status with error
        print(f"Report generation failed: {str(e)}")
        raise
