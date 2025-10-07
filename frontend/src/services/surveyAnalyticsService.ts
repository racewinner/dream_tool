import axios from 'axios';

// Define base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const ANALYTICS_API_URL = `${API_BASE_URL}/api/surveys-analytics`;

// Helper to get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Enhanced analytics types
export interface GeographicalSite {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  facilityType: string;
  powerSource: string;
  completeness: number;
  lastSurveyDate: string;
}

export interface GeographicalAnalytics {
  sites: GeographicalSite[];
  summary: {
    totalSitesWithGPS: number;
    regions: number;
    districts: number;
    averageCompleteness: number;
  };
}

export interface RegionalBreakdown {
  region: string;
  district: string;
  facilityCounts: {
    total: number;
    byType: { [key: string]: number };
    byPowerSource: { [key: string]: number };
  };
  dataQuality: {
    averageCompleteness: number;
    surveysComplete: number;
    totalSurveys: number;
  };
}

export interface RegionalAnalytics {
  breakdown: RegionalBreakdown[];
  summary: {
    totalRegions: number;
    totalDistricts: number;
    totalFacilities: number;
    overallCompleteness: number;
  };
}

export interface EquipmentAnalytics {
  category: string;
  totalCount: number;
  facilitiesWithEquipment: number;
  averagePerFacility: number;
  byFacilityType: { [key: string]: number };
}

export interface EquipmentAnalyticsResponse {
  equipment: EquipmentAnalytics[];
  summary: {
    totalEquipmentTypes: number;
    totalEquipmentCount: number;
    facilitiesWithEquipment: number;
    mostCommonEquipment: string;
  };
}

// Enhanced Survey Analytics Service
export class SurveyAnalyticsService {
  // Get geographical analytics for mapping
  static async getGeographicalAnalytics(): Promise<GeographicalAnalytics> {
    try {
      const response = await axios.get(`${ANALYTICS_API_URL}/geographical`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch geographical analytics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching geographical analytics:', error);
      throw error;
    }
  }

  // Get regional breakdown analytics
  static async getRegionalAnalytics(): Promise<RegionalAnalytics> {
    try {
      const response = await axios.get(`${ANALYTICS_API_URL}/regional-breakdown`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch regional analytics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching regional analytics:', error);
      throw error;
    }
  }

  // Get equipment analytics
  static async getEquipmentAnalytics(): Promise<EquipmentAnalyticsResponse> {
    try {
      const response = await axios.get(`${ANALYTICS_API_URL}/equipment`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch equipment analytics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching equipment analytics:', error);
      throw error;
    }
  }
}
