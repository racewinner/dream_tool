import axios from 'axios';

// Add type declaration for import.meta.env (Vite environment variables)
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

// Define base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const METRICS_API_URL = API_BASE_URL;

// Helper to get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Define metrics data types
export interface DataMetrics {
  surveysImported: number;
  dataCompleteness: string;
  lastImport: string | Date;
}

export interface DesignMetrics {
  designsCreated: number;
  designOptimizations: number;
  averageEfficiency: string;
}

export interface PVSiteMetrics {
  totalSites: number;
  activeSites: number;
  avgGeneration: string;
}

export interface MaintenanceMetrics {
  openTickets: number;
  scheduledVisits: number;
  systemHealth: string;
}

export interface MetricsSummary {
  totalSites: number;
  activeSites: number;
  totalCapacity: number;
  averageEfficiency: number;
  maintenanceIssues: number;
  recentSurveys: number;
}

export interface SolarMetrics {
  dailyGeneration: { date: string; value: number }[];
  monthlyGeneration: { month: string; value: number }[];
  efficiencyTrend: { date: string; value: number }[];
}

export interface ReportMetrics {
  generatedThisMonth: number;
  availableTemplates: number;
  lastGenerated: string;
}

export interface SettingsMetrics {
  userAccounts: number;
  activeIntegrations: number;
  lastConfiguration: string | Date;
}

export interface DashboardMetrics {
  dataMetrics: DataMetrics;
  designMetrics: DesignMetrics;
  pvSiteMetrics: PVSiteMetrics;
  maintenanceMetrics: MaintenanceMetrics;
  reportMetrics: ReportMetrics;
  settings: SettingsMetrics;
}

/**
 * Service for fetching metrics data from the API
 */
const metricsService = {
  /**
   * Fetch all dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await axios.get(`${METRICS_API_URL}/metrics/dashboard`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  /**
   * Fetch metrics for the data section
   */
  async getDataMetrics(): Promise<DataMetrics> {
    try {
      const response = await axios.get(`${METRICS_API_URL}/metrics/data`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching data metrics:', error);
      throw error;
    }
  },

  /**
   * Fetch metrics for the design section
   */
  async getDesignMetrics(): Promise<DesignMetrics> {
    try {
      const response = await axios.get(`${METRICS_API_URL}/metrics/design`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching design metrics:', error);
      throw error;
    }
  },

  /**
   * Fetch metrics for the PV sites section
   */
  async getPVSiteMetrics(): Promise<PVSiteMetrics> {
    try {
      const response = await axios.get(`${METRICS_API_URL}/metrics/pv-sites`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching PV site metrics:', error);
      throw error;
    }
  },

  /**
   * Fetch metrics for the maintenance section
   */
  async getMaintenanceMetrics(): Promise<MaintenanceMetrics> {
    try {
      const response = await axios.get(`${METRICS_API_URL}/metrics/maintenance`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance metrics:', error);
      throw error;
    }
  },

  /**
   * Fetch metrics for the reports section
   */
  async getReportMetrics(): Promise<ReportMetrics> {
    try {
      const response = await axios.get(`${METRICS_API_URL}/metrics/reports`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching report metrics:', error);
      throw error;
    }
  },

  /**
   * Fetch summary metrics for dashboard overview
   */
  async getMetricsSummary(): Promise<MetricsSummary> {
    try {
      const response = await axios.get(`${METRICS_API_URL}/metrics/summary`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics summary:', error);
      throw error;
    }
  },

  /**
   * Fetch detailed solar metrics for charts and analytics
   */
  async getSolarMetrics(): Promise<SolarMetrics> {
    try {
      const response = await axios.get(`${METRICS_API_URL}/metrics/solar`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching solar metrics:', error);
      
      // Generate mock data if API request fails
      // Generate mock data for the last 7 days
      const dailyGeneration = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 100) + 50
        };
      });
      
      // Generate mock data for the last 6 months
      const monthlyGeneration = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const month = date.toLocaleString('default', { month: 'short' });
        return {
          month,
          value: Math.floor(Math.random() * 2000) + 1000
        };
      });
      
      // Generate mock efficiency trend data
      const efficiencyTrend = Array.from({ length: 10 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (9 - i));
        return {
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 10) + 85
        };
      });
      
      return {
        dailyGeneration,
        monthlyGeneration,
        efficiencyTrend
      };
    }
  }
};

export default metricsService;
