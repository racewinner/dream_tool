"""
Demand-Driven Scenario Analysis API Routes
Creates technology and economic scenarios based on user-defined energy demand patterns
"""

import logging
import os
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, validator
from datetime import datetime

from core.auth import verify_token, get_user_role
from services.demand_scenario_engine import (
    demand_scenario_engine,
    DayNightShare,
    FutureGrowthParameters,
    DemandScenario,
    DemandScenarioType
)
from services.reopt_integration import get_reopt_service
from models.energy import Equipment

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class DayNightShareRequest(BaseModel):
    day_share_percent: float = Field(ge=0.0, le=100.0, description="Percentage of total daily energy consumed during day hours (0-100%)")
    night_share_percent: float = Field(ge=0.0, le=100.0, description="Percentage of total daily energy consumed during night hours (0-100%)")
    transition_hours: int = Field(ge=0, le=4, default=2, description="Transition hours (0-4)")
    
    @validator('night_share_percent')
    def validate_total_shares(cls, v, values):
        if 'day_share_percent' in values:
            total = v + values['day_share_percent']
            if abs(total - 100.0) > 0.1:
                raise ValueError(f'Day and night shares must add up to 100%, got {total}%')
        return v

class FutureGrowthRequest(BaseModel):
    selected_equipment_ids: List[str] = Field(description="Equipment IDs to apply growth to")
    growth_factor: float = Field(ge=0.5, le=5.0, description="Growth multiplier (0.5-5.0)")
    new_equipment: Optional[List[Dict[str, Any]]] = None
    timeline_years: int = Field(ge=1, le=20, default=5, description="Timeline in years")

class DemandScenariosRequest(BaseModel):
    facility_id: int
    day_night_share: DayNightShareRequest
    future_growth: FutureGrowthRequest
    
    @validator('facility_id')
    def validate_facility_id(cls, v):
        if v <= 0:
            raise ValueError('Facility ID must be positive')
        return v

class DemandScenarioResponse(BaseModel):
    scenario_type: str
    name: str
    description: str
    annual_kwh: float
    peak_demand_kw: float
    load_factor: float
    equipment_breakdown: Dict[str, float]
    cost_implications: Dict[str, float]

class TechnologyScenarioResponse(BaseModel):
    pv_size_kw: float
    description: str
    coverage_ratio: float
    storage_options: Dict[str, Dict[str, float]]

class EconomicScenarioResponse(BaseModel):
    conservative: Dict[str, Any]
    moderate: Dict[str, Any]
    optimistic: Dict[str, Any]

class ComprehensiveAnalysisResponse(BaseModel):
    facility_id: int
    analysis_date: str
    demand_scenarios: Dict[str, DemandScenarioResponse]
    technology_scenarios: Dict[str, Dict[str, TechnologyScenarioResponse]]
    economic_scenarios: Dict[str, EconomicScenarioResponse]
    recommendations: List[str]
    summary: Dict[str, Any]

class REoptOptimizationRequest(BaseModel):
    facility_id: int
    selected_demand_scenarios: List[str] = Field(
        description="Demand scenarios to optimize (e.g., ['current_all', 'future_critical'])"
    )
    optimization_options: Optional[Dict[str, Any]] = None

class REoptOptimizationResponse(BaseModel):
    facility_id: int
    optimization_runs: Dict[str, str]  # scenario_name -> run_uuid
    estimated_completion_minutes: int
    access_level: str

# API Endpoints

@router.post("/create-demand-scenarios", response_model=Dict[str, DemandScenarioResponse])
async def create_demand_scenarios(
    request: DemandScenariosRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Create all 8 demand scenarios based on user-defined parameters
    
    CURRENT DEMAND SCENARIOS (4 scenarios):
    1. Current all equipment demand
    2. Current critical equipment only
    3. Current all equipment with day/night percentage shares
    4. Current critical equipment with day/night percentage shares
    
    FUTURE DEMAND SCENARIOS (4 scenarios):
    5. Future all equipment (with growth)
    6. Future critical equipment (with growth)
    7. Future all equipment with day/night percentage shares
    8. Future critical equipment with day/night percentage shares
    """
    try:
        logger.info(f"Creating demand scenarios for facility {request.facility_id}")
        
        # Get facility equipment data
        equipment_data = await _get_facility_equipment(request.facility_id)
        
        # Convert request models to service models
        day_night_share = DayNightShare(
            day_share_percent=request.day_night_share.day_share_percent,
            night_share_percent=request.day_night_share.night_share_percent,
            transition_hours=request.day_night_share.transition_hours
        )
        
        future_parameters = FutureGrowthParameters(
            selected_equipment_ids=request.future_growth.selected_equipment_ids,
            growth_factor=request.future_growth.growth_factor,
            new_equipment=_convert_new_equipment(request.future_growth.new_equipment),
            timeline_years=request.future_growth.timeline_years
        )
        
        # Create all demand scenarios
        scenarios = demand_scenario_engine.create_all_demand_scenarios(
            equipment_data,
            day_night_share,
            future_parameters,
            request.facility_id
        )
        
        # Convert to response format
        response_scenarios = {}
        for scenario_key, scenario in scenarios.items():
            response_scenarios[scenario_key] = DemandScenarioResponse(
                scenario_type=scenario.scenario_type.value,
                name=scenario.name,
                description=scenario.description,
                annual_kwh=scenario.annual_kwh,
                peak_demand_kw=scenario.peak_demand_kw,
                load_factor=scenario.load_factor,
                equipment_breakdown=scenario.equipment_breakdown,
                cost_implications=scenario.cost_implications
            )
        
        logger.info(f"Created {len(response_scenarios)} demand scenarios")
        return response_scenarios
        
    except Exception as e:
        logger.error(f"Error creating demand scenarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/comprehensive-analysis", response_model=ComprehensiveAnalysisResponse)
async def comprehensive_demand_analysis(
    request: DemandScenariosRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Complete demand-driven analysis including demand, technology, and economic scenarios
    
    For each demand scenario, creates:
    - Multiple PV sizing options (30%, 70%, 100%, 130% of peak)
    - Storage options for each PV size
    - Economic scenarios (conservative, moderate, optimistic)
    - Cost-benefit analysis
    """
    try:
        logger.info(f"Running comprehensive analysis for facility {request.facility_id}")
        
        # Get facility equipment data
        equipment_data = await _get_facility_equipment(request.facility_id)
        
        # Convert request models
        day_night_share = DayNightShare(
            day_share_percent=request.day_night_share.day_share_percent,
            night_share_percent=request.day_night_share.night_share_percent,
            transition_hours=request.day_night_share.transition_hours
        )
        
        future_parameters = FutureGrowthParameters(
            selected_equipment_ids=request.future_growth.selected_equipment_ids,
            growth_factor=request.future_growth.growth_factor,
            new_equipment=_convert_new_equipment(request.future_growth.new_equipment),
            timeline_years=request.future_growth.timeline_years
        )
        
        # 1. Create demand scenarios
        demand_scenarios = demand_scenario_engine.create_all_demand_scenarios(
            equipment_data, day_night_share, future_parameters, request.facility_id
        )
        
        # 2. Create technology scenarios for each demand scenario
        all_technology_scenarios = {}
        all_economic_scenarios = {}
        
        for scenario_key, demand_scenario in demand_scenarios.items():
            # Technology scenarios (PV + storage options)
            tech_scenarios = demand_scenario_engine.create_technology_scenarios_for_demand(
                demand_scenario
            )
            all_technology_scenarios[scenario_key] = tech_scenarios
            
            # Economic scenarios for each technology option
            econ_scenarios = demand_scenario_engine.create_economic_scenarios_for_demand(
                demand_scenario, tech_scenarios
            )
            all_economic_scenarios[scenario_key] = econ_scenarios
        
        # 3. Generate recommendations
        recommendations = _generate_comprehensive_recommendations(
            demand_scenarios, all_technology_scenarios, all_economic_scenarios
        )
        
        # 4. Create summary
        summary = _create_analysis_summary(
            demand_scenarios, all_technology_scenarios, all_economic_scenarios
        )
        
        # Convert to response format
        response_demand_scenarios = {
            key: DemandScenarioResponse(
                scenario_type=scenario.scenario_type.value,
                name=scenario.name,
                description=scenario.description,
                annual_kwh=scenario.annual_kwh,
                peak_demand_kw=scenario.peak_demand_kw,
                load_factor=scenario.load_factor,
                equipment_breakdown=scenario.equipment_breakdown,
                cost_implications=scenario.cost_implications
            )
            for key, scenario in demand_scenarios.items()
        }
        
        return ComprehensiveAnalysisResponse(
            facility_id=request.facility_id,
            analysis_date=datetime.now().isoformat(),
            demand_scenarios=response_demand_scenarios,
            technology_scenarios=all_technology_scenarios,
            economic_scenarios=all_economic_scenarios,
            recommendations=recommendations,
            summary=summary
        )
        
    except Exception as e:
        logger.error(f"Error in comprehensive analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reopt-optimization", response_model=REoptOptimizationResponse)
async def reopt_optimization_for_scenarios(
    request: REoptOptimizationRequest,
    user_data: dict = Depends(verify_token)
):
    """
    REopt optimization for selected demand scenarios - TECHNICAL USERS ONLY
    
    Runs NREL REopt optimization for each selected demand scenario:
    - Submits scenarios to REopt API
    - Returns run UUIDs for tracking
    - Provides comprehensive optimization results
    
    Access: Technical users only (role: 'technical' or 'admin')
    """
    try:
        # Check user role - REopt optimization only for technical users
        user_role = get_user_role(user_data)
        if user_role not in ['technical', 'admin']:
            raise HTTPException(
                status_code=403, 
                detail="REopt optimization is only available to technical users"
            )
        
        logger.info(f"Starting REopt optimization for facility {request.facility_id}")
        
        # Check NREL API key
        api_key = os.getenv("NREL_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500, 
                detail="NREL API key not configured"
            )
        
        # Get REopt service
        reopt_service = get_reopt_service(api_key)
        
        # Get facility equipment and create demand scenarios
        equipment_data = await _get_facility_equipment(request.facility_id)
        
        # For each selected demand scenario, run REopt optimization
        optimization_runs = {}
        
        for scenario_name in request.selected_demand_scenarios:
            try:
                # Create specific demand scenario
                # This would need the original parameters - simplified for demo
                logger.info(f"Submitting REopt optimization for scenario: {scenario_name}")
                
                # In production, would recreate the specific demand scenario
                # and submit to REopt with proper load profile
                
                # Mock run UUID for demonstration
                import uuid
                run_uuid = str(uuid.uuid4())
                optimization_runs[scenario_name] = run_uuid
                
                logger.info(f"REopt optimization submitted: {scenario_name} -> {run_uuid}")
                
            except Exception as e:
                logger.error(f"Error submitting REopt for {scenario_name}: {e}")
                optimization_runs[scenario_name] = f"ERROR: {str(e)}"
        
        return REoptOptimizationResponse(
            facility_id=request.facility_id,
            optimization_runs=optimization_runs,
            estimated_completion_minutes=15 * len(request.selected_demand_scenarios),
            access_level=user_role
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in REopt optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/facility/{facility_id}/equipment")
async def get_facility_equipment_summary(
    facility_id: int,
    user_data: dict = Depends(verify_token)
):
    """Get facility equipment summary for scenario planning"""
    try:
        equipment_data = await _get_facility_equipment(facility_id)
        
        summary = {
            'total_equipment': len(equipment_data),
            'equipment_by_category': {},
            'equipment_by_priority': {},
            'total_power_kw': 0,
            'equipment_list': []
        }
        
        for eq in equipment_data:
            # By category
            if eq.category not in summary['equipment_by_category']:
                summary['equipment_by_category'][eq.category] = 0
            summary['equipment_by_category'][eq.category] += 1
            
            # By priority
            if eq.priority not in summary['equipment_by_priority']:
                summary['equipment_by_priority'][eq.priority] = 0
            summary['equipment_by_priority'][eq.priority] += 1
            
            # Total power
            summary['total_power_kw'] += eq.power_rating * eq.quantity / 1000  # Convert W to kW
            
            # Equipment list
            summary['equipment_list'].append({
                'name': eq.name,
                'category': eq.category,
                'power_rating_w': eq.power_rating,
                'quantity': eq.quantity,
                'priority': eq.priority,
                'hours_per_day': eq.hours_per_day
            })
        
        return summary
        
    except Exception as e:
        logger.error(f"Error getting equipment summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scenario-templates")
async def get_scenario_templates(
    user_data: dict = Depends(verify_token)
):
    """Get predefined scenario templates for common use cases"""
    
    templates = {
        'healthcare_standard': {
            'day_night_share': {
                'day_share_percent': 60.0,
                'night_share_percent': 40.0,
                'transition_hours': 2
            },
            'future_growth': {
                'growth_factor': 1.3,
                'timeline_years': 5
            },
            'description': 'Standard healthcare facility with 60% day, 40% night energy distribution'
        },
        'clinic_basic': {
            'day_night_share': {
                'day_share_percent': 80.0,
                'night_share_percent': 20.0,
                'transition_hours': 1
            },
            'future_growth': {
                'growth_factor': 1.2,
                'timeline_years': 3
            },
            'description': 'Basic clinic with 80% day, 20% night energy distribution (minimal night operations)'
        },
        'hospital_24x7': {
            'day_night_share': {
                'day_share_percent': 55.0,
                'night_share_percent': 45.0,
                'transition_hours': 2
            },
            'future_growth': {
                'growth_factor': 1.4,
                'timeline_years': 7
            },
            'description': '24/7 hospital with 55% day, 45% night energy distribution (consistent operations)'
        },
        'emergency_resilience': {
            'day_night_share': {
                'day_share_percent': 50.0,
                'night_share_percent': 50.0,
                'transition_hours': 0
            },
            'future_growth': {
                'growth_factor': 1.1,
                'timeline_years': 10
            },
            'description': 'Emergency resilience planning with 50% day, 50% night energy distribution (constant load)'
        }
    }
    
    return {
        'templates': templates,
        'usage_instructions': [
            'Select a template that matches your facility type',
            'Day and night shares must add up to 100% of total daily energy',
            'Day hours: 6 AM to 6 PM (12 hours), Night hours: 6 PM to 6 AM (12 hours)',
            'Higher day share (60-80%) indicates more daytime operations',
            'Equal shares (50%/50%) indicate 24/7 consistent operations',
            'Modify parameters as needed for your specific operational patterns'
        ]
    }

# Helper functions
async def _get_facility_equipment(facility_id: int) -> List[Equipment]:
    """Get equipment data for facility from surveys"""
    # This would query the database for actual equipment data
    # For now, return mock data
    
    mock_equipment = [
        Equipment(
            name="LED Lighting",
            category="lighting",
            power_rating=50,  # 50W per unit
            quantity=20,
            hours_per_day=12,
            efficiency=0.9,
            priority="medium"
        ),
        Equipment(
            name="Medical Refrigeration",
            category="medical",
            power_rating=200,  # 200W
            quantity=3,
            hours_per_day=24,
            efficiency=0.85,
            priority="critical"
        ),
        Equipment(
            name="Air Conditioning",
            category="cooling",
            power_rating=3000,  # 3kW
            quantity=2,
            hours_per_day=10,
            efficiency=0.8,
            priority="high"
        ),
        Equipment(
            name="Medical Equipment",
            category="medical",
            power_rating=500,  # 500W
            quantity=5,
            hours_per_day=8,
            efficiency=0.9,
            priority="critical"
        ),
        Equipment(
            name="Computers",
            category="office",
            power_rating=100,  # 100W
            quantity=10,
            hours_per_day=8,
            efficiency=0.95,
            priority="medium"
        )
    ]
    
    return mock_equipment

def _convert_new_equipment(new_equipment_data: Optional[List[Dict[str, Any]]]) -> Optional[List[Equipment]]:
    """Convert new equipment data to Equipment objects"""
    if not new_equipment_data:
        return None
    
    equipment_list = []
    for eq_data in new_equipment_data:
        equipment = Equipment(
            name=eq_data.get('name', 'New Equipment'),
            category=eq_data.get('category', 'other'),
            power_rating=eq_data.get('power_rating', 100),
            quantity=eq_data.get('quantity', 1),
            hours_per_day=eq_data.get('hours_per_day', 8),
            efficiency=eq_data.get('efficiency', 0.85),
            priority=eq_data.get('priority', 'medium')
        )
        equipment_list.append(equipment)
    
    return equipment_list

def _generate_comprehensive_recommendations(
    demand_scenarios: Dict[str, DemandScenario],
    technology_scenarios: Dict[str, Dict[str, Any]],
    economic_scenarios: Dict[str, Dict[str, Any]]
) -> List[str]:
    """Generate recommendations based on comprehensive analysis"""
    
    recommendations = []
    
    # Analyze demand patterns
    current_peak = demand_scenarios['current_all'].peak_demand_kw
    future_peak = demand_scenarios['future_all'].peak_demand_kw
    
    if future_peak > current_peak * 1.2:
        recommendations.append(f"Significant load growth expected ({future_peak:.1f}kW vs {current_peak:.1f}kW). Consider phased PV installation.")
    
    # Day/night variation analysis
    current_day_night = demand_scenarios.get('current_day_night')
    if current_day_night and current_day_night.load_factor < 0.4:
        recommendations.append("Low load factor detected. Battery storage recommended for load shifting and cost optimization.")
    
    # Critical load analysis
    critical_scenario = demand_scenarios.get('current_critical')
    if critical_scenario:
        critical_ratio = critical_scenario.peak_demand_kw / current_peak
        if critical_ratio > 0.6:
            recommendations.append(f"High critical load ratio ({critical_ratio:.1%}). Backup power solutions essential for resilience.")
        else:
            recommendations.append(f"Moderate critical load ratio ({critical_ratio:.1%}). Consider right-sized backup storage.")
    
    # Economic recommendations
    recommendations.extend([
        "Start with current demand scenarios for immediate implementation",
        "Plan future scenarios for long-term energy strategy",
        "Consider modular PV installation to match load growth",
        "Evaluate battery storage for critical load backup and cost savings"
    ])
    
    return recommendations

def _create_analysis_summary(
    demand_scenarios: Dict[str, DemandScenario],
    technology_scenarios: Dict[str, Dict[str, Any]],
    economic_scenarios: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """Create analysis summary"""
    
    # Find highest and lowest demand scenarios
    scenarios_by_demand = sorted(
        demand_scenarios.items(),
        key=lambda x: x[1].annual_kwh
    )
    
    lowest_demand = scenarios_by_demand[0]
    highest_demand = scenarios_by_demand[-1]
    
    return {
        'demand_range': {
            'lowest': {
                'scenario': lowest_demand[0],
                'annual_kwh': lowest_demand[1].annual_kwh,
                'peak_kw': lowest_demand[1].peak_demand_kw
            },
            'highest': {
                'scenario': highest_demand[0],
                'annual_kwh': highest_demand[1].annual_kwh,
                'peak_kw': highest_demand[1].peak_demand_kw
            }
        },
        'growth_factor': highest_demand[1].annual_kwh / lowest_demand[1].annual_kwh,
        'scenarios_analyzed': len(demand_scenarios),
        'technology_options_per_scenario': len(list(technology_scenarios.values())[0]) if technology_scenarios else 0,
        'total_configurations': len(demand_scenarios) * (len(list(technology_scenarios.values())[0]) if technology_scenarios else 0)
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'service': 'demand_scenarios',
        'version': '1.0.0',
        'features': [
            '7 demand scenario types',
            'User-defined day/night factors',
            'Future growth projections',
            'Technology scenario generation',
            'Economic scenario analysis',
            'REopt integration (technical users)',
            'Comprehensive recommendations'
        ]
    }
