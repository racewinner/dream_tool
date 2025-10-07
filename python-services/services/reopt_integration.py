"""
NREL REopt API Integration Service
Advanced energy system optimization using DREAM Tool data with REopt API
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
import pandas as pd
import aiohttp
from pydantic import BaseModel, Field, validator

from core.database import get_db_session
from models.database_models import Facility, Survey
from services.energy_analysis import AdvancedEnergyAnalyzer

logger = logging.getLogger(__name__)

class REoptScenarioStatus(Enum):
    SUBMITTED = "submitted"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class REoptLoadProfile:
    """8760 hourly load values for full year"""
    annual_kwh: float
    hourly_loads: List[float]  # 8760 values
    peak_demand_kw: float
    load_factor: float
    
    def validate_8760_hours(self) -> bool:
        """Ensure we have exactly 8760 hourly values"""
        return len(self.hourly_loads) == 8760

@dataclass
class REoptUtilityRate:
    """Utility rate structure for REopt"""
    monthly_demand_charges: List[Dict[str, Any]]
    energy_charges: List[Dict[str, Any]]
    fixed_monthly_charge: float
    net_metering_limit_kw: Optional[float] = None
    interconnection_limit_kw: Optional[float] = None

@dataclass
class REoptSite:
    """Site configuration for REopt"""
    latitude: float
    longitude: float
    land_acres: Optional[float] = None
    roof_squarefeet: Optional[float] = None
    
    @property
    def coordinates_valid(self) -> bool:
        """Validate coordinates are in acceptable ranges"""
        return (-90 <= self.latitude <= 90) and (-180 <= self.longitude <= 180)

@dataclass
class REoptScenario:
    """Complete REopt scenario payload"""
    site: REoptSite
    load_profile: REoptLoadProfile
    electric_utility: REoptUtilityRate
    pv: Optional[Dict[str, Any]] = None
    storage: Optional[Dict[str, Any]] = None
    generator: Optional[Dict[str, Any]] = None
    financial: Optional[Dict[str, Any]] = None

@dataclass
class REoptResults:
    """REopt optimization results"""
    run_uuid: str
    status: REoptScenarioStatus
    optimal_pv_size_kw: Optional[float] = None
    optimal_battery_size_kw: Optional[float] = None
    optimal_battery_size_kwh: Optional[float] = None
    net_present_value: Optional[float] = None
    payback_period_years: Optional[float] = None
    lcoe_dollars_per_kwh: Optional[float] = None
    renewable_electricity_fraction: Optional[float] = None
    year_one_savings_dollars: Optional[float] = None
    lifecycle_cost_dollars: Optional[float] = None
    
    # Advanced metrics
    resilience_hours: Optional[float] = None
    emissions_reduction_tons_co2: Optional[float] = None
    peak_demand_reduction_kw: Optional[float] = None

class REoptAPIClient:
    """NREL REopt API client with comprehensive error handling"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.nrel.gov/reopt/v1"
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def submit_scenario(self, scenario: REoptScenario) -> str:
        """Submit scenario to REopt API and return run_uuid"""
        
        if not self.session:
            raise RuntimeError("Client session not initialized")
            
        # Construct REopt payload
        payload = self._build_reopt_payload(scenario)
        
        # Validate payload before submission
        self._validate_payload(payload)
        
        url = f"{self.base_url}/scenario/"
        params = {"api_key": self.api_key}
        
        try:
            logger.info("Submitting scenario to REopt API")
            async with self.session.post(url, json=payload, params=params) as response:
                if response.status == 201:
                    result = await response.json()
                    run_uuid = result.get("run_uuid")
                    logger.info(f"Scenario submitted successfully: {run_uuid}")
                    return run_uuid
                else:
                    error_text = await response.text()
                    logger.error(f"REopt API error {response.status}: {error_text}")
                    raise Exception(f"REopt API submission failed: {response.status}")
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error submitting to REopt: {e}")
            raise Exception(f"Network error: {e}")
    
    async def get_results(self, run_uuid: str) -> REoptResults:
        """Get results for a submitted scenario"""
        
        if not self.session:
            raise RuntimeError("Client session not initialized")
            
        url = f"{self.base_url}/scenario/{run_uuid}/results/"
        params = {"api_key": self.api_key}
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    result = await response.json()
                    return self._parse_results(run_uuid, result)
                elif response.status == 202:
                    # Still running
                    return REoptResults(run_uuid=run_uuid, status=REoptScenarioStatus.RUNNING)
                else:
                    error_text = await response.text()
                    logger.error(f"REopt results error {response.status}: {error_text}")
                    return REoptResults(run_uuid=run_uuid, status=REoptScenarioStatus.FAILED)
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error getting REopt results: {e}")
            return REoptResults(run_uuid=run_uuid, status=REoptScenarioStatus.FAILED)
    
    async def poll_until_complete(self, run_uuid: str, max_wait_minutes: int = 30) -> REoptResults:
        """Poll REopt API until results are ready"""
        
        start_time = datetime.now()
        max_wait = timedelta(minutes=max_wait_minutes)
        
        while (datetime.now() - start_time) < max_wait:
            results = await self.get_results(run_uuid)
            
            if results.status == REoptScenarioStatus.COMPLETED:
                logger.info(f"REopt optimization completed: {run_uuid}")
                return results
            elif results.status == REoptScenarioStatus.FAILED:
                logger.error(f"REopt optimization failed: {run_uuid}")
                return results
            
            # Wait before next poll
            await asyncio.sleep(30)  # Poll every 30 seconds
            
        # Timeout
        logger.warning(f"REopt optimization timed out: {run_uuid}")
        return REoptResults(run_uuid=run_uuid, status=REoptScenarioStatus.FAILED)
    
    def _build_reopt_payload(self, scenario: REoptScenario) -> Dict[str, Any]:
        """Build REopt API payload from scenario"""
        
        payload = {
            "Scenario": {
                "Site": {
                    "latitude": scenario.site.latitude,
                    "longitude": scenario.site.longitude,
                    "LoadProfile": {
                        "annual_kwh": scenario.load_profile.annual_kwh,
                        "loads_kw": scenario.load_profile.hourly_loads
                    },
                    "ElectricUtility": {
                        "monthly_demand_charges": scenario.electric_utility.monthly_demand_charges,
                        "energy_charges": scenario.electric_utility.energy_charges,
                        "fixed_monthly_charge": scenario.electric_utility.fixed_monthly_charge
                    }
                }
            }
        }
        
        # Add optional components
        if scenario.site.land_acres:
            payload["Scenario"]["Site"]["land_acres"] = scenario.site.land_acres
            
        if scenario.site.roof_squarefeet:
            payload["Scenario"]["Site"]["roof_squarefeet"] = scenario.site.roof_squarefeet
            
        if scenario.pv:
            payload["Scenario"]["Site"]["PV"] = scenario.pv
            
        if scenario.storage:
            payload["Scenario"]["Site"]["Storage"] = scenario.storage
            
        if scenario.generator:
            payload["Scenario"]["Site"]["Generator"] = scenario.generator
            
        if scenario.financial:
            payload["Scenario"]["Financial"] = scenario.financial
            
        return payload
    
    def _validate_payload(self, payload: Dict[str, Any]) -> None:
        """Validate REopt payload before submission"""
        
        scenario = payload.get("Scenario", {})
        site = scenario.get("Site", {})
        
        # Validate coordinates
        lat = site.get("latitude")
        lon = site.get("longitude")
        if not lat or not lon:
            raise ValueError("Missing latitude or longitude")
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError("Invalid coordinates")
            
        # Validate load profile
        load_profile = site.get("LoadProfile", {})
        loads = load_profile.get("loads_kw", [])
        if len(loads) != 8760:
            raise ValueError(f"Load profile must have 8760 hourly values, got {len(loads)}")
            
        # Validate annual kWh consistency
        annual_kwh = load_profile.get("annual_kwh", 0)
        calculated_annual = sum(loads)
        if abs(annual_kwh - calculated_annual) > annual_kwh * 0.05:  # 5% tolerance
            logger.warning(f"Annual kWh mismatch: stated={annual_kwh}, calculated={calculated_annual}")
    
    def _parse_results(self, run_uuid: str, result_data: Dict[str, Any]) -> REoptResults:
        """Parse REopt API results into structured format"""
        
        outputs = result_data.get("outputs", {})
        
        return REoptResults(
            run_uuid=run_uuid,
            status=REoptScenarioStatus.COMPLETED,
            optimal_pv_size_kw=outputs.get("PV", {}).get("size_kw"),
            optimal_battery_size_kw=outputs.get("Storage", {}).get("size_kw"),
            optimal_battery_size_kwh=outputs.get("Storage", {}).get("size_kwh"),
            net_present_value=outputs.get("Financial", {}).get("npv"),
            payback_period_years=outputs.get("Financial", {}).get("simple_payback_years"),
            lcoe_dollars_per_kwh=outputs.get("Financial", {}).get("lcoe_us_dollars_per_kwh"),
            renewable_electricity_fraction=outputs.get("Site", {}).get("renewable_electricity_fraction"),
            year_one_savings_dollars=outputs.get("Financial", {}).get("year_one_savings_us_dollars"),
            lifecycle_cost_dollars=outputs.get("Financial", {}).get("lcc_us_dollars"),
            resilience_hours=outputs.get("Outage", {}).get("expected_outage_duration_hrs"),
            emissions_reduction_tons_co2=outputs.get("Site", {}).get("annual_emissions_reduction_CO2_lbs", 0) / 2204.62,  # Convert lbs to tons
            peak_demand_reduction_kw=outputs.get("ElectricUtility", {}).get("annual_demand_reduction_kw")
        )

class REoptIntegrationService:
    """Main service for integrating DREAM Tool data with REopt"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.energy_analyzer = AdvancedEnergyAnalyzer()
        
    async def optimize_facility_energy_system(
        self, 
        facility_id: int,
        optimization_options: Optional[Dict[str, Any]] = None
    ) -> REoptResults:
        """Complete energy system optimization for a facility"""
        
        logger.info(f"Starting REopt optimization for facility {facility_id}")
        
        # Get facility data and energy profile
        scenario = await self._build_scenario_from_facility(facility_id, optimization_options)
        
        # Submit to REopt and wait for results
        async with REoptAPIClient(self.api_key) as client:
            run_uuid = await client.submit_scenario(scenario)
            results = await client.poll_until_complete(run_uuid)
            
        logger.info(f"REopt optimization completed for facility {facility_id}")
        return results
    
    async def _build_scenario_from_facility(
        self, 
        facility_id: int, 
        options: Optional[Dict[str, Any]] = None
    ) -> REoptScenario:
        """Build REopt scenario from DREAM Tool facility data"""
        
        async with get_db_session() as session:
            # Get facility data
            facility = await self._get_facility_data(session, facility_id)
            
            # Get energy demand data from surveys
            load_profile = await self._generate_annual_load_profile(session, facility_id)
            
            # Get utility rate structure
            utility_rates = await self._get_utility_rates(facility)
            
            # Build site configuration
            site = REoptSite(
                latitude=facility.latitude,
                longitude=facility.longitude,
                land_acres=getattr(facility, 'land_area_acres', None),
                roof_squarefeet=getattr(facility, 'roof_area_sqft', None)
            )
            
            # Validate coordinates
            if not site.coordinates_valid:
                raise ValueError(f"Invalid coordinates for facility {facility_id}")
            
            # Build scenario with optional components
            scenario = REoptScenario(
                site=site,
                load_profile=load_profile,
                electric_utility=utility_rates
            )
            
            # Add optional optimization components based on options
            if options:
                scenario.pv = self._build_pv_options(options.get('pv', {}))
                scenario.storage = self._build_storage_options(options.get('storage', {}))
                scenario.generator = self._build_generator_options(options.get('generator', {}))
                scenario.financial = self._build_financial_options(options.get('financial', {}))
            
            return scenario
    
    async def _generate_annual_load_profile(self, session, facility_id: int) -> REoptLoadProfile:
        """Generate 8760 hourly load profile from DREAM Tool energy data"""
        
        # Get equipment data from surveys
        equipment_data = await self._get_facility_equipment(session, facility_id)
        
        # Generate daily load profile using existing energy analyzer
        from models.energy import EnergyAnalysisOptions
        options = EnergyAnalysisOptions(
            include_weather_adjustment=True,
            safety_factor=1.2,
            diversity_factor=0.8
        )
        
        daily_profile = self.energy_analyzer.generate_load_profile(equipment_data, options)
        
        # Expand to full year (8760 hours) with seasonal variations
        annual_loads = self._expand_to_annual_profile(daily_profile)
        
        # Calculate metrics
        annual_kwh = sum(annual_loads)
        peak_demand_kw = max(annual_loads)
        load_factor = annual_kwh / (peak_demand_kw * 8760) if peak_demand_kw > 0 else 0
        
        load_profile = REoptLoadProfile(
            annual_kwh=annual_kwh,
            hourly_loads=annual_loads,
            peak_demand_kw=peak_demand_kw,
            load_factor=load_factor
        )
        
        # Validate 8760 hours
        if not load_profile.validate_8760_hours():
            raise ValueError("Failed to generate valid 8760-hour load profile")
            
        return load_profile
    
    def _expand_to_annual_profile(self, daily_profile: List) -> List[float]:
        """Expand daily profile to full year with seasonal variations"""
        
        # Seasonal factors for different months
        seasonal_factors = {
            1: 1.1,   # January - higher heating
            2: 1.05,  # February
            3: 1.0,   # March
            4: 0.95,  # April
            5: 0.9,   # May
            6: 1.1,   # June - higher cooling
            7: 1.2,   # July - peak cooling
            8: 1.15,  # August
            9: 1.0,   # September
            10: 0.95, # October
            11: 1.0,  # November
            12: 1.05  # December
        }
        
        annual_loads = []
        
        # Days in each month
        days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        
        for month in range(12):
            factor = seasonal_factors[month + 1]
            days = days_in_month[month]
            
            for day in range(days):
                for hour_data in daily_profile:
                    # Apply seasonal factor with some random variation
                    base_load = hour_data.demand_kw
                    seasonal_load = base_load * factor
                    
                    # Add small random variation (±5%)
                    variation = np.random.normal(1.0, 0.05)
                    final_load = max(0, seasonal_load * variation)
                    
                    annual_loads.append(final_load)
        
        # Ensure exactly 8760 hours (handle leap year)
        while len(annual_loads) < 8760:
            annual_loads.append(annual_loads[-1])  # Repeat last value
        
        return annual_loads[:8760]  # Truncate to exactly 8760
    
    async def _get_facility_data(self, session, facility_id: int):
        """Get facility data from database"""
        from sqlalchemy import select
        
        query = select(Facility).where(Facility.id == facility_id)
        result = await session.execute(query)
        facility = result.scalar_one_or_none()
        
        if not facility:
            raise ValueError(f"Facility {facility_id} not found")
            
        return facility
    
    async def _get_facility_equipment(self, session, facility_id: int) -> List:
        """Get equipment data for facility from surveys"""
        from sqlalchemy import select
        
        # Get latest survey for facility
        query = select(Survey).where(Survey.facility_id == facility_id).order_by(Survey.created_at.desc())
        result = await session.execute(query)
        survey = result.scalar_one_or_none()
        
        if not survey:
            # Return default equipment if no survey data
            return self._get_default_equipment()
        
        # Extract equipment from survey data
        return self._extract_equipment_from_survey(survey)
    
    def _extract_equipment_from_survey(self, survey) -> List:
        """Extract equipment data from survey"""
        # This would parse the survey data to extract equipment information
        # For now, return default equipment
        return self._get_default_equipment()
    
    def _get_default_equipment(self) -> List:
        """Get default equipment for facilities without survey data"""
        from models.energy import Equipment
        
        return [
            Equipment(
                name="Lighting",
                category="lighting",
                power_rating=500,  # 500W
                quantity=10,
                hours_per_day=12,
                efficiency=0.9,
                priority="high"
            ),
            Equipment(
                name="Medical Equipment",
                category="medical",
                power_rating=1000,  # 1kW
                quantity=5,
                hours_per_day=24,
                efficiency=0.85,
                priority="critical"
            ),
            Equipment(
                name="Cooling",
                category="cooling",
                power_rating=2000,  # 2kW
                quantity=2,
                hours_per_day=8,
                efficiency=0.8,
                priority="medium"
            )
        ]
    
    async def _get_utility_rates(self, facility) -> REoptUtilityRate:
        """Get utility rate structure for facility"""
        
        # Default utility rate structure
        # In production, this would be based on facility location and utility provider
        return REoptUtilityRate(
            monthly_demand_charges=[
                {"month": "all", "rate_per_kw": 15.0}  # $15/kW demand charge
            ],
            energy_charges=[
                {"period": "all", "rate_per_kwh": 0.12}  # $0.12/kWh energy charge
            ],
            fixed_monthly_charge=25.0,  # $25/month fixed charge
            net_metering_limit_kw=100.0,
            interconnection_limit_kw=500.0
        )
    
    def _build_pv_options(self, pv_config: Dict[str, Any]) -> Dict[str, Any]:
        """Build PV configuration for REopt"""
        
        default_pv = {
            "min_kw": 0,
            "max_kw": 1000,
            "installed_cost_us_dollars_per_kw": 2000,
            "om_cost_us_dollars_per_kw": 20,
            "macrs_option_years": 5,
            "macrs_bonus_pct": 0.6,
            "can_net_meter": True,
            "can_wholesale": True,
            "can_export_beyond_nem_limit": True
        }
        
        # Override with provided configuration
        default_pv.update(pv_config)
        return default_pv
    
    def _build_storage_options(self, storage_config: Dict[str, Any]) -> Dict[str, Any]:
        """Build battery storage configuration for REopt"""
        
        default_storage = {
            "min_kw": 0,
            "max_kw": 500,
            "min_kwh": 0,
            "max_kwh": 2000,
            "installed_cost_us_dollars_per_kw": 1000,
            "installed_cost_us_dollars_per_kwh": 500,
            "om_cost_us_dollars_per_kw": 10,
            "macrs_option_years": 7,
            "macrs_bonus_pct": 0.6,
            "can_grid_charge": True,
            "soc_min_pct": 0.2,
            "soc_init_pct": 0.5
        }
        
        # Override with provided configuration
        default_storage.update(storage_config)
        return default_storage
    
    def _build_generator_options(self, generator_config: Dict[str, Any]) -> Dict[str, Any]:
        """Build backup generator configuration for REopt"""
        
        default_generator = {
            "min_kw": 0,
            "max_kw": 200,
            "installed_cost_us_dollars_per_kw": 800,
            "om_cost_us_dollars_per_kw": 50,
            "fuel_cost_us_dollars_per_gallon": 3.5,
            "fuel_slope_gal_per_kwh": 0.076,
            "fuel_intercept_gal_per_hr": 0.0,
            "min_turn_down_pct": 0.3
        }
        
        # Override with provided configuration
        default_generator.update(generator_config)
        return default_generator
    
    def _build_financial_options(self, financial_config: Dict[str, Any]) -> Dict[str, Any]:
        """Build financial parameters for REopt"""
        
        default_financial = {
            "analysis_years": 25,
            "escalation_pct": 0.023,
            "om_cost_escalation_pct": 0.025,
            "discount_pct": 0.083,
            "tax_pct": 0.26,
            "macrs_enabled": True,
            "macrs_bonus_pct": 0.6
        }
        
        # Override with provided configuration
        default_financial.update(financial_config)
        return default_financial

# Global service instance
reopt_service = None

def get_reopt_service(api_key: str) -> REoptIntegrationService:
    """Get REopt service instance"""
    global reopt_service
    if not reopt_service:
        reopt_service = REoptIntegrationService(api_key)
    return reopt_service
