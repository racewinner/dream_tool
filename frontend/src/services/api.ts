import axios from 'axios';
import { SolarSystemRequest, SolarSystemResponse, MaintenanceRecordRequest, MaintenanceRecord, SystemStatus, MaintenanceAnalyticsResponse } from '../types/solarSystem';

// Base API configuration with consistent headers
const createApiClient = (token?: string | null) => {
  return axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

// Setup a logout callback for 401 errors
let logoutCallback: (() => void) | null = null;
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

export const useApi = (token: string | null) => {
  const api = createApiClient(token);

  // Add request interceptor that uses the current token
  api.interceptors.request.use(
    (config) => {
      // Use the most recent token passed to useApi
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && logoutCallback) {
        // Use the registered logout callback instead of direct hook access
        logoutCallback();
      }
      return Promise.reject(error);
    }
  );

  // Solar System Endpoints
  const createSystem = async (data: SolarSystemRequest): Promise<SolarSystemResponse> => {
    const response = await api.post('/solar-system', data);
    return response.data;
  };

  const getSystems = async (facilityId?: number): Promise<SolarSystemResponse[]> => {
    const params = facilityId ? { facilityId } : {};
    const response = await api.get('/solar-system', { params });
    return response.data;
  };

  const getSystem = async (systemId: number): Promise<SolarSystemResponse> => {
    const response = await api.get(`/solar-system/${systemId}`);
    return response.data;
  };

  const updateSystem = async (systemId: number, data: Partial<SolarSystemRequest>): Promise<SolarSystemResponse> => {
    const response = await api.put(`/solar-system/${systemId}`, data);
    return response.data;
  };

  const deleteSystem = async (systemId: number): Promise<void> => {
    await api.delete(`/solar-system/${systemId}`);
  };
  
  const getSystemPerformance = async (systemId: number): Promise<SystemStatus> => {
    const response = await api.get(`/solar-system/${systemId}/performance`);
    return response.data;
  };
  
  const getSystemMaintenanceSchedule = async (systemId: number): Promise<SystemStatus> => {
    const response = await api.get(`/solar-system/${systemId}/maintenance/schedule`);
    return response.data;
  };

  // Maintenance Record Endpoints
  const createMaintenanceRecord = async (systemId: number, data: MaintenanceRecordRequest): Promise<MaintenanceRecord> => {
    const response = await api.post(`/solar-system/${systemId}/maintenance`, data);
    return response.data;
  };

  const getMaintenanceHistory = async (systemId: number): Promise<MaintenanceRecord[]> => {
    const response = await api.get(`/solar-system/${systemId}/maintenance`);
    return response.data;
  };

  const getMaintenanceAnalytics = async (systemId: number): Promise<MaintenanceAnalyticsResponse> => {
    const response = await api.get(`/solar-system/${systemId}/maintenance/analytics`);
    return response.data;
  };

  const updateMaintenanceRecord = async (systemId: number, recordId: number, data: Partial<MaintenanceRecordRequest>): Promise<MaintenanceRecord> => {
    const response = await api.put(`/solar-system/${systemId}/maintenance/${recordId}`, data);
    return response.data;
  };

  const deleteMaintenanceRecord = async (systemId: number, recordId: number): Promise<void> => {
    await api.delete(`/solar-system/${systemId}/maintenance/${recordId}`);
  };

  const optimizeMaintenanceSchedule = async (): Promise<void> => {
    await api.post('/maintenance/schedule/optimize');
  };

  const generateMaintenanceReport = async (): Promise<void> => {
    // TO DO: implement generateMaintenanceReport
  };

  const getMaintenanceAlerts = async (): Promise<void> => {
    // TO DO: implement getMaintenanceAlerts
  };

  const acknowledgeMaintenanceAlert = async (): Promise<void> => {
    // TO DO: implement acknowledgeMaintenanceAlert
  };

  return {
    // Solar System
    createSystem,
    getSystems,
    getSystem,
    updateSystem,
    deleteSystem,
    getSystemPerformance,
    getSystemMaintenanceSchedule,
    
    // Maintenance Records
    createMaintenanceRecord,
    getMaintenanceHistory,
    getMaintenanceAnalytics,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    
    // Other
    optimizeMaintenanceSchedule,
    generateMaintenanceReport,
    getMaintenanceAlerts,
    acknowledgeMaintenanceAlert
  };
};
