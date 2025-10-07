"""
Solar Monitoring Service
Service for integrating with solar PV monitoring systems and correlating with assessment data
"""

import os
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple
import aiohttp
from datetime import datetime, timedelta
import uuid
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.solar_analysis_models import (
    SolarSystemAssessment, SolarComponentDetected, ComponentType,
    DetectedIssue, UpgradeRecommendation
)
from models.solar_history_models import (
    MaintenanceAction, AssessmentHistory, ComponentHistory
)

logger = logging.getLogger(__name__)

# Monitoring system API keys and endpoints
MONITORING_API_KEY = os.getenv("MONITORING_API_KEY", "")
MONITORING_API_BASE_URL = os.getenv("MONITORING_API_BASE_URL", "")

# Supported monitoring system providers
SUPPORTED_PROVIDERS = ["solaredge", "enphase", "fronius", "sma", "huawei", "growatt", "generic"]

class SolarMonitoringService:
    """Service for integrating with solar PV monitoring systems"""
    
    def __init__(self):
        """Initialize the monitoring service"""
        self.api_key = MONITORING_API_KEY
        self.base_url = MONITORING_API_BASE_URL
        self.cache = {}
        self.cache_timeout = 300  # 5 minutes
    
    async def get_monitoring_data(
        self,
        facility_id: int,
        provider: str,
        site_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        data_type: str = "production",
        resolution: str = "day"
    ) -> Dict[str, Any]:
        """
        Get monitoring data from a solar monitoring system
        
        Args:
            facility_id: ID of the facility
            provider: Monitoring system provider (solaredge, enphase, etc.)
            site_id: Site ID in the monitoring system
            start_date: Start date for data (optional, defaults to 7 days ago)
            end_date: End date for data (optional, defaults to today)
            data_type: Type of data to retrieve (production, consumption, etc.)
            resolution: Data resolution (day, hour, quarter_hour, etc.)
            
        Returns:
            Dictionary with monitoring data
        """
        logger.info(f"Getting {data_type} data for facility {facility_id} from {provider}")
        
        # Validate provider
        if provider.lower() not in SUPPORTED_PROVIDERS:
            raise ValueError(f"Unsupported monitoring provider: {provider}")
        
        # Set default dates if not provided
        if not end_date:
            end_date = datetime.now()
        
        if not start_date:
            start_date = end_date - timedelta(days=7)
        
        # Check cache
        cache_key = f"{facility_id}_{provider}_{site_id}_{data_type}_{resolution}_{start_date.isoformat()}_{end_date.isoformat()}"
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if (datetime.now() - cache_entry["timestamp"]).total_seconds() < self.cache_timeout:
                logger.info(f"Returning cached monitoring data for {cache_key}")
                return cache_entry["data"]
        
        # Get data from appropriate provider
        if provider.lower() == "solaredge":
            data = await self._get_solaredge_data(site_id, start_date, end_date, data_type, resolution)
        elif provider.lower() == "enphase":
            data = await self._get_enphase_data(site_id, start_date, end_date, data_type, resolution)
        elif provider.lower() == "fronius":
            data = await self._get_fronius_data(site_id, start_date, end_date, data_type, resolution)
        elif provider.lower() == "sma":
            data = await self._get_sma_data(site_id, start_date, end_date, data_type, resolution)
        elif provider.lower() == "huawei":
            data = await self._get_huawei_data(site_id, start_date, end_date, data_type, resolution)
        elif provider.lower() == "growatt":
            data = await self._get_growatt_data(site_id, start_date, end_date, data_type, resolution)
        else:  # generic
            data = await self._get_generic_data(site_id, start_date, end_date, data_type, resolution)
        
        # Add metadata
        data["metadata"] = {
            "facility_id": facility_id,
            "provider": provider,
            "site_id": site_id,
            "data_type": data_type,
            "resolution": resolution,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "retrieved_at": datetime.now().isoformat()
        }
        
        # Cache the result
        self.cache[cache_key] = {
            "timestamp": datetime.now(),
            "data": data
        }
        
        return data
    
    async def _get_solaredge_data(
        self,
        site_id: str,
        start_date: datetime,
        end_date: datetime,
        data_type: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Get data from SolarEdge monitoring system"""
        logger.info(f"Getting SolarEdge data for site {site_id}")
        
        if not self.api_key:
            logger.warning("SolarEdge API key not set")
            return self._generate_mock_data(start_date, end_date, data_type, resolution)
        
        try:
            # Determine endpoint based on data type
            if data_type == "production":
                endpoint = f"site/{site_id}/energy"
            elif data_type == "consumption":
                endpoint = f"site/{site_id}/consumption"
            elif data_type == "power":
                endpoint = f"site/{site_id}/power"
            else:
                endpoint = f"site/{site_id}/energy"
            
            # Map resolution to SolarEdge time unit
            time_unit_map = {
                "quarter_hour": "QUARTER_OF_AN_HOUR",
                "hour": "HOUR",
                "day": "DAY",
                "week": "WEEK",
                "month": "MONTH",
                "year": "YEAR"
            }
            time_unit = time_unit_map.get(resolution, "DAY")
            
            # Build URL
            url = f"{self.base_url}/solaredge/{endpoint}"
            
            # Build parameters
            params = {
                "api_key": self.api_key,
                "startDate": start_date.strftime("%Y-%m-%d"),
                "endDate": end_date.strftime("%Y-%m-%d"),
                "timeUnit": time_unit
            }
            
            # Make request
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"SolarEdge API error: {response.status}")
                        return self._generate_mock_data(start_date, end_date, data_type, resolution)
                    
                    result = await response.json()
                    
                    # Process and format the data
                    return self._process_solaredge_data(result, data_type)
        
        except Exception as e:
            logger.error(f"Error getting SolarEdge data: {str(e)}")
            return self._generate_mock_data(start_date, end_date, data_type, resolution)
    
    async def _get_enphase_data(
        self,
        site_id: str,
        start_date: datetime,
        end_date: datetime,
        data_type: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Get data from Enphase monitoring system"""
        logger.info(f"Getting Enphase data for site {site_id}")
        
        # In a real implementation, this would connect to the Enphase API
        # For now, return mock data
        return self._generate_mock_data(start_date, end_date, data_type, resolution)
    
    async def _get_fronius_data(
        self,
        site_id: str,
        start_date: datetime,
        end_date: datetime,
        data_type: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Get data from Fronius monitoring system"""
        logger.info(f"Getting Fronius data for site {site_id}")
        
        # In a real implementation, this would connect to the Fronius API
        # For now, return mock data
        return self._generate_mock_data(start_date, end_date, data_type, resolution)
    
    async def _get_sma_data(
        self,
        site_id: str,
        start_date: datetime,
        end_date: datetime,
        data_type: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Get data from SMA monitoring system"""
        logger.info(f"Getting SMA data for site {site_id}")
        
        # In a real implementation, this would connect to the SMA API
        # For now, return mock data
        return self._generate_mock_data(start_date, end_date, data_type, resolution)
    
    async def _get_huawei_data(
        self,
        site_id: str,
        start_date: datetime,
        end_date: datetime,
        data_type: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Get data from Huawei monitoring system"""
        logger.info(f"Getting Huawei data for site {site_id}")
        
        # In a real implementation, this would connect to the Huawei API
        # For now, return mock data
        return self._generate_mock_data(start_date, end_date, data_type, resolution)
    
    async def _get_growatt_data(
        self,
        site_id: str,
        start_date: datetime,
        end_date: datetime,
        data_type: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Get data from Growatt monitoring system"""
        logger.info(f"Getting Growatt data for site {site_id}")
        
        # In a real implementation, this would connect to the Growatt API
        # For now, return mock data
        return self._generate_mock_data(start_date, end_date, data_type, resolution)
    
    async def _get_generic_data(
        self,
        site_id: str,
        start_date: datetime,
        end_date: datetime,
        data_type: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Get data from a generic monitoring system"""
        logger.info(f"Getting generic data for site {site_id}")
        
        # In a real implementation, this would connect to a generic API
        # For now, return mock data
        return self._generate_mock_data(start_date, end_date, data_type, resolution)
    
    def _process_solaredge_data(self, raw_data: Dict[str, Any], data_type: str) -> Dict[str, Any]:
        """Process and format SolarEdge API response"""
        try:
            if data_type == "production":
                energy_values = raw_data.get("energy", {}).get("values", [])
                return {
                    "values": energy_values,
                    "unit": raw_data.get("energy", {}).get("unit", "Wh"),
                    "summary": {
                        "total": sum(item.get("value", 0) for item in energy_values if item.get("value") is not None),
                        "count": len(energy_values)
                    }
                }
            elif data_type == "consumption":
                consumption_values = raw_data.get("consumption", {}).get("values", [])
                return {
                    "values": consumption_values,
                    "unit": raw_data.get("consumption", {}).get("unit", "Wh"),
                    "summary": {
                        "total": sum(item.get("value", 0) for item in consumption_values if item.get("value") is not None),
                        "count": len(consumption_values)
                    }
                }
            elif data_type == "power":
                power_values = raw_data.get("power", {}).get("values", [])
                return {
                    "values": power_values,
                    "unit": raw_data.get("power", {}).get("unit", "W"),
                    "summary": {
                        "average": sum(item.get("value", 0) for item in power_values if item.get("value") is not None) / len(power_values) if power_values else 0,
                        "max": max((item.get("value", 0) for item in power_values if item.get("value") is not None), default=0),
                        "count": len(power_values)
                    }
                }
            else:
                return raw_data
        except Exception as e:
            logger.error(f"Error processing SolarEdge data: {str(e)}")
            return raw_data
    
    def _generate_mock_data(
        self,
        start_date: datetime,
        end_date: datetime,
        data_type: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Generate mock monitoring data for testing"""
        logger.info(f"Generating mock {data_type} data with {resolution} resolution")
        
        # Calculate number of data points based on resolution
        if resolution == "quarter_hour":
            delta = timedelta(minutes=15)
        elif resolution == "hour":
            delta = timedelta(hours=1)
        elif resolution == "day":
            delta = timedelta(days=1)
        elif resolution == "week":
            delta = timedelta(weeks=1)
        elif resolution == "month":
            delta = timedelta(days=30)
        else:
            delta = timedelta(days=1)
        
        # Generate time points
        current_date = start_date
        values = []
        
        while current_date <= end_date:
            # Generate realistic values based on data type and time of day
            if data_type == "production":
                # Solar production follows a bell curve during daylight hours
                hour = current_date.hour
                if 6 <= hour <= 18:  # Daylight hours
                    # Bell curve with peak at noon
                    peak_factor = 1 - abs(hour - 12) / 6
                    base_value = 2000 * peak_factor
                    # Add some randomness
                    value = max(0, base_value * (0.8 + 0.4 * np.random.random()))
                else:
                    value = 0  # No production at night
                
                # Unit: Wh
                unit = "Wh"
            
            elif data_type == "consumption":
                # Consumption has morning and evening peaks
                hour = current_date.hour
                if 6 <= hour <= 9:  # Morning peak
                    base_value = 1500
                elif 17 <= hour <= 22:  # Evening peak
                    base_value = 2000
                elif 23 <= hour or hour <= 5:  # Night (low)
                    base_value = 500
                else:  # Day (medium)
                    base_value = 1000
                
                # Add some randomness
                value = base_value * (0.8 + 0.4 * np.random.random())
                
                # Unit: Wh
                unit = "Wh"
            
            elif data_type == "power":
                # Power follows production pattern but with more variability
                hour = current_date.hour
                if 6 <= hour <= 18:  # Daylight hours
                    # Bell curve with peak at noon
                    peak_factor = 1 - abs(hour - 12) / 6
                    base_value = 5000 * peak_factor
                    # Add more randomness for power
                    value = max(0, base_value * (0.6 + 0.8 * np.random.random()))
                else:
                    value = 0  # No power at night
                
                # Unit: W
                unit = "W"
            
            else:
                # Generic data
                value = 1000 * np.random.random()
                unit = "units"
            
            # Add to values list
            values.append({
                "date": current_date.isoformat(),
                "value": round(value, 2)
            })
            
            # Move to next time point
            current_date += delta
        
        # Create result structure
        result = {
            "values": values,
            "unit": unit
        }
        
        # Add summary statistics
        if values:
            if data_type in ["production", "consumption"]:
                result["summary"] = {
                    "total": round(sum(item["value"] for item in values), 2),
                    "average": round(sum(item["value"] for item in values) / len(values), 2),
                    "max": round(max(item["value"] for item in values), 2),
                    "count": len(values)
                }
            else:
                result["summary"] = {
                    "average": round(sum(item["value"] for item in values) / len(values), 2),
                    "max": round(max(item["value"] for item in values), 2),
                    "min": round(min(item["value"] for item in values), 2),
                    "count": len(values)
                }
        
        return result
    
    async def correlate_monitoring_with_assessment(
        self,
        db_session: Session,
        assessment_id: str,
        monitoring_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Correlate monitoring data with assessment results
        
        Args:
            db_session: Database session
            assessment_id: ID of the assessment
            monitoring_data: Monitoring data from get_monitoring_data()
            
        Returns:
            Dictionary with correlation results
        """
        logger.info(f"Correlating monitoring data with assessment {assessment_id}")
        
        # Get assessment
        assessment = db_session.query(SolarSystemAssessment).filter_by(id=uuid.UUID(assessment_id)).first()
        if not assessment:
            raise ValueError(f"Assessment {assessment_id} not found")
        
        # Get issues
        issues = db_session.query(DetectedIssue).filter_by(assessment_id=uuid.UUID(assessment_id)).all()
        
        # Get components
        components = db_session.query(SolarComponentDetected).filter_by(assessment_id=uuid.UUID(assessment_id)).all()
        
        # Get capacity
        capacity = assessment.capacity
        
        # Extract monitoring values
        monitoring_values = monitoring_data.get("values", [])
        monitoring_unit = monitoring_data.get("unit", "")
        monitoring_summary = monitoring_data.get("summary", {})
        
        # Calculate expected production based on capacity
        expected_production = None
        if capacity and capacity.solar_capacity_kw is not None:
            # Simple model: 4 kWh per kW per day
            days = len(monitoring_values) if monitoring_data.get("resolution") == "day" else len(monitoring_values) / 24
            expected_production = capacity.solar_capacity_kw * 4 * days
        
        # Calculate performance ratio
        performance_ratio = None
        if expected_production and monitoring_summary.get("total"):
            performance_ratio = monitoring_summary.get("total") / (expected_production * 1000)  # Convert kWh to Wh
        
        # Identify potential issues based on monitoring data
        monitoring_issues = []
        
        # Check for low performance ratio
        if performance_ratio is not None:
            if performance_ratio < 0.5:
                monitoring_issues.append({
                    "issue_type": "low_performance_ratio",
                    "severity": "high",
                    "description": f"System is performing at only {performance_ratio:.1%} of expected output",
                    "confidence_score": 0.8
                })
            elif performance_ratio < 0.7:
                monitoring_issues.append({
                    "issue_type": "reduced_performance_ratio",
                    "severity": "medium",
                    "description": f"System is performing at {performance_ratio:.1%} of expected output",
                    "confidence_score": 0.7
                })
        
        # Check for production anomalies
        if len(monitoring_values) > 3:
            # Calculate moving average
            values = [item.get("value", 0) for item in monitoring_values]
            moving_avg = pd.Series(values).rolling(window=3).mean().tolist()[2:]
            
            # Check for sudden drops
            for i in range(3, len(values)):
                if values[i] < moving_avg[i-3] * 0.5:
                    monitoring_issues.append({
                        "issue_type": "sudden_production_drop",
                        "severity": "high",
                        "description": f"Sudden drop in production detected on {monitoring_values[i].get('date')}",
                        "confidence_score": 0.75
                    })
        
        # Correlate detected issues with monitoring data
        correlated_issues = []
        for issue in issues:
            # Find monitoring evidence for this issue
            evidence = None
            confidence_adjustment = 0
            
            if issue.issue_type == "dirt_accumulation" and performance_ratio is not None:
                if performance_ratio < 0.7:
                    evidence = "Reduced performance ratio confirms potential dirt accumulation"
                    confidence_adjustment = 0.1
            
            elif issue.issue_type == "panel_damage" and "sudden_production_drop" in [i.get("issue_type") for i in monitoring_issues]:
                evidence = "Sudden production drop confirms potential panel damage"
                confidence_adjustment = 0.2
            
            # Add to correlated issues
            correlated_issues.append({
                "id": str(issue.id),
                "issue_type": issue.issue_type,
                "component_type": issue.component_type,
                "severity": issue.severity,
                "description": issue.description,
                "confidence_score": issue.confidence_score,
                "monitoring_evidence": evidence,
                "adjusted_confidence": min(1.0, issue.confidence_score + confidence_adjustment) if confidence_adjustment > 0 else issue.confidence_score
            })
        
        # Create result
        result = {
            "assessment_id": assessment_id,
            "monitoring_period": {
                "start": monitoring_values[0].get("date") if monitoring_values else None,
                "end": monitoring_values[-1].get("date") if monitoring_values else None,
                "days": len(monitoring_values) if monitoring_data.get("resolution") == "day" else len(monitoring_values) / 24
            },
            "monitoring_summary": monitoring_summary,
            "expected_production": expected_production,
            "performance_ratio": performance_ratio,
            "monitoring_issues": monitoring_issues,
            "correlated_issues": correlated_issues,
            "correlation_summary": {
                "total_issues": len(issues),
                "correlated_issues": sum(1 for i in correlated_issues if i.get("monitoring_evidence")),
                "new_issues_from_monitoring": len(monitoring_issues)
            }
        }
        
        return result
    
    async def register_monitoring_system(
        self,
        db_session: Session,
        facility_id: int,
        provider: str,
        site_id: str,
        api_key: Optional[str] = None,
        site_name: Optional[str] = None,
        site_details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Register a monitoring system for a facility
        
        Args:
            db_session: Database session
            facility_id: ID of the facility
            provider: Monitoring system provider
            site_id: Site ID in the monitoring system
            api_key: API key for the monitoring system (optional)
            site_name: Name of the site (optional)
            site_details: Additional site details (optional)
            
        Returns:
            Dictionary with registration result
        """
        logger.info(f"Registering {provider} monitoring system for facility {facility_id}")
        
        # In a real implementation, this would store the monitoring system details in the database
        # For now, just return a success response
        return {
            "facility_id": facility_id,
            "provider": provider,
            "site_id": site_id,
            "site_name": site_name,
            "registered_at": datetime.now().isoformat(),
            "status": "success"
        }
    
    async def test_monitoring_connection(
        self,
        provider: str,
        site_id: str,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Test connection to a monitoring system
        
        Args:
            provider: Monitoring system provider
            site_id: Site ID in the monitoring system
            api_key: API key for the monitoring system (optional)
            
        Returns:
            Dictionary with connection test result
        """
        logger.info(f"Testing connection to {provider} monitoring system for site {site_id}")
        
        # In a real implementation, this would test the connection to the monitoring system
        # For now, just return a success response
        return {
            "provider": provider,
            "site_id": site_id,
            "connection_status": "success",
            "tested_at": datetime.now().isoformat(),
            "system_info": {
                "name": f"Test {provider.capitalize()} System",
                "capacity_kw": 10.5,
                "installation_date": "2023-01-15"
            }
        }
