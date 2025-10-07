"""
Enhanced Weather Service for DREAM Tool
Migrated from TypeScript with improved capabilities using Python scientific libraries
"""

import asyncio
import aiohttp
import redis.asyncio as redis
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum
import os
from urllib.parse import urlencode

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WeatherProvider(Enum):
    OPENWEATHER = "openweather"
    NREL = "nrel" 
    NASA_POWER = "nasa_power"

@dataclass
class CurrentWeather:
    temperature: float
    humidity: float
    wind_speed: float
    solar_radiation: float

@dataclass
class DailyWeather:
    date: str
    temperature_min: float
    temperature_max: float
    solar_radiation: float
    precipitation: float
    humidity: float

@dataclass
class WeatherData:
    latitude: float
    longitude: float
    timezone: str
    current: CurrentWeather
    daily: List[DailyWeather]

class WeatherServiceError(Exception):
    def __init__(self, message: str, provider: str = None, status_code: int = None):
        self.message = message
        self.provider = provider
        self.status_code = status_code
        super().__init__(self.message)

class WeatherService:
    def __init__(self):
        self.redis_client = None
        self.session = None
        self.cache_ttl = 3600  # 1 hour cache
        self.max_retries = 3
        self.retry_delay = 1.0
        
        # API configurations
        self.openweather_api_key = os.getenv('OPENWEATHER_API_KEY')
        self.nrel_api_key = os.getenv('NREL_API_KEY')
        
        # Provider configurations
        self.providers = [
            WeatherProvider.OPENWEATHER,
            WeatherProvider.NREL,
            WeatherProvider.NASA_POWER
        ]
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self._cleanup()
    
    async def _initialize(self):
        """Initialize async resources"""
        try:
            # Initialize Redis connection
            redis_host = os.getenv('REDIS_HOST', 'localhost')
            redis_port = int(os.getenv('REDIS_PORT', 6379))
            self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
            
            # Initialize HTTP session
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
            
            logger.info("Weather service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize weather service: {e}")
            raise WeatherServiceError(f"Initialization failed: {e}")
    
    async def _cleanup(self):
        """Cleanup async resources"""
        if self.session:
            await self.session.close()
        if self.redis_client:
            await self.redis_client.aclose()
    
    def validate_coordinates(self, latitude: float, longitude: float) -> bool:
        """Validate coordinate bounds"""
        return -90 <= latitude <= 90 and -180 <= longitude <= 180
    
    def validate_date_range(self, start_date: str, end_date: str) -> bool:
        """Validate date range format and logic"""
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            return start <= end and end <= datetime.now()
        except ValueError:
            return False
    
    async def get_current_weather(self, latitude: float, longitude: float) -> WeatherData:
        """Get current weather data with provider fallback"""
        if not self.validate_coordinates(latitude, longitude):
            raise WeatherServiceError("Invalid coordinates provided")
        
        # Check cache first
        cache_key = f"weather:current:{latitude}:{longitude}"
        cached_data = await self._get_cached_data(cache_key)
        if cached_data:
            return self._deserialize_weather_data(cached_data)
        
        # Try providers in order
        last_error = None
        for provider in self.providers:
            try:
                data = await self._fetch_current_weather(provider, latitude, longitude)
                if data:
                    # Cache successful result
                    await self._cache_data(cache_key, self._serialize_weather_data(data))
                    return data
            except Exception as e:
                last_error = WeatherServiceError(
                    f"Provider {provider.value} failed: {str(e)}", 
                    provider.value
                )
                logger.warning(f"Weather provider {provider.value} failed: {e}")
        
        if last_error:
            raise last_error
        raise WeatherServiceError("All weather providers failed")
    
    async def get_historical_weather(
        self, 
        latitude: float, 
        longitude: float, 
        start_date: str, 
        end_date: str
    ) -> List[WeatherData]:
        """Get historical weather data"""
        if not self.validate_coordinates(latitude, longitude):
            raise WeatherServiceError("Invalid coordinates provided")
        
        if not self.validate_date_range(start_date, end_date):
            raise WeatherServiceError("Invalid date range provided")
        
        # Check cache
        cache_key = f"weather:historical:{latitude}:{longitude}:{start_date}:{end_date}"
        cached_data = await self._get_cached_data(cache_key)
        if cached_data:
            return [self._deserialize_weather_data(item) for item in cached_data]
        
        # Try providers
        last_error = None
        for provider in self.providers:
            try:
                data = await self._fetch_historical_weather(provider, latitude, longitude, start_date, end_date)
                if data:
                    # Cache successful result
                    serialized_data = [self._serialize_weather_data(item) for item in data]
                    await self._cache_data(cache_key, serialized_data)
                    return data
            except Exception as e:
                last_error = WeatherServiceError(
                    f"Provider {provider.value} failed: {str(e)}", 
                    provider.value
                )
                logger.warning(f"Historical weather provider {provider.value} failed: {e}")
        
        if last_error:
            raise last_error
        raise WeatherServiceError("All weather providers failed for historical data")
    
    async def _fetch_current_weather(self, provider: WeatherProvider, lat: float, lon: float) -> Optional[WeatherData]:
        """Fetch current weather from specific provider"""
        if provider == WeatherProvider.OPENWEATHER:
            return await self._fetch_openweather_current(lat, lon)
        elif provider == WeatherProvider.NREL:
            return await self._fetch_nrel_current(lat, lon)
        elif provider == WeatherProvider.NASA_POWER:
            return await self._fetch_nasa_power_current(lat, lon)
        return None
    
    async def _fetch_historical_weather(
        self, 
        provider: WeatherProvider, 
        lat: float, 
        lon: float, 
        start_date: str, 
        end_date: str
    ) -> Optional[List[WeatherData]]:
        """Fetch historical weather from specific provider"""
        if provider == WeatherProvider.OPENWEATHER:
            return await self._fetch_openweather_historical(lat, lon, start_date, end_date)
        elif provider == WeatherProvider.NREL:
            return await self._fetch_nrel_historical(lat, lon, start_date, end_date)
        elif provider == WeatherProvider.NASA_POWER:
            return await self._fetch_nasa_power_historical(lat, lon, start_date, end_date)
        return None
    
    async def _fetch_openweather_current(self, lat: float, lon: float) -> Optional[WeatherData]:
        """Fetch current weather from OpenWeatherMap"""
        if not self.openweather_api_key:
            logger.warning("OpenWeatherMap API key not configured")
            return None
        
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.openweather_api_key,
            'units': 'metric'
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_openweather_current(data, lat, lon)
                else:
                    raise WeatherServiceError(f"OpenWeatherMap API error: {response.status}")
        except Exception as e:
            raise WeatherServiceError(f"OpenWeatherMap request failed: {e}")
    
    async def _fetch_nrel_current(self, lat: float, lon: float) -> Optional[WeatherData]:
        """Fetch current weather from NREL"""
        if not self.nrel_api_key:
            logger.warning("NREL API key not configured")
            return None
        
        # NREL doesn't provide current weather, only historical/forecasted
        # Return None to try next provider
        return None
    
    async def _fetch_nasa_power_current(self, lat: float, lon: float) -> Optional[WeatherData]:
        """Fetch current weather from NASA POWER (limited current data)"""
        # NASA POWER primarily provides historical data
        # For current weather, we'll use recent historical data
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y%m%d')
        today = datetime.now().strftime('%Y%m%d')
        
        url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        params = {
            'parameters': 'T2M,RH2M,WS10M,ALLSKY_SFC_SW_DWN',
            'community': 'SB',
            'longitude': lon,
            'latitude': lat,
            'start': yesterday,
            'end': today,
            'format': 'JSON'
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_nasa_power_current(data, lat, lon)
                else:
                    raise WeatherServiceError(f"NASA POWER API error: {response.status}")
        except Exception as e:
            raise WeatherServiceError(f"NASA POWER request failed: {e}")
    
    def _parse_openweather_current(self, data: dict, lat: float, lon: float) -> WeatherData:
        """Parse OpenWeatherMap current weather response"""
        current = CurrentWeather(
            temperature=data['main']['temp'],
            humidity=data['main']['humidity'],
            wind_speed=data['wind'].get('speed', 0),
            solar_radiation=0  # OpenWeather doesn't provide solar radiation
        )
        
        daily_weather = DailyWeather(
            date=datetime.now().strftime('%Y-%m-%d'),
            temperature_min=data['main']['temp_min'],
            temperature_max=data['main']['temp_max'],
            solar_radiation=0,
            precipitation=data.get('rain', {}).get('1h', 0),
            humidity=data['main']['humidity']
        )
        
        return WeatherData(
            latitude=lat,
            longitude=lon,
            timezone=data.get('timezone', 'UTC'),
            current=current,
            daily=[daily_weather]
        )
    
    def _parse_nasa_power_current(self, data: dict, lat: float, lon: float) -> WeatherData:
        """Parse NASA POWER response for current weather"""
        properties = data.get('properties', {})
        parameter_data = properties.get('parameter', {})
        
        # Get most recent data
        latest_date = max(parameter_data.get('T2M', {}).keys()) if parameter_data.get('T2M') else None
        
        if not latest_date:
            raise WeatherServiceError("No recent data available from NASA POWER")
        
        temp = parameter_data.get('T2M', {}).get(latest_date, 20)
        humidity = parameter_data.get('RH2M', {}).get(latest_date, 50)
        wind_speed = parameter_data.get('WS10M', {}).get(latest_date, 0)
        solar_radiation = parameter_data.get('ALLSKY_SFC_SW_DWN', {}).get(latest_date, 0)
        
        current = CurrentWeather(
            temperature=temp,
            humidity=humidity,
            wind_speed=wind_speed,
            solar_radiation=solar_radiation
        )
        
        daily_weather = DailyWeather(
            date=latest_date,
            temperature_min=temp - 5,  # Estimate
            temperature_max=temp + 5,  # Estimate
            solar_radiation=solar_radiation,
            precipitation=0,  # NASA POWER doesn't provide precipitation in this format
            humidity=humidity
        )
        
        return WeatherData(
            latitude=lat,
            longitude=lon,
            timezone='UTC',
            current=current,
            daily=[daily_weather]
        )
    
    async def _get_cached_data(self, key: str) -> Optional[Union[dict, list]]:
        """Get data from Redis cache"""
        try:
            if self.redis_client:
                cached = await self.redis_client.get(key)
                if cached:
                    return json.loads(cached)
        except Exception as e:
            logger.warning(f"Cache retrieval failed: {e}")
        return None
    
    async def _cache_data(self, key: str, data: Union[dict, list]):
        """Store data in Redis cache"""
        try:
            if self.redis_client:
                await self.redis_client.setex(key, self.cache_ttl, json.dumps(data))
        except Exception as e:
            logger.warning(f"Cache storage failed: {e}")
    
    def _serialize_weather_data(self, data: WeatherData) -> dict:
        """Convert WeatherData to dictionary for caching"""
        return {
            'latitude': data.latitude,
            'longitude': data.longitude,
            'timezone': data.timezone,
            'current': {
                'temperature': data.current.temperature,
                'humidity': data.current.humidity,
                'wind_speed': data.current.wind_speed,
                'solar_radiation': data.current.solar_radiation
            },
            'daily': [
                {
                    'date': day.date,
                    'temperature_min': day.temperature_min,
                    'temperature_max': day.temperature_max,
                    'solar_radiation': day.solar_radiation,
                    'precipitation': day.precipitation,
                    'humidity': day.humidity
                }
                for day in data.daily
            ]
        }
    
    def _deserialize_weather_data(self, data: dict) -> WeatherData:
        """Convert dictionary back to WeatherData"""
        current = CurrentWeather(**data['current'])
        daily = [DailyWeather(**day) for day in data['daily']]
        
        return WeatherData(
            latitude=data['latitude'],
            longitude=data['longitude'],
            timezone=data['timezone'],
            current=current,
            daily=daily
        )
    
    async def clear_cache(self):
        """Clear all weather cache entries"""
        try:
            if self.redis_client:
                pattern = "weather:*"
                keys = await self.redis_client.keys(pattern)
                if keys:
                    await self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} weather cache entries")
        except Exception as e:
            logger.error(f"Failed to clear weather cache: {e}")
    
    async def get_cache_stats(self) -> dict:
        """Get weather cache statistics"""
        try:
            if self.redis_client:
                current_keys = await self.redis_client.keys("weather:current:*")
                historical_keys = await self.redis_client.keys("weather:historical:*")
                
                return {
                    'current_entries': len(current_keys),
                    'historical_entries': len(historical_keys),
                    'total_entries': len(current_keys) + len(historical_keys),
                    'cache_ttl': self.cache_ttl
                }
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
        
        return {'current_entries': 0, 'historical_entries': 0, 'total_entries': 0, 'cache_ttl': self.cache_ttl}

# Create singleton instance
weather_service = WeatherService()
