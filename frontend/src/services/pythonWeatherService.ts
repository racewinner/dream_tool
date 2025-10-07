/**
 * Python Weather Service Client for DREAM Tool
 * Enhanced weather data API client with provider fallback and caching
 */

import { API_CONFIG } from '../config/api';

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    solar_radiation: number;
  };
  daily: Array<{
    date: string;
    temperature_min: number;
    temperature_max: number;
    solar_radiation: number;
    precipitation: number;
    humidity: number;
  }>;
}

export interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  message?: string;
  provider_used?: string;
  cache_hit?: boolean;
}

export interface HistoricalWeatherResponse {
  success: boolean;
  data?: {
    latitude: number;
    longitude: number;
    date_range: {
      start: string;
      end: string;
    };
    data_points: number;
    daily_data: Array<{
      date: string;
      temperature_min: number;
      temperature_max: number;
      solar_radiation: number;
      precipitation: number;
      humidity: number;
    }>;
  };
  message?: string;
}

export interface WeatherProviderStatus {
  success: boolean;
  data?: {
    providers: Array<{
      name: string;
      status: string;
      api_key_configured: boolean;
      priority: number;
    }>;
    fallback_enabled: boolean;
    total_providers: number;
    active_providers: number;
  };
  message?: string;
}

export interface WeatherCacheStats {
  success: boolean;
  data?: {
    current_entries: number;
    historical_entries: number;
    total_entries: number;
    cache_ttl: number;
  };
  message?: string;
}

class PythonWeatherService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/weather`;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Handle authentication error
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get current weather data for specified coordinates
   */
  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/current?latitude=${latitude}&longitude=${longitude}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      return this.handleResponse<WeatherResponse>(response);
    } catch (error) {
      console.error('Failed to get current weather:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get current weather data'
      };
    }
  }

  /**
   * Get historical weather data for specified coordinates and date range
   */
  async getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<HistoricalWeatherResponse> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        start_date: startDate,
        end_date: endDate
      });

      const response = await fetch(
        `${this.baseUrl}/historical?${params}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      return this.handleResponse<HistoricalWeatherResponse>(response);
    } catch (error) {
      console.error('Failed to get historical weather:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get historical weather data'
      };
    }
  }

  /**
   * Get current weather data using POST method (for complex requests)
   */
  async getCurrentWeatherPost(latitude: number, longitude: number): Promise<WeatherResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/current`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ latitude, longitude }),
      });

      return this.handleResponse<WeatherResponse>(response);
    } catch (error) {
      console.error('Failed to get current weather (POST):', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get current weather data'
      };
    }
  }

  /**
   * Get historical weather data using POST method (for complex requests)
   */
  async getHistoricalWeatherPost(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<HistoricalWeatherResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/historical`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          latitude,
          longitude,
          start_date: startDate,
          end_date: endDate
        }),
      });

      return this.handleResponse<HistoricalWeatherResponse>(response);
    } catch (error) {
      console.error('Failed to get historical weather (POST):', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get historical weather data'
      };
    }
  }

  /**
   * Get weather provider status and availability
   */
  async getProviderStatus(): Promise<WeatherProviderStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/providers/status`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<WeatherProviderStatus>(response);
    } catch (error) {
      console.error('Failed to get provider status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get provider status'
      };
    }
  }

  /**
   * Get weather cache statistics
   */
  async getCacheStats(): Promise<WeatherCacheStats> {
    try {
      const response = await fetch(`${this.baseUrl}/cache/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<WeatherCacheStats>(response);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get cache statistics'
      };
    }
  }

  /**
   * Clear weather data cache
   */
  async clearCache(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/cache`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<{ success: boolean; message?: string }>(response);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear cache'
      };
    }
  }

  /**
   * Get weather data for multiple locations (batch request)
   */
  async getBatchWeather(locations: Array<{ latitude: number; longitude: number; name?: string }>): Promise<{
    success: boolean;
    data?: Array<WeatherData & { name?: string; error?: string }>;
    message?: string;
  }> {
    try {
      // Since the API doesn't have a batch endpoint, make concurrent requests
      const weatherPromises = locations.map(async (location) => {
        try {
          const result = await this.getCurrentWeather(location.latitude, location.longitude);
          if (result.success && result.data) {
            return {
              ...result.data,
              name: location.name
            };
          } else {
            return {
              latitude: location.latitude,
              longitude: location.longitude,
              name: location.name,
              error: result.message || 'Failed to get weather data'
            } as any;
          }
        } catch (error) {
          return {
            latitude: location.latitude,
            longitude: location.longitude,
            name: location.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          } as any;
        }
      });

      const results = await Promise.all(weatherPromises);
      
      return {
        success: true,
        data: results,
        message: `Retrieved weather data for ${results.length} locations`
      };
    } catch (error) {
      console.error('Failed to get batch weather data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get batch weather data'
      };
    }
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Validate date range
   */
  validateDateRange(startDate: string, endDate: string): boolean {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      
      return start <= end && end <= now && !isNaN(start.getTime()) && !isNaN(end.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Format weather data for display
   */
  formatWeatherData(data: WeatherData): {
    current: {
      temperature: string;
      humidity: string;
      windSpeed: string;
      solarRadiation: string;
    };
    daily: Array<{
      date: string;
      temperatureRange: string;
      solarRadiation: string;
      precipitation: string;
      humidity: string;
    }>;
  } {
    return {
      current: {
        temperature: `${Math.round(data.current.temperature)}°C`,
        humidity: `${Math.round(data.current.humidity)}%`,
        windSpeed: `${data.current.wind_speed.toFixed(1)} m/s`,
        solarRadiation: `${data.current.solar_radiation.toFixed(1)} W/m²`
      },
      daily: data.daily.map(day => ({
        date: new Date(day.date).toLocaleDateString(),
        temperatureRange: `${Math.round(day.temperature_min)}°C - ${Math.round(day.temperature_max)}°C`,
        solarRadiation: `${day.solar_radiation.toFixed(1)} W/m²`,
        precipitation: `${day.precipitation.toFixed(1)} mm`,
        humidity: `${Math.round(day.humidity)}%`
      }))
    };
  }
}

// Export singleton instance
export const pythonWeatherService = new PythonWeatherService();
export default pythonWeatherService;
