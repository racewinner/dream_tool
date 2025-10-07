import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Solar System API client
const solarApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for solar system management
export interface SolarSystemData {
  id?: number;
  name: string;
  facilityId: number;
  capacity: number; // kW
  type: 'grid-tied' | 'off-grid' | 'hybrid';
  status: 'active' | 'inactive' | 'maintenance' | 'planned';
  installationDate?: string;
  efficiency?: number; // Performance efficiency percentage
  location: {
    latitude: number;
    longitude: number;
  };
  components: {
    panels: number;
    inverters: number;
    batteries?: number;
  };
  performance?: {
    currentOutput: number;
    dailyGeneration: number;
    monthlyGeneration: number;
    efficiency: number;
  };
  maintenance?: {
    lastMaintenance?: string;
    nextMaintenance?: string;
    issues?: string[];
  };
}

export interface SolarSystemResponse {
  success: boolean;
  data: SolarSystemData[];
  total?: number;
  message?: string;
}

export interface SolarSystemCreateRequest {
  name: string;
  facilityId: number;
  capacity: number;
  type: 'grid-tied' | 'off-grid' | 'hybrid';
  installationDate?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  components: {
    panels: number;
    inverters: number;
    batteries?: number;
  };
}

export interface SolarSystemUpdateRequest extends Partial<SolarSystemCreateRequest> {
  id: number;
  status?: 'active' | 'inactive' | 'maintenance' | 'planned';
}

export interface SolarSystemPerformanceData {
  systemId: number;
  timestamp: string;
  output: number; // kW
  generation: number; // kWh
  efficiency: number; // %
  weather?: {
    temperature: number;
    irradiance: number;
    cloudCover: number;
  };
}

// Solar System Service
export class SolarSystemService {
  /**
   * Get all solar systems with optional filtering
   */
  static async getSolarSystems(
    token: string,
    filters?: {
      facilityId?: number;
      status?: string;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<SolarSystemResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.facilityId) params.append('facilityId', filters.facilityId.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await solarApi.get(`/api/solar-systems?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch solar systems');
    }
  }

  /**
   * Get a specific solar system by ID
   */
  static async getSolarSystem(token: string, systemId: number): Promise<{ success: boolean; data: SolarSystemData }> {
    try {
      const response = await solarApi.get(`/api/solar-systems/${systemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch solar system');
    }
  }

  /**
   * Create a new solar system
   */
  static async createSolarSystem(
    token: string, 
    systemData: SolarSystemCreateRequest
  ): Promise<{ success: boolean; data: SolarSystemData }> {
    try {
      const response = await solarApi.post('/api/solar-systems', systemData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create solar system');
    }
  }

  /**
   * Update an existing solar system
   */
  static async updateSolarSystem(
    token: string, 
    systemData: SolarSystemUpdateRequest
  ): Promise<{ success: boolean; data: SolarSystemData }> {
    try {
      const response = await solarApi.put(`/api/solar-systems/${systemData.id}`, systemData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update solar system');
    }
  }

  /**
   * Delete a solar system
   */
  static async deleteSolarSystem(token: string, systemId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await solarApi.delete(`/api/solar-systems/${systemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete solar system');
    }
  }

  /**
   * Get solar system performance data
   */
  static async getSystemPerformance(
    token: string, 
    systemId: number, 
    timeRange?: {
      startDate: string;
      endDate: string;
    }
  ): Promise<{ success: boolean; data: SolarSystemPerformanceData[] }> {
    try {
      const params = new URLSearchParams();
      if (timeRange?.startDate) params.append('startDate', timeRange.startDate);
      if (timeRange?.endDate) params.append('endDate', timeRange.endDate);

      const response = await solarApi.get(`/api/solar-systems/${systemId}/performance?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch system performance');
    }
  }

  /**
   * Record new performance data
   */
  static async recordPerformance(
    token: string, 
    performanceData: SolarSystemPerformanceData
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await solarApi.post(
        `/api/solar-systems/${performanceData.systemId}/performance`, 
        performanceData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to record performance data');
    }
  }

  /**
   * Get solar system analytics and insights
   */
  static async getSystemAnalytics(
    token: string, 
    systemId: number
  ): Promise<{ 
    success: boolean; 
    data: {
      totalGeneration: number;
      averageEfficiency: number;
      uptime: number;
      carbonOffset: number;
      financialSavings: number;
      trends: {
        daily: number[];
        monthly: number[];
      };
    }
  }> {
    try {
      const response = await solarApi.get(`/api/solar-systems/${systemId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch system analytics');
    }
  }

  /**
   * Schedule maintenance for a solar system
   */
  static async scheduleMaintenance(
    token: string, 
    systemId: number, 
    maintenanceData: {
      scheduledDate: string;
      type: 'routine' | 'repair' | 'upgrade';
      description: string;
      technician?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await solarApi.post(
        `/api/solar-systems/${systemId}/maintenance`, 
        maintenanceData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to schedule maintenance');
    }
  }
}

export default SolarSystemService;
