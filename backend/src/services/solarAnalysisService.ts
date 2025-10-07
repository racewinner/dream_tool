import { WeatherService } from './weatherService';
import { Weather } from '../models/weather';

interface SolarAnalysisResult {
  dailyEnergyProduction: number;
  monthlyEnergyProduction: number[];
  yearlyEnergyProduction: number;
  optimalTiltAngle: number;
  optimalOrientation: string;
  temperatureImpact: number;
  shadingImpact: number;
  systemEfficiency: number;
}

export class SolarAnalysisService {
  private static instance: SolarAnalysisService;
  private weatherService: WeatherService;

  private constructor() {
    this.weatherService = WeatherService.getInstance();
  }

  public static getInstance(): SolarAnalysisService {
    if (!SolarAnalysisService.instance) {
      SolarAnalysisService.instance = new SolarAnalysisService();
    }
    return SolarAnalysisService.instance;
  }

  async analyzeSolarPotential(
    facilityId: number,
    latitude: number,
    longitude: number,
    panelRating: number,
    numPanels: number,
    systemLosses: number = 15
  ): Promise<SolarAnalysisResult> {
    try {
      // Get historical weather data for the last year
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);

      const weatherData = await this.weatherService.getHistoricalWeather(
        latitude,
        longitude,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Calculate daily energy production
      const dailyProduction = weatherData.map((day) => {
        const { temperature, solarRadiation, humidity } = day.current;
        return this.calculateDailyProduction(
          solarRadiation,
          temperature,
          panelRating,
          numPanels,
          systemLosses
        );
      });

      // Calculate monthly averages
      const monthlyProduction = Array(12).fill(0);
      weatherData.forEach((day, index) => {
        const month = new Date(day.date).getMonth();
        monthlyProduction[month] += dailyProduction[index];
      });

      // Calculate yearly production
      const yearlyProduction = dailyProduction.reduce((sum, value) => sum + value, 0);

      // Calculate optimal tilt angle based on latitude
      const optimalTiltAngle = this.calculateOptimalTiltAngle(latitude);

      // Calculate optimal orientation
      const optimalOrientation = this.calculateOptimalOrientation(latitude);

      // Calculate temperature impact
      const averageTemperature = weatherData.reduce(
        (sum, day) => sum + day.current.temperature,
        0
      ) / weatherData.length;
      const temperatureImpact = this.calculateTemperatureImpact(averageTemperature);

      // Calculate shading impact
      const shadingImpact = this.calculateShadingImpact(
        latitude,
        longitude,
        optimalTiltAngle
      );

      // Calculate system efficiency
      const systemEfficiency = this.calculateSystemEfficiency(
        dailyProduction,
        panelRating,
        numPanels
      );

      return {
        dailyEnergyProduction: dailyProduction.reduce(
          (sum, value) => sum + value,
          0
        ) / dailyProduction.length,
        monthlyEnergyProduction: monthlyProduction,
        yearlyEnergyProduction: yearlyProduction,
        optimalTiltAngle,
        optimalOrientation,
        temperatureImpact,
        shadingImpact,
        systemEfficiency,
      };
    } catch (error) {
      console.error('Error analyzing solar potential:', error);
      throw new Error('Failed to analyze solar potential');
    }
  }

  private calculateDailyProduction(
    solarRadiation: number,
    temperature: number,
    panelRating: number,
    numPanels: number,
    systemLosses: number
  ): number {
    // Calculate temperature coefficient impact
    const tempCoefficient = -0.45; // % per degree Celsius
    const tempImpact = 1 + (temperature - 25) * (tempCoefficient / 100);

    // Calculate system losses
    const systemEfficiency = 1 - (systemLosses / 100);

    // Calculate daily production
    return (
      (solarRadiation * 0.001) * // Convert to kWh/m²
      panelRating * // Panel rating in W
      numPanels * // Number of panels
      tempImpact * // Temperature impact
      systemEfficiency // System losses
    );
  }

  private calculateOptimalTiltAngle(latitude: number): number {
    // Optimal tilt angle is approximately equal to latitude
    // Adjust slightly for better performance
    return latitude + 5;
  }

  private calculateOptimalOrientation(latitude: number): string {
    return latitude > 0 ? 'South' : 'North';
  }

  private calculateTemperatureImpact(averageTemperature: number): number {
    // Calculate temperature impact on PV efficiency
    const baseTemp = 25; // Standard test conditions
    const tempCoefficient = -0.45; // % per degree Celsius
    return tempCoefficient * (averageTemperature - baseTemp);
  }

  private calculateShadingImpact(
    latitude: number,
    longitude: number,
    tiltAngle: number
  ): number {
    // Simplified shading calculation based on location and tilt
    // This is a placeholder - actual implementation would require more detailed analysis
    const shadingFactor = 0.9; // 10% reduction due to potential shading
    return shadingFactor;
  }

  private calculateSystemEfficiency(
    dailyProduction: number[],
    panelRating: number,
    numPanels: number
  ): number {
    // Calculate system efficiency based on actual vs theoretical production
    const theoreticalProduction = dailyProduction.length *
      panelRating *
      numPanels *
      0.001; // Convert to kWh
    const actualProduction = dailyProduction.reduce(
      (sum, value) => sum + value,
      0
    );
    return (actualProduction / theoreticalProduction) * 100;
  }
}
