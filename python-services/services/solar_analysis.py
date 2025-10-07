"""
Enhanced Solar Analysis Service for DREAM Tool
Migrated from TypeScript with advanced scientific computing capabilities
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging
import asyncio
from scipy.optimize import minimize_scalar
from scipy import interpolate
import math

from .weather_service import weather_service, WeatherData, WeatherService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SolarAnalysisResult:
    daily_energy_production: float
    monthly_energy_production: List[float]
    yearly_energy_production: float
    optimal_tilt_angle: float
    optimal_orientation: str
    temperature_impact: float
    shading_impact: float
    system_efficiency: float
    performance_ratio: float
    capacity_factor: float
    specific_yield: float  # kWh/kWp/year
    irradiation_data: Dict[str, float]
    weather_summary: Dict[str, float]

@dataclass
class PVSystemConfig:
    panel_rating: float  # Watts per panel
    num_panels: int
    system_losses: float = 15.0  # Percentage
    inverter_efficiency: float = 95.0  # Percentage
    module_efficiency: float = 20.0  # Percentage
    temperature_coefficient: float = -0.45  # %/°C
    tilt_angle: Optional[float] = None
    azimuth_angle: float = 180.0  # South-facing

@dataclass
class SolarPosition:
    elevation: float  # degrees
    azimuth: float   # degrees
    zenith: float    # degrees

class SolarAnalysisService:
    def __init__(self):
        self.weather_service = weather_service
        
        # Solar constants
        self.SOLAR_CONSTANT = 1367  # W/m²
        self.EARTH_ORBIT_ECCENTRICITY = 0.0167
        
        # PV module constants
        self.STANDARD_TEST_CONDITIONS = {
            'irradiance': 1000,  # W/m²
            'temperature': 25,   # °C
            'air_mass': 1.5
        }
    
    async def analyze_solar_potential(
        self,
        facility_id: int,
        latitude: float,
        longitude: float,
        pv_system: PVSystemConfig,
        analysis_period_days: int = 365
    ) -> SolarAnalysisResult:
        """
        Comprehensive solar potential analysis for a given location and PV system configuration
        """
        logger.info(f"Starting solar analysis for facility {facility_id} at {latitude}, {longitude}")
        
        try:
            # Calculate analysis period
            end_date = datetime.now()
            start_date = end_date - timedelta(days=analysis_period_days)
            
            # Get historical weather data
            async with WeatherService() as weather_svc:
                weather_data = await weather_svc.get_historical_weather(
                    latitude, longitude,
                    start_date.strftime('%Y-%m-%d'),
                    end_date.strftime('%Y-%m-%d')
                )
            
            if not weather_data:
                raise ValueError("No weather data available for analysis")
            
            # Calculate optimal system configuration if not provided
            if pv_system.tilt_angle is None:
                pv_system.tilt_angle = self.calculate_optimal_tilt_angle(latitude)
            
            # Perform detailed solar analysis
            daily_productions = []
            monthly_productions = [0.0] * 12
            irradiation_sum = 0.0
            temperature_sum = 0.0
            
            for weather_day in weather_data:
                # Calculate solar position and irradiance for each day
                daily_production = await self._calculate_daily_production(
                    weather_day, latitude, longitude, pv_system
                )
                daily_productions.append(daily_production)
                
                # Accumulate monthly data
                month_index = datetime.strptime(weather_day.daily[0].date, '%Y-%m-%d').month - 1
                monthly_productions[month_index] += daily_production
                
                # Accumulate weather statistics
                if weather_day.daily:
                    irradiation_sum += weather_day.daily[0].solar_radiation
                    temperature_sum += (weather_day.daily[0].temperature_min + weather_day.daily[0].temperature_max) / 2
            
            # Calculate analysis results
            yearly_production = sum(daily_productions)
            average_daily_production = yearly_production / len(daily_productions) if daily_productions else 0
            
            # Calculate performance metrics
            system_capacity_kw = (pv_system.panel_rating * pv_system.num_panels) / 1000
            performance_ratio = self._calculate_performance_ratio(daily_productions, weather_data, system_capacity_kw)
            capacity_factor = self._calculate_capacity_factor(yearly_production, system_capacity_kw, analysis_period_days)
            specific_yield = yearly_production / system_capacity_kw if system_capacity_kw > 0 else 0
            
            # Calculate environmental impacts
            avg_temperature = temperature_sum / len(weather_data) if weather_data else 25
            temperature_impact = self._calculate_temperature_impact(avg_temperature)
            shading_impact = self._calculate_shading_impact(latitude, longitude, pv_system.tilt_angle)
            system_efficiency = self._calculate_system_efficiency(pv_system)
            
            # Optimal orientation analysis
            optimal_orientation = self._calculate_optimal_orientation(latitude)
            
            # Weather summary
            avg_irradiation = irradiation_sum / len(weather_data) if weather_data else 0
            weather_summary = {
                'average_temperature': avg_temperature,
                'average_irradiation': avg_irradiation,
                'total_days': len(weather_data),
                'analysis_period': analysis_period_days
            }
            
            irradiation_data = {
                'daily_average': avg_irradiation,
                'yearly_total': irradiation_sum,
                'peak_sun_hours': avg_irradiation / 1000  # Convert to peak sun hours
            }
            
            result = SolarAnalysisResult(
                daily_energy_production=average_daily_production,
                monthly_energy_production=monthly_productions,
                yearly_energy_production=yearly_production,
                optimal_tilt_angle=pv_system.tilt_angle,
                optimal_orientation=optimal_orientation,
                temperature_impact=temperature_impact,
                shading_impact=shading_impact,
                system_efficiency=system_efficiency,
                performance_ratio=performance_ratio,
                capacity_factor=capacity_factor,
                specific_yield=specific_yield,
                irradiation_data=irradiation_data,
                weather_summary=weather_summary
            )
            
            logger.info(f"Solar analysis completed. Yearly production: {yearly_production:.2f} kWh")
            return result
            
        except Exception as e:
            logger.error(f"Solar analysis failed: {e}")
            raise
    
    async def _calculate_daily_production(
        self, 
        weather_day: WeatherData, 
        latitude: float, 
        longitude: float, 
        pv_system: PVSystemConfig
    ) -> float:
        """Calculate daily energy production for a specific day"""
        if not weather_day.daily:
            return 0.0
        
        daily_weather = weather_day.daily[0]
        date_obj = datetime.strptime(daily_weather.date, '%Y-%m-%d')
        
        # Calculate sun position and irradiance throughout the day
        hourly_production = 0.0
        
        for hour in range(24):
            # Calculate solar position
            solar_position = self._calculate_solar_position(
                latitude, longitude, date_obj, hour
            )
            
            if solar_position.elevation > 0:  # Sun is above horizon
                # Calculate incident irradiance on tilted surface
                incident_irradiance = self._calculate_incident_irradiance(
                    daily_weather.solar_radiation,
                    solar_position,
                    pv_system.tilt_angle,
                    pv_system.azimuth_angle
                )
                
                # Calculate temperature effects
                module_temperature = self._estimate_module_temperature(
                    (daily_weather.temperature_min + daily_weather.temperature_max) / 2,
                    incident_irradiance
                )
                
                # Calculate hourly production
                hourly_output = self._calculate_pv_output(
                    incident_irradiance,
                    module_temperature,
                    pv_system
                )
                
                hourly_production += hourly_output
        
        return hourly_production
    
    def _calculate_solar_position(
        self, 
        latitude: float, 
        longitude: float, 
        date: datetime, 
        hour: int
    ) -> SolarPosition:
        """Calculate solar position (elevation and azimuth) for given time and location"""
        # Day of year
        day_of_year = date.timetuple().tm_yday
        
        # Solar declination angle
        declination = 23.45 * math.sin(math.radians((360 * (284 + day_of_year)) / 365))
        
        # Hour angle
        hour_angle = 15 * (hour - 12)
        
        # Convert to radians
        lat_rad = math.radians(latitude)
        dec_rad = math.radians(declination)
        hour_rad = math.radians(hour_angle)
        
        # Solar elevation angle
        elevation_rad = math.asin(
            math.sin(lat_rad) * math.sin(dec_rad) + 
            math.cos(lat_rad) * math.cos(dec_rad) * math.cos(hour_rad)
        )
        elevation = math.degrees(elevation_rad)
        
        # Solar azimuth angle
        azimuth_rad = math.atan2(
            math.sin(hour_rad),
            math.cos(hour_rad) * math.sin(lat_rad) - math.tan(dec_rad) * math.cos(lat_rad)
        )
        azimuth = math.degrees(azimuth_rad) + 180  # Convert to 0-360 range
        
        # Solar zenith angle
        zenith = 90 - elevation
        
        return SolarPosition(
            elevation=max(0, elevation),
            azimuth=azimuth,
            zenith=zenith
        )
    
    def _calculate_incident_irradiance(
        self,
        horizontal_irradiance: float,
        solar_position: SolarPosition,
        tilt_angle: float,
        surface_azimuth: float
    ) -> float:
        """Calculate irradiance incident on tilted surface"""
        if solar_position.elevation <= 0:
            return 0.0
        
        # Convert angles to radians
        tilt_rad = math.radians(tilt_angle)
        surface_azimuth_rad = math.radians(surface_azimuth)
        solar_azimuth_rad = math.radians(solar_position.azimuth)
        solar_elevation_rad = math.radians(solar_position.elevation)
        
        # Angle of incidence
        cos_incidence = (
            math.sin(solar_elevation_rad) * math.cos(tilt_rad) +
            math.cos(solar_elevation_rad) * math.sin(tilt_rad) * 
            math.cos(solar_azimuth_rad - surface_azimuth_rad)
        )
        
        # Ensure non-negative
        cos_incidence = max(0, cos_incidence)
        
        # Simple model: incident irradiance = horizontal irradiance * cos(incidence) / sin(elevation)
        if math.sin(solar_elevation_rad) > 0:
            incident_irradiance = horizontal_irradiance * cos_incidence / math.sin(solar_elevation_rad)
        else:
            incident_irradiance = 0
        
        return max(0, incident_irradiance)
    
    def _estimate_module_temperature(self, ambient_temp: float, irradiance: float) -> float:
        """Estimate PV module temperature based on ambient temperature and irradiance"""
        # Nominal Operating Cell Temperature (NOCT) model
        noct = 45  # °C
        noct_irradiance = 800  # W/m²
        noct_ambient = 20  # °C
        
        module_temp = ambient_temp + (noct - noct_ambient) * (irradiance / noct_irradiance)
        return module_temp
    
    def _calculate_pv_output(
        self,
        irradiance: float,
        module_temperature: float,
        pv_system: PVSystemConfig
    ) -> float:
        """Calculate PV power output for given conditions"""
        if irradiance <= 0:
            return 0.0
        
        # Normalize irradiance to STC
        irradiance_ratio = irradiance / self.STANDARD_TEST_CONDITIONS['irradiance']
        
        # Temperature coefficient effect
        temp_effect = 1 + (pv_system.temperature_coefficient / 100) * (
            module_temperature - self.STANDARD_TEST_CONDITIONS['temperature']
        )
        
        # Calculate DC power
        dc_power = (
            pv_system.panel_rating * pv_system.num_panels * 
            irradiance_ratio * temp_effect
        ) / 1000  # Convert to kW
        
        # Apply system losses
        system_efficiency = (100 - pv_system.system_losses) / 100
        inverter_efficiency = pv_system.inverter_efficiency / 100
        
        # Calculate AC power output
        ac_power = dc_power * system_efficiency * inverter_efficiency
        
        return max(0, ac_power)  # kWh for 1 hour
    
    def calculate_optimal_tilt_angle(self, latitude: float) -> float:
        """Calculate optimal tilt angle for maximum annual energy production"""
        # Rule of thumb: optimal tilt ≈ latitude for fixed systems
        # Fine-tune based on latitude
        if abs(latitude) < 25:
            return abs(latitude)
        elif abs(latitude) < 50:
            return abs(latitude) - 5
        else:
            return abs(latitude) - 10
    
    def _calculate_optimal_orientation(self, latitude: float) -> str:
        """Calculate optimal orientation based on hemisphere"""
        if latitude >= 0:
            return "South"  # Northern hemisphere
        else:
            return "North"  # Southern hemisphere
    
    def _calculate_temperature_impact(self, average_temperature: float) -> float:
        """Calculate temperature impact on PV efficiency"""
        base_temp = self.STANDARD_TEST_CONDITIONS['temperature']
        temp_coefficient = -0.45  # %/°C typical for silicon PV
        return temp_coefficient * (average_temperature - base_temp)
    
    def _calculate_shading_impact(self, latitude: float, longitude: float, tilt_angle: float) -> float:
        """Simplified shading impact calculation"""
        # This is a simplified model. In practice, would require detailed site analysis
        base_shading = 0.95  # 5% general shading loss
        
        # Adjust based on tilt angle (higher tilt may reduce shading but increase inter-row shading)
        tilt_factor = 1 - (tilt_angle - 30) * 0.001 if tilt_angle > 30 else 1
        
        return base_shading * tilt_factor
    
    def _calculate_system_efficiency(self, pv_system: PVSystemConfig) -> float:
        """Calculate overall system efficiency"""
        module_efficiency = pv_system.module_efficiency / 100
        inverter_efficiency = pv_system.inverter_efficiency / 100
        system_losses = (100 - pv_system.system_losses) / 100
        
        return module_efficiency * inverter_efficiency * system_losses * 100
    
    def _calculate_performance_ratio(
        self, 
        daily_productions: List[float], 
        weather_data: List[WeatherData], 
        system_capacity_kw: float
    ) -> float:
        """Calculate performance ratio (actual vs theoretical production)"""
        if not daily_productions or not weather_data or system_capacity_kw <= 0:
            return 0.0
        
        total_actual = sum(daily_productions)
        total_theoretical = 0.0
        
        for i, weather_day in enumerate(weather_data):
            if i < len(daily_productions) and weather_day.daily:
                daily_irradiation = weather_day.daily[0].solar_radiation / 1000  # Convert to kWh/m²
                theoretical_daily = system_capacity_kw * daily_irradiation
                total_theoretical += theoretical_daily
        
        if total_theoretical > 0:
            return (total_actual / total_theoretical) * 100
        return 0.0
    
    def _calculate_capacity_factor(
        self, 
        yearly_production: float, 
        system_capacity_kw: float, 
        analysis_days: int
    ) -> float:
        """Calculate capacity factor"""
        if system_capacity_kw <= 0:
            return 0.0
        
        hours_in_period = analysis_days * 24
        theoretical_max = system_capacity_kw * hours_in_period
        
        if theoretical_max > 0:
            return (yearly_production / theoretical_max) * 100
        return 0.0
    
    async def optimize_system_configuration(
        self,
        latitude: float,
        longitude: float,
        available_area: float,  # m²
        budget_constraints: Optional[Dict[str, float]] = None
    ) -> Dict[str, any]:
        """Optimize PV system configuration for given constraints"""
        logger.info(f"Optimizing system configuration for {available_area} m² at {latitude}, {longitude}")
        
        # Define optimization search space
        panel_power_options = [300, 400, 500, 600]  # Watts
        tilt_angle_range = (0, 60)
        
        best_config = None
        best_performance = 0
        
        for panel_power in panel_power_options:
            # Calculate number of panels that fit in available area
            panel_area = 2.0  # m² per panel (typical)
            max_panels = int(available_area / panel_area)
            
            if max_panels < 1:
                continue
            
            # Optimize tilt angle
            def objective(tilt_angle):
                pv_system = PVSystemConfig(
                    panel_rating=panel_power,
                    num_panels=max_panels,
                    tilt_angle=tilt_angle
                )
                
                # Quick performance estimation (simplified)
                optimal_tilt = self.calculate_optimal_tilt_angle(latitude)
                tilt_penalty = abs(tilt_angle - optimal_tilt) * 0.01
                base_performance = panel_power * max_panels * 4.5  # Rough daily kWh estimate
                
                return -(base_performance * (1 - tilt_penalty))  # Negative for minimization
            
            # Optimize tilt angle
            result = minimize_scalar(objective, bounds=tilt_angle_range, method='bounded')
            optimal_tilt = result.x
            performance = -result.fun
            
            if performance > best_performance:
                best_performance = performance
                best_config = {
                    'panel_rating': panel_power,
                    'num_panels': max_panels,
                    'tilt_angle': optimal_tilt,
                    'system_capacity_kw': (panel_power * max_panels) / 1000,
                    'estimated_daily_production': performance,
                    'area_utilization': (max_panels * panel_area) / available_area * 100
                }
        
        return best_config or {}

# Create singleton instance
solar_analysis_service = SolarAnalysisService()
