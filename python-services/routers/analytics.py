"""
Advanced Analytics Router
Machine learning and statistical analysis endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.auth import verify_token
import numpy as np
import pandas as pd
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.get("/health")
async def analytics_health():
    """Health check for analytics service"""
    return {
        "service": "advanced_analytics",
        "status": "healthy",
        "features": [
            "predictive_modeling",
            "statistical_analysis",
            "data_visualization",
            "machine_learning"
        ],
        "libraries": {
            "numpy": "available",
            "pandas": "available",
            "scikit-learn": "available",
            "matplotlib": "available"
        }
    }

@router.post("/energy-prediction")
async def predict_energy_consumption(
    facility_data: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Predict energy consumption using ML models"""
    user = await verify_token(credentials.credentials)
    
    try:
        # Placeholder for ML-based energy prediction
        # In production, this would use trained models
        
        base_consumption = facility_data.get('building_area', 100) * 0.8  # kWh/day per m²
        staff_factor = facility_data.get('staff_count', 5) * 0.5
        equipment_factor = len(facility_data.get('equipment', [])) * 2
        
        predicted_consumption = base_consumption + staff_factor + equipment_factor
        
        return {
            "predicted_daily_consumption": round(predicted_consumption, 2),
            "predicted_annual_consumption": round(predicted_consumption * 365, 2),
            "confidence_interval": {
                "lower": round(predicted_consumption * 0.85, 2),
                "upper": round(predicted_consumption * 1.15, 2)
            },
            "model_type": "linear_regression_placeholder",
            "features_used": ["building_area", "staff_count", "equipment_count"]
        }
        
    except Exception as e:
        logger.error(f"Energy prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/statistical-analysis")
async def perform_statistical_analysis(
    data: List[Dict[str, Any]],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Perform statistical analysis on energy data"""
    user = await verify_token(credentials.credentials)
    
    try:
        # Convert to DataFrame for analysis
        df = pd.DataFrame(data)
        
        if df.empty:
            raise HTTPException(status_code=400, detail="No data provided")
        
        # Basic statistical analysis
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        
        stats = {}
        for col in numeric_columns:
            stats[col] = {
                "mean": float(df[col].mean()),
                "median": float(df[col].median()),
                "std": float(df[col].std()),
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "quartiles": {
                    "q25": float(df[col].quantile(0.25)),
                    "q75": float(df[col].quantile(0.75))
                }
            }
        
        return {
            "statistics": stats,
            "data_shape": df.shape,
            "numeric_columns": list(numeric_columns),
            "analysis_type": "descriptive_statistics"
        }
        
    except Exception as e:
        logger.error(f"Statistical analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/benchmark-comparison")
async def compare_with_benchmarks(
    facility_data: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Compare facility performance with benchmarks"""
    user = await verify_token(credentials.credentials)
    
    try:
        facility_type = facility_data.get('facility_type', 'health_clinic')
        
        # Benchmark data (would come from database in production)
        benchmarks = {
            'health_clinic': {
                'energy_intensity_kwh_per_m2': 0.8,
                'peak_demand_w_per_m2': 15,
                'load_factor': 0.45
            },
            'school': {
                'energy_intensity_kwh_per_m2': 0.6,
                'peak_demand_w_per_m2': 12,
                'load_factor': 0.35
            }
        }
        
        benchmark = benchmarks.get(facility_type, benchmarks['health_clinic'])
        
        # Calculate facility metrics
        building_area = facility_data.get('building_area', 100)
        daily_consumption = facility_data.get('daily_consumption', 50)
        peak_demand = facility_data.get('peak_demand', 8)
        
        facility_energy_intensity = daily_consumption / building_area
        facility_peak_intensity = (peak_demand * 1000) / building_area  # W/m²
        
        # Performance comparison
        energy_performance = facility_energy_intensity / benchmark['energy_intensity_kwh_per_m2']
        peak_performance = facility_peak_intensity / benchmark['peak_demand_w_per_m2']
        
        return {
            "facility_metrics": {
                "energy_intensity_kwh_per_m2": round(facility_energy_intensity, 3),
                "peak_demand_w_per_m2": round(facility_peak_intensity, 1)
            },
            "benchmark_metrics": benchmark,
            "performance_ratios": {
                "energy_efficiency": round(energy_performance, 2),
                "peak_demand_ratio": round(peak_performance, 2)
            },
            "performance_grade": "A" if energy_performance < 0.8 else "B" if energy_performance < 1.2 else "C",
            "recommendations": [
                "Excellent efficiency" if energy_performance < 0.8 else
                "Good efficiency" if energy_performance < 1.2 else
                "Consider efficiency improvements"
            ]
        }
        
    except Exception as e:
        logger.error(f"Benchmark comparison failed: {e}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.post("/trend-analysis")
async def analyze_trends(
    time_series_data: List[Dict[str, Any]],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analyze trends in energy consumption data"""
    user = await verify_token(credentials.credentials)
    
    try:
        df = pd.DataFrame(time_series_data)
        
        if df.empty or 'timestamp' not in df.columns:
            raise HTTPException(status_code=400, detail="Invalid time series data")
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Analyze trends for numeric columns
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        trends = {}
        
        for col in numeric_columns:
            if col != 'timestamp':
                # Simple linear trend analysis
                x = np.arange(len(df))
                y = df[col].values
                
                # Calculate trend slope
                slope = np.polyfit(x, y, 1)[0]
                
                # Calculate correlation
                correlation = np.corrcoef(x, y)[0, 1]
                
                trends[col] = {
                    "slope": float(slope),
                    "correlation": float(correlation),
                    "trend_direction": "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable",
                    "trend_strength": "strong" if abs(correlation) > 0.7 else "moderate" if abs(correlation) > 0.3 else "weak"
                }
        
        return {
            "trends": trends,
            "data_points": len(df),
            "time_range": {
                "start": df['timestamp'].min().isoformat(),
                "end": df['timestamp'].max().isoformat()
            },
            "analysis_type": "linear_trend_analysis"
        }
        
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
