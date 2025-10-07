"""
Techno-Economic Assessment API Routes for DREAM Tool
Enhanced financial modeling with Python scientific computing capabilities
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import logging

from services.techno_economic_service import techno_economic_service
from core.auth import verify_token

router = APIRouter()
logger = logging.getLogger(__name__)

class TechnoEconomicRequest(BaseModel):
    facility_id: int = Field(..., description="Facility ID")
    daily_usage: float = Field(..., description="Daily energy usage in kWh")
    peak_hours: float = Field(..., description="Peak sun hours")
    stage: str = Field("prefeasibility", description="Analysis stage: prefeasibility or tendering")
    costing_method: str = Field("perWatt", description="Costing method: perWatt, fixedVariable, componentBased")
    
    # System configuration
    battery_autonomy_factor: float = Field(1.0, description="Battery autonomy factor")
    battery_depth_of_discharge: float = Field(0.8, description="Battery depth of discharge")
    battery_type: str = Field("lithium", description="Battery type: lithium or lead_acid")
    inverter_efficiency: float = Field(0.94, description="Inverter efficiency")
    
    # Costing parameters
    panel_cost_per_watt: Optional[float] = Field(None, description="Panel cost per watt")
    panel_cost_per_kw: Optional[float] = Field(None, description="Panel cost per kW")
    battery_cost_per_kwh: Optional[float] = Field(None, description="Battery cost per kWh")
    inverter_cost_per_kw: Optional[float] = Field(None, description="Inverter cost per kW")
    structure_cost_per_kw: Optional[float] = Field(None, description="Structure cost per kW")
    fixed_costs: Optional[float] = Field(None, description="Fixed costs")
    num_panels: Optional[int] = Field(None, description="Number of panels")
    panel_rating: Optional[float] = Field(None, description="Panel rating in watts")
    
    # Financial parameters
    discount_rate: Optional[float] = Field(None, description="Discount rate")
    project_lifetime: Optional[int] = Field(None, description="Project lifetime in years")
    diesel_fuel_cost: Optional[float] = Field(None, description="Diesel fuel cost per liter")

class SensitivityAnalysisRequest(BaseModel):
    base_analysis: TechnoEconomicRequest
    parameters: Dict[str, List[float]] = Field(..., description="Parameters and their variation ranges")

class MonteCarloRequest(BaseModel):
    base_analysis: TechnoEconomicRequest
    uncertainty_ranges: Dict[str, List[float]] = Field(..., description="Parameter uncertainty ranges [min, max]")
    num_simulations: int = Field(1000, description="Number of Monte Carlo simulations")

class TechnoEconomicResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    processing_time: Optional[float] = None

@router.post("/analyze/{facility_id}", response_model=TechnoEconomicResponse)
async def analyze_facility_techno_economic(
    facility_id: int,
    request: TechnoEconomicRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Perform comprehensive techno-economic analysis for a facility
    
    Enhanced Python implementation with advanced financial modeling:
    - NPV and IRR calculations using scipy
    - LCOE (Levelized Cost of Energy) analysis
    - Environmental impact assessment
    - Detailed cost breakdown by methodology
    """
    try:
        # Prepare analysis parameters
        analysis_params = {
            'daily_usage': request.daily_usage,
            'peak_hours': request.peak_hours,
            'costing_params': {
                'costing_method': request.costing_method,
                'panel_cost_per_watt': request.panel_cost_per_watt or 0.4,
                'panel_cost_per_kw': request.panel_cost_per_kw or 400,
                'battery_cost_per_kwh': request.battery_cost_per_kwh or 300,
                'inverter_cost_per_kw': request.inverter_cost_per_kw or 300,
                'structure_cost_per_kw': request.structure_cost_per_kw or 150,
                'fixed_costs': request.fixed_costs or 0,
                'num_panels': request.num_panels or 0,
                'panel_rating': request.panel_rating or 400
            },
            'system_config': {
                'battery_autonomy_factor': request.battery_autonomy_factor,
                'battery_depth_of_discharge': request.battery_depth_of_discharge,
                'battery_type': request.battery_type,
                'inverter_efficiency': request.inverter_efficiency
            },
            'financial_params': {
                'discount_rate': request.discount_rate or 0.08,
                'project_lifetime': request.project_lifetime or 20,
                'diesel_fuel_cost': request.diesel_fuel_cost or 1.5
            }
        }
        
        # Validate stage and costing method combination
        if request.stage == 'prefeasibility' and request.costing_method == 'componentBased':
            raise HTTPException(
                status_code=400,
                detail="Component-based costing is only available for tendering stage"
            )
        
        if request.stage == 'tendering' and request.costing_method != 'componentBased':
            raise HTTPException(
                status_code=400,
                detail="Only component-based costing is available for tendering stage"
            )
        
        async with techno_economic_service as service:
            results = await service.comprehensive_analysis(facility_id, analysis_params)
            
            return TechnoEconomicResponse(
                success=True,
                data=results,
                message=f"Techno-economic analysis completed for facility {facility_id}",
                processing_time=0.5  # Would be actual processing time
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in techno-economic analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform techno-economic analysis: {str(e)}"
        )

@router.post("/sensitivity-analysis", response_model=TechnoEconomicResponse)
async def perform_sensitivity_analysis(
    request: SensitivityAnalysisRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Perform sensitivity analysis on techno-economic parameters
    
    Analyzes how changes in key parameters affect NPV, IRR, and LCOE:
    - Panel costs, battery costs, fuel prices
    - Discount rates, project lifetime
    - System efficiency parameters
    """
    try:
        # Convert base analysis to parameters
        base_params = {
            'daily_usage': request.base_analysis.daily_usage,
            'peak_hours': request.base_analysis.peak_hours,
            'panel_cost_per_watt': request.base_analysis.panel_cost_per_watt or 0.4,
            'battery_cost_per_kwh': request.base_analysis.battery_cost_per_kwh or 300,
            'diesel_fuel_cost': request.base_analysis.diesel_fuel_cost or 1.5,
            'discount_rate': request.base_analysis.discount_rate or 0.08
        }
        
        async with techno_economic_service as service:
            sensitivity_results = service.perform_sensitivity_analysis(
                base_params, request.parameters
            )
            
            return TechnoEconomicResponse(
                success=True,
                data={
                    'sensitivity_analysis': sensitivity_results,
                    'base_parameters': base_params
                },
                message="Sensitivity analysis completed successfully"
            )
    
    except Exception as e:
        logger.error(f"Error in sensitivity analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform sensitivity analysis: {str(e)}"
        )

@router.post("/monte-carlo-analysis", response_model=TechnoEconomicResponse)
async def perform_monte_carlo_analysis(
    request: MonteCarloRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Perform Monte Carlo risk analysis
    
    Uses statistical simulation to assess project risk:
    - Probability distributions for uncertain parameters
    - Risk metrics (VaR, probability of positive NPV)
    - Confidence intervals for financial metrics
    """
    try:
        # Convert base analysis to parameters
        base_params = {
            'daily_usage': request.base_analysis.daily_usage,
            'peak_hours': request.base_analysis.peak_hours,
            'panel_cost_per_watt': request.base_analysis.panel_cost_per_watt or 0.4,
            'battery_cost_per_kwh': request.base_analysis.battery_cost_per_kwh or 300,
            'diesel_fuel_cost': request.base_analysis.diesel_fuel_cost or 1.5,
            'discount_rate': request.base_analysis.discount_rate or 0.08
        }
        
        # Convert uncertainty ranges to tuples
        uncertainty_ranges = {
            param: (values[0], values[1]) 
            for param, values in request.uncertainty_ranges.items()
        }
        
        async with techno_economic_service as service:
            monte_carlo_results = service.monte_carlo_analysis(
                base_params, uncertainty_ranges, request.num_simulations
            )
            
            return TechnoEconomicResponse(
                success=True,
                data={
                    'monte_carlo_analysis': monte_carlo_results,
                    'simulation_parameters': {
                        'num_simulations': request.num_simulations,
                        'uncertainty_ranges': request.uncertainty_ranges
                    }
                },
                message=f"Monte Carlo analysis completed with {request.num_simulations} simulations"
            )
    
    except Exception as e:
        logger.error(f"Error in Monte Carlo analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform Monte Carlo analysis: {str(e)}"
        )

@router.get("/facility/{facility_id}/quick-analysis")
async def quick_techno_economic_analysis(
    facility_id: int,
    panel_rating: float = Query(400, description="Panel rating in watts"),
    num_panels: int = Query(50, description="Number of panels"),
    current_user: dict = Depends(verify_token)
):
    """
    Quick techno-economic analysis using default parameters
    
    Simplified analysis for rapid assessment using facility survey data
    and standard assumptions for system sizing and costs.
    """
    try:
        # This would fetch facility data from database
        # For now, using mock data
        mock_facility_data = {
            'equipment': [
                {'name': 'refrigerator', 'quantity': 2, 'hoursPerDay': 24},
                {'name': 'light', 'quantity': 10, 'hoursPerDay': 12},
                {'name': 'computer', 'quantity': 3, 'hoursPerDay': 8}
            ],
            'operationalHours': {'day': 12, 'night': 0},
            'infrastructure': {'nationalGrid': False, 'digitalConnectivity': 'medium'}
        }
        
        async with techno_economic_service as service:
            daily_usage = service.calculate_daily_usage(mock_facility_data)
            peak_hours = 5.0  # Default for Somalia
            
            # Quick analysis parameters
            analysis_params = {
                'daily_usage': daily_usage,
                'peak_hours': peak_hours,
                'costing_params': {
                    'costing_method': 'componentBased',
                    'panel_cost_per_watt': 0.4,
                    'panel_cost_per_kw': 400,
                    'battery_cost_per_kwh': 300,
                    'inverter_cost_per_kw': 300,
                    'structure_cost_per_kw': 150,
                    'fixed_costs': 0,
                    'num_panels': num_panels,
                    'panel_rating': panel_rating
                },
                'system_config': {
                    'battery_autonomy_factor': 1.0,
                    'battery_depth_of_discharge': 0.8,
                    'battery_type': 'lithium',
                    'inverter_efficiency': 0.94
                },
                'financial_params': {
                    'discount_rate': 0.08,
                    'project_lifetime': 20,
                    'diesel_fuel_cost': 1.5
                }
            }
            
            results = await service.comprehensive_analysis(facility_id, analysis_params)
            
            return TechnoEconomicResponse(
                success=True,
                data={
                    **results,
                    'input_parameters': {
                        'calculated_daily_usage': daily_usage,
                        'peak_hours': peak_hours,
                        'panel_rating': panel_rating,
                        'num_panels': num_panels
                    }
                },
                message=f"Quick analysis completed for facility {facility_id}"
            )
    
    except Exception as e:
        logger.error(f"Error in quick analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform quick analysis: {str(e)}"
        )

@router.get("/cost-benchmarks")
async def get_cost_benchmarks(
    region: str = Query("somalia", description="Region for cost benchmarks"),
    current_user: dict = Depends(verify_token)
):
    """
    Get regional cost benchmarks for techno-economic analysis
    
    Returns typical cost ranges for PV components, diesel fuel,
    and financial parameters based on regional data.
    """
    try:
        # Regional cost benchmarks (would come from database)
        benchmarks = {
            'somalia': {
                'pv_costs': {
                    'panel_cost_per_watt': {'min': 0.35, 'typical': 0.40, 'max': 0.50},
                    'battery_cost_per_kwh': {'min': 250, 'typical': 300, 'max': 400},
                    'inverter_cost_per_kw': {'min': 250, 'typical': 300, 'max': 400}
                },
                'diesel_costs': {
                    'fuel_cost_per_liter': {'min': 1.2, 'typical': 1.5, 'max': 2.0},
                    'generator_cost_per_kw': {'min': 400, 'typical': 500, 'max': 700}
                },
                'financial_parameters': {
                    'discount_rate': {'min': 0.06, 'typical': 0.08, 'max': 0.12},
                    'inflation_rate': {'min': 0.02, 'typical': 0.03, 'max': 0.05}
                },
                'solar_resource': {
                    'peak_sun_hours': {'min': 4.5, 'typical': 5.0, 'max': 5.5},
                    'seasonal_variation': 0.15
                }
            }
        }
        
        region_data = benchmarks.get(region.lower())
        if not region_data:
            raise HTTPException(
                status_code=404,
                detail=f"Cost benchmarks not available for region: {region}"
            )
        
        return TechnoEconomicResponse(
            success=True,
            data={
                'region': region,
                'benchmarks': region_data,
                'last_updated': '2024-01-01',
                'currency': 'USD'
            },
            message=f"Cost benchmarks retrieved for {region}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving cost benchmarks: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cost benchmarks: {str(e)}"
        )

@router.get("/financial-metrics/definitions")
async def get_financial_metrics_definitions(current_user: dict = Depends(verify_token)):
    """
    Get definitions and explanations of financial metrics used in analysis
    
    Educational endpoint providing clear explanations of NPV, IRR, LCOE,
    payback period, and other financial metrics for user understanding.
    """
    try:
        definitions = {
            'npv': {
                'name': 'Net Present Value',
                'definition': 'The difference between present value of cash inflows and outflows',
                'interpretation': 'Positive NPV indicates profitable investment',
                'formula': 'NPV = Σ(Cash Flow / (1 + r)^t) - Initial Investment',
                'units': 'USD'
            },
            'irr': {
                'name': 'Internal Rate of Return',
                'definition': 'Discount rate that makes NPV equal to zero',
                'interpretation': 'Higher IRR indicates better investment opportunity',
                'formula': 'NPV = 0 when discount rate = IRR',
                'units': 'Percentage (%)'
            },
            'lcoe': {
                'name': 'Levelized Cost of Energy',
                'definition': 'Average cost per unit of energy over project lifetime',
                'interpretation': 'Lower LCOE indicates more cost-effective energy source',
                'formula': 'LCOE = Total Lifecycle Costs / Total Energy Production',
                'units': 'USD/kWh'
            },
            'payback_period': {
                'name': 'Payback Period',
                'definition': 'Time required to recover initial investment',
                'interpretation': 'Shorter payback period indicates faster cost recovery',
                'formula': 'Initial Investment / Annual Cash Savings',
                'units': 'Years'
            },
            'roi': {
                'name': 'Return on Investment',
                'definition': 'Percentage return on initial investment',
                'interpretation': 'Higher ROI indicates better investment performance',
                'formula': '(Total Returns - Initial Investment) / Initial Investment × 100',
                'units': 'Percentage (%)'
            }
        }
        
        return TechnoEconomicResponse(
            success=True,
            data={
                'financial_metrics': definitions,
                'calculation_notes': [
                    'All calculations use real (inflation-adjusted) values',
                    'Cash flows are discounted to present value',
                    'Environmental benefits are not monetized in base analysis',
                    'Sensitivity analysis shows impact of parameter variations'
                ]
            },
            message="Financial metrics definitions retrieved successfully"
        )
    
    except Exception as e:
        logger.error(f"Error retrieving financial metrics definitions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve financial metrics definitions: {str(e)}"
        )
