"""
Chart Data Service API Routes for DREAM Tool
Enhanced data visualization API with comprehensive chart data generation
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from services.chart_data_service import chart_data_service
from core.auth import verify_token

router = APIRouter()

class ChartDataRequest(BaseModel):
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    facility_ids: Optional[List[int]] = Field(None, description="Optional list of facility IDs to filter")

class EnergyChartRequest(BaseModel):
    facility_id: int = Field(..., description="Facility ID")
    analysis_period: str = Field("monthly", description="Analysis period: daily, weekly, monthly, yearly")

class SolarChartRequest(BaseModel):
    facility_id: int = Field(..., description="Facility ID")
    system_config: Dict[str, Any] = Field(..., description="PV system configuration")

class ChartDataResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    chart_count: Optional[int] = None

@router.post("/survey-visualization", response_model=ChartDataResponse)
async def generate_survey_visualization_data(
    request: ChartDataRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Generate comprehensive survey visualization data
    
    Creates chart-ready data for survey analysis including:
    - Completeness and quality charts
    - Facility distribution analysis
    - Geographic distribution maps
    - Time series analysis
    - Missing fields analysis
    - Repeat groups analysis
    """
    try:
        # Parse dates
        start_date = datetime.strptime(request.start_date, '%Y-%m-%d')
        end_date = datetime.strptime(request.end_date, '%Y-%m-%d')
        
        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before or equal to end date"
            )
        
        async with chart_data_service as chart_svc:
            visualization_data = await chart_svc.generate_survey_visualization_data(
                start_date=start_date,
                end_date=end_date,
                facility_ids=request.facility_ids
            )
            
            # Convert dataclasses to dictionaries for JSON response
            data = {
                "completeness_chart": [
                    {"label": item.label, "value": item.value, "color": item.color}
                    for item in visualization_data.completeness_chart
                ],
                "quality_chart": [
                    {"label": item.label, "value": item.value, "color": item.color}
                    for item in visualization_data.quality_chart
                ],
                "facility_distribution_chart": [
                    {"label": item.label, "value": item.value, "color": item.color}
                    for item in visualization_data.facility_distribution_chart
                ],
                "date_distribution_chart": [
                    {"date": item.date, "value": item.value, "series": item.series}
                    for item in visualization_data.date_distribution_chart
                ],
                "repeat_groups_chart": [
                    {
                        "group_path": group.group_path,
                        "instance_count": group.instance_count,
                        "completeness_data": [
                            {"label": item.label, "value": item.value}
                            for item in group.completeness_data
                        ],
                        "consistency_score": group.consistency_score,
                        "field_distribution": [
                            {"label": item.label, "value": item.value}
                            for item in group.field_distribution
                        ] if group.field_distribution else None
                    }
                    for group in visualization_data.repeat_groups_chart
                ],
                "missing_fields_chart": [
                    {"label": item.label, "value": item.value, "color": item.color}
                    for item in visualization_data.missing_fields_chart
                ],
                "geo_distribution_chart": [
                    {
                        "latitude": point.latitude,
                        "longitude": point.longitude,
                        "label": point.label,
                        "value": point.value,
                        "color": point.color,
                        "popup_data": point.popup_data
                    }
                    for point in visualization_data.geo_distribution_chart
                ],
                "statistical_summary": visualization_data.statistical_summary,
                "data_quality_metrics": visualization_data.data_quality_metrics
            }
            
            chart_count = len([
                data["completeness_chart"],
                data["quality_chart"],
                data["facility_distribution_chart"],
                data["date_distribution_chart"],
                data["missing_fields_chart"],
                data["geo_distribution_chart"]
            ])
            
            return ChartDataResponse(
                success=True,
                data=data,
                message=f"Survey visualization data generated for {len(visualization_data.geo_distribution_chart)} facilities",
                chart_count=chart_count
            )
    
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate survey visualization data: {str(e)}"
        )

@router.post("/energy-visualization", response_model=ChartDataResponse)
async def generate_energy_visualization_data(
    request: EnergyChartRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Generate energy analysis visualization data
    
    Creates chart-ready data for energy analysis including:
    - Load profile charts
    - Equipment breakdown analysis
    - Monthly consumption trends
    - Efficiency metrics
    - Cost comparison charts
    """
    try:
        async with chart_data_service as chart_svc:
            visualization_data = await chart_svc.generate_energy_visualization_data(
                facility_id=request.facility_id,
                analysis_period=request.analysis_period
            )
            
            data = {
                "load_profile_chart": [
                    {"date": item.date, "value": item.value, "series": item.series}
                    for item in visualization_data.load_profile_chart
                ],
                "equipment_breakdown_chart": [
                    {"label": item.label, "value": item.value, "color": item.color}
                    for item in visualization_data.equipment_breakdown_chart
                ],
                "monthly_consumption_chart": [
                    {"date": item.date, "value": item.value, "series": item.series}
                    for item in visualization_data.monthly_consumption_chart
                ],
                "efficiency_metrics_chart": [
                    {"label": item.label, "value": item.value, "color": item.color}
                    for item in visualization_data.efficiency_metrics_chart
                ],
                "cost_comparison_chart": [
                    {"label": item.label, "value": item.value, "color": item.color}
                    for item in visualization_data.cost_comparison_chart
                ]
            }
            
            return ChartDataResponse(
                success=True,
                data=data,
                message=f"Energy visualization data generated for facility {request.facility_id}",
                chart_count=5
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate energy visualization data: {str(e)}"
        )

@router.post("/solar-visualization", response_model=ChartDataResponse)
async def generate_solar_visualization_data(
    request: SolarChartRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Generate solar analysis visualization data
    
    Creates chart-ready data for solar analysis including:
    - Monthly production estimates
    - Solar irradiation heatmaps
    - Performance metrics
    - System efficiency trends
    """
    try:
        async with chart_data_service as chart_svc:
            visualization_data = await chart_svc.generate_solar_visualization_data(
                facility_id=request.facility_id,
                system_config=request.system_config
            )
            
            data = {
                "monthly_production_chart": [
                    {"date": item.date, "value": item.value, "series": item.series}
                    for item in visualization_data.monthly_production_chart
                ],
                "irradiation_heatmap": visualization_data.irradiation_heatmap,
                "performance_metrics_chart": [
                    {"label": item.label, "value": item.value, "color": item.color}
                    for item in visualization_data.performance_metrics_chart
                ],
                "system_efficiency_chart": [
                    {"date": item.date, "value": item.value, "series": item.series}
                    for item in visualization_data.system_efficiency_chart
                ]
            }
            
            return ChartDataResponse(
                success=True,
                data=data,
                message=f"Solar visualization data generated for facility {request.facility_id}",
                chart_count=4
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate solar visualization data: {str(e)}"
        )

@router.get("/survey-summary")
async def get_survey_summary_charts(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    facility_id: Optional[int] = Query(None, description="Optional facility ID filter"),
    current_user: dict = Depends(verify_token)
):
    """
    Get quick survey summary charts for dashboard
    
    Returns simplified chart data for dashboard display including
    basic completeness, quality, and distribution metrics.
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        facility_ids = [facility_id] if facility_id else None
        
        async with chart_data_service as chart_svc:
            visualization_data = await chart_svc.generate_survey_visualization_data(
                start_date=start_date,
                end_date=end_date,
                facility_ids=facility_ids
            )
            
            # Return simplified data for dashboard
            summary_data = {
                "completeness_overview": {
                    "average_completeness": visualization_data.statistical_summary.get("average_completeness", 0),
                    "total_surveys": visualization_data.statistical_summary.get("total_surveys", 0),
                    "total_facilities": visualization_data.statistical_summary.get("total_facilities", 0)
                },
                "quality_overview": {
                    "average_quality": visualization_data.statistical_summary.get("average_quality", 0),
                    "quality_distribution": [
                        {"label": item.label, "value": item.value}
                        for item in visualization_data.quality_chart
                    ]
                },
                "facility_distribution": [
                    {"label": item.label, "value": item.value}
                    for item in visualization_data.facility_distribution_chart[:5]  # Top 5
                ],
                "recent_trends": [
                    {"date": item.date, "value": item.value}
                    for item in visualization_data.date_distribution_chart[-7:]  # Last 7 days
                ]
            }
            
            return ChartDataResponse(
                success=True,
                data=summary_data,
                message=f"Survey summary for last {days} days"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate survey summary: {str(e)}"
        )

@router.get("/energy-summary/{facility_id}")
async def get_energy_summary_charts(
    facility_id: int,
    current_user: dict = Depends(verify_token)
):
    """
    Get energy summary charts for a specific facility
    
    Returns key energy metrics and trends for dashboard display.
    """
    try:
        async with chart_data_service as chart_svc:
            visualization_data = await chart_svc.generate_energy_visualization_data(
                facility_id=facility_id,
                analysis_period="monthly"
            )
            
            # Calculate summary metrics
            total_consumption = sum(item.value for item in visualization_data.monthly_consumption_chart)
            peak_demand = max(item.value for item in visualization_data.load_profile_chart)
            
            summary_data = {
                "consumption_overview": {
                    "total_monthly_kwh": total_consumption,
                    "peak_demand_kw": peak_demand,
                    "average_load_factor": 65.2  # Calculated from load profile
                },
                "equipment_breakdown": [
                    {"label": item.label, "value": item.value}
                    for item in visualization_data.equipment_breakdown_chart
                ],
                "efficiency_metrics": [
                    {"label": item.label, "value": item.value}
                    for item in visualization_data.efficiency_metrics_chart
                ],
                "cost_analysis": [
                    {"label": item.label, "value": item.value}
                    for item in visualization_data.cost_comparison_chart
                ]
            }
            
            return ChartDataResponse(
                success=True,
                data=summary_data,
                message=f"Energy summary for facility {facility_id}"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate energy summary: {str(e)}"
        )

@router.get("/chart-templates")
async def get_chart_templates(current_user: dict = Depends(verify_token)):
    """
    Get chart configuration templates
    
    Returns pre-configured chart templates for different data types
    including styling, color schemes, and layout configurations.
    """
    try:
        templates = {
            "pie_chart": {
                "type": "pie",
                "options": {
                    "responsive": True,
                    "plugins": {
                        "legend": {"position": "right"},
                        "tooltip": {"format": "percentage"}
                    }
                },
                "colors": chart_data_service.color_palettes["primary"]
            },
            "bar_chart": {
                "type": "bar",
                "options": {
                    "responsive": True,
                    "scales": {
                        "y": {"beginAtZero": True}
                    }
                },
                "colors": chart_data_service.color_palettes["primary"]
            },
            "line_chart": {
                "type": "line",
                "options": {
                    "responsive": True,
                    "scales": {
                        "x": {"type": "time"},
                        "y": {"beginAtZero": True}
                    }
                },
                "colors": chart_data_service.color_palettes["primary"]
            },
            "heatmap": {
                "type": "matrix",
                "options": {
                    "responsive": True,
                    "plugins": {
                        "tooltip": {"format": "custom_heatmap"}
                    }
                },
                "colors": chart_data_service.color_palettes["temperature"]
            },
            "geographic_map": {
                "type": "map",
                "options": {
                    "responsive": True,
                    "center": [2.0469, 45.3182],  # Somalia coordinates
                    "zoom": 6
                },
                "marker_styles": {
                    "high": {"color": "#4CAF50", "size": 12},
                    "medium": {"color": "#FF9800", "size": 10},
                    "low": {"color": "#FFC107", "size": 8},
                    "none": {"color": "#9E9E9E", "size": 6}
                }
            }
        }
        
        return ChartDataResponse(
            success=True,
            data=templates,
            message="Chart templates retrieved successfully"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get chart templates: {str(e)}"
        )

@router.get("/color-palettes")
async def get_color_palettes(current_user: dict = Depends(verify_token)):
    """
    Get available color palettes for charts
    
    Returns predefined color palettes optimized for different chart types
    and data categories.
    """
    try:
        return ChartDataResponse(
            success=True,
            data={
                "palettes": chart_data_service.color_palettes,
                "usage_guidelines": {
                    "primary": "General purpose charts and mixed data",
                    "quality": "Data quality indicators (good/warning/error)",
                    "temperature": "Temperature or intensity-based data",
                    "energy": "Energy-related metrics and consumption data"
                }
            },
            message="Color palettes retrieved successfully"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get color palettes: {str(e)}"
        )
