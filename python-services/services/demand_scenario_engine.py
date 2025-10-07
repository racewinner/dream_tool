"""
Demand-Driven Scenario Engine
Creates technology and economic scenarios based on user-defined energy demand patterns
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from datetime import datetime, timedelta

from models.energy import Equipment, LoadProfilePoint
from services.energy_analysis import AdvancedEnergyAnalyzer

logger = logging.getLogger(__name__)

class DemandScenarioType(Enum):
    CURRENT_ALL = "current_all_equipment"
    CURRENT_CRITICAL = "current_critical_equipment"
    CURRENT_DAY_NIGHT = "current_all_with_day_night_variation"
    CURRENT_CRITICAL_DAY_NIGHT = "current_critical_with_day_night_variation"
    FUTURE_ALL = "future_all_equipment"
    FUTURE_CRITICAL = "future_critical_equipment"
    FUTURE_DAY_NIGHT = "future_all_with_day_night_variation"
    FUTURE_CRITICAL_DAY_NIGHT = "future_critical_with_day_night_variation"

@dataclass
class DayNightShare:
    day_share_percent: float = 60.0    # Percentage of total daily energy consumed during day hours (6 AM - 6 PM)
    night_share_percent: float = 40.0  # Percentage of total daily energy consumed during night hours (6 PM - 6 AM)
    transition_hours: int = 2          # Hours for gradual transition
    
    def __post_init__(self):
        """Validate that day and night shares add up to 100%"""
        total_share = self.day_share_percent + self.night_share_percent
        if abs(total_share - 100.0) > 0.1:  # Allow small floating point errors
            raise ValueError(f"Day and night shares must add up to 100%, got {total_share}%")

@dataclass
class FutureGrowthParameters:
    selected_equipment_ids: List[str]
    growth_factor: float = 1.2   # 20% growth by default
    new_equipment: List[Equipment] = None
    timeline_years: int = 5

@dataclass
class DemandScenario:
    scenario_type: DemandScenarioType
    name: str
    description: str
    annual_kwh: float
    peak_demand_kw: float
    load_factor: float
    hourly_profile: List[float]  # 8760 hours
    equipment_breakdown: Dict[str, float]
    cost_implications: Dict[str, float]

class DemandScenarioEngine:
    """Engine for creating demand-driven technology and economic scenarios"""
    
    def __init__(self):
        self.energy_analyzer = AdvancedEnergyAnalyzer()
        
    def create_all_demand_scenarios(
        self,
        base_equipment: List[Equipment],
        day_night_share: DayNightShare,
        future_parameters: FutureGrowthParameters,
        facility_id: int
    ) -> Dict[str, DemandScenario]:
        """Create all 8 demand scenarios based on user inputs"""
        
        scenarios = {}
        
        # CURRENT DEMAND SCENARIOS (4 scenarios)
        # 1. Current all equipment demand
        scenarios['current_all'] = self._create_current_all_scenario(base_equipment)
        
        # 2. Current critical equipment only
        scenarios['current_critical'] = self._create_current_critical_scenario(base_equipment)
        
        # 3. Current all equipment with day/night percentage shares
        scenarios['current_all_day_night'] = self._create_current_day_night_scenario(
            base_equipment, day_night_share
        )
        
        # 4. Current critical equipment with day/night percentage shares
        scenarios['current_critical_day_night'] = self._create_current_critical_day_night_scenario(
            base_equipment, day_night_share
        )
        
        # FUTURE DEMAND SCENARIOS (4 scenarios)
        # 5. Future all equipment
        scenarios['future_all'] = self._create_future_all_scenario(
            base_equipment, future_parameters
        )
        
        # 6. Future critical equipment
        scenarios['future_critical'] = self._create_future_critical_scenario(
            base_equipment, future_parameters
        )
        
        # 7. Future all equipment with day/night percentage shares
        scenarios['future_all_day_night'] = self._create_future_day_night_scenario(
            base_equipment, future_parameters, day_night_share
        )
        
        # 8. Future critical equipment with day/night percentage shares
        scenarios['future_critical_day_night'] = self._create_future_critical_day_night_scenario(
            base_equipment, future_parameters, day_night_share
        )
        
        return scenarios
    
    def _create_current_all_scenario(self, equipment: List[Equipment]) -> DemandScenario:
        """Current energy demand from all equipment"""
        
        # Generate base load profile
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(include_weather_adjustment=True)
        daily_profile = self.energy_analyzer.generate_load_profile(equipment, options)
        
        # Expand to annual profile
        annual_profile = self._expand_to_annual(daily_profile)
        
        return DemandScenario(
            scenario_type=DemandScenarioType.CURRENT_ALL,
            name="Current All Equipment",
            description="Current energy demand from all surveyed equipment",
            annual_kwh=sum(annual_profile),
            peak_demand_kw=max(annual_profile),
            load_factor=self._calculate_load_factor(annual_profile),
            hourly_profile=annual_profile,
            equipment_breakdown=self._get_equipment_breakdown(equipment),
            cost_implications=self._calculate_cost_implications(annual_profile, "current")
        )
    
    def _create_current_critical_scenario(self, equipment: List[Equipment]) -> DemandScenario:
        """Current energy demand from critical equipment only"""
        
        critical_equipment = [eq for eq in equipment if eq.priority in ['critical', 'high']]
        
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(include_weather_adjustment=True)
        daily_profile = self.energy_analyzer.generate_load_profile(critical_equipment, options)
        
        annual_profile = self._expand_to_annual(daily_profile)
        
        return DemandScenario(
            scenario_type=DemandScenarioType.CURRENT_CRITICAL,
            name="Current Critical Equipment",
            description="Current energy demand from critical equipment only",
            annual_kwh=sum(annual_profile),
            peak_demand_kw=max(annual_profile),
            load_factor=self._calculate_load_factor(annual_profile),
            hourly_profile=annual_profile,
            equipment_breakdown=self._get_equipment_breakdown(critical_equipment),
            cost_implications=self._calculate_cost_implications(annual_profile, "critical")
        )
    
    def _create_current_day_night_scenario(
        self, 
        equipment: List[Equipment], 
        day_night_share: DayNightShare
    ) -> DemandScenario:
        """Current demand with user-defined day/night percentage shares"""
        
        # Base profile
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(include_weather_adjustment=True)
        daily_profile = self.energy_analyzer.generate_load_profile(equipment, options)
        
        # Apply day/night percentage shares
        modified_profile = self._apply_day_night_shares(daily_profile, day_night_share)
        annual_profile = self._expand_to_annual(modified_profile)
        
        return DemandScenario(
            scenario_type=DemandScenarioType.CURRENT_DAY_NIGHT,
            name="Current All Equipment with Day/Night Variation",
            description=f"Current all equipment demand with {day_night_share.day_share_percent}% day, {day_night_share.night_share_percent}% night energy distribution",
            annual_kwh=sum(annual_profile),
            peak_demand_kw=max(annual_profile),
            load_factor=self._calculate_load_factor(annual_profile),
            hourly_profile=annual_profile,
            equipment_breakdown=self._get_equipment_breakdown(equipment),
            cost_implications=self._calculate_cost_implications(annual_profile, "current_all_day_night")
        )
    
    def _create_current_critical_day_night_scenario(
        self, 
        equipment: List[Equipment], 
        day_night_share: DayNightShare
    ) -> DemandScenario:
        """Current critical equipment with user-defined day/night percentage shares"""
        
        critical_equipment = [eq for eq in equipment if eq.priority in ['critical', 'high']]
        
        # Base profile for critical equipment
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(include_weather_adjustment=True)
        daily_profile = self.energy_analyzer.generate_load_profile(critical_equipment, options)
        
        # Apply day/night percentage shares
        modified_profile = self._apply_day_night_shares(daily_profile, day_night_share)
        annual_profile = self._expand_to_annual(modified_profile)
        
        return DemandScenario(
            scenario_type=DemandScenarioType.CURRENT_CRITICAL_DAY_NIGHT,
            name="Current Critical Equipment with Day/Night Variation",
            description=f"Current critical equipment demand with {day_night_share.day_share_percent}% day, {day_night_share.night_share_percent}% night energy distribution",
            annual_kwh=sum(annual_profile),
            peak_demand_kw=max(annual_profile),
            load_factor=self._calculate_load_factor(annual_profile),
            hourly_profile=annual_profile,
            equipment_breakdown=self._get_equipment_breakdown(critical_equipment),
            cost_implications=self._calculate_cost_implications(annual_profile, "current_critical_day_night")
        )
    
    def _create_future_all_scenario(
        self, 
        equipment: List[Equipment], 
        future_params: FutureGrowthParameters
    ) -> DemandScenario:
        """Future energy demand from selected equipment with growth"""
        
        # Filter selected equipment and apply growth
        future_equipment = self._apply_future_growth(equipment, future_params)
        
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(include_weather_adjustment=True)
        daily_profile = self.energy_analyzer.generate_load_profile(future_equipment, options)
        
        annual_profile = self._expand_to_annual(daily_profile)
        
        return DemandScenario(
            scenario_type=DemandScenarioType.FUTURE_ALL,
            name="Future All Equipment",
            description=f"Future demand with {future_params.growth_factor}x growth over {future_params.timeline_years} years",
            annual_kwh=sum(annual_profile),
            peak_demand_kw=max(annual_profile),
            load_factor=self._calculate_load_factor(annual_profile),
            hourly_profile=annual_profile,
            equipment_breakdown=self._get_equipment_breakdown(future_equipment),
            cost_implications=self._calculate_cost_implications(annual_profile, "future")
        )
    
    def _create_future_critical_scenario(
        self, 
        equipment: List[Equipment], 
        future_params: FutureGrowthParameters
    ) -> DemandScenario:
        """Future critical equipment demand"""
        
        future_equipment = self._apply_future_growth(equipment, future_params)
        critical_equipment = [eq for eq in future_equipment if eq.priority in ['critical', 'high']]
        
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(include_weather_adjustment=True)
        daily_profile = self.energy_analyzer.generate_load_profile(critical_equipment, options)
        
        annual_profile = self._expand_to_annual(daily_profile)
        
        return DemandScenario(
            scenario_type=DemandScenarioType.FUTURE_CRITICAL,
            name="Future Critical Equipment",
            description=f"Future critical equipment demand with {future_params.growth_factor}x growth",
            annual_kwh=sum(annual_profile),
            peak_demand_kw=max(annual_profile),
            load_factor=self._calculate_load_factor(annual_profile),
            hourly_profile=annual_profile,
            equipment_breakdown=self._get_equipment_breakdown(critical_equipment),
            cost_implications=self._calculate_cost_implications(annual_profile, "future_critical")
        )
    
    def _create_future_day_night_scenario(
        self, 
        equipment: List[Equipment], 
        future_params: FutureGrowthParameters,
        day_night_share: DayNightShare
    ) -> DemandScenario:
        """Future all equipment with day/night percentage shares"""
        
        future_equipment = self._apply_future_growth(equipment, future_params)
        
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(include_weather_adjustment=True)
        daily_profile = self.energy_analyzer.generate_load_profile(future_equipment, options)
        
        # Apply day/night percentage shares
        modified_profile = self._apply_day_night_shares(daily_profile, day_night_share)
        annual_profile = self._expand_to_annual(modified_profile)
        
        return DemandScenario(
            scenario_type=DemandScenarioType.FUTURE_DAY_NIGHT,
            name="Future All Equipment with Day/Night Variation",
            description=f"Future all equipment demand with {day_night_share.day_share_percent}% day, {day_night_share.night_share_percent}% night energy distribution",
            annual_kwh=sum(annual_profile),
            peak_demand_kw=max(annual_profile),
            load_factor=self._calculate_load_factor(annual_profile),
            hourly_profile=annual_profile,
            equipment_breakdown=self._get_equipment_breakdown(future_equipment),
            cost_implications=self._calculate_cost_implications(annual_profile, "future_day_night")
        )
    
    def _create_future_critical_day_night_scenario(
        self, 
        equipment: List[Equipment], 
        future_params: FutureGrowthParameters,
        day_night_share: DayNightShare
    ) -> DemandScenario:
        """Future critical equipment with day/night percentage shares"""
        
        future_equipment = self._apply_future_growth(equipment, future_params)
        critical_equipment = [eq for eq in future_equipment if eq.priority in ['critical', 'high']]
        
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(include_weather_adjustment=True)
        daily_profile = self.energy_analyzer.generate_load_profile(critical_equipment, options)
        
        # Apply day/night percentage shares
        modified_profile = self._apply_day_night_shares(daily_profile, day_night_share)
        annual_profile = self._expand_to_annual(modified_profile)
        
        return DemandScenario(
            scenario_type=DemandScenarioType.FUTURE_CRITICAL_DAY_NIGHT,
            name="Future Critical with Day/Night Variation",
            description=f"Future critical equipment with {day_night_share.day_share_percent}% day, {day_night_share.night_share_percent}% night energy distribution",
            annual_kwh=sum(annual_profile),
            peak_demand_kw=max(annual_profile),
            load_factor=self._calculate_load_factor(annual_profile),
            hourly_profile=annual_profile,
            equipment_breakdown=self._get_equipment_breakdown(critical_equipment),
            cost_implications=self._calculate_cost_implications(annual_profile, "future_critical_day_night")
        )
    
    def create_technology_scenarios_for_demand(
        self, 
        demand_scenario: DemandScenario
    ) -> Dict[str, Dict[str, Any]]:
        """Create solar PV technology scenarios based on demand scenario"""
        
        peak_demand = demand_scenario.peak_demand_kw
        annual_demand = demand_scenario.annual_kwh
        
        # Technology sizing scenarios
        scenarios = {
            'minimal_pv': {
                'pv_size_kw': peak_demand * 0.3,  # 30% of peak demand
                'description': 'Minimal PV to offset daytime consumption',
                'coverage_ratio': 0.3
            },
            'partial_pv': {
                'pv_size_kw': peak_demand * 0.7,  # 70% of peak demand
                'description': 'Partial PV coverage for significant savings',
                'coverage_ratio': 0.7
            },
            'full_pv': {
                'pv_size_kw': peak_demand * 1.0,  # 100% of peak demand
                'description': 'Full PV coverage for maximum generation',
                'coverage_ratio': 1.0
            },
            'oversized_pv': {
                'pv_size_kw': peak_demand * 1.3,  # 130% of peak demand
                'description': 'Oversized PV for export and future growth',
                'coverage_ratio': 1.3
            }
        }
        
        # Add storage scenarios for each PV size
        for pv_scenario in scenarios.values():
            pv_size = pv_scenario['pv_size_kw']
            pv_scenario['storage_options'] = {
                'no_storage': {'battery_kw': 0, 'battery_kwh': 0},
                'minimal_storage': {'battery_kw': pv_size * 0.3, 'battery_kwh': pv_size * 1.0},
                'full_storage': {'battery_kw': pv_size * 0.5, 'battery_kwh': pv_size * 2.0},
                'extended_storage': {'battery_kw': pv_size * 0.7, 'battery_kwh': pv_size * 4.0}
            }
        
        return scenarios
    
    def create_economic_scenarios_for_demand(
        self, 
        demand_scenario: DemandScenario,
        technology_scenarios: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """Create economic analysis scenarios for each technology option"""
        
        economic_scenarios = {}
        
        for tech_name, tech_config in technology_scenarios.items():
            pv_size = tech_config['pv_size_kw']
            
            # Base costs ($/kW for PV, $/kW and $/kWh for storage)
            base_pv_cost = 2000  # $/kW
            base_battery_power_cost = 1000  # $/kW
            base_battery_energy_cost = 500   # $/kWh
            
            economic_scenarios[tech_name] = {
                'conservative': {
                    'pv_cost_per_kw': base_pv_cost * 1.2,
                    'battery_power_cost_per_kw': base_battery_power_cost * 1.2,
                    'battery_energy_cost_per_kwh': base_battery_energy_cost * 1.2,
                    'electricity_rate': 0.15,  # $/kWh
                    'escalation_rate': 0.02,
                    'discount_rate': 0.08
                },
                'moderate': {
                    'pv_cost_per_kw': base_pv_cost,
                    'battery_power_cost_per_kw': base_battery_power_cost,
                    'battery_energy_cost_per_kwh': base_battery_energy_cost,
                    'electricity_rate': 0.12,
                    'escalation_rate': 0.025,
                    'discount_rate': 0.07
                },
                'optimistic': {
                    'pv_cost_per_kw': base_pv_cost * 0.8,
                    'battery_power_cost_per_kw': base_battery_power_cost * 0.8,
                    'battery_energy_cost_per_kwh': base_battery_energy_cost * 0.8,
                    'electricity_rate': 0.10,
                    'escalation_rate': 0.03,
                    'discount_rate': 0.06
                }
            }
            
            # Calculate investment costs for each economic scenario
            for econ_name, econ_params in economic_scenarios[tech_name].items():
                pv_investment = pv_size * econ_params['pv_cost_per_kw']
                
                # Add storage costs for each storage option
                storage_investments = {}
                for storage_name, storage_config in tech_config['storage_options'].items():
                    battery_power_cost = storage_config['battery_kw'] * econ_params['battery_power_cost_per_kw']
                    battery_energy_cost = storage_config['battery_kwh'] * econ_params['battery_energy_cost_per_kwh']
                    total_storage_cost = battery_power_cost + battery_energy_cost
                    
                    storage_investments[storage_name] = {
                        'total_investment': pv_investment + total_storage_cost,
                        'pv_cost': pv_investment,
                        'storage_cost': total_storage_cost,
                        'annual_savings_estimate': self._estimate_annual_savings(
                            demand_scenario, pv_size, storage_config, econ_params
                        )
                    }
                
                econ_params['storage_investments'] = storage_investments
        
        return economic_scenarios
    
    def _apply_day_night_shares(
        self, 
        daily_profile: List[LoadProfilePoint], 
        shares: DayNightShare
    ) -> List[LoadProfilePoint]:
        """Apply day/night percentage shares to load profile"""
        
        # Calculate total daily energy from base profile
        total_daily_energy = sum(point.demand_kw for point in daily_profile)
        
        # Calculate target energy for day and night periods
        day_target_energy = total_daily_energy * (shares.day_share_percent / 100.0)
        night_target_energy = total_daily_energy * (shares.night_share_percent / 100.0)
        
        # Separate day and night hours
        day_hours = []    # 6 AM to 6 PM (12 hours)
        night_hours = []  # 6 PM to 6 AM (12 hours)
        
        for hour, point in enumerate(daily_profile):
            if 6 <= hour < 18:  # Day hours
                day_hours.append((hour, point))
            else:  # Night hours
                night_hours.append((hour, point))
        
        # Calculate current energy distribution
        current_day_energy = sum(point.demand_kw for _, point in day_hours)
        current_night_energy = sum(point.demand_kw for _, point in night_hours)
        
        # Calculate scaling factors to achieve target shares
        day_scale_factor = day_target_energy / current_day_energy if current_day_energy > 0 else 1.0
        night_scale_factor = night_target_energy / current_night_energy if current_night_energy > 0 else 1.0
        
        # Apply scaling factors with transition smoothing
        modified_profile = []
        
        for hour, point in enumerate(daily_profile):
            if 6 <= hour < 18:  # Day hours
                scale_factor = day_scale_factor
            else:  # Night hours
                scale_factor = night_scale_factor
            
            # Apply transition smoothing during transition hours
            if shares.transition_hours > 0:
                transition_start = 6 - shares.transition_hours // 2
                transition_end = 6 + shares.transition_hours // 2
                evening_transition_start = 18 - shares.transition_hours // 2
                evening_transition_end = 18 + shares.transition_hours // 2
                
                # Morning transition (night to day)
                if transition_start <= hour < transition_end:
                    transition_progress = (hour - transition_start) / shares.transition_hours
                    scale_factor = night_scale_factor * (1 - transition_progress) + day_scale_factor * transition_progress
                
                # Evening transition (day to night)
                elif evening_transition_start <= hour < evening_transition_end:
                    transition_progress = (hour - evening_transition_start) / shares.transition_hours
                    scale_factor = day_scale_factor * (1 - transition_progress) + night_scale_factor * transition_progress
            
            modified_point = LoadProfilePoint(
                hour=point.hour,
                demand_kw=point.demand_kw * scale_factor,
                equipment_breakdown=point.equipment_breakdown
            )
            modified_profile.append(modified_point)
        
        return modified_profile
    
    def _apply_future_growth(
        self, 
        equipment: List[Equipment], 
        future_params: FutureGrowthParameters
    ) -> List[Equipment]:
        """Apply future growth parameters to equipment"""
        
        future_equipment = []
        
        for eq in equipment:
            if eq.name in future_params.selected_equipment_ids:
                # Apply growth factor to selected equipment
                grown_equipment = Equipment(
                    name=eq.name,
                    category=eq.category,
                    power_rating=eq.power_rating * future_params.growth_factor,
                    quantity=eq.quantity,
                    hours_per_day=eq.hours_per_day,
                    efficiency=eq.efficiency,
                    priority=eq.priority
                )
                future_equipment.append(grown_equipment)
            else:
                # Keep non-selected equipment unchanged
                future_equipment.append(eq)
        
        # Add new equipment if specified
        if future_params.new_equipment:
            future_equipment.extend(future_params.new_equipment)
        
        return future_equipment
    
    def _expand_to_annual(self, daily_profile: List[LoadProfilePoint]) -> List[float]:
        """Expand daily profile to 8760 hours with seasonal variations"""
        
        # Seasonal factors
        seasonal_factors = [1.1, 1.05, 1.0, 0.95, 0.9, 1.1, 1.2, 1.15, 1.0, 0.95, 1.0, 1.05]
        days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        
        annual_loads = []
        
        for month in range(12):
            factor = seasonal_factors[month]
            days = days_in_month[month]
            
            for day in range(days):
                for point in daily_profile:
                    seasonal_load = point.demand_kw * factor
                    # Add small random variation
                    variation = np.random.normal(1.0, 0.05)
                    final_load = max(0, seasonal_load * variation)
                    annual_loads.append(final_load)
        
        # Ensure exactly 8760 hours
        return annual_loads[:8760]
    
    def _calculate_load_factor(self, annual_profile: List[float]) -> float:
        """Calculate load factor from annual profile"""
        if not annual_profile:
            return 0.0
        
        average_load = sum(annual_profile) / len(annual_profile)
        peak_load = max(annual_profile)
        
        return average_load / peak_load if peak_load > 0 else 0.0
    
    def _get_equipment_breakdown(self, equipment: List[Equipment]) -> Dict[str, float]:
        """Get equipment power breakdown"""
        breakdown = {}
        for eq in equipment:
            total_power = eq.power_rating * eq.quantity * (eq.hours_per_day / 24)
            breakdown[eq.name] = total_power
        return breakdown
    
    def _calculate_cost_implications(self, annual_profile: List[float], scenario_type: str) -> Dict[str, float]:
        """Calculate cost implications for demand scenario"""
        
        annual_kwh = sum(annual_profile)
        peak_kw = max(annual_profile) if annual_profile else 0
        
        # Base electricity rates
        energy_rate = 0.12  # $/kWh
        demand_charge = 15.0  # $/kW/month
        
        return {
            'annual_energy_cost': annual_kwh * energy_rate,
            'annual_demand_cost': peak_kw * demand_charge * 12,
            'total_annual_cost': (annual_kwh * energy_rate) + (peak_kw * demand_charge * 12),
            'cost_per_kwh': ((annual_kwh * energy_rate) + (peak_kw * demand_charge * 12)) / annual_kwh if annual_kwh > 0 else 0
        }
    
    def _estimate_annual_savings(
        self, 
        demand_scenario: DemandScenario, 
        pv_size_kw: float, 
        storage_config: Dict[str, float], 
        economic_params: Dict[str, float]
    ) -> float:
        """Estimate annual savings for technology configuration"""
        
        # Simplified savings calculation
        # In production, this would use detailed hourly simulation
        
        annual_generation = pv_size_kw * 1500  # Assume 1500 kWh/kW/year
        electricity_rate = economic_params['electricity_rate']
        
        # Estimate self-consumption based on load profile and storage
        storage_kwh = storage_config.get('battery_kwh', 0)
        self_consumption_ratio = min(0.9, 0.4 + (storage_kwh / annual_generation) * 0.5)
        
        annual_savings = annual_generation * self_consumption_ratio * electricity_rate
        
        return annual_savings

# Global service instance
demand_scenario_engine = DemandScenarioEngine()
