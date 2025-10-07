"""
Demand Data Provider Service
Centralized service for providing energy demand data to all DREAM Tool components
"""

import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import json
import asyncio
from datetime import datetime

from services.demand_scenario_engine import (
    demand_scenario_engine,
    DemandScenario,
    DemandScenarioType,
    DayNightShare,
    FutureGrowthParameters
)
from models.energy import Equipment

logger = logging.getLogger(__name__)

@dataclass
class DemandDataRequest:
    """Request for demand data from other services"""
    facility_id: int
    scenario_types: List[str]  # List of scenario keys needed
    data_format: str = "hourly_profile"  # hourly_profile, daily_profile, monthly_totals, annual_total
    include_metadata: bool = True
    
@dataclass
class DemandDataResponse:
    """Standardized demand data response for consumption by other services"""
    facility_id: int
    scenario_data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
    generation_timestamp: str = None
    data_format: str = "hourly_profile"

class DemandDataFormat(Enum):
    """Supported data formats for demand scenarios"""
    HOURLY_PROFILE = "hourly_profile"        # 8760 hours array
    DAILY_PROFILE = "daily_profile"          # 24 hours array
    MONTHLY_TOTALS = "monthly_totals"        # 12 months array
    ANNUAL_TOTAL = "annual_total"            # Single value
    PEAK_DEMAND = "peak_demand"              # Peak kW value
    LOAD_FACTOR = "load_factor"              # Load factor value
    EQUIPMENT_BREAKDOWN = "equipment_breakdown"  # Equipment contribution
    COST_ANALYSIS = "cost_analysis"          # Cost implications

class DemandDataProvider:
    """Centralized provider for energy demand data across DREAM Tool services"""
    
    def __init__(self):
        self.scenario_cache = {}  # Cache for generated scenarios
        self.cache_timeout = 3600  # 1 hour cache timeout
        
    async def get_demand_data(
        self,
        facility_id: int,
        scenario_types: List[str],
        data_format: str = "hourly_profile",
        day_night_share: Optional[DayNightShare] = None,
        future_parameters: Optional[FutureGrowthParameters] = None,
        include_metadata: bool = True
    ) -> DemandDataResponse:
        """
        Get demand data for specified scenarios in requested format
        
        Args:
            facility_id: Facility identifier
            scenario_types: List of scenario keys (e.g., ['current_all', 'future_critical'])
            data_format: Format for returned data
            day_night_share: Day/night percentage shares (required for day/night scenarios)
            future_parameters: Future growth parameters (required for future scenarios)
            include_metadata: Whether to include metadata in response
            
        Returns:
            DemandDataResponse with requested scenario data
        """
        try:
            logger.info(f"Providing demand data for facility {facility_id}, scenarios: {scenario_types}")
            
            # Generate scenarios if not cached
            cache_key = self._generate_cache_key(facility_id, day_night_share, future_parameters)
            
            if cache_key not in self.scenario_cache or self._is_cache_expired(cache_key):
                scenarios = await self._generate_scenarios(
                    facility_id, day_night_share, future_parameters
                )
                self.scenario_cache[cache_key] = {
                    'scenarios': scenarios,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                scenarios = self.scenario_cache[cache_key]['scenarios']
            
            # Extract requested scenarios
            scenario_data = {}
            for scenario_type in scenario_types:
                if scenario_type in scenarios:
                    scenario_data[scenario_type] = self._format_scenario_data(
                        scenarios[scenario_type], data_format
                    )
                else:
                    logger.warning(f"Scenario type '{scenario_type}' not found")
                    scenario_data[scenario_type] = None
            
            # Prepare metadata
            metadata = None
            if include_metadata:
                metadata = self._generate_metadata(scenarios, scenario_types)
            
            return DemandDataResponse(
                facility_id=facility_id,
                scenario_data=scenario_data,
                metadata=metadata,
                generation_timestamp=datetime.now().isoformat(),
                data_format=data_format
            )
            
        except Exception as e:
            logger.error(f"Error providing demand data: {e}")
            raise
    
    async def get_all_scenarios(
        self,
        facility_id: int,
        day_night_share: DayNightShare,
        future_parameters: FutureGrowthParameters
    ) -> Dict[str, DemandScenario]:
        """Get all 8 demand scenarios for a facility"""
        
        cache_key = self._generate_cache_key(facility_id, day_night_share, future_parameters)
        
        if cache_key not in self.scenario_cache or self._is_cache_expired(cache_key):
            scenarios = await self._generate_scenarios(
                facility_id, day_night_share, future_parameters
            )
            self.scenario_cache[cache_key] = {
                'scenarios': scenarios,
                'timestamp': datetime.now().isoformat()
            }
        
        return self.scenario_cache[cache_key]['scenarios']
    
    def get_scenario_summary(
        self,
        scenarios: Dict[str, DemandScenario]
    ) -> Dict[str, Any]:
        """Generate summary statistics for scenarios"""
        
        if not scenarios:
            return {}
        
        summary = {
            'total_scenarios': len(scenarios),
            'current_scenarios': len([k for k in scenarios.keys() if k.startswith('current_')]),
            'future_scenarios': len([k for k in scenarios.keys() if k.startswith('future_')]),
            'day_night_scenarios': len([k for k in scenarios.keys() if 'day_night' in k]),
            'critical_scenarios': len([k for k in scenarios.keys() if 'critical' in k]),
            'demand_range': {
                'min_annual_kwh': min(s.annual_kwh for s in scenarios.values()),
                'max_annual_kwh': max(s.annual_kwh for s in scenarios.values()),
                'min_peak_kw': min(s.peak_demand_kw for s in scenarios.values()),
                'max_peak_kw': max(s.peak_demand_kw for s in scenarios.values())
            },
            'load_factor_range': {
                'min': min(s.load_factor for s in scenarios.values()),
                'max': max(s.load_factor for s in scenarios.values()),
                'average': sum(s.load_factor for s in scenarios.values()) / len(scenarios)
            }
        }
        
        return summary
    
    async def get_demand_for_reopt(
        self,
        facility_id: int,
        scenario_type: str,
        day_night_share: Optional[DayNightShare] = None,
        future_parameters: Optional[FutureGrowthParameters] = None
    ) -> Dict[str, Any]:
        """
        Get demand data formatted for REopt optimization
        
        Returns:
            REopt-compatible load profile and metadata
        """
        
        demand_data = await self.get_demand_data(
            facility_id=facility_id,
            scenario_types=[scenario_type],
            data_format="hourly_profile",
            day_night_share=day_night_share,
            future_parameters=future_parameters
        )
        
        scenario_data = demand_data.scenario_data.get(scenario_type)
        if not scenario_data:
            raise ValueError(f"Scenario '{scenario_type}' not found")
        
        # Format for REopt
        reopt_data = {
            'loads_kw': scenario_data['hourly_profile'],
            'annual_kwh': scenario_data['annual_kwh'],
            'peak_kw': scenario_data['peak_demand_kw'],
            'load_factor': scenario_data['load_factor'],
            'facility_id': facility_id,
            'scenario_type': scenario_type,
            'data_source': 'DREAM_Tool_Demand_Scenarios'
        }
        
        return reopt_data
    
    async def get_demand_for_mcda(
        self,
        facility_ids: List[int],
        scenario_type: str = "current_all",
        day_night_share: Optional[DayNightShare] = None,
        future_parameters: Optional[FutureGrowthParameters] = None
    ) -> Dict[int, Dict[str, float]]:
        """
        Get demand data formatted for MCDA analysis
        
        Returns:
            Dictionary mapping facility_id to demand metrics for MCDA
        """
        
        mcda_data = {}
        
        for facility_id in facility_ids:
            try:
                demand_data = await self.get_demand_data(
                    facility_id=facility_id,
                    scenario_types=[scenario_type],
                    data_format="annual_total",
                    day_night_share=day_night_share,
                    future_parameters=future_parameters
                )
                
                scenario_data = demand_data.scenario_data.get(scenario_type)
                if scenario_data:
                    mcda_data[facility_id] = {
                        'annual_energy_demand_kwh': scenario_data['annual_kwh'],
                        'peak_demand_kw': scenario_data['peak_demand_kw'],
                        'load_factor': scenario_data['load_factor'],
                        'estimated_annual_cost': scenario_data.get('cost_implications', {}).get('total_annual_cost', 0)
                    }
                
            except Exception as e:
                logger.error(f"Error getting MCDA data for facility {facility_id}: {e}")
                mcda_data[facility_id] = None
        
        return mcda_data
    
    async def get_demand_for_energy_analysis(
        self,
        facility_id: int,
        scenario_types: List[str],
        day_night_share: Optional[DayNightShare] = None,
        future_parameters: Optional[FutureGrowthParameters] = None
    ) -> Dict[str, Any]:
        """
        Get demand data formatted for energy analysis services
        
        Returns:
            Comprehensive demand data for energy modeling
        """
        
        demand_data = await self.get_demand_data(
            facility_id=facility_id,
            scenario_types=scenario_types,
            data_format="hourly_profile",
            day_night_share=day_night_share,
            future_parameters=future_parameters,
            include_metadata=True
        )
        
        # Format for energy analysis
        energy_analysis_data = {
            'facility_id': facility_id,
            'scenarios': {},
            'comparison_metrics': {},
            'metadata': demand_data.metadata
        }
        
        for scenario_type, scenario_data in demand_data.scenario_data.items():
            if scenario_data:
                energy_analysis_data['scenarios'][scenario_type] = {
                    'hourly_loads_kw': scenario_data['hourly_profile'],
                    'annual_energy_kwh': scenario_data['annual_kwh'],
                    'peak_demand_kw': scenario_data['peak_demand_kw'],
                    'load_factor': scenario_data['load_factor'],
                    'equipment_breakdown': scenario_data['equipment_breakdown'],
                    'monthly_totals': self._calculate_monthly_totals(scenario_data['hourly_profile'])
                }
        
        # Add comparison metrics
        if len(scenario_types) > 1:
            energy_analysis_data['comparison_metrics'] = self._calculate_scenario_comparisons(
                demand_data.scenario_data
            )
        
        return energy_analysis_data
    
    def _generate_cache_key(
        self,
        facility_id: int,
        day_night_share: Optional[DayNightShare],
        future_parameters: Optional[FutureGrowthParameters]
    ) -> str:
        """Generate cache key for scenarios"""
        
        key_parts = [f"facility_{facility_id}"]
        
        if day_night_share:
            key_parts.append(f"day_{day_night_share.day_share_percent}_night_{day_night_share.night_share_percent}")
        
        if future_parameters:
            key_parts.append(f"growth_{future_parameters.growth_factor}_years_{future_parameters.timeline_years}")
            key_parts.append(f"equipment_{len(future_parameters.selected_equipment_ids)}")
        
        return "_".join(key_parts)
    
    def _is_cache_expired(self, cache_key: str) -> bool:
        """Check if cached data is expired"""
        
        if cache_key not in self.scenario_cache:
            return True
        
        cache_time = datetime.fromisoformat(self.scenario_cache[cache_key]['timestamp'])
        current_time = datetime.now()
        
        return (current_time - cache_time).seconds > self.cache_timeout
    
    async def _generate_scenarios(
        self,
        facility_id: int,
        day_night_share: Optional[DayNightShare],
        future_parameters: Optional[FutureGrowthParameters]
    ) -> Dict[str, DemandScenario]:
        """Generate all demand scenarios"""
        
        # Get facility equipment data
        from routes.demand_scenarios import _get_facility_equipment
        equipment_data = await _get_facility_equipment(facility_id)
        
        # Use defaults if parameters not provided
        if not day_night_share:
            day_night_share = DayNightShare(day_share_percent=60.0, night_share_percent=40.0)
        
        if not future_parameters:
            future_parameters = FutureGrowthParameters(
                selected_equipment_ids=[eq.name for eq in equipment_data],
                growth_factor=1.2,
                timeline_years=5
            )
        
        # Generate scenarios
        scenarios = demand_scenario_engine.create_all_demand_scenarios(
            equipment_data,
            day_night_share,
            future_parameters,
            facility_id
        )
        
        return scenarios
    
    def _format_scenario_data(
        self,
        scenario: DemandScenario,
        data_format: str
    ) -> Dict[str, Any]:
        """Format scenario data according to requested format"""
        
        base_data = {
            'scenario_type': scenario.scenario_type.value,
            'name': scenario.name,
            'description': scenario.description,
            'annual_kwh': scenario.annual_kwh,
            'peak_demand_kw': scenario.peak_demand_kw,
            'load_factor': scenario.load_factor,
            'equipment_breakdown': scenario.equipment_breakdown,
            'cost_implications': scenario.cost_implications
        }
        
        if data_format == DemandDataFormat.HOURLY_PROFILE.value:
            base_data['hourly_profile'] = scenario.hourly_profile
        elif data_format == DemandDataFormat.DAILY_PROFILE.value:
            base_data['daily_profile'] = scenario.hourly_profile[:24]  # First 24 hours
        elif data_format == DemandDataFormat.MONTHLY_TOTALS.value:
            base_data['monthly_totals'] = self._calculate_monthly_totals(scenario.hourly_profile)
        elif data_format == DemandDataFormat.ANNUAL_TOTAL.value:
            # Base data already includes annual totals
            pass
        elif data_format == DemandDataFormat.PEAK_DEMAND.value:
            base_data = {'peak_demand_kw': scenario.peak_demand_kw}
        elif data_format == DemandDataFormat.LOAD_FACTOR.value:
            base_data = {'load_factor': scenario.load_factor}
        elif data_format == DemandDataFormat.EQUIPMENT_BREAKDOWN.value:
            base_data = {'equipment_breakdown': scenario.equipment_breakdown}
        elif data_format == DemandDataFormat.COST_ANALYSIS.value:
            base_data = {'cost_implications': scenario.cost_implications}
        
        return base_data
    
    def _generate_metadata(
        self,
        scenarios: Dict[str, DemandScenario],
        requested_scenarios: List[str]
    ) -> Dict[str, Any]:
        """Generate metadata for demand data response"""
        
        available_scenarios = list(scenarios.keys())
        
        metadata = {
            'available_scenarios': available_scenarios,
            'requested_scenarios': requested_scenarios,
            'total_scenarios_available': len(available_scenarios),
            'scenarios_returned': len([s for s in requested_scenarios if s in available_scenarios]),
            'generation_method': 'DREAM_Tool_Demand_Scenario_Engine',
            'data_quality': 'high',
            'assumptions': {
                'day_hours': '6 AM to 6 PM (12 hours)',
                'night_hours': '6 PM to 6 AM (12 hours)',
                'seasonal_variation': 'Applied with monthly factors',
                'weather_adjustment': 'Included in base profiles'
            }
        }
        
        return metadata
    
    def _calculate_monthly_totals(self, hourly_profile: List[float]) -> List[float]:
        """Calculate monthly energy totals from hourly profile"""
        
        days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        monthly_totals = []
        
        hour_index = 0
        for month_days in days_in_month:
            month_total = 0
            for day in range(month_days):
                for hour in range(24):
                    if hour_index < len(hourly_profile):
                        month_total += hourly_profile[hour_index]
                        hour_index += 1
            monthly_totals.append(month_total)
        
        return monthly_totals
    
    def _calculate_scenario_comparisons(
        self,
        scenario_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate comparison metrics between scenarios"""
        
        valid_scenarios = {k: v for k, v in scenario_data.items() if v is not None}
        
        if len(valid_scenarios) < 2:
            return {}
        
        annual_values = [s['annual_kwh'] for s in valid_scenarios.values()]
        peak_values = [s['peak_demand_kw'] for s in valid_scenarios.values()]
        
        return {
            'annual_energy_range': {
                'min': min(annual_values),
                'max': max(annual_values),
                'ratio': max(annual_values) / min(annual_values) if min(annual_values) > 0 else 0
            },
            'peak_demand_range': {
                'min': min(peak_values),
                'max': max(peak_values),
                'ratio': max(peak_values) / min(peak_values) if min(peak_values) > 0 else 0
            }
        }

# Global service instance
demand_data_provider = DemandDataProvider()
