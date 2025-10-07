import { ApiResponse } from '../types/api';
import { SolarSystemData } from './solarSystemService';

export interface MaintenanceSchedule {
  id: string;
  siteId: number;
  siteName: string;
  scheduledDate: string;
  maintenanceType: 'routine' | 'preventive' | 'corrective' | 'inspection' | 'cleaning';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedDuration: number; // in hours
  assignedTechnician?: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';
  createdDate: string;
  requiredParts?: string[];
  estimatedCost?: number;
  weatherDependent: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'bi-annual' | 'annual';
  nextScheduledDate?: string;
}

export interface SchedulingRecommendation {
  siteId: number;
  siteName: string;
  recommendationType: 'overdue' | 'predictive' | 'performance_based' | 'seasonal';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  suggestedDate: string;
  reason: string;
  maintenanceType: MaintenanceSchedule['maintenanceType'];
  estimatedCost: number;
  urgencyScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceCalendar {
  date: string;
  schedules: MaintenanceSchedule[];
  workload: number; // 0-100 percentage
  availableTechnicians: string[];
}

class MaintenanceSchedulingService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Get maintenance schedule for a date range
   */
  async getSchedule(token: string, dateRange: { from: string; to: string }): Promise<ApiResponse<MaintenanceSchedule[]>> {
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to
      });
      
      const response = await fetch(`${this.baseUrl}/api/maintenance/schedule?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch maintenance schedule: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Maintenance schedule retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch maintenance schedule'
      };
    }
  }

  /**
   * Create new maintenance schedule
   */
  async createSchedule(token: string, schedule: Omit<MaintenanceSchedule, 'id' | 'createdDate' | 'status'>): Promise<ApiResponse<MaintenanceSchedule>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/maintenance/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        throw new Error(`Failed to create maintenance schedule: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Maintenance schedule created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: undefined,
        message: error.message || 'Failed to create maintenance schedule'
      };
    }
  }

  /**
   * Get intelligent scheduling recommendations
   */
  async getSchedulingRecommendations(token: string, siteIds?: number[]): Promise<ApiResponse<SchedulingRecommendation[]>> {
    try {
      const params = new URLSearchParams();
      if (siteIds && siteIds.length > 0) {
        params.append('siteIds', siteIds.join(','));
      }
      
      const response = await fetch(`${this.baseUrl}/api/maintenance/recommendations?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch scheduling recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Scheduling recommendations retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch scheduling recommendations'
      };
    }
  }

  /**
   * Get maintenance calendar view
   */
  async getMaintenanceCalendar(token: string, month: string): Promise<ApiResponse<MaintenanceCalendar[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/maintenance/calendar/${month}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch maintenance calendar: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Maintenance calendar retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch maintenance calendar'
      };
    }
  }

  /**
   * Update maintenance schedule
   */
  async updateSchedule(token: string, scheduleId: string, updates: Partial<MaintenanceSchedule>): Promise<ApiResponse<MaintenanceSchedule>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/maintenance/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update maintenance schedule: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Maintenance schedule updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: undefined,
        error: 'Failed to update maintenance schedule'
      };
    }
  }

  /**
   * Generate intelligent scheduling recommendations based on site data
   */
  generateIntelligentRecommendations(sites: SolarSystemData[]): SchedulingRecommendation[] {
    const recommendations: SchedulingRecommendation[] = [];
    const now = new Date();
    
    sites.forEach(site => {
      // Performance-based recommendations
      if (site.efficiency && site.efficiency < 85) {
        recommendations.push({
          siteId: site.id!,
          siteName: site.name,
          recommendationType: 'performance_based',
          priority: site.efficiency < 75 ? 'High' : 'Medium',
          suggestedDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: `System efficiency at ${site.efficiency}% - below optimal threshold`,
          maintenanceType: 'inspection',
          estimatedCost: 150 + (site.capacity * 2),
          urgencyScore: Math.max(0, 100 - site.efficiency),
          riskLevel: site.efficiency < 75 ? 'high' : 'medium'
        });
      }

      // Capacity-based maintenance scheduling
      const capacityFactor = site.capacity / 1000; // Convert to kW factor
      if (capacityFactor > 5) {
        recommendations.push({
          siteId: site.id!,
          siteName: site.name,
          recommendationType: 'predictive',
          priority: 'Medium',
          suggestedDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: `Large capacity system (${site.capacity} kW) requires regular preventive maintenance`,
          maintenanceType: 'preventive',
          estimatedCost: 200 + (capacityFactor * 50),
          urgencyScore: Math.min(80, capacityFactor * 10),
          riskLevel: 'medium'
        });
      }

      // Status-based recommendations
      if (site.status === 'maintenance') {
        recommendations.push({
          siteId: site.id!,
          siteName: site.name,
          recommendationType: 'overdue',
          priority: 'Critical',
          suggestedDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: 'System currently in maintenance status - immediate attention required',
          maintenanceType: 'corrective',
          estimatedCost: 300 + (site.capacity * 3),
          urgencyScore: 95,
          riskLevel: 'critical'
        });
      }

      // Seasonal cleaning recommendations
      const isRainySeason = now.getMonth() >= 3 && now.getMonth() <= 5; // April-June
      if (!isRainySeason) {
        recommendations.push({
          siteId: site.id!,
          siteName: site.name,
          recommendationType: 'seasonal',
          priority: 'Low',
          suggestedDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: 'Dry season - optimal time for panel cleaning',
          maintenanceType: 'cleaning',
          estimatedCost: 50 + (site.capacity * 0.5),
          urgencyScore: 30,
          riskLevel: 'low'
        });
      }
    });

    return recommendations.sort((a, b) => b.urgencyScore - a.urgencyScore);
  }

  /**
   * Get mock schedule data for fallback
   */
  getMockSchedule(): MaintenanceSchedule[] {
    const now = new Date();
    return [
      {
        id: 'MS-001',
        siteId: 1,
        siteName: 'Nairobi Community Center',
        scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintenanceType: 'routine',
        priority: 'Medium',
        estimatedDuration: 4,
        assignedTechnician: 'John Kamau',
        description: 'Quarterly system inspection and performance check',
        status: 'scheduled',
        createdDate: now.toISOString().split('T')[0],
        requiredParts: ['Multimeter', 'Cleaning supplies'],
        estimatedCost: 200,
        weatherDependent: false,
        recurringInterval: 'quarterly'
      },
      {
        id: 'MS-002',
        siteId: 2,
        siteName: 'Kisumu School Campus',
        scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintenanceType: 'cleaning',
        priority: 'Low',
        estimatedDuration: 2,
        assignedTechnician: 'Mary Ochieng',
        description: 'Panel cleaning and debris removal',
        status: 'scheduled',
        createdDate: now.toISOString().split('T')[0],
        requiredParts: ['Cleaning equipment', 'Safety gear'],
        estimatedCost: 100,
        weatherDependent: true,
        recurringInterval: 'monthly'
      },
      {
        id: 'MS-003',
        siteId: 3,
        siteName: 'Mombasa Market Solar Kiosk',
        scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintenanceType: 'inspection',
        priority: 'High',
        estimatedDuration: 3,
        assignedTechnician: 'Peter Njoroge',
        description: 'Battery performance assessment and inverter check',
        status: 'scheduled',
        createdDate: now.toISOString().split('T')[0],
        requiredParts: ['Battery tester', 'Inverter diagnostic tools'],
        estimatedCost: 250,
        weatherDependent: false,
        recurringInterval: 'bi-annual'
      }
    ];
  }
}

export default new MaintenanceSchedulingService();
