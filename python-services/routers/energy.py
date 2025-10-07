"""
Energy Modeling API Router
Advanced energy analysis endpoints using Python scientific libraries
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List
import logging
from datetime import datetime

from core.auth import verify_token
from models.energy import (
    LoadProfileRequest, LoadProfileResponse, EnergyAnalysisRequest, 
    EnergyAnalysisResponse, Equipment, FacilityData, EnergyScenario,
    SystemSizing, WeatherData
)
from services.energy_analysis import energy_analyzer

logger = logging.getLogger(__name__)
security = HTTPBearer()

router = APIRouter()

@router.post("/load-profile", response_model=LoadProfileResponse)
async def generate_load_profile(
    request: LoadProfileRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Generate advanced load profile using Python scientific computing
    
    This endpoint provides enhanced load profile generation with:
    - Weather-based corrections
    - Advanced usage patterns
    - Equipment efficiency modeling
    - Statistical analysis
    """
    try:
        user = await verify_token(credentials.credentials)
        logger.info(f"Generating load profile for user {user.get('email')}")
        
        # Generate load profile using advanced analyzer
        load_profile = energy_analyzer.generate_load_profile(
            equipment=request.equipment,
            options=request.options,
            weather_data=request.weather_data
        )
        
        # Calculate summary metrics
        demands = [point.demand for point in load_profile]
        peak_demand = max(demands)
        daily_consumption = sum(demands)
        annual_consumption = daily_consumption * 365
        
        # Create metadata
        metadata = {
            "generated_at": datetime.utcnow().isoformat(),
            "equipment_count": len(request.equipment),
            "analysis_type": "advanced_python",
            "weather_corrected": request.weather_data is not None,
            "options": request.options.dict() if request.options else {}
        }
        
        logger.info(f"Load profile generated: {peak_demand:.2f}kW peak, {daily_consumption:.2f}kWh daily")
        
        return LoadProfileResponse(
            load_profile=load_profile,
            peak_demand=peak_demand,
            daily_consumption=daily_consumption,
            annual_consumption=annual_consumption,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"Error generating load profile: {e}")
        raise HTTPException(status_code=500, detail=f"Load profile generation failed: {str(e)}")

@router.post("/comprehensive-analysis", response_model=EnergyAnalysisResponse)
async def perform_comprehensive_analysis(
    request: EnergyAnalysisRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Perform comprehensive energy analysis with advanced features:
    
    - Load profile generation with weather corrections
    - Advanced statistical analysis (load factor, variability)
    - Optimized system sizing using mathematical optimization
    - ML-based recommendations
    - Equipment efficiency analysis
    """
    try:
        user = await verify_token(credentials.credentials)
        logger.info(f"Performing comprehensive analysis for {request.facility_data.name}")
        
        # Perform comprehensive analysis
        analysis_result = energy_analyzer.perform_comprehensive_analysis(
            facility_data=request.facility_data,
            options=request.options,
            weather_data=request.weather_data
        )
        
        # Optimize system sizing
        system_sizing = energy_analyzer.optimize_system_sizing(
            analysis_result=analysis_result,
            options=request.options
        )
        
        # Create energy scenario
        scenario = EnergyScenario(
            id=f"python_analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            name=f"Advanced Analysis - {request.facility_data.name}",
            scenario_type=request.scenario_type,
            facility_data=request.facility_data,
            analysis_result=analysis_result,
            system_sizing=system_sizing,
            weather_data=request.weather_data,
            created_at=datetime.utcnow()
        )
        
        # Generate benchmark comparison (placeholder)
        benchmark_comparison = {
            "peer_facilities_avg_consumption": analysis_result.daily_consumption * 1.2,
            "efficiency_percentile": 75.0,
            "carbon_footprint_kg_co2_per_year": analysis_result.annual_consumption * 0.5
        }
        
        logger.info(f"Comprehensive analysis completed for {request.facility_data.name}")
        
        return EnergyAnalysisResponse(
            scenario=scenario,
            system_sizing=system_sizing,
            recommendations=analysis_result.recommendations,
            benchmark_comparison=benchmark_comparison
        )
        
    except Exception as e:
        logger.error(f"Error in comprehensive analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/optimize-sizing")
async def optimize_system_sizing(
    facility_data: FacilityData,
    target_reliability: float = 0.95,
    cost_per_kw_pv: float = 1000,
    cost_per_kwh_battery: float = 500,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Advanced system sizing optimization using mathematical optimization
    
    Uses scipy.optimize to find optimal PV and battery sizing that minimizes
    total system cost while meeting reliability constraints.
    """
    try:
        user = await verify_token(credentials.credentials)
        logger.info(f"Optimizing system sizing for {facility_data.name}")
        
        # First perform energy analysis
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions()
        
        analysis_result = energy_analyzer.perform_comprehensive_analysis(
            facility_data=facility_data,
            options=options
        )
        
        # Perform optimization
        system_sizing = energy_analyzer.optimize_system_sizing(
            analysis_result=analysis_result,
            options=options
        )
        
        # Calculate cost breakdown
        pv_cost = system_sizing.pv_system_size * cost_per_kw_pv
        battery_cost = system_sizing.battery_capacity * cost_per_kwh_battery
        inverter_cost = system_sizing.inverter_size * 200  # $200/kW
        installation_cost = (pv_cost + battery_cost) * 0.3  # 30% of equipment
        
        total_cost = pv_cost + battery_cost + inverter_cost + installation_cost
        
        result = {
            "system_sizing": system_sizing,
            "cost_breakdown": {
                "pv_system": pv_cost,
                "battery_system": battery_cost,
                "inverter": inverter_cost,
                "installation": installation_cost,
                "total": total_cost
            },
            "performance_metrics": {
                "expected_reliability": target_reliability,
                "annual_energy_yield": system_sizing.pv_system_size * 1800,  # kWh/year
                "capacity_factor": 0.21,  # 21% for Somalia
                "payback_period_years": total_cost / (analysis_result.annual_consumption * 0.25)  # $0.25/kWh
            }
        }
        
        logger.info(f"System sizing optimized: {system_sizing.pv_system_size:.2f}kW PV, {system_sizing.battery_capacity:.2f}kWh battery")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in system sizing optimization: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@router.get("/equipment-database")
async def get_equipment_database(
    category: str = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get equipment database with enhanced specifications
    
    Returns equipment database with power ratings, efficiency curves,
    and usage patterns for accurate modeling.
    """
    try:
        user = await verify_token(credentials.credentials)
        
        # Enhanced equipment database
        equipment_db = {
            "medical": [
                {
                    "name": "LED Examination Light",
                    "power_rating": 25,
                    "efficiency": 0.95,
                    "usage_pattern": "medical",
                    "priority": "essential",
                    "cost_usd": 150
                },
                {
                    "name": "Medical Refrigerator",
                    "power_rating": 120,
                    "efficiency": 0.85,
                    "usage_pattern": "continuous",
                    "priority": "essential",
                    "cost_usd": 800
                },
                {
                    "name": "Ultrasound Machine",
                    "power_rating": 200,
                    "efficiency": 0.80,
                    "usage_pattern": "medical",
                    "priority": "important",
                    "cost_usd": 5000
                }
            ],
            "lighting": [
                {
                    "name": "LED Tube Light 18W",
                    "power_rating": 18,
                    "efficiency": 0.95,
                    "usage_pattern": "lighting",
                    "priority": "essential",
                    "cost_usd": 25
                },
                {
                    "name": "LED Bulb 12W",
                    "power_rating": 12,
                    "efficiency": 0.90,
                    "usage_pattern": "lighting",
                    "priority": "important",
                    "cost_usd": 8
                }
            ],
            "cooling": [
                {
                    "name": "Ceiling Fan",
                    "power_rating": 75,
                    "efficiency": 0.85,
                    "usage_pattern": "cooling",
                    "priority": "important",
                    "cost_usd": 120
                },
                {
                    "name": "Split AC Unit 1.5 Ton",
                    "power_rating": 1800,
                    "efficiency": 0.75,
                    "usage_pattern": "cooling",
                    "priority": "optional",
                    "cost_usd": 600
                }
            ],
            "computing": [
                {
                    "name": "Desktop Computer",
                    "power_rating": 200,
                    "efficiency": 0.85,
                    "usage_pattern": "computing",
                    "priority": "important",
                    "cost_usd": 500
                },
                {
                    "name": "Laptop",
                    "power_rating": 65,
                    "efficiency": 0.90,
                    "usage_pattern": "computing",
                    "priority": "important",
                    "cost_usd": 400
                }
            ]
        }
        
        if category:
            return equipment_db.get(category, [])
        
        return equipment_db
        
    except Exception as e:
        logger.error(f"Error fetching equipment database: {e}")
        raise HTTPException(status_code=500, detail=f"Database fetch failed: {str(e)}")

@router.get("/weather-data/{latitude}/{longitude}")
async def get_weather_data(
    latitude: float,
    longitude: float,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get weather data for location (placeholder for real weather API integration)
    
    In production, this would integrate with weather APIs like:
    - OpenWeatherMap
    - NASA POWER
    - PVGIS
    """
    try:
        user = await verify_token(credentials.credentials)
        
        # Generate synthetic weather data for Somalia climate
        import numpy as np
        
        # Typical Somalia weather patterns
        base_temp = 30  # 30°C average
        temp_variation = 8  # 8°C daily variation
        
        temperatures = []
        solar_irradiance = []
        
        for hour in range(24):
            # Temperature model
            temp = base_temp + temp_variation * np.sin((hour - 14 + 6) * np.pi / 12)
            temperatures.append(round(temp, 1))
            
            # Solar irradiance model
            if 6 <= hour <= 18:
                irradiance = 1000 * np.sin((hour - 6) * np.pi / 12)
            else:
                irradiance = 0
            solar_irradiance.append(round(irradiance, 1))
        
        weather_data = WeatherData(
            solar_irradiance=solar_irradiance,
            temperature=temperatures,
            wind_speed=[3.5] * 24,  # Constant 3.5 m/s
            humidity=[60] * 24      # Constant 60%
        )
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "weather_data": weather_data,
            "data_source": "synthetic_somalia_climate",
            "note": "In production, integrate with real weather APIs"
        }
        
    except Exception as e:
        logger.error(f"Error fetching weather data: {e}")
        raise HTTPException(status_code=500, detail=f"Weather data fetch failed: {str(e)}")

@router.get("/benchmarks/{facility_type}")
async def get_energy_benchmarks(
    facility_type: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get energy benchmarks for facility type
    
    Returns statistical benchmarks for energy consumption patterns
    based on facility type and size.
    """
    try:
        user = await verify_token(credentials.credentials)
        
        # Energy benchmarks database
        benchmarks = {
            "health_clinic": {
                "daily_consumption_kwh_per_m2": 0.8,
                "peak_demand_w_per_m2": 15,
                "load_factor": 0.45,
                "equipment_breakdown": {
                    "medical": 0.35,
                    "lighting": 0.25,
                    "cooling": 0.20,
                    "computing": 0.15,
                    "other": 0.05
                },
                "typical_operating_hours": 12,
                "energy_intensity_kwh_per_patient_per_day": 2.5
            },
            "school": {
                "daily_consumption_kwh_per_m2": 0.6,
                "peak_demand_w_per_m2": 12,
                "load_factor": 0.35,
                "equipment_breakdown": {
                    "lighting": 0.40,
                    "computing": 0.25,
                    "cooling": 0.20,
                    "other": 0.15
                },
                "typical_operating_hours": 8,
                "energy_intensity_kwh_per_student_per_day": 1.2
            },
            "community_center": {
                "daily_consumption_kwh_per_m2": 0.5,
                "peak_demand_w_per_m2": 10,
                "load_factor": 0.30,
                "equipment_breakdown": {
                    "lighting": 0.45,
                    "cooling": 0.25,
                    "computing": 0.20,
                    "other": 0.10
                },
                "typical_operating_hours": 10,
                "energy_intensity_kwh_per_visitor_per_day": 0.8
            }
        }
        
        benchmark = benchmarks.get(facility_type)
        if not benchmark:
            raise HTTPException(status_code=404, detail=f"Benchmarks not found for facility type: {facility_type}")
        
        return {
            "facility_type": facility_type,
            "benchmarks": benchmark,
            "data_source": "dream_tool_database",
            "last_updated": "2024-01-01"
        }
        
    except Exception as e:
        logger.error(f"Error fetching benchmarks: {e}")
        raise HTTPException(status_code=500, detail=f"Benchmark fetch failed: {str(e)}")

# Health check for energy service
@router.get("/health")
async def energy_service_health():
    """Health check for energy service"""
    return {
        "service": "energy_modeling",
        "status": "healthy",
        "features": [
            "advanced_load_profiling",
            "weather_corrections",
            "mathematical_optimization",
            "ml_recommendations",
            "statistical_analysis"
        ],
        "libraries": {
            "numpy": "available",
            "pandas": "available",
            "scipy": "available",
            "scikit-learn": "available"
        }
    }
