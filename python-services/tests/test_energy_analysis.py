"""
Test suite for Python Energy Analysis Services
Comprehensive testing for hybrid architecture integration
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import numpy as np
import pandas as pd

# Import the FastAPI app and services
from main import app
from services.energy_analysis import energy_analyzer
from models.energy import (
    Equipment, FacilityData, EnergyAnalysisOptions,
    LoadProfileRequest, EnergyAnalysisRequest
)

# Test client
client = TestClient(app)

# Mock authentication for testing
@pytest.fixture
def mock_auth():
    with patch('core.auth.verify_token') as mock_verify:
        mock_verify.return_value = {
            'id': 1,
            'email': 'test@example.com',
            'role': 'admin'
        }
        yield mock_verify

class TestEnergyAnalysisService:
    """Test the core energy analysis service"""
    
    def test_equipment_to_dataframe(self):
        """Test equipment list to DataFrame conversion"""
        equipment = [
            Equipment(
                id="led_1",
                name="LED Lights",
                category="lighting",
                power_rating=20,
                hours_per_day=12,
                efficiency=0.9,
                priority="essential",
                quantity=10
            ),
            Equipment(
                id="fridge_1",
                name="Medical Refrigerator",
                category="medical",
                power_rating=150,
                hours_per_day=24,
                efficiency=0.85,
                priority="essential",
                quantity=1
            )
        ]
        
        df = energy_analyzer.equipment_to_dataframe(equipment)
        
        assert len(df) == 2
        assert 'total_power' in df.columns
        assert df.iloc[0]['total_power'] == 200  # 20W * 10 units
        assert df.iloc[1]['total_power'] == 150  # 150W * 1 unit
    
    def test_load_profile_generation(self):
        """Test 24-hour load profile generation"""
        equipment = [
            Equipment(
                id="test_eq",
                name="Test Equipment",
                category="lighting",
                power_rating=100,
                hours_per_day=12,
                efficiency=0.8,
                priority="important",
                quantity=1
            )
        ]
        
        options = EnergyAnalysisOptions()
        load_profile = energy_analyzer.generate_load_profile(equipment, options)
        
        assert len(load_profile) == 24
        assert all(point.hour >= 0 and point.hour <= 23 for point in load_profile)
        assert all(point.demand >= 0 for point in load_profile)
        
        # Check that lighting equipment has higher demand during evening hours
        evening_demand = [p.demand for p in load_profile if 18 <= p.hour <= 22]
        morning_demand = [p.demand for p in load_profile if 6 <= p.hour <= 10]
        
        assert max(evening_demand) > max(morning_demand)
    
    def test_comprehensive_analysis(self):
        """Test comprehensive energy analysis"""
        facility_data = FacilityData(
            name="Test Clinic",
            facility_type="health_clinic",
            location={"latitude": 2.0469, "longitude": 45.3182},
            equipment=[
                Equipment(
                    id="led_lights",
                    name="LED Lights",
                    category="lighting",
                    power_rating=20,
                    hours_per_day=12,
                    efficiency=0.9,
                    priority="essential",
                    quantity=10
                ),
                Equipment(
                    id="medical_fridge",
                    name="Medical Refrigerator",
                    category="medical",
                    power_rating=150,
                    hours_per_day=24,
                    efficiency=0.85,
                    priority="essential",
                    quantity=1
                )
            ],
            operational_hours=12,
            staff_count=5
        )
        
        options = EnergyAnalysisOptions()
        result = energy_analyzer.perform_comprehensive_analysis(facility_data, options)
        
        assert result.peak_demand > 0
        assert result.daily_consumption > 0
        assert result.annual_consumption == result.daily_consumption * 365
        assert 0 < result.load_factor <= 1
        assert result.base_load >= 0
        assert len(result.recommendations) > 0
        assert len(result.equipment_breakdown) > 0
    
    def test_system_sizing_optimization(self):
        """Test mathematical optimization for system sizing"""
        # Create mock analysis result
        from models.energy import EnergyAnalysisResult, LoadProfilePoint
        
        load_profile = [
            LoadProfilePoint(hour=i, demand=2.0 + np.sin(i * np.pi / 12), equipment_breakdown={})
            for i in range(24)
        ]
        
        analysis_result = EnergyAnalysisResult(
            load_profile=load_profile,
            peak_demand=3.0,
            daily_consumption=50.0,
            annual_consumption=18250.0,
            critical_load=2.0,
            non_critical_load=1.0,
            equipment_breakdown={"lighting": 1.5, "medical": 1.5},
            recommendations=["Test recommendation"],
            load_factor=0.7,
            diversity_factor=0.8,
            peak_hours=[12, 13, 14],
            base_load=1.5,
            load_variability=0.3
        )
        
        options = EnergyAnalysisOptions()
        sizing = energy_analyzer.optimize_system_sizing(analysis_result, options)
        
        assert sizing.pv_system_size >= analysis_result.peak_demand
        assert sizing.battery_capacity > 0
        assert sizing.inverter_size >= sizing.pv_system_size
        assert sizing.panel_count > 0
        assert sizing.charge_controller_size > 0

class TestEnergyAPIEndpoints:
    """Test the FastAPI endpoints"""
    
    def test_health_endpoint(self):
        """Test energy service health check"""
        response = client.get("/api/python/energy/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["service"] == "energy_modeling"
        assert data["status"] == "healthy"
        assert "numpy" in data["libraries"]
    
    def test_load_profile_endpoint(self, mock_auth):
        """Test load profile generation endpoint"""
        request_data = {
            "equipment": [
                {
                    "id": "test_eq",
                    "name": "Test Equipment",
                    "category": "lighting",
                    "power_rating": 100,
                    "hours_per_day": 12,
                    "efficiency": 0.8,
                    "priority": "important",
                    "quantity": 1
                }
            ],
            "options": {
                "include_seasonal_variation": True,
                "safety_margin": 1.2,
                "system_efficiency": 0.85
            }
        }
        
        response = client.post(
            "/api/python/energy/load-profile",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "load_profile" in data
        assert "peak_demand" in data
        assert "daily_consumption" in data
        assert len(data["load_profile"]) == 24
    
    def test_comprehensive_analysis_endpoint(self, mock_auth):
        """Test comprehensive analysis endpoint"""
        request_data = {
            "facility_data": {
                "name": "Test Facility",
                "facility_type": "health_clinic",
                "location": {"latitude": 2.0469, "longitude": 45.3182},
                "equipment": [
                    {
                        "id": "led_1",
                        "name": "LED Lights",
                        "category": "lighting",
                        "power_rating": 20,
                        "hours_per_day": 12,
                        "efficiency": 0.9,
                        "priority": "essential",
                        "quantity": 10
                    }
                ],
                "operational_hours": 12,
                "staff_count": 5
            },
            "scenario_type": "optimized",
            "options": {
                "include_seasonal_variation": True,
                "safety_margin": 1.2
            }
        }
        
        response = client.post(
            "/api/python/energy/comprehensive-analysis",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "scenario" in data
        assert "system_sizing" in data
        assert "recommendations" in data
        assert len(data["recommendations"]) > 0
    
    def test_equipment_database_endpoint(self, mock_auth):
        """Test equipment database endpoint"""
        response = client.get(
            "/api/python/energy/equipment-database",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "medical" in data
        assert "lighting" in data
        assert "cooling" in data
        assert "computing" in data
    
    def test_weather_data_endpoint(self, mock_auth):
        """Test weather data endpoint"""
        response = client.get(
            "/api/python/energy/weather-data/2.0469/45.3182",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "weather_data" in data
        assert len(data["weather_data"]["solar_irradiance"]) == 24
        assert len(data["weather_data"]["temperature"]) == 24
    
    def test_benchmarks_endpoint(self, mock_auth):
        """Test energy benchmarks endpoint"""
        response = client.get(
            "/api/python/energy/benchmarks/health_clinic",
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "benchmarks" in data
        assert "daily_consumption_kwh_per_m2" in data["benchmarks"]
        assert "equipment_breakdown" in data["benchmarks"]
    
    def test_unauthorized_access(self):
        """Test that endpoints require authentication"""
        response = client.post("/api/python/energy/load-profile", json={})
        assert response.status_code == 403  # Forbidden without auth
    
    def test_invalid_request_data(self, mock_auth):
        """Test handling of invalid request data"""
        # Missing required fields
        request_data = {
            "equipment": []  # Empty equipment list
        }
        
        response = client.post(
            "/api/python/energy/load-profile",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Should handle gracefully, not crash
        assert response.status_code in [200, 400, 422]

class TestIntegrationWithTypeScript:
    """Test integration between Python and TypeScript services"""
    
    def test_data_format_compatibility(self):
        """Test that Python service can handle TypeScript data formats"""
        # Simulate data from TypeScript service
        typescript_facility = {
            "id": 1,
            "name": "Test Facility",
            "facilityType": "health_clinic",  # TypeScript naming
            "latitude": 2.0469,
            "longitude": 45.3182,
            "operationalHours": 12,  # TypeScript naming
            "staffCount": 5,  # TypeScript naming
            "equipment": [
                {
                    "name": "LED Lights",
                    "powerRating": 20,  # TypeScript naming
                    "hoursPerDay": 12,  # TypeScript naming
                    "quantity": 10
                }
            ]
        }
        
        # Test conversion to Python format
        from services.pythonEnergyService import PythonEnergyService
        python_facility = PythonEnergyService.convertToPythonFacility(typescript_facility)
        
        assert python_facility["name"] == "Test Facility"
        assert python_facility["facility_type"] == "health_clinic"
        assert python_facility["operational_hours"] == 12
        assert python_facility["staff_count"] == 5
        assert len(python_facility["equipment"]) == 1
        assert python_facility["equipment"][0]["power_rating"] == 20

class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_empty_equipment_list(self):
        """Test handling of empty equipment list"""
        options = EnergyAnalysisOptions()
        load_profile = energy_analyzer.generate_load_profile([], options)
        
        assert len(load_profile) == 24
        assert all(point.demand == 0 for point in load_profile)
    
    def test_invalid_equipment_data(self):
        """Test handling of invalid equipment data"""
        with pytest.raises(ValueError):
            Equipment(
                id="invalid",
                name="Invalid Equipment",
                category="lighting",
                power_rating=-100,  # Negative power rating should fail validation
                hours_per_day=12,
                efficiency=0.8,
                priority="important",
                quantity=1
            )
    
    def test_extreme_values(self):
        """Test handling of extreme values"""
        equipment = [
            Equipment(
                id="extreme",
                name="Extreme Equipment",
                category="other",
                power_rating=10000,  # Very high power
                hours_per_day=24,
                efficiency=0.5,  # Low efficiency
                priority="optional",
                quantity=100  # Many units
            )
        ]
        
        options = EnergyAnalysisOptions(safety_margin=2.0)  # High safety margin
        
        # Should not crash with extreme values
        load_profile = energy_analyzer.generate_load_profile(equipment, options)
        assert len(load_profile) == 24
        assert all(point.demand >= 0 for point in load_profile)

# Performance tests
class TestPerformance:
    """Test performance characteristics"""
    
    def test_large_equipment_list_performance(self):
        """Test performance with large equipment lists"""
        import time
        
        # Create large equipment list
        equipment = []
        for i in range(100):
            equipment.append(Equipment(
                id=f"eq_{i}",
                name=f"Equipment {i}",
                category="lighting",
                power_rating=50,
                hours_per_day=12,
                efficiency=0.8,
                priority="important",
                quantity=1
            ))
        
        options = EnergyAnalysisOptions()
        
        start_time = time.time()
        load_profile = energy_analyzer.generate_load_profile(equipment, options)
        end_time = time.time()
        
        # Should complete within reasonable time (< 5 seconds)
        assert (end_time - start_time) < 5.0
        assert len(load_profile) == 24

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
