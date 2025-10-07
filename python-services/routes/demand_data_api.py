"""
Demand Data API Routes
Centralized API for providing energy demand data to all DREAM Tool services
"""

import logging
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from datetime import datetime

from core.auth import verify_token
from services.demand_data_provider import (
    demand_data_provider,
    DemandDataRequest,
    DemandDataResponse,
    DemandDataFormat
)
from services.demand_scenario_engine import DayNightShare, FutureGrowthParameters

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class DemandDataAPIRequest(BaseModel):
    facility_id: int
    scenario_types: List[str] = Field(description="List of scenario keys (e.g., ['current_all', 'future_critical'])")
    data_format: str = Field(default="hourly_profile", description="Format for returned data")
    day_night_share: Optional[Dict[str, Any]] = None
    future_parameters: Optional[Dict[str, Any]] = None
    include_metadata: bool = True

class REoptDataRequest(BaseModel):
    facility_id: int
    scenario_type: str = Field(description="Single scenario for REopt optimization")
    day_night_share: Optional[Dict[str, Any]] = None
    future_parameters: Optional[Dict[str, Any]] = None

class MCDADataRequest(BaseModel):
    facility_ids: List[int] = Field(description="List of facility IDs for MCDA analysis")
    scenario_type: str = Field(default="current_all", description="Scenario to use for MCDA")
    day_night_share: Optional[Dict[str, Any]] = None
    future_parameters: Optional[Dict[str, Any]] = None

class EnergyAnalysisDataRequest(BaseModel):
    facility_id: int
    scenario_types: List[str] = Field(description="Scenarios for energy analysis")
    day_night_share: Optional[Dict[str, Any]] = None
    future_parameters: Optional[Dict[str, Any]] = None

# API Endpoints

@router.post("/get-demand-data", response_model=Dict[str, Any])
async def get_demand_data(
    request: DemandDataAPIRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Get energy demand data for specified scenarios and format
    
    This is the primary endpoint for any service needing demand data.
    Supports multiple data formats and caching for performance.
    """
    try:
        logger.info(f"Demand data requested for facility {request.facility_id}, scenarios: {request.scenario_types}")
        
        # Convert request parameters
        day_night_share = None
        if request.day_night_share:
            day_night_share = DayNightShare(
                day_share_percent=request.day_night_share.get('day_share_percent', 60.0),
                night_share_percent=request.day_night_share.get('night_share_percent', 40.0),
                transition_hours=request.day_night_share.get('transition_hours', 2)
            )
        
        future_parameters = None
        if request.future_parameters:
            future_parameters = FutureGrowthParameters(
                selected_equipment_ids=request.future_parameters.get('selected_equipment_ids', []),
                growth_factor=request.future_parameters.get('growth_factor', 1.2),
                timeline_years=request.future_parameters.get('timeline_years', 5)
            )
        
        # Get demand data
        response = await demand_data_provider.get_demand_data(
            facility_id=request.facility_id,
            scenario_types=request.scenario_types,
            data_format=request.data_format,
            day_night_share=day_night_share,
            future_parameters=future_parameters,
            include_metadata=request.include_metadata
        )
        
        return {
            'success': True,
            'data': {
                'facility_id': response.facility_id,
                'scenario_data': response.scenario_data,
                'metadata': response.metadata,
                'generation_timestamp': response.generation_timestamp,
                'data_format': response.data_format
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting demand data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reopt-data", response_model=Dict[str, Any])
async def get_reopt_data(
    request: REoptDataRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Get demand data formatted specifically for REopt optimization
    
    Returns REopt-compatible load profile and metadata.
    Used by REopt integration service.
    """
    try:
        logger.info(f"REopt data requested for facility {request.facility_id}, scenario: {request.scenario_type}")
        
        # Convert parameters
        day_night_share = None
        if request.day_night_share:
            day_night_share = DayNightShare(**request.day_night_share)
        
        future_parameters = None
        if request.future_parameters:
            future_parameters = FutureGrowthParameters(**request.future_parameters)
        
        # Get REopt-formatted data
        reopt_data = await demand_data_provider.get_demand_for_reopt(
            facility_id=request.facility_id,
            scenario_type=request.scenario_type,
            day_night_share=day_night_share,
            future_parameters=future_parameters
        )
        
        return {
            'success': True,
            'reopt_data': reopt_data,
            'message': f'REopt data prepared for scenario: {request.scenario_type}'
        }
        
    except Exception as e:
        logger.error(f"Error getting REopt data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mcda-data", response_model=Dict[str, Any])
async def get_mcda_data(
    request: MCDADataRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Get demand data formatted for MCDA analysis
    
    Returns demand metrics for multiple facilities for MCDA comparison.
    Used by MCDA service.
    """
    try:
        logger.info(f"MCDA data requested for facilities: {request.facility_ids}, scenario: {request.scenario_type}")
        
        # Convert parameters
        day_night_share = None
        if request.day_night_share:
            day_night_share = DayNightShare(**request.day_night_share)
        
        future_parameters = None
        if request.future_parameters:
            future_parameters = FutureGrowthParameters(**request.future_parameters)
        
        # Get MCDA-formatted data
        mcda_data = await demand_data_provider.get_demand_for_mcda(
            facility_ids=request.facility_ids,
            scenario_type=request.scenario_type,
            day_night_share=day_night_share,
            future_parameters=future_parameters
        )
        
        return {
            'success': True,
            'mcda_data': mcda_data,
            'facilities_processed': len(mcda_data),
            'scenario_used': request.scenario_type
        }
        
    except Exception as e:
        logger.error(f"Error getting MCDA data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/energy-analysis-data", response_model=Dict[str, Any])
async def get_energy_analysis_data(
    request: EnergyAnalysisDataRequest,
    user_data: dict = Depends(verify_token)
):
    """
    Get demand data formatted for energy analysis services
    
    Returns comprehensive demand data for energy modeling and analysis.
    Used by energy analysis and modeling services.
    """
    try:
        logger.info(f"Energy analysis data requested for facility {request.facility_id}, scenarios: {request.scenario_types}")
        
        # Convert parameters
        day_night_share = None
        if request.day_night_share:
            day_night_share = DayNightShare(**request.day_night_share)
        
        future_parameters = None
        if request.future_parameters:
            future_parameters = FutureGrowthParameters(**request.future_parameters)
        
        # Get energy analysis formatted data
        analysis_data = await demand_data_provider.get_demand_for_energy_analysis(
            facility_id=request.facility_id,
            scenario_types=request.scenario_types,
            day_night_share=day_night_share,
            future_parameters=future_parameters
        )
        
        return {
            'success': True,
            'analysis_data': analysis_data,
            'scenarios_included': len(analysis_data['scenarios']),
            'has_comparison_metrics': bool(analysis_data.get('comparison_metrics'))
        }
        
    except Exception as e:
        logger.error(f"Error getting energy analysis data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available-scenarios")
async def get_available_scenarios(
    user_data: dict = Depends(verify_token)
):
    """
    Get list of all available demand scenario types
    
    Returns information about all 8 demand scenarios and their descriptions.
    """
    
    scenarios = {
        'current_all': {
            'name': 'Current All Equipment',
            'description': 'Baseline energy demand from all surveyed equipment',
            'category': 'current',
            'equipment_type': 'all',
            'has_day_night_variation': False
        },
        'current_critical': {
            'name': 'Current Critical Equipment',
            'description': 'Energy demand from critical equipment only',
            'category': 'current',
            'equipment_type': 'critical',
            'has_day_night_variation': False
        },
        'current_all_day_night': {
            'name': 'Current All Equipment with Day/Night Variation',
            'description': 'All equipment with percentage energy distribution',
            'category': 'current',
            'equipment_type': 'all',
            'has_day_night_variation': True
        },
        'current_critical_day_night': {
            'name': 'Current Critical Equipment with Day/Night Variation',
            'description': 'Critical equipment with percentage energy distribution',
            'category': 'current',
            'equipment_type': 'critical',
            'has_day_night_variation': True
        },
        'future_all': {
            'name': 'Future All Equipment',
            'description': 'Growth projections for selected equipment',
            'category': 'future',
            'equipment_type': 'all',
            'has_day_night_variation': False
        },
        'future_critical': {
            'name': 'Future Critical Equipment',
            'description': 'Future critical equipment demand with growth',
            'category': 'future',
            'equipment_type': 'critical',
            'has_day_night_variation': False
        },
        'future_all_day_night': {
            'name': 'Future All Equipment with Day/Night Variation',
            'description': 'Future all equipment with percentage distribution',
            'category': 'future',
            'equipment_type': 'all',
            'has_day_night_variation': True
        },
        'future_critical_day_night': {
            'name': 'Future Critical Equipment with Day/Night Variation',
            'description': 'Future critical equipment with percentage distribution',
            'category': 'future',
            'equipment_type': 'critical',
            'has_day_night_variation': True
        }
    }
    
    return {
        'scenarios': scenarios,
        'total_scenarios': len(scenarios),
        'categories': ['current', 'future'],
        'equipment_types': ['all', 'critical'],
        'data_formats': [format.value for format in DemandDataFormat],
        'usage_notes': [
            'Use current scenarios for immediate analysis and system sizing',
            'Use future scenarios for long-term planning and growth projections',
            'Day/night scenarios require day_night_share parameters',
            'Future scenarios require future_parameters',
            'All scenarios support multiple data formats for different use cases'
        ]
    }

@router.get("/data-formats")
async def get_data_formats(
    user_data: dict = Depends(verify_token)
):
    """
    Get information about available data formats
    
    Returns details about all supported data formats for demand scenarios.
    """
    
    formats = {
        'hourly_profile': {
            'description': '8760-hour annual load profile',
            'use_cases': ['REopt optimization', 'Detailed energy modeling', 'Storage sizing'],
            'data_size': 'Large (8760 values)',
            'typical_consumers': ['REopt service', 'Energy analysis service']
        },
        'daily_profile': {
            'description': '24-hour typical day profile',
            'use_cases': ['Quick analysis', 'Pattern visualization', 'Load shape analysis'],
            'data_size': 'Small (24 values)',
            'typical_consumers': ['Dashboard components', 'Visualization services']
        },
        'monthly_totals': {
            'description': '12-month energy totals',
            'use_cases': ['Seasonal analysis', 'Monthly planning', 'Cost estimation'],
            'data_size': 'Small (12 values)',
            'typical_consumers': ['Financial analysis', 'Reporting services']
        },
        'annual_total': {
            'description': 'Single annual energy value',
            'use_cases': ['High-level comparison', 'MCDA analysis', 'Summary reports'],
            'data_size': 'Minimal (1 value)',
            'typical_consumers': ['MCDA service', 'Summary dashboards']
        },
        'peak_demand': {
            'description': 'Peak demand value only',
            'use_cases': ['System sizing', 'Infrastructure planning', 'Utility analysis'],
            'data_size': 'Minimal (1 value)',
            'typical_consumers': ['System sizing algorithms', 'Infrastructure planning']
        },
        'load_factor': {
            'description': 'Load factor metric only',
            'use_cases': ['Efficiency analysis', 'System utilization', 'Performance metrics'],
            'data_size': 'Minimal (1 value)',
            'typical_consumers': ['Performance analysis', 'Efficiency reporting']
        },
        'equipment_breakdown': {
            'description': 'Equipment-wise energy contribution',
            'use_cases': ['Equipment analysis', 'Efficiency identification', 'Maintenance planning'],
            'data_size': 'Medium (per equipment)',
            'typical_consumers': ['Equipment analysis', 'Maintenance services']
        },
        'cost_analysis': {
            'description': 'Cost implications and estimates',
            'use_cases': ['Financial planning', 'Cost optimization', 'Budget analysis'],
            'data_size': 'Small (cost metrics)',
            'typical_consumers': ['Financial analysis', 'Cost optimization services']
        }
    }
    
    return {
        'formats': formats,
        'total_formats': len(formats),
        'recommendations': {
            'reopt_optimization': 'hourly_profile',
            'mcda_analysis': 'annual_total',
            'energy_modeling': 'hourly_profile',
            'financial_analysis': 'cost_analysis',
            'dashboard_display': 'daily_profile',
            'reporting': 'monthly_totals'
        }
    }

@router.get("/scenario-summary/{facility_id}")
async def get_scenario_summary(
    facility_id: int,
    user_data: dict = Depends(verify_token)
):
    """
    Get summary statistics for all scenarios of a facility
    
    Provides overview of demand ranges and characteristics across all scenarios.
    """
    try:
        # Get all scenarios with default parameters
        day_night_share = DayNightShare(day_share_percent=60.0, night_share_percent=40.0)
        future_parameters = FutureGrowthParameters(
            selected_equipment_ids=[],  # Will be populated with all equipment
            growth_factor=1.2,
            timeline_years=5
        )
        
        scenarios = await demand_data_provider.get_all_scenarios(
            facility_id=facility_id,
            day_night_share=day_night_share,
            future_parameters=future_parameters
        )
        
        summary = demand_data_provider.get_scenario_summary(scenarios)
        
        return {
            'facility_id': facility_id,
            'summary': summary,
            'generation_timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting scenario summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear-cache")
async def clear_demand_cache(
    user_data: dict = Depends(verify_token)
):
    """
    Clear the demand scenario cache
    
    Forces regeneration of all cached scenarios on next request.
    Useful for development and when equipment data changes.
    """
    try:
        demand_data_provider.scenario_cache.clear()
        
        return {
            'success': True,
            'message': 'Demand scenario cache cleared successfully',
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint for demand data service"""
    
    return {
        'status': 'healthy',
        'service': 'demand_data_provider',
        'version': '1.0.0',
        'features': [
            '8 demand scenario types',
            '8 data format options',
            'REopt integration support',
            'MCDA integration support',
            'Energy analysis integration',
            'Intelligent caching system',
            'Multi-service data provider'
        ],
        'cache_status': {
            'cached_scenarios': len(demand_data_provider.scenario_cache),
            'cache_timeout_seconds': demand_data_provider.cache_timeout
        }
    }
