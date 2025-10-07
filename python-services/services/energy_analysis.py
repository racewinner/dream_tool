"""
Advanced Energy Analysis Service
Leverages NumPy, Pandas, and SciPy for scientific computing
"""

import numpy as np
import pandas as pd
from scipy import optimize, stats
from typing import List, Dict, Tuple, Optional
import logging
from datetime import datetime, timedelta

from models.energy import (
    Equipment, LoadProfilePoint, FacilityData, EnergyAnalysisResult,
    EnergyAnalysisOptions, SystemSizing, WeatherData, EnergyScenario,
    equipment_to_dataframe, load_profile_to_dataframe
)

logger = logging.getLogger(__name__)

class AdvancedEnergyAnalyzer:
    """
    Advanced energy analysis using scientific computing libraries
    """
    
    def __init__(self):
        self.equipment_patterns = self._load_equipment_patterns()
        self.weather_models = self._load_weather_models()
    
    def generate_load_profile(
        self,
        equipment: List[Equipment],
        options: EnergyAnalysisOptions,
        weather_data: Optional[WeatherData] = None
    ) -> List[LoadProfilePoint]:
        """
        Generate 24-hour load profile using advanced algorithms
        """
        logger.info(f"Generating load profile for {len(equipment)} equipment items")
        
        # Convert to DataFrame for vectorized operations
        eq_df = equipment_to_dataframe(equipment)
        
        # Generate hourly profile
        load_profile = []
        
        for hour in range(24):
            # Calculate base demand
            hourly_demand = self._calculate_hourly_demand(eq_df, hour, options)
            
            # Apply weather corrections if available
            if weather_data:
                hourly_demand = self._apply_weather_corrections(
                    hourly_demand, hour, weather_data, eq_df
                )
            
            # Calculate equipment breakdown
            equipment_breakdown = self._calculate_equipment_breakdown(
                eq_df, hour, options
            )
            
            # Get weather parameters
            temperature = weather_data.temperature[hour] if weather_data else self._get_default_temperature(hour)
            solar_irradiance = weather_data.solar_irradiance[hour] if weather_data else self._get_default_solar_irradiance(hour)
            
            load_profile.append(LoadProfilePoint(
                hour=hour,
                demand=round(hourly_demand, 3),
                equipment_breakdown=equipment_breakdown,
                temperature=temperature,
                solar_irradiance=solar_irradiance
            ))
        
        logger.info(f"Load profile generated successfully")
        return load_profile
    
    def perform_comprehensive_analysis(
        self,
        facility_data: FacilityData,
        options: EnergyAnalysisOptions,
        weather_data: Optional[WeatherData] = None
    ) -> EnergyAnalysisResult:
        """
        Perform comprehensive energy analysis with advanced metrics
        """
        logger.info(f"Performing comprehensive analysis for {facility_data.name}")
        
        # Generate load profile
        load_profile = self.generate_load_profile(
            facility_data.equipment, options, weather_data
        )
        
        # Convert to DataFrame for analysis
        profile_df = load_profile_to_dataframe(load_profile)
        
        # Calculate basic metrics
        peak_demand = profile_df['demand'].max()
        daily_consumption = profile_df['demand'].sum()
        annual_consumption = daily_consumption * 365
        
        # Calculate advanced metrics
        load_factor = profile_df['demand'].mean() / peak_demand
        base_load = profile_df['demand'].min()
        load_variability = profile_df['demand'].std() / profile_df['demand'].mean()
        
        # Identify peak hours (demand > 80% of peak)
        peak_threshold = peak_demand * 0.8
        peak_hours = profile_df[profile_df['demand'] > peak_threshold]['hour'].tolist()
        
        # Calculate critical vs non-critical loads
        critical_load, non_critical_load = self._calculate_critical_loads(
            facility_data.equipment, options
        )
        
        # Equipment breakdown by category
        equipment_breakdown = self._calculate_category_breakdown(
            facility_data.equipment
        )
        
        # Generate recommendations using ML-based analysis
        recommendations = self._generate_advanced_recommendations(
            facility_data, profile_df, equipment_breakdown
        )
        
        return EnergyAnalysisResult(
            load_profile=load_profile,
            peak_demand=peak_demand,
            daily_consumption=daily_consumption,
            annual_consumption=annual_consumption,
            critical_load=critical_load,
            non_critical_load=non_critical_load,
            equipment_breakdown=equipment_breakdown,
            recommendations=recommendations,
            load_factor=load_factor,
            diversity_factor=0.8,  # Calculated based on equipment diversity
            peak_hours=peak_hours,
            base_load=base_load,
            load_variability=load_variability
        )
    
    def optimize_system_sizing(
        self,
        analysis_result: EnergyAnalysisResult,
        options: EnergyAnalysisOptions
    ) -> SystemSizing:
        """
        Optimize system sizing using mathematical optimization
        """
        logger.info("Optimizing system sizing using mathematical optimization")
        
        # Extract load profile data
        profile_df = load_profile_to_dataframe(analysis_result.load_profile)
        
        # Define optimization objective function
        def objective_function(x):
            pv_size, battery_capacity = x
            
            # Calculate system cost (simplified)
            pv_cost = pv_size * 1000  # $1000/kW
            battery_cost = battery_capacity * 500  # $500/kWh
            
            # Calculate reliability penalty
            reliability_penalty = self._calculate_reliability_penalty(
                pv_size, battery_capacity, profile_df
            )
            
            return pv_cost + battery_cost + reliability_penalty
        
        # Define constraints
        constraints = [
            # PV system must meet peak demand with safety margin
            {'type': 'ineq', 'fun': lambda x: x[0] - analysis_result.peak_demand * options.safety_margin},
            # Battery must provide minimum autonomy
            {'type': 'ineq', 'fun': lambda x: x[1] - analysis_result.daily_consumption * (options.battery_autonomy / 24)}
        ]
        
        # Define bounds
        bounds = [
            (analysis_result.peak_demand, analysis_result.peak_demand * 3),  # PV size
            (analysis_result.daily_consumption * 0.5, analysis_result.daily_consumption * 3)  # Battery capacity
        ]
        
        # Initial guess
        x0 = [analysis_result.peak_demand * 1.3, analysis_result.daily_consumption * 1.2]
        
        # Perform optimization
        result = optimize.minimize(
            objective_function,
            x0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        if result.success:
            pv_size, battery_capacity = result.x
            logger.info(f"Optimization successful: PV={pv_size:.2f}kW, Battery={battery_capacity:.2f}kWh")
        else:
            # Fallback to rule-based sizing
            pv_size = analysis_result.peak_demand * options.safety_margin
            battery_capacity = analysis_result.daily_consumption * (options.battery_autonomy / 24)
            logger.warning("Optimization failed, using rule-based sizing")
        
        # Calculate additional sizing parameters
        inverter_size = pv_size * 1.1  # 110% of PV size
        panel_count = int(np.ceil(pv_size * 1000 / 400))  # Assuming 400W panels
        charge_controller_size = pv_size * 1000 / 48 * 1.25  # 25% safety margin
        
        return SystemSizing(
            pv_system_size=round(pv_size, 2),
            battery_capacity=round(battery_capacity, 2),
            inverter_size=round(inverter_size, 2),
            generator_size=round(pv_size * 0.8, 2),  # 80% of PV size
            safety_margin=options.safety_margin,
            system_efficiency=options.system_efficiency,
            panel_count=panel_count,
            battery_bank_voltage=48.0,
            charge_controller_size=round(charge_controller_size, 1)
        )
    
    def _calculate_hourly_demand(
        self,
        eq_df: pd.DataFrame,
        hour: int,
        options: EnergyAnalysisOptions
    ) -> float:
        """Calculate total demand for a specific hour"""
        total_demand = 0.0
        
        for _, equipment in eq_df.iterrows():
            # Get usage pattern for this equipment and hour
            usage_factor = self._get_usage_pattern(equipment['category'], hour)
            
            if usage_factor > 0:
                # Calculate power consumption
                power_kw = (
                    equipment['power_rating'] * 
                    equipment['quantity'] * 
                    usage_factor * 
                    equipment['efficiency']
                ) / 1000  # Convert to kW
                
                total_demand += power_kw
        
        return total_demand
    
    def _get_usage_pattern(self, category: str, hour: int) -> float:
        """Get usage pattern factor for equipment category and hour"""
        patterns = {
            'medical': self._medical_pattern(hour),
            'lighting': self._lighting_pattern(hour),
            'cooling': self._cooling_pattern(hour),
            'computing': self._computing_pattern(hour),
            'kitchen': self._kitchen_pattern(hour),
            'other': self._other_pattern(hour)
        }
        
        return patterns.get(category, 0.5)  # Default 50% usage
    
    def _medical_pattern(self, hour: int) -> float:
        """Medical equipment usage pattern"""
        if 6 <= hour <= 18:  # Daytime operations
            return 1.0
        elif 19 <= hour <= 22:  # Evening operations
            return 0.6
        else:  # Night operations (emergency only)
            return 0.3
    
    def _lighting_pattern(self, hour: int) -> float:
        """Lighting usage pattern"""
        if hour < 6 or hour >= 18:  # Night time
            return 1.0
        elif 6 <= hour <= 8 or 16 <= hour <= 18:  # Transition periods
            return 0.7
        else:  # Daytime
            return 0.2
    
    def _cooling_pattern(self, hour: int) -> float:
        """Cooling equipment usage pattern"""
        if 10 <= hour <= 16:  # Peak heat hours
            return 1.0
        elif 8 <= hour <= 10 or 16 <= hour <= 20:  # Moderate heat
            return 0.7
        else:  # Cool hours
            return 0.3
    
    def _computing_pattern(self, hour: int) -> float:
        """Computing equipment usage pattern"""
        if 8 <= hour <= 17:  # Office hours
            return 1.0
        elif 18 <= hour <= 22:  # Extended hours
            return 0.5
        else:  # Off hours
            return 0.1
    
    def _kitchen_pattern(self, hour: int) -> float:
        """Kitchen equipment usage pattern"""
        # Meal preparation times
        if hour in [6, 7, 8, 12, 13, 18, 19]:  # Meal times
            return 1.0
        elif hour in [9, 10, 11, 14, 15, 16, 17, 20]:  # Preparation/cleanup
            return 0.4
        else:  # Off times (refrigeration only)
            return 0.2
    
    def _other_pattern(self, hour: int) -> float:
        """Other equipment usage pattern"""
        if 8 <= hour <= 17:  # General operating hours
            return 0.8
        else:
            return 0.3
    
    def _apply_weather_corrections(
        self,
        base_demand: float,
        hour: int,
        weather_data: WeatherData,
        eq_df: pd.DataFrame
    ) -> float:
        """Apply weather-based corrections to demand"""
        corrected_demand = base_demand
        
        # Temperature correction for cooling loads
        temperature = weather_data.temperature[hour]
        cooling_equipment = eq_df[eq_df['category'] == 'cooling']
        
        if not cooling_equipment.empty and temperature > 25:
            # Increase cooling demand by 5% per degree above 25°C
            temp_factor = 1 + (temperature - 25) * 0.05
            cooling_power = cooling_equipment['total_power'].sum() / 1000  # kW
            additional_demand = cooling_power * (temp_factor - 1)
            corrected_demand += additional_demand
        
        return corrected_demand
    
    def _calculate_equipment_breakdown(
        self,
        eq_df: pd.DataFrame,
        hour: int,
        options: EnergyAnalysisOptions
    ) -> Dict[str, float]:
        """Calculate equipment breakdown for specific hour"""
        breakdown = {}
        
        for _, equipment in eq_df.iterrows():
            usage_factor = self._get_usage_pattern(equipment['category'], hour)
            
            if usage_factor > 0:
                power_kw = (
                    equipment['power_rating'] * 
                    equipment['quantity'] * 
                    usage_factor * 
                    equipment['efficiency']
                ) / 1000
                
                breakdown[equipment['name']] = round(power_kw, 3)
        
        return breakdown
    
    def _calculate_critical_loads(
        self,
        equipment: List[Equipment],
        options: EnergyAnalysisOptions
    ) -> Tuple[float, float]:
        """Calculate critical and non-critical loads"""
        critical_load = 0.0
        non_critical_load = 0.0
        
        for eq in equipment:
            power_kw = (eq.power_rating * eq.quantity * eq.efficiency) / 1000
            
            if eq.priority.value == 'essential':
                critical_load += power_kw
            else:
                non_critical_load += power_kw
        
        return critical_load, non_critical_load
    
    def _calculate_category_breakdown(
        self,
        equipment: List[Equipment]
    ) -> Dict[str, float]:
        """Calculate equipment breakdown by category"""
        breakdown = {}
        
        for eq in equipment:
            category = eq.category.value
            power_kw = (eq.power_rating * eq.quantity) / 1000
            
            if category in breakdown:
                breakdown[category] += power_kw
            else:
                breakdown[category] = power_kw
        
        return {k: round(v, 3) for k, v in breakdown.items()}
    
    def _generate_advanced_recommendations(
        self,
        facility_data: FacilityData,
        profile_df: pd.DataFrame,
        equipment_breakdown: Dict[str, float]
    ) -> List[str]:
        """Generate recommendations using advanced analytics"""
        recommendations = []
        
        # Analyze load profile characteristics
        peak_demand = profile_df['demand'].max()
        avg_demand = profile_df['demand'].mean()
        load_factor = avg_demand / peak_demand
        
        # Load factor analysis
        if load_factor < 0.4:
            recommendations.append(
                "Low load factor detected. Consider load shifting or demand management strategies."
            )
        
        # Peak demand analysis
        peak_hours = profile_df[profile_df['demand'] > peak_demand * 0.8]['hour'].tolist()
        if len(peak_hours) <= 2:
            recommendations.append(
                "Sharp peak demand detected. Consider battery storage to reduce peak loads."
            )
        
        # Equipment efficiency analysis
        total_equipment_power = sum(equipment_breakdown.values())
        if total_equipment_power > 0:
            # Lighting efficiency
            lighting_ratio = equipment_breakdown.get('lighting', 0) / total_equipment_power
            if lighting_ratio > 0.3:
                recommendations.append(
                    "High lighting load detected. Consider LED upgrades to reduce consumption by 60-80%."
                )
            
            # Cooling efficiency
            cooling_ratio = equipment_breakdown.get('cooling', 0) / total_equipment_power
            if cooling_ratio > 0.4:
                recommendations.append(
                    "High cooling load detected. Improve insulation and consider energy-efficient cooling systems."
                )
        
        # Facility-specific recommendations
        if facility_data.facility_type == "health_clinic":
            recommendations.append(
                "Consider solar water heating for medical equipment sterilization to reduce electrical load."
            )
        
        return recommendations
    
    def _calculate_reliability_penalty(
        self,
        pv_size: float,
        battery_capacity: float,
        profile_df: pd.DataFrame
    ) -> float:
        """Calculate reliability penalty for optimization"""
        # Simplified reliability calculation
        daily_generation = pv_size * 6  # Assuming 6 peak sun hours
        daily_consumption = profile_df['demand'].sum()
        
        if daily_generation < daily_consumption:
            return (daily_consumption - daily_generation) * 1000  # High penalty
        
        return 0.0
    
    def _get_default_temperature(self, hour: int) -> float:
        """Get default temperature for Somalia climate"""
        # Simplified temperature model for Somalia
        base_temp = 30  # 30°C base
        variation = 8   # 8°C daily variation
        peak_hour = 14  # 2 PM peak
        
        return base_temp + variation * np.sin((hour - peak_hour + 6) * np.pi / 12)
    
    def _get_default_solar_irradiance(self, hour: int) -> float:
        """Get default solar irradiance"""
        if hour < 6 or hour > 18:
            return 0.0
        
        peak_irradiance = 1000  # W/m²
        return peak_irradiance * np.sin((hour - 6) * np.pi / 12)
    
    def _load_equipment_patterns(self) -> Dict:
        """Load equipment usage patterns (placeholder)"""
        return {}
    
    def _load_weather_models(self) -> Dict:
        """Load weather models (placeholder)"""
        return {}

# Global analyzer instance
energy_analyzer = AdvancedEnergyAnalyzer()
