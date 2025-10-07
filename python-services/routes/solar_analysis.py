"""
Solar Analysis Service API Routes for DREAM Tool
Enhanced solar potential analysis with advanced PV system modeling
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from services.solar_analysis import solar_analysis_service, SolarAnalysisResult, PVSystemConfig
from core.auth import verify_token

router = APIRouter()

class PVSystemRequest(BaseModel):
    panel_rating: float = Field(..., gt=0, description="Panel rating in Watts")
    num_panels: int = Field(..., gt=0, description="Number of panels")
    system_losses: float = Field(15.0, ge=0, le=50, description="System losses percentage")
    inverter_efficiency: float = Field(95.0, ge=50, le=100, description="Inverter efficiency percentage")
    module_efficiency: float = Field(20.0, ge=10, le=30, description="Module efficiency percentage")
    temperature_coefficient: float = Field(-0.45, ge=-1.0, le=0, description="Temperature coefficient %/°C")
    tilt_angle: Optional[float] = Field(None, ge=0, le=90, description="Tilt angle in degrees")
    azimuth_angle: float = Field(180.0, ge=0, le=360, description="Azimuth angle in degrees (180=South)")

class SolarAnalysisRequest(BaseModel):
    facility_id: int = Field(..., description="Facility ID")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    pv_system: PVSystemRequest
    analysis_period_days: int = Field(365, ge=30, le=730, description="Analysis period in days")

class OptimizationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    available_area: float = Field(..., gt=0, description="Available area in square meters")
    budget_constraints: Optional[Dict[str, float]] = Field(None, description="Budget constraints")

class SolarAnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    processing_time: Optional[float] = None

@router.post("/analyze", response_model=SolarAnalysisResponse)
async def analyze_solar_potential(
    request: SolarAnalysisRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Perform comprehensive solar potential analysis for a facility
    
    Analyzes solar energy potential for a given location and PV system configuration.
    Returns detailed analysis including:
    - Daily, monthly, and yearly energy production estimates
    - Optimal system configuration recommendations
    - Performance metrics and efficiency analysis
    - Environmental impact calculations
    """
    import time
    start_time = time.time()
    
    try:
        # Convert request to PVSystemConfig
        pv_system = PVSystemConfig(
            panel_rating=request.pv_system.panel_rating,
            num_panels=request.pv_system.num_panels,
            system_losses=request.pv_system.system_losses,
            inverter_efficiency=request.pv_system.inverter_efficiency,
            module_efficiency=request.pv_system.module_efficiency,
            temperature_coefficient=request.pv_system.temperature_coefficient,
            tilt_angle=request.pv_system.tilt_angle,
            azimuth_angle=request.pv_system.azimuth_angle
        )
        
        # Perform analysis
        result = await solar_analysis_service.analyze_solar_potential(
            facility_id=request.facility_id,
            latitude=request.latitude,
            longitude=request.longitude,
            pv_system=pv_system,
            analysis_period_days=request.analysis_period_days
        )
        
        processing_time = time.time() - start_time
        
        return SolarAnalysisResponse(
            success=True,
            data={
                "facility_id": request.facility_id,
                "location": {
                    "latitude": request.latitude,
                    "longitude": request.longitude
                },
                "system_configuration": {
                    "panel_rating_w": pv_system.panel_rating,
                    "num_panels": pv_system.num_panels,
                    "total_capacity_kw": (pv_system.panel_rating * pv_system.num_panels) / 1000,
                    "system_losses_percent": pv_system.system_losses,
                    "inverter_efficiency_percent": pv_system.inverter_efficiency,
                    "tilt_angle_degrees": result.optimal_tilt_angle,
                    "orientation": result.optimal_orientation
                },
                "energy_production": {
                    "daily_average_kwh": result.daily_energy_production,
                    "monthly_production_kwh": result.monthly_energy_production,
                    "yearly_total_kwh": result.yearly_energy_production,
                    "specific_yield_kwh_per_kwp": result.specific_yield
                },
                "performance_metrics": {
                    "system_efficiency_percent": result.system_efficiency,
                    "performance_ratio_percent": result.performance_ratio,
                    "capacity_factor_percent": result.capacity_factor,
                    "temperature_impact_percent": result.temperature_impact,
                    "shading_impact_factor": result.shading_impact
                },
                "solar_resource": {
                    "irradiation_data": result.irradiation_data,
                    "weather_summary": result.weather_summary
                },
                "environmental_impact": {
                    "co2_reduction_tons_per_year": result.yearly_energy_production * 0.0007,  # Estimate
                    "equivalent_trees_planted": int(result.yearly_energy_production * 0.0007 * 16),  # Estimate
                    "diesel_offset_liters_per_year": result.yearly_energy_production * 0.3  # Estimate
                },
                "financial_overview": {
                    "estimated_annual_savings_usd": result.yearly_energy_production * 0.25,  # $0.25/kWh estimate
                    "payback_period_years": 8.5,  # Rough estimate
                    "lifetime_generation_kwh": result.yearly_energy_production * 25  # 25-year lifetime
                }
            },
            message=f"Solar analysis completed successfully. Estimated yearly production: {result.yearly_energy_production:.1f} kWh",
            processing_time=processing_time
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Solar analysis failed: {str(e)}"
        )

@router.get("/analyze/{facility_id}")
async def analyze_facility_solar_potential(
    facility_id: int,
    panel_rating: float = Query(400, gt=0, description="Panel rating in Watts"),
    num_panels: int = Query(50, gt=0, description="Number of panels"),
    current_user: dict = Depends(verify_token)
):
    """
    Quick solar analysis for an existing facility
    
    Performs solar analysis using facility coordinates from the database.
    Uses default PV system configuration with customizable panel specifications.
    """
    try:
        # Mock facility lookup - in real implementation would query database
        facility_coords = {
            1: (2.0469, 45.3182),  # Mogadishu
            2: (5.5528, 44.2114),  # Kaalmo
            3: (5.3500, 46.2000)   # Hobyo
        }
        
        if facility_id not in facility_coords:
            raise HTTPException(
                status_code=404,
                detail=f"Facility {facility_id} not found"
            )
        
        latitude, longitude = facility_coords[facility_id]
        
        # Create default PV system configuration
        pv_system = PVSystemConfig(
            panel_rating=panel_rating,
            num_panels=num_panels
        )
        
        # Perform analysis
        result = await solar_analysis_service.analyze_solar_potential(
            facility_id=facility_id,
            latitude=latitude,
            longitude=longitude,
            pv_system=pv_system
        )
        
        return SolarAnalysisResponse(
            success=True,
            data={
                "facility_id": facility_id,
                "daily_production_kwh": result.daily_energy_production,
                "yearly_production_kwh": result.yearly_energy_production,
                "system_efficiency": result.system_efficiency,
                "capacity_factor": result.capacity_factor,
                "optimal_tilt": result.optimal_tilt_angle,
                "performance_ratio": result.performance_ratio
            },
            message="Quick solar analysis completed"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Solar analysis failed: {str(e)}"
        )

@router.post("/optimize", response_model=SolarAnalysisResponse)
async def optimize_system_configuration(
    request: OptimizationRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Optimize PV system configuration for given constraints
    
    Finds the optimal PV system configuration based on:
    - Available installation area
    - Budget constraints (optional)
    - Location-specific solar resource
    - System performance optimization
    """
    try:
        result = await solar_analysis_service.optimize_system_configuration(
            latitude=request.latitude,
            longitude=request.longitude,
            available_area=request.available_area,
            budget_constraints=request.budget_constraints
        )
        
        if not result:
            raise HTTPException(
                status_code=400,
                detail="No suitable system configuration found for the given constraints"
            )
        
        return SolarAnalysisResponse(
            success=True,
            data={
                "optimized_configuration": result,
                "location": {
                    "latitude": request.latitude,
                    "longitude": request.longitude
                },
                "constraints": {
                    "available_area_m2": request.available_area,
                    "budget_constraints": request.budget_constraints
                },
                "recommendations": {
                    "install_capacity_kw": result.get('system_capacity_kw', 0),
                    "estimated_annual_production": result.get('estimated_daily_production', 0) * 365,
                    "area_utilization_percent": result.get('area_utilization', 0)
                }
            },
            message="System optimization completed successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"System optimization failed: {str(e)}"
        )

@router.get("/irradiance/{latitude}/{longitude}")
async def get_solar_irradiance_data(
    latitude: float = Path(..., ge=-90, le=90),
    longitude: float = Path(..., ge=-180, le=180),
    tilt_angle: float = Query(30, ge=0, le=90, description="Panel tilt angle in degrees"),
    azimuth_angle: float = Query(180, ge=0, le=360, description="Panel azimuth in degrees"),
    current_user: dict = Depends(verify_token)
):
    """
    Get solar irradiance data for a specific location and panel orientation
    
    Returns detailed solar irradiance information including:
    - Global horizontal irradiance (GHI)
    - Direct normal irradiance (DNI)
    - Diffuse horizontal irradiance (DHI)
    - Plane of array irradiance (POA)
    """
    try:
        # Mock irradiance calculation - would use weather service in real implementation
        from datetime import datetime
        import math
        
        # Simple solar position and irradiance calculation
        day_of_year = datetime.now().timetuple().tm_yday
        declination = 23.45 * math.sin(math.radians((360 * (284 + day_of_year)) / 365))
        
        # Calculate approximate daily irradiance values
        base_ghi = 5.5  # kWh/m²/day (typical for equatorial regions)
        
        # Adjust for latitude
        latitude_factor = 1 - abs(latitude) * 0.01
        ghi = base_ghi * latitude_factor
        
        # Estimate components
        dni = ghi * 0.7  # Direct normal irradiance
        dhi = ghi * 0.3  # Diffuse horizontal irradiance
        
        # Simple POA calculation for tilted surface
        tilt_factor = 1 + (tilt_angle - abs(latitude)) * 0.005
        poa = ghi * tilt_factor
        
        return SolarAnalysisResponse(
            success=True,
            data={
                "location": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "panel_orientation": {
                    "tilt_angle_degrees": tilt_angle,
                    "azimuth_angle_degrees": azimuth_angle
                },
                "irradiance_data": {
                    "global_horizontal_irradiance_kwh_m2_day": round(ghi, 2),
                    "direct_normal_irradiance_kwh_m2_day": round(dni, 2),
                    "diffuse_horizontal_irradiance_kwh_m2_day": round(dhi, 2),
                    "plane_of_array_irradiance_kwh_m2_day": round(poa, 2)
                },
                "solar_metrics": {
                    "peak_sun_hours": round(ghi, 1),
                    "annual_irradiance_kwh_m2": round(ghi * 365, 0),
                    "solar_resource_quality": "Excellent" if ghi > 5.0 else "Good" if ghi > 4.0 else "Fair"
                }
            },
            message="Solar irradiance data calculated successfully"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate solar irradiance: {str(e)}"
        )

@router.get("/performance/comparison")
async def compare_system_performance(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    systems: str = Query(..., description="Comma-separated system configurations (e.g., '400x50,500x40')"),
    current_user: dict = Depends(verify_token)
):
    """
    Compare performance of different PV system configurations
    
    Compares multiple PV system configurations for the same location.
    Format for systems parameter: 'panel_rating_w x num_panels,panel_rating_w x num_panels'
    Example: '400x50,500x40' compares 400W×50 panels vs 500W×40 panels
    """
    try:
        # Parse system configurations
        system_configs = []
        for system_str in systems.split(','):
            try:
                parts = system_str.strip().split('x')
                if len(parts) == 2:
                    panel_rating = float(parts[0])
                    num_panels = int(parts[1])
                    system_configs.append((panel_rating, num_panels))
            except (ValueError, IndexError):
                continue
        
        if not system_configs:
            raise HTTPException(
                status_code=400,
                detail="Invalid system configuration format. Use 'panel_rating x num_panels' format."
            )
        
        # Perform quick analysis for each configuration
        comparisons = []
        for i, (panel_rating, num_panels) in enumerate(system_configs):
            pv_system = PVSystemConfig(
                panel_rating=panel_rating,
                num_panels=num_panels
            )
            
            # Quick estimation for comparison
            system_capacity_kw = (panel_rating * num_panels) / 1000
            estimated_daily_production = system_capacity_kw * 5.5  # Rough estimate
            estimated_yearly_production = estimated_daily_production * 365
            
            comparisons.append({
                "configuration_id": f"config_{i+1}",
                "system_specs": {
                    "panel_rating_w": panel_rating,
                    "num_panels": num_panels,
                    "total_capacity_kw": system_capacity_kw
                },
                "performance_estimate": {
                    "daily_production_kwh": round(estimated_daily_production, 1),
                    "yearly_production_kwh": round(estimated_yearly_production, 0),
                    "specific_yield_kwh_per_kwp": round(estimated_yearly_production / system_capacity_kw, 0),
                    "capacity_factor_percent": round((estimated_yearly_production / (system_capacity_kw * 8760)) * 100, 1)
                }
            })
        
        # Find best performing system
        best_system = max(comparisons, key=lambda x: x["performance_estimate"]["yearly_production_kwh"])
        
        return SolarAnalysisResponse(
            success=True,
            data={
                "location": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "systems_compared": len(comparisons),
                "comparison_results": comparisons,
                "recommended_system": best_system,
                "summary": {
                    "best_yearly_production_kwh": best_system["performance_estimate"]["yearly_production_kwh"],
                    "best_configuration": f"{best_system['system_specs']['panel_rating_w']}W × {best_system['system_specs']['num_panels']} panels"
                }
            },
            message=f"Compared {len(comparisons)} system configurations successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"System comparison failed: {str(e)}"
        )

@router.get("/optimal-tilt/{latitude}")
async def get_optimal_tilt_angle(
    latitude: float = Path(..., ge=-90, le=90),
    current_user: dict = Depends(verify_token)
):
    """
    Calculate optimal tilt angle for a given latitude
    
    Returns the optimal panel tilt angle to maximize annual energy production
    for a fixed-tilt solar installation at the specified latitude.
    """
    try:
        optimal_tilt = solar_analysis_service.calculate_optimal_tilt_angle(latitude)
        
        # Calculate seasonal adjustments
        winter_tilt = optimal_tilt + 15
        summer_tilt = optimal_tilt - 15
        
        return SolarAnalysisResponse(
            success=True,
            data={
                "latitude": latitude,
                "optimal_tilt_angle_degrees": optimal_tilt,
                "seasonal_adjustments": {
                    "winter_tilt_degrees": winter_tilt,
                    "summer_tilt_degrees": summer_tilt,
                    "seasonal_benefit_percent": 3.5  # Typical improvement with seasonal adjustment
                },
                "orientation_recommendation": {
                    "azimuth_degrees": 180 if latitude >= 0 else 0,
                    "direction": "South" if latitude >= 0 else "North"
                },
                "installation_notes": [
                    f"Fixed tilt at {optimal_tilt}° provides optimal year-round performance",
                    "Seasonal tilt adjustment can improve performance by ~3-4%",
                    "Consider tracking systems for additional 15-25% improvement"
                ]
            },
            message=f"Optimal tilt angle calculated: {optimal_tilt}°"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate optimal tilt: {str(e)}"
        )
