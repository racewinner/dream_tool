"""
Weather Service API Routes for DREAM Tool
Enhanced weather data API with provider fallback and comprehensive error handling
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from services.weather_service import weather_service, WeatherData
from core.auth import verify_token

router = APIRouter()

class WeatherRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")

class HistoricalWeatherRequest(WeatherRequest):
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")

class WeatherResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
    provider_used: Optional[str] = None
    cache_hit: Optional[bool] = None

@router.get("/current", response_model=WeatherResponse)
async def get_current_weather(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
    current_user: dict = Depends(verify_token)
):
    """
    Get current weather data for specified coordinates
    
    - **latitude**: Latitude in decimal degrees (-90 to 90)
    - **longitude**: Longitude in decimal degrees (-180 to 180)
    
    Returns current weather conditions including temperature, humidity, wind speed, and solar radiation.
    Uses multiple weather providers with automatic fallback for reliability.
    """
    try:
        async with weather_service as weather_svc:
            weather_data = await weather_svc.get_current_weather(latitude, longitude)
            
            return WeatherResponse(
                success=True,
                data={
                    "latitude": weather_data.latitude,
                    "longitude": weather_data.longitude,
                    "timezone": weather_data.timezone,
                    "current": {
                        "temperature": weather_data.current.temperature,
                        "humidity": weather_data.current.humidity,
                        "wind_speed": weather_data.current.wind_speed,
                        "solar_radiation": weather_data.current.solar_radiation
                    },
                    "daily": [
                        {
                            "date": day.date,
                            "temperature_min": day.temperature_min,
                            "temperature_max": day.temperature_max,
                            "solar_radiation": day.solar_radiation,
                            "precipitation": day.precipitation,
                            "humidity": day.humidity
                        }
                        for day in weather_data.daily
                    ]
                },
                message="Weather data retrieved successfully"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve weather data: {str(e)}"
        )

@router.get("/historical", response_model=WeatherResponse)
async def get_historical_weather(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    current_user: dict = Depends(verify_token)
):
    """
    Get historical weather data for specified coordinates and date range
    
    - **latitude**: Latitude in decimal degrees (-90 to 90)
    - **longitude**: Longitude in decimal degrees (-180 to 180)
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    
    Returns historical weather data including daily temperatures, solar radiation, and precipitation.
    Data availability depends on weather provider and may vary by location.
    """
    try:
        # Validate date format and range
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use YYYY-MM-DD format."
            )
        
        if start_dt > end_dt:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before or equal to end date"
            )
        
        if end_dt > datetime.now():
            raise HTTPException(
                status_code=400,
                detail="End date cannot be in the future"
            )
        
        # Limit date range to prevent excessive data requests
        if (end_dt - start_dt).days > 365:
            raise HTTPException(
                status_code=400,
                detail="Date range cannot exceed 365 days"
            )
        
        async with weather_service as weather_svc:
            weather_data_list = await weather_svc.get_historical_weather(
                latitude, longitude, start_date, end_date
            )
            
            return WeatherResponse(
                success=True,
                data={
                    "latitude": latitude,
                    "longitude": longitude,
                    "date_range": {
                        "start": start_date,
                        "end": end_date
                    },
                    "data_points": len(weather_data_list),
                    "daily_data": [
                        {
                            "date": weather_data.daily[0].date if weather_data.daily else "",
                            "temperature_min": weather_data.daily[0].temperature_min if weather_data.daily else None,
                            "temperature_max": weather_data.daily[0].temperature_max if weather_data.daily else None,
                            "solar_radiation": weather_data.daily[0].solar_radiation if weather_data.daily else None,
                            "precipitation": weather_data.daily[0].precipitation if weather_data.daily else None,
                            "humidity": weather_data.daily[0].humidity if weather_data.daily else None
                        }
                        for weather_data in weather_data_list
                    ]
                },
                message=f"Retrieved {len(weather_data_list)} days of historical weather data"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve historical weather data: {str(e)}"
        )

@router.post("/current", response_model=WeatherResponse)
async def get_current_weather_post(
    request: WeatherRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Get current weather data (POST method for complex requests)
    
    Alternative POST endpoint for getting current weather data.
    Useful when additional parameters or request body data is needed.
    """
    try:
        async with weather_service as weather_svc:
            weather_data = await weather_svc.get_current_weather(
                request.latitude, request.longitude
            )
            
            return WeatherResponse(
                success=True,
                data={
                    "latitude": weather_data.latitude,
                    "longitude": weather_data.longitude,
                    "timezone": weather_data.timezone,
                    "current": {
                        "temperature": weather_data.current.temperature,
                        "humidity": weather_data.current.humidity,
                        "wind_speed": weather_data.current.wind_speed,
                        "solar_radiation": weather_data.current.solar_radiation
                    }
                }
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve weather data: {str(e)}"
        )

@router.post("/historical", response_model=WeatherResponse)
async def get_historical_weather_post(
    request: HistoricalWeatherRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Get historical weather data (POST method for complex requests)
    
    Alternative POST endpoint for getting historical weather data.
    Useful when additional parameters or request body data is needed.
    """
    try:
        async with weather_service as weather_svc:
            weather_data_list = await weather_svc.get_historical_weather(
                request.latitude, request.longitude, 
                request.start_date, request.end_date
            )
            
            return WeatherResponse(
                success=True,
                data={
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "date_range": {
                        "start": request.start_date,
                        "end": request.end_date
                    },
                    "data_points": len(weather_data_list),
                    "daily_data": [
                        {
                            "date": wd.daily[0].date if wd.daily else "",
                            "temperature_min": wd.daily[0].temperature_min if wd.daily else None,
                            "temperature_max": wd.daily[0].temperature_max if wd.daily else None,
                            "solar_radiation": wd.daily[0].solar_radiation if wd.daily else None,
                            "precipitation": wd.daily[0].precipitation if wd.daily else None,
                            "humidity": wd.daily[0].humidity if wd.daily else None
                        }
                        for wd in weather_data_list
                    ]
                }
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve historical weather data: {str(e)}"
        )

@router.get("/cache/stats")
async def get_cache_stats(current_user: dict = Depends(verify_token)):
    """
    Get weather cache statistics
    
    Returns information about cached weather data including entry counts and cache performance.
    Useful for monitoring and debugging weather service performance.
    """
    try:
        async with weather_service as weather_svc:
            stats = await weather_svc.get_cache_stats()
            
            return {
                "success": True,
                "data": stats,
                "message": "Cache statistics retrieved successfully"
            }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cache statistics: {str(e)}"
        )

@router.delete("/cache")
async def clear_weather_cache(current_user: dict = Depends(verify_token)):
    """
    Clear weather data cache
    
    Clears all cached weather data. Use with caution as this will force fresh API calls
    for subsequent weather requests, which may be slower and count against API quotas.
    """
    try:
        async with weather_service as weather_svc:
            await weather_svc.clear_cache()
            
            return {
                "success": True,
                "message": "Weather cache cleared successfully"
            }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear weather cache: {str(e)}"
        )

@router.get("/providers/status")
async def get_provider_status(current_user: dict = Depends(verify_token)):
    """
    Get weather provider status and availability
    
    Returns information about configured weather providers and their current status.
    Helps with debugging weather service issues and provider failover.
    """
    try:
        # Mock provider status - in real implementation would check each provider
        providers = [
            {
                "name": "OpenWeatherMap",
                "status": "active",
                "api_key_configured": bool(weather_service.openweather_api_key),
                "priority": 1
            },
            {
                "name": "NREL",
                "status": "active",
                "api_key_configured": bool(weather_service.nrel_api_key),
                "priority": 2
            },
            {
                "name": "NASA POWER",
                "status": "active",
                "api_key_configured": True,  # No API key required
                "priority": 3
            }
        ]
        
        return {
            "success": True,
            "data": {
                "providers": providers,
                "fallback_enabled": True,
                "total_providers": len(providers),
                "active_providers": len([p for p in providers if p["status"] == "active"])
            },
            "message": "Provider status retrieved successfully"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve provider status: {str(e)}"
        )
