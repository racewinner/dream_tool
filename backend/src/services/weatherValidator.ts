import { config } from '../config';

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

export class WeatherValidator {
  private static instance: WeatherValidator;
  private readonly MAX_TEMPERATURE = 50;
  private readonly MIN_TEMPERATURE = -50;
  private readonly MAX_WIND_SPEED = 150;
  private readonly MAX_SOLAR_RADIATION = 1200;
  private readonly MAX_HUMIDITY = 100;
  private readonly MAX_PRECIPITATION = 100;

  private constructor() {}

  public static getInstance(): WeatherValidator {
    if (!WeatherValidator.instance) {
      WeatherValidator.instance = new WeatherValidator();
    }
    return WeatherValidator.instance;
  }

  validateWeatherData(data: WeatherData): boolean {
    if (!data) return false;

    // Validate current weather
    const isValidCurrent = this.validateCurrentWeather(data.current);
    if (!isValidCurrent) return false;

    // Validate daily data
    if (data.daily) {
      const isValidDaily = data.daily.every(day => this.validateDailyWeather(day));
      if (!isValidDaily) return false;
    }

    return true;
  }

  private validateCurrentWeather(current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    solarRadiation: number;
  }): boolean {
    if (!current) return false;

    // Temperature
    if (typeof current.temperature !== 'number' ||
        current.temperature < this.MIN_TEMPERATURE ||
        current.temperature > this.MAX_TEMPERATURE) {
      return false;
    }

    // Humidity
    if (typeof current.humidity !== 'number' ||
        current.humidity < 0 ||
        current.humidity > this.MAX_HUMIDITY) {
      return false;
    }

    // Wind Speed
    if (typeof current.windSpeed !== 'number' ||
        current.windSpeed < 0 ||
        current.windSpeed > this.MAX_WIND_SPEED) {
      return false;
    }

    // Solar Radiation
    if (typeof current.solarRadiation !== 'number' ||
        current.solarRadiation < 0 ||
        current.solarRadiation > this.MAX_SOLAR_RADIATION) {
      return false;
    }

    return true;
  }

  private validateDailyWeather(day: {
    date: string;
    temperature: {
      min: number;
      max: number;
    };
    solarRadiation: number;
    precipitation: number;
    humidity: number;
  }): boolean {
    if (!day) return false;

    // Temperature
    if (typeof day.temperature?.min !== 'number' ||
        typeof day.temperature?.max !== 'number' ||
        day.temperature.min > day.temperature.max ||
        day.temperature.min < this.MIN_TEMPERATURE ||
        day.temperature.max > this.MAX_TEMPERATURE) {
      return false;
    }

    // Solar Radiation
    if (typeof day.solarRadiation !== 'number' ||
        day.solarRadiation < 0 ||
        day.solarRadiation > this.MAX_SOLAR_RADIATION) {
      return false;
    }

    // Precipitation
    if (typeof day.precipitation !== 'number' ||
        day.precipitation < 0 ||
        day.precipitation > this.MAX_PRECIPITATION) {
      return false;
    }

    // Humidity
    if (typeof day.humidity !== 'number' ||
        day.humidity < 0 ||
        day.humidity > this.MAX_HUMIDITY) {
      return false;
    }

    return true;
  }

  validateCoordinates(latitude: number, longitude: number): boolean {
    if (typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
      return false;
    }
    return true;
  }

  validateDateRange(startDate: string, endDate: string): boolean {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      const MAX_RANGE_MILLISECONDS = 365 * 24 * 60 * 60 * 1000; // Max 1 year range

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
      if (end < start) return false;
      if (end > now) return false;
      if ((end.getTime() - start.getTime()) > MAX_RANGE_MILLISECONDS) return false;

      return true;
    } catch {
      return false;
    }
  }
}
