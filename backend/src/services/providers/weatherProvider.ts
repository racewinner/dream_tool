import axios from 'axios';
import { config } from '../../config';

export interface WeatherData {
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

export interface WeatherProvider {
  getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData>;
  getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<WeatherData[]>;
}

export class OpenWeatherProvider implements WeatherProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.weatherApiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${this.baseUrl}/onecall`, {
        params: {
          lat: latitude,
          lon: longitude,
          exclude: 'minutely,hourly,alerts',
          units: 'metric',
          appid: this.apiKey,
        },
      });

      return this.transformWeatherData(response.data);
    } catch (error) {
      console.error('OpenWeather error:', error);
      throw new Error('Failed to fetch OpenWeather data');
    }
  }

  async getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<WeatherData[]> {
    try {
      const dateRange = this.generateDateRange(startDate, endDate);
      const weatherData = await Promise.all(
        dateRange.map(async (date) => {
          const response = await axios.get(`${this.baseUrl}/onecall/timemachine`, {
            params: {
              lat: latitude,
              lon: longitude,
              dt: Math.floor(new Date(date).getTime() / 1000),
              units: 'metric',
              appid: this.apiKey,
            },
          });
          return this.transformWeatherData(response.data);
        })
      );
      return weatherData;
    } catch (error) {
      console.error('OpenWeather historical error:', error);
      throw new Error('Failed to fetch OpenWeather historical data');
    }
  }

  private transformWeatherData(data: any): WeatherData {
    return {
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      current: {
        temperature: data.current.temp,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_speed,
        solarRadiation: data.current.solarRadiation || 0,
      },
      daily: data.daily.map((day: any) => ({
        date: new Date(day.dt * 1000).toISOString().split('T')[0],
        temperature: {
          min: day.temp.min,
          max: day.temp.max,
        },
        solarRadiation: day.solarRadiation || 0,
        precipitation: day.pop * 100,
        humidity: day.humidity,
      })),
    };
  }

  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    while (start <= end) {
      dates.push(start.toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }

    return dates;
  }
}

export class NRELProvider implements WeatherProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://developer.nrel.gov/api/solar/solar_resource/v1.json';
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: config.nrelApiKey,
          lat: latitude,
          lon: longitude,
          attribute: 'ghi,air_temperature,wind_speed',
          timeframe: 'hourly',
          leap_year: 'false',
        },
      });

      const data = response.data;
      return {
        latitude,
        longitude,
        timezone: data.timezone,
        current: {
          temperature: data.station.air_temperature,
          humidity: data.station.relative_humidity,
          windSpeed: data.station.wind_speed,
          solarRadiation: data.station.ghi,
        },
        daily: [], // NREL doesn't provide daily data in this format
      };
    } catch (error) {
      console.error('NREL error:', error);
      throw new Error('Failed to fetch NREL data');
    }
  }

  async getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<WeatherData[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: config.nrelApiKey,
          lat: latitude,
          lon: longitude,
          start_year: new Date(startDate).getFullYear(),
          end_year: new Date(endDate).getFullYear(),
          attribute: 'ghi,air_temperature,wind_speed',
          timeframe: 'monthly',
        },
      });

      const data = response.data;
      const monthlyData = data.monthly.map((month: any) => ({
        date: month.month,
        temperature: {
          min: month.air_temperature_min,
          max: month.air_temperature_max,
        },
        solarRadiation: month.ghi,
        precipitation: month.precipitation,
        humidity: month.relative_humidity,
      }));

      return [{
        latitude,
        longitude,
        timezone: data.timezone,
        current: {
          temperature: data.station.air_temperature,
          humidity: data.station.relative_humidity,
          windSpeed: data.station.wind_speed,
          solarRadiation: data.station.ghi,
        },
        daily: monthlyData,
      }];
    } catch (error) {
      console.error('NREL historical error:', error);
      throw new Error('Failed to fetch NREL historical data');
    }
  }
}

export class NASAPOWERProvider implements WeatherProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://power.larc.nasa.gov/api/temporal';
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${this.baseUrl}/daily`, {
        params: {
          parameters: 'ALLSKY_SFC_SW_DWN,WS50M,T2M,RH2M',
          community: 'RE',
          format: 'JSON',
          lat: latitude,
          lon: longitude,
        },
      });

      const data = response.data;
      const latestDay = data.properties.parameter.ALLSKY_SFC_SW_DWN[data.properties.parameter.ALLSKY_SFC_SW_DWN.length - 1];

      return {
        latitude,
        longitude,
        timezone: 'UTC',
        current: {
          temperature: data.properties.parameter.T2M[data.properties.parameter.T2M.length - 1],
          humidity: data.properties.parameter.RH2M[data.properties.parameter.RH2M.length - 1],
          windSpeed: data.properties.parameter.WS50M[data.properties.parameter.WS50M.length - 1],
          solarRadiation: latestDay,
        },
        daily: [],
      };
    } catch (error) {
      console.error('NASA POWER error:', error);
      throw new Error('Failed to fetch NASA POWER data');
    }
  }

  async getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<WeatherData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/daily`, {
        params: {
          parameters: 'ALLSKY_SFC_SW_DWN,WS50M,T2M,RH2M',
          community: 'RE',
          format: 'JSON',
          lat: latitude,
          lon: longitude,
          start: startDate,
          end: endDate,
        },
      });

      const data = response.data;
      const dailyData = Object.entries(data.properties.parameter.ALLSKY_SFC_SW_DWN).map(([date, radiation]) => ({
        date,
        temperature: {
          min: data.properties.parameter.T2M[date],
          max: data.properties.parameter.T2M[date],
        },
        solarRadiation: radiation,
        precipitation: 0,
        humidity: data.properties.parameter.RH2M[date],
      }));

      return [{
        latitude,
        longitude,
        timezone: 'UTC',
        current: {
          temperature: data.properties.parameter.T2M[data.properties.parameter.T2M.length - 1],
          humidity: data.properties.parameter.RH2M[data.properties.parameter.RH2M.length - 1],
          windSpeed: data.properties.parameter.WS50M[data.properties.parameter.WS50M.length - 1],
          solarRadiation: data.properties.parameter.ALLSKY_SFC_SW_DWN[data.properties.parameter.ALLSKY_SFC_SW_DWN.length - 1],
        },
        daily: dailyData,
      }];
    } catch (error) {
      console.error('NASA POWER historical error:', error);
      throw new Error('Failed to fetch NASA POWER historical data');
    }
  }
}
