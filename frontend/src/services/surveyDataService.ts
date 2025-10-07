import axios from 'axios';

// Define base API URL using centralized config
import { API_BASE_URL } from '../config';

// Python API URL for enhanced survey analytics
const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
const SURVEYS_API_URL = `${API_BASE_URL}/surveys`;
const PYTHON_SURVEYS_API_URL = `${PYTHON_API_URL}/api/python/survey-analysis`;

// Helper to get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Survey data types
export interface Survey {
  id: number;
  externalId: string;
  facilityName: string;
  region: string;
  district: string;
  facilityType: string;
  completionDate: string;
  completeness: number;
  questionsAnswered: number;
  repeatGroups: {
    departments: any[];
    equipment: any[];
  };
}

export interface SurveyDetail {
  survey: Survey;
  rawData: any;
  facilityData: any;
}

export interface SurveyListResponse {
  surveys: Survey[];
  summary: {
    totalSurveys: number;
    completedSurveys: number;
    averageCompleteness: number;
    totalResponses: number;
    lastUpdated: string;
  };
}

// Survey Data Service
export class SurveyDataService {
  // Get all surveys with authentication
  static async getSurveys(): Promise<SurveyListResponse> {
    try {
      const response = await axios.get(SURVEYS_API_URL, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching surveys:', error);
      throw error;
    }
  }

  // Get individual survey detail with authentication
  static async getSurveyDetail(surveyId: number): Promise<SurveyDetail> {
    try {
      const response = await axios.get(`${SURVEYS_API_URL}/${surveyId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching survey detail for ID ${surveyId}:`, error);
      throw error;
    }
  }

  // Get detailed survey data with analytics
  static async getDetailedSurveyData(surveyId: number): Promise<any> {
    try {
      const response = await axios.get(`${SURVEYS_API_URL}/detailed/${surveyId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching detailed survey data for ID ${surveyId}:`, error);
      throw error;
    }
  }

  // Get repeat group analytics with authentication
  static async getRepeatGroupAnalytics(): Promise<any> {
    try {
      const response = await axios.get(`${SURVEYS_API_URL}/analytics/repeat-groups`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching repeat group analytics:', error);
      throw error;
    }
  }
}
