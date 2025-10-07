"""
Equipment Planning API Routes
RESTful API for managing future equipment scenarios and planning
"""

import logging
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime

from core.auth import verify_token
from services.equipment_planning_service import (
    equipment_planning_service,
    FutureEquipment,
    EquipmentScenario,
    EquipmentRecommendation
)
from models.energy import Equipment

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class FutureEquipmentRequest(BaseModel):
    name: str = Field(description="Equipment name")
    category: str = Field(description="Equipment category")
    power_rating_w: float = Field(ge=0, description="Power rating in watts")
    quantity: int = Field(ge=1, description="Quantity of equipment")
    hours_per_day: float = Field(ge=0, le=24, description="Operating hours per day")
    priority: str = Field(default="normal", description="Priority level")
    efficiency: float = Field(ge=0.1, le=2.0, default=1.0, description="Efficiency factor")
    installation_year: int = Field(description="Planned installation year")
    replacement_for: Optional[str] = None
    is_new_addition: bool = True
    estimated_cost: float = Field(ge=0, default=0.0)

class CreateScenarioRequest(BaseModel):
    facility_id: int
    name: str = Field(description="Scenario name")
    description: str = Field(description="Scenario description")
    timeline_years: int = Field(ge=1, le=20, description="Planning timeline in years")
    growth_factor: float = Field(ge=0.5, le=5.0, description="Growth factor for existing equipment")

class UpdateScenarioRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    timeline_years: Optional[int] = Field(None, ge=1, le=20)
    growth_factor: Optional[float] = Field(None, ge=0.5, le=5.0)
    selected_current_equipment: Optional[List[str]] = None

class EquipmentRecommendationRequest(BaseModel):
    facility_id: int
    facility_type: str = Field(default="healthcare", description="Type of facility")
    budget_constraint: Optional[float] = Field(None, ge=0, description="Budget constraint in USD")

class ScenarioValidationRequest(BaseModel):
    scenario_id: str

# Response Models
class FutureEquipmentResponse(BaseModel):
    id: str
    name: str
    category: str
    power_rating_w: float
    quantity: int
    hours_per_day: float
    priority: str
    efficiency: float
    installation_year: int
    replacement_for: Optional[str]
    is_new_addition: bool
    estimated_cost: float
    annual_kwh: float

class EquipmentScenarioResponse(BaseModel):
    id: str
    name: str
    description: str
    facility_id: int
    timeline_years: int
    growth_factor: float
    selected_current_equipment: List[str]
    new_equipment: List[FutureEquipmentResponse]
    equipment_replacements: Dict[str, str]
    total_projected_demand: float
    estimated_total_cost: float
    created_at: str
    updated_at: str

class EquipmentRecommendationResponse(BaseModel):
    equipment_type: str
    category: str
    recommended_power_w: float
    recommended_quantity: int
    justification: str
    priority: str
    estimated_cost: float
    energy_impact_kwh: float
    payback_period_years: float

# API Endpoints

@router.post("/create-scenario", response_model=Dict[str, Any])
async def create_equipment_scenario(
    request: CreateScenarioRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Create a new equipment planning scenario
    
    Creates a new scenario for planning future equipment additions and replacements.
    """
    try:
        logger.info(f"Creating equipment scenario for facility {request.facility_id}")
        
        # Get current equipment data (mock for now)
        current_equipment = await _get_facility_equipment(request.facility_id)
        
        # Create scenario
        scenario = await equipment_planning_service.create_equipment_scenario(
            facility_id=request.facility_id,
            name=request.name,
            description=request.description,
            timeline_years=request.timeline_years,
            growth_factor=request.growth_factor,
            current_equipment=current_equipment
        )
        
        return {
            'success': True,
            'scenario': _convert_scenario_to_response(scenario),
            'message': f'Equipment scenario "{request.name}" created successfully'
        }
        
    except Exception as e:
        logger.error(f"Error creating equipment scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-scenario/{scenario_id}", response_model=Dict[str, Any])
async def update_equipment_scenario(
    scenario_id: str,
    request: UpdateScenarioRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Update an existing equipment scenario
    
    Updates scenario parameters and recalculates projections.
    """
    try:
        logger.info(f"Updating equipment scenario {scenario_id}")
        
        # Get current equipment data
        current_equipment = await _get_facility_equipment_for_scenario(scenario_id)
        
        # Prepare updates
        updates = {}
        if request.name is not None:
            updates['name'] = request.name
        if request.description is not None:
            updates['description'] = request.description
        if request.timeline_years is not None:
            updates['timeline_years'] = request.timeline_years
        if request.growth_factor is not None:
            updates['growth_factor'] = request.growth_factor
        if request.selected_current_equipment is not None:
            updates['selected_current_equipment'] = request.selected_current_equipment
        
        # Update scenario
        scenario = await equipment_planning_service.update_equipment_scenario(
            scenario_id=scenario_id,
            updates=updates,
            current_equipment=current_equipment
        )
        
        return {
            'success': True,
            'scenario': _convert_scenario_to_response(scenario),
            'message': f'Scenario {scenario_id} updated successfully'
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating equipment scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add-equipment/{scenario_id}", response_model=Dict[str, Any])
async def add_future_equipment(
    scenario_id: str,
    request: FutureEquipmentRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Add new equipment to a scenario
    
    Adds a new piece of equipment to the future equipment list.
    """
    try:
        logger.info(f"Adding equipment to scenario {scenario_id}")
        
        # Create future equipment object
        equipment = FutureEquipment(
            id=f"future_eq_{int(datetime.now().timestamp())}",
            name=request.name,
            category=request.category,
            power_rating_w=request.power_rating_w,
            quantity=request.quantity,
            hours_per_day=request.hours_per_day,
            priority=request.priority,
            efficiency=request.efficiency,
            installation_year=request.installation_year,
            replacement_for=request.replacement_for,
            is_new_addition=request.is_new_addition,
            estimated_cost=request.estimated_cost
        )
        
        # Get current equipment data
        current_equipment = await _get_facility_equipment_for_scenario(scenario_id)
        
        # Add equipment to scenario
        scenario = await equipment_planning_service.add_future_equipment(
            scenario_id=scenario_id,
            equipment=equipment,
            current_equipment=current_equipment
        )
        
        return {
            'success': True,
            'scenario': _convert_scenario_to_response(scenario),
            'equipment_added': _convert_future_equipment_to_response(equipment),
            'message': f'Equipment "{request.name}" added to scenario'
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding equipment to scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove-equipment/{scenario_id}/{equipment_id}", response_model=Dict[str, Any])
async def remove_future_equipment(
    scenario_id: str,
    equipment_id: str,
    user_data: dict = Depends(verify_token)
):
    """
    Remove equipment from a scenario
    
    Removes a piece of equipment from the future equipment list.
    """
    try:
        logger.info(f"Removing equipment {equipment_id} from scenario {scenario_id}")
        
        # Get current equipment data
        current_equipment = await _get_facility_equipment_for_scenario(scenario_id)
        
        # Remove equipment from scenario
        scenario = await equipment_planning_service.remove_future_equipment(
            scenario_id=scenario_id,
            equipment_id=equipment_id,
            current_equipment=current_equipment
        )
        
        return {
            'success': True,
            'scenario': _convert_scenario_to_response(scenario),
            'message': f'Equipment {equipment_id} removed from scenario'
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error removing equipment from scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-recommendations", response_model=Dict[str, Any])
async def get_equipment_recommendations(
    request: EquipmentRecommendationRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Get equipment recommendations for a facility
    
    Analyzes current equipment and provides recommendations for additions or upgrades.
    """
    try:
        logger.info(f"Getting equipment recommendations for facility {request.facility_id}")
        
        # Get current equipment data
        current_equipment = await _get_facility_equipment(request.facility_id)
        
        # Get recommendations
        recommendations = await equipment_planning_service.get_equipment_recommendations(
            facility_id=request.facility_id,
            current_equipment=current_equipment,
            facility_type=request.facility_type,
            budget_constraint=request.budget_constraint
        )
        
        return {
            'success': True,
            'recommendations': [_convert_recommendation_to_response(rec) for rec in recommendations],
            'total_recommendations': len(recommendations),
            'facility_type': request.facility_type,
            'budget_constraint': request.budget_constraint
        }
        
    except Exception as e:
        logger.error(f"Error getting equipment recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-scenario", response_model=Dict[str, Any])
async def validate_equipment_scenario(
    request: ScenarioValidationRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Validate an equipment scenario for feasibility
    
    Checks scenario for conflicts, power requirements, timeline feasibility, and cost.
    """
    try:
        logger.info(f"Validating equipment scenario {request.scenario_id}")
        
        # Get scenario from cache
        if request.scenario_id not in equipment_planning_service.scenarios_cache:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        scenario = equipment_planning_service.scenarios_cache[request.scenario_id]
        
        # Get current equipment data
        current_equipment = await _get_facility_equipment_for_scenario(request.scenario_id)
        
        # Validate scenario
        validation_results = await equipment_planning_service.validate_equipment_scenario(
            scenario=scenario,
            current_equipment=current_equipment
        )
        
        return {
            'success': True,
            'validation_results': validation_results,
            'scenario_id': request.scenario_id
        }
        
    except Exception as e:
        logger.error(f"Error validating equipment scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export-scenario/{scenario_id}", response_model=Dict[str, Any])
async def export_scenario_for_demand_analysis(
    scenario_id: str,
    user_data: dict = Depends(verify_token)
):
    """
    Export scenario for demand analysis
    
    Exports scenario in format suitable for demand scenario engine.
    """
    try:
        logger.info(f"Exporting scenario {scenario_id} for demand analysis")
        
        # Get current equipment data
        current_equipment = await _get_facility_equipment_for_scenario(scenario_id)
        
        # Export scenario
        export_data = await equipment_planning_service.export_scenario_for_demand_analysis(
            scenario_id=scenario_id,
            current_equipment=current_equipment
        )
        
        return {
            'success': True,
            'export_data': export_data,
            'message': f'Scenario {scenario_id} exported successfully'
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error exporting scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scenarios/{facility_id}", response_model=Dict[str, Any])
async def get_facility_scenarios(
    facility_id: int,
    user_data: dict = Depends(verify_token)
):
    """
    Get all scenarios for a facility
    
    Returns all equipment planning scenarios for the specified facility.
    """
    try:
        # Filter scenarios by facility_id
        facility_scenarios = [
            scenario for scenario in equipment_planning_service.scenarios_cache.values()
            if scenario.facility_id == facility_id
        ]
        
        return {
            'success': True,
            'scenarios': [_convert_scenario_to_response(scenario) for scenario in facility_scenarios],
            'total_scenarios': len(facility_scenarios),
            'facility_id': facility_id
        }
        
    except Exception as e:
        logger.error(f"Error getting facility scenarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/equipment-categories", response_model=Dict[str, Any])
async def get_equipment_categories(
    user_data: dict = Depends(verify_token)
):
    """
    Get available equipment categories
    
    Returns list of available equipment categories for selection.
    """
    
    categories = [
        {
            'name': 'Medical Equipment',
            'description': 'Medical devices, diagnostic equipment, treatment systems',
            'typical_power_range': '100W - 50kW',
            'priority': 'critical'
        },
        {
            'name': 'Laboratory Equipment',
            'description': 'Lab instruments, analyzers, centrifuges, microscopes',
            'typical_power_range': '50W - 10kW',
            'priority': 'high'
        },
        {
            'name': 'HVAC',
            'description': 'Heating, ventilation, air conditioning systems',
            'typical_power_range': '1kW - 100kW',
            'priority': 'high'
        },
        {
            'name': 'Lighting',
            'description': 'Interior and exterior lighting systems',
            'typical_power_range': '10W - 5kW',
            'priority': 'normal'
        },
        {
            'name': 'IT Equipment',
            'description': 'Computers, servers, networking equipment',
            'typical_power_range': '50W - 10kW',
            'priority': 'high'
        },
        {
            'name': 'Kitchen Equipment',
            'description': 'Refrigeration, cooking equipment, food preparation',
            'typical_power_range': '500W - 20kW',
            'priority': 'normal'
        },
        {
            'name': 'Security Systems',
            'description': 'Access control, surveillance, alarm systems',
            'typical_power_range': '10W - 2kW',
            'priority': 'high'
        },
        {
            'name': 'Communication Equipment',
            'description': 'Phone systems, radios, internet infrastructure',
            'typical_power_range': '20W - 5kW',
            'priority': 'high'
        },
        {
            'name': 'Other',
            'description': 'Miscellaneous equipment not covered by other categories',
            'typical_power_range': 'Variable',
            'priority': 'normal'
        }
    ]
    
    return {
        'categories': categories,
        'total_categories': len(categories),
        'priority_levels': ['critical', 'high', 'normal', 'low']
    }

@router.get("/health")
async def health_check():
    """Health check endpoint for equipment planning service"""
    
    return {
        'status': 'healthy',
        'service': 'equipment_planning_service',
        'version': '1.0.0',
        'features': [
            'Equipment scenario creation and management',
            'Future equipment planning',
            'Equipment recommendations',
            'Scenario validation and optimization',
            'Demand analysis integration',
            'Cost estimation and analysis'
        ],
        'cached_scenarios': len(equipment_planning_service.scenarios_cache)
    }

# Helper functions
async def _get_facility_equipment(facility_id: int) -> List[Equipment]:
    """Get current equipment for facility"""
    # Mock equipment data - in real implementation, this would query the database
    mock_equipment = [
        Equipment(
            name="X-Ray Machine",
            category="Medical Equipment",
            power_rating_w=15000,
            quantity=1,
            hours_per_day=8,
            priority="critical",
            efficiency=0.9
        ),
        Equipment(
            name="LED Lighting",
            category="Lighting",
            power_rating_w=2000,
            quantity=10,
            hours_per_day=12,
            priority="normal",
            efficiency=1.0
        ),
        Equipment(
            name="HVAC System",
            category="HVAC",
            power_rating_w=25000,
            quantity=1,
            hours_per_day=24,
            priority="high",
            efficiency=0.85
        )
    ]
    return mock_equipment

async def _get_facility_equipment_for_scenario(scenario_id: str) -> List[Equipment]:
    """Get current equipment for scenario's facility"""
    if scenario_id not in equipment_planning_service.scenarios_cache:
        raise ValueError(f"Scenario {scenario_id} not found")
    
    scenario = equipment_planning_service.scenarios_cache[scenario_id]
    return await _get_facility_equipment(scenario.facility_id)

def _convert_scenario_to_response(scenario: EquipmentScenario) -> EquipmentScenarioResponse:
    """Convert scenario to response format"""
    return EquipmentScenarioResponse(
        id=scenario.id,
        name=scenario.name,
        description=scenario.description,
        facility_id=scenario.facility_id,
        timeline_years=scenario.timeline_years,
        growth_factor=scenario.growth_factor,
        selected_current_equipment=scenario.selected_current_equipment,
        new_equipment=[_convert_future_equipment_to_response(eq) for eq in scenario.new_equipment],
        equipment_replacements=scenario.equipment_replacements,
        total_projected_demand=scenario.total_projected_demand,
        estimated_total_cost=scenario.estimated_total_cost,
        created_at=scenario.created_at.isoformat(),
        updated_at=scenario.updated_at.isoformat()
    )

def _convert_future_equipment_to_response(equipment: FutureEquipment) -> FutureEquipmentResponse:
    """Convert future equipment to response format"""
    annual_kwh = (
        equipment.power_rating_w / 1000 *
        equipment.hours_per_day *
        365 *
        equipment.quantity *
        equipment.efficiency
    )
    
    return FutureEquipmentResponse(
        id=equipment.id,
        name=equipment.name,
        category=equipment.category,
        power_rating_w=equipment.power_rating_w,
        quantity=equipment.quantity,
        hours_per_day=equipment.hours_per_day,
        priority=equipment.priority,
        efficiency=equipment.efficiency,
        installation_year=equipment.installation_year,
        replacement_for=equipment.replacement_for,
        is_new_addition=equipment.is_new_addition,
        estimated_cost=equipment.estimated_cost,
        annual_kwh=annual_kwh
    )

def _convert_recommendation_to_response(recommendation: EquipmentRecommendation) -> EquipmentRecommendationResponse:
    """Convert recommendation to response format"""
    return EquipmentRecommendationResponse(
        equipment_type=recommendation.equipment_type,
        category=recommendation.category,
        recommended_power_w=recommendation.recommended_power_w,
        recommended_quantity=recommendation.recommended_quantity,
        justification=recommendation.justification,
        priority=recommendation.priority,
        estimated_cost=recommendation.estimated_cost,
        energy_impact_kwh=recommendation.energy_impact_kwh,
        payback_period_years=recommendation.payback_period_years
    )
