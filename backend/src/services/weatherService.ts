import axios from 'axios';
import { config } from '../config';
import { WeatherProvider, OpenWeatherProvider, NRELProvider, NASAPOWERProvider } from './providers/weatherProvider';
import { CacheService } from './cacheService';
import { WeatherValidator } from './weatherValidator';

interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    solarRadiation: number;
  };
  daily: Array<{
    date: string;
    temperature: {
      min: number;
      max: number;
    };
    solarRadiation: number;
    precipitation: number;
    humidity: number;
  }>;
}

interface WeatherError extends Error {
  provider?: string;
  statusCode?: number;
  retryAfter?: number;
}

export class WeatherService {
  private static instance: WeatherService;
  private providers: WeatherProvider[];
  private cache: CacheService;
  private validator: WeatherValidator;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {
    this.providers = [
      new OpenWeatherProvider(),
      new NRELProvider(),
      new NASAPOWERProvider(),
    ];
    this.cache = CacheService.getInstance();
    this.validator = WeatherValidator.getInstance();
  }

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async getCurrentWeather(
    latitude: number,
    longitude: number,
    retryCount: number = 0
  ): Promise<WeatherData> {
    // Validate coordinates
    if (!this.validator.validateCoordinates(latitude, longitude)) {
      throw new Error('Invalid coordinates');
    }

    // Check cache first
    const cacheKey = this.cache.generateCacheKey('weather', latitude, longitude);
    const cachedData = await this.cache.get<WeatherData>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let lastError: WeatherError | null = null;
    let lastValidData: WeatherData | null = null;
    
    // Try each provider
    for (const provider of this.providers) {
      try {
        const data = await provider.getCurrentWeather(latitude, longitude);
        
        // Validate data
        if (this.validator.validateWeatherData(data)) {
          lastValidData = data;
          
          // Cache valid data
          await this.cache.set(cacheKey, data);
          
          return data;
        }
      } catch (error) {
        const err = error as WeatherError;
        err.provider = provider.constructor.name;
        console.error(`Error with ${provider.constructor.name}:`, error);
        lastError = err;
      }
    }

    // If we have valid data from a previous provider, return it
    if (lastValidData) {
      return lastValidData;
    }

    // If we have an error and haven't exceeded retries
    if (lastError && retryCount < this.MAX_RETRIES) {
      if (lastError.retryAfter) {
        await new Promise(resolve => setTimeout(resolve, lastError.retryAfter));
      } else {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
      return this.getCurrentWeather(latitude, longitude, retryCount + 1);
    }

    // If we've exhausted all providers and retries
    if (lastError) {
      throw lastError;
    }
    throw new Error('Failed to fetch weather data from all providers');
  }

  async getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    retryCount: number = 0
  ): Promise<WeatherData[]> {
    // Validate coordinates and date range
    if (!this.validator.validateCoordinates(latitude, longitude)) {
      throw new Error('Invalid coordinates');
    }
    if (!this.validator.validateDateRange(startDate, endDate)) {
      throw new Error('Invalid date range');
    }

    // Check cache first
    const cacheKey = this.cache.generateCacheKey('historical', latitude, longitude, startDate);
    const cachedData = await this.cache.get<WeatherData[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const results: WeatherData[] = [];
    let lastError: WeatherError | null = null;
    let lastValidData: WeatherData[] | null = null;
    
    // Try each provider
    for (const provider of this.providers) {
      try {
        const data = await provider.getHistoricalWeather(latitude, longitude, startDate, endDate);
        
        // Validate data
        if (data && data.length > 0 && data.every(this.validator.validateWeatherData)) {
          lastValidData = data;
          
          // Cache valid data
          await this.cache.set(cacheKey, data);
          
          return data;
        }
      } catch (error) {
        const err = error as WeatherError;
        err.provider = provider.constructor.name;
        console.error(`Error with ${provider.constructor.name}:`, error);
        lastError = err;
      }
    }

    // If we have valid data from a previous provider, return it
    if (lastValidData) {
      return lastValidData;
    }

    // If we have an error and haven't exceeded retries
    if (lastError && retryCount < this.MAX_RETRIES) {
      if (lastError.retryAfter) {
        await new Promise(resolve => setTimeout(resolve, lastError.retryAfter));
      } else {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
      return this.getHistoricalWeather(latitude, longitude, startDate, endDate, retryCount + 1);
    }

    // If we've exhausted all providers and retries
    if (lastError) {
      throw lastError;
    }
    throw new Error('Failed to fetch historical weather data from all providers');
  }

  private mergeWeatherData(data: WeatherData[]): WeatherData[] {
    // Group data by date
    const groupedData = data.reduce((acc: { [key: string]: WeatherData }, item) => {
      item.daily.forEach(day => {
        const date = day.date;
        if (!acc[date]) {
          acc[date] = {
            latitude: item.latitude,
            longitude: item.longitude,
            timezone: item.timezone,
            current: item.current,
            daily: [],
          };
        }
        acc[date].daily.push(day);
      });
      return acc;
    }, {});

    // Calculate averages for each date
    return Object.values(groupedData).map(item => ({
      ...item,
      daily: item.daily.map(day => ({
        ...day,
        temperature: {
          min: day.temperature.min,
          max: day.temperature.max,
        },
        solarRadiation: day.solarRadiation,
        precipitation: day.precipitation,
        humidity: day.humidity,
      })),
    }));
  }

  // Additional utility methods
  async clearCache(): Promise<void> {
    await this.cache.clearCache();
  }

  async deleteCacheEntry(latitude: number, longitude: number, type: 'weather' | 'historical', date?: string): Promise<void> {
    const cacheKey = this.cache.generateCacheKey(type, latitude, longitude, date);
    await this.cache.delete(cacheKey);
  }
}
