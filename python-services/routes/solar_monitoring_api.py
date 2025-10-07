"""
Solar Monitoring API Routes
FastAPI routes for solar PV monitoring system integration
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid

from core.database import get_db_session
from core.auth import verify_token
from services.solar_monitoring_service import SolarMonitoringService

router = APIRouter(
    prefix="/solar-monitoring",
    tags=["Solar Monitoring"],
    dependencies=[Depends(verify_token)]
)

# Initialize service
monitoring_service = SolarMonitoringService()

@router.get("/data/{facility_id}")
async def get_monitoring_data(
    facility_id: int,
    provider: str = Query(..., description="Monitoring system provider"),
    site_id: str = Query(..., description="Site ID in the monitoring system"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    data_type: str = Query("production", description="Type of data to retrieve"),
    resolution: str = Query("day", description="Data resolution"),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Get monitoring data from a solar monitoring system
    """
    try:
        # Parse dates
        start_date_obj = datetime.fromisoformat(start_date) if start_date else None
        end_date_obj = datetime.fromisoformat(end_date) if end_date else None
        
        # Get monitoring data
        data = await monitoring_service.get_monitoring_data(
            facility_id=facility_id,
            provider=provider,
            site_id=site_id,
            start_date=start_date_obj,
            end_date=end_date_obj,
            data_type=data_type,
            resolution=resolution
        )
        
        return data
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting monitoring data: {str(e)}")

@router.post("/correlate/{assessment_id}")
async def correlate_monitoring_with_assessment(
    assessment_id: str,
    provider: str = Query(..., description="Monitoring system provider"),
    site_id: str = Query(..., description="Site ID in the monitoring system"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    data_type: str = Query("production", description="Type of data to retrieve"),
    resolution: str = Query("day", description="Data resolution"),
    db_session: Session = Depends(get_db_session),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Correlate monitoring data with assessment results
    """
    try:
        # Parse dates
        start_date_obj = datetime.fromisoformat(start_date) if start_date else None
        end_date_obj = datetime.fromisoformat(end_date) if end_date else None
        
        # Get monitoring data
        monitoring_data = await monitoring_service.get_monitoring_data(
            facility_id=0,  # Will be overridden by assessment facility ID
            provider=provider,
            site_id=site_id,
            start_date=start_date_obj,
            end_date=end_date_obj,
            data_type=data_type,
            resolution=resolution
        )
        
        # Correlate with assessment
        correlation = await monitoring_service.correlate_monitoring_with_assessment(
            db_session=db_session,
            assessment_id=assessment_id,
            monitoring_data=monitoring_data
        )
        
        return correlation
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error correlating monitoring data: {str(e)}")

@router.post("/register")
async def register_monitoring_system(
    facility_id: int = Body(..., description="Facility ID"),
    provider: str = Body(..., description="Monitoring system provider"),
    site_id: str = Body(..., description="Site ID in the monitoring system"),
    api_key: Optional[str] = Body(None, description="API key for the monitoring system"),
    site_name: Optional[str] = Body(None, description="Name of the site"),
    site_details: Optional[Dict[str, Any]] = Body(None, description="Additional site details"),
    db_session: Session = Depends(get_db_session),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Register a monitoring system for a facility
    """
    try:
        # Register monitoring system
        result = await monitoring_service.register_monitoring_system(
            db_session=db_session,
            facility_id=facility_id,
            provider=provider,
            site_id=site_id,
            api_key=api_key,
            site_name=site_name,
            site_details=site_details
        )
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registering monitoring system: {str(e)}")

@router.post("/test-connection")
async def test_monitoring_connection(
    provider: str = Body(..., description="Monitoring system provider"),
    site_id: str = Body(..., description="Site ID in the monitoring system"),
    api_key: Optional[str] = Body(None, description="API key for the monitoring system"),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Test connection to a monitoring system
    """
    try:
        # Test connection
        result = await monitoring_service.test_monitoring_connection(
            provider=provider,
            site_id=site_id,
            api_key=api_key
        )
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing monitoring connection: {str(e)}")

@router.get("/providers")
async def get_supported_providers(
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Get list of supported monitoring system providers
    """
    return {
        "providers": [
            {"id": "solaredge", "name": "SolarEdge"},
            {"id": "enphase", "name": "Enphase"},
            {"id": "fronius", "name": "Fronius"},
            {"id": "sma", "name": "SMA"},
            {"id": "huawei", "name": "Huawei"},
            {"id": "growatt", "name": "Growatt"},
            {"id": "generic", "name": "Generic / Other"}
        ]
    }
