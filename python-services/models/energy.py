"""
Enhanced Energy Models for Python Microservices
Leverages NumPy and Pandas for scientific computing
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Union
from enum import Enum
import numpy as np
import pandas as pd
from datetime import datetime

class EquipmentCategory(str, Enum):
    MEDICAL = "medical"
    LIGHTING = "lighting"
    COOLING = "cooling"
    COMPUTING = "computing"
    KITCHEN = "kitchen"
    OTHER = "other"

class EquipmentPriority(str, Enum):
    ESSENTIAL = "essential"
    IMPORTANT = "important"
    OPTIONAL = "optional"

class Equipment(BaseModel):
    id: str
    name: str
    category: EquipmentCategory
    power_rating: float = Field(..., gt=0, description="Power rating in Watts")
    hours_per_day: float = Field(..., ge=0, le=24, description="Operating hours per day")
    efficiency: float = Field(default=0.8, ge=0, le=1, description="Equipment efficiency (0-1)")
    priority: EquipmentPriority = EquipmentPriority.IMPORTANT
    quantity: int = Field(default=1, ge=1, description="Number of units")
    condition: Optional[str] = Field(default="good", description="Equipment condition")
    
    @validator('power_rating')
    def validate_power_rating(cls, v):
        if v <= 0:
            raise ValueError('Power rating must be positive')
        if v > 50000:  # 50kW max for single equipment
            raise ValueError('Power rating seems too high')
        return v

class LoadProfilePoint(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    demand: float = Field(..., ge=0, description="Power demand in kW")
    equipment_breakdown: Dict[str, float] = Field(default_factory=dict)
    temperature: Optional[float] = Field(default=None, description="Ambient temperature in °C")
    solar_irradiance: Optional[float] = Field(default=None, description="Solar irradiance in W/m²")

class FacilityData(BaseModel):
    name: str
    facility_type: str = Field(default="health_clinic")
    location: Dict[str, float] = Field(..., description="Latitude and longitude")
    equipment: List[Equipment]
    operational_hours: float = Field(default=12, ge=0, le=24)
    staff_count: int = Field(default=5, ge=1)
    building_area: Optional[float] = Field(default=None, gt=0, description="Building area in m²")
    patient_capacity: Optional[int] = Field(default=None, ge=0)

class EnergyAnalysisOptions(BaseModel):
    include_seasonal_variation: bool = Field(default=True)
    safety_margin: float = Field(default=1.2, ge=1.0, le=2.0)
    system_efficiency: float = Field(default=0.85, ge=0.5, le=1.0)
    battery_autonomy: float = Field(default=24, ge=0, description="Battery autonomy in hours")
    ambient_temperature: float = Field(default=25, description="Average ambient temperature in °C")

class EnergyAnalysisResult(BaseModel):
    load_profile: List[LoadProfilePoint]
    peak_demand: float = Field(..., description="Peak demand in kW")
    daily_consumption: float = Field(..., description="Daily consumption in kWh")
    annual_consumption: float = Field(..., description="Annual consumption in kWh")
    critical_load: float = Field(..., description="Critical load in kW")
    non_critical_load: float = Field(..., description="Non-critical load in kW")
    equipment_breakdown: Dict[str, float] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)
    load_factor: float = Field(..., description="Load factor (average/peak)")
    diversity_factor: float = Field(default=0.8, description="Diversity factor")
    
    # Enhanced analytics
    peak_hours: List[int] = Field(default_factory=list, description="Hours with peak demand")
    base_load: float = Field(..., description="Base load in kW")
    load_variability: float = Field(..., description="Load variability coefficient")

class SystemSizing(BaseModel):
    pv_system_size: float = Field(..., description="PV system size in kW")
    battery_capacity: float = Field(..., description="Battery capacity in kWh")
    inverter_size: float = Field(..., description="Inverter size in kW")
    generator_size: Optional[float] = Field(default=None, description="Backup generator size in kW")
    safety_margin: float = Field(default=1.2)
    system_efficiency: float = Field(default=0.85)
    
    # Enhanced sizing calculations
    panel_count: int = Field(..., description="Number of solar panels")
    battery_bank_voltage: float = Field(default=48, description="Battery bank voltage")
    charge_controller_size: float = Field(..., description="Charge controller size in A")

class WeatherData(BaseModel):
    """Weather data for enhanced energy modeling"""
    solar_irradiance: List[float] = Field(..., description="Hourly solar irradiance W/m²")
    temperature: List[float] = Field(..., description="Hourly temperature °C")
    wind_speed: Optional[List[float]] = Field(default=None, description="Hourly wind speed m/s")
    humidity: Optional[List[float]] = Field(default=None, description="Hourly humidity %")
    
    @validator('solar_irradiance', 'temperature')
    def validate_hourly_data(cls, v):
        if len(v) != 24:
            raise ValueError('Must provide 24 hourly values')
        return v

class EnergyScenario(BaseModel):
    """Complete energy scenario with all analysis results"""
    id: str
    name: str
    scenario_type: str = Field(..., pattern="^(current|ideal|optimized)$")
    facility_data: FacilityData
    analysis_result: EnergyAnalysisResult
    system_sizing: SystemSizing
    weather_data: Optional[WeatherData] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Economic analysis integration
    economic_metrics: Optional[Dict[str, float]] = Field(default=None)
    carbon_footprint: Optional[Dict[str, float]] = Field(default=None)

# Request/Response models for API
class LoadProfileRequest(BaseModel):
    equipment: List[Equipment]
    facility_data: Optional[FacilityData] = None
    options: Optional[EnergyAnalysisOptions] = EnergyAnalysisOptions()
    weather_data: Optional[WeatherData] = None

class LoadProfileResponse(BaseModel):
    load_profile: List[LoadProfilePoint]
    peak_demand: float
    daily_consumption: float
    annual_consumption: float
    metadata: Dict[str, Union[str, datetime, Dict]]

class EnergyAnalysisRequest(BaseModel):
    facility_data: FacilityData
    scenario_type: str = Field(default="current", pattern="^(current|ideal|optimized)$")
    options: Optional[EnergyAnalysisOptions] = EnergyAnalysisOptions()
    weather_data: Optional[WeatherData] = None

class EnergyAnalysisResponse(BaseModel):
    scenario: EnergyScenario
    system_sizing: SystemSizing
    recommendations: List[str]
    benchmark_comparison: Optional[Dict[str, float]] = None

# Utility functions for data conversion
def equipment_to_dataframe(equipment_list: List[Equipment]) -> pd.DataFrame:
    """Convert equipment list to pandas DataFrame for analysis"""
    data = []
    for eq in equipment_list:
        data.append({
            'id': eq.id,
            'name': eq.name,
            'category': eq.category.value,
            'power_rating': eq.power_rating,
            'hours_per_day': eq.hours_per_day,
            'efficiency': eq.efficiency,
            'priority': eq.priority.value,
            'quantity': eq.quantity,
            'total_power': eq.power_rating * eq.quantity
        })
    
    return pd.DataFrame(data)

def load_profile_to_dataframe(load_profile: List[LoadProfilePoint]) -> pd.DataFrame:
    """Convert load profile to pandas DataFrame for analysis"""
    data = []
    for point in load_profile:
        data.append({
            'hour': point.hour,
            'demand': point.demand,
            'temperature': point.temperature,
            'solar_irradiance': point.solar_irradiance,
            **point.equipment_breakdown
        })
    
    return pd.DataFrame(data)
