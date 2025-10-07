import axios from 'axios';

// Vite uses import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  is2faEnabled: boolean;
  createdAt: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  unitSystem: string;
  theme: 'light' | 'dark' | 'system';
  notificationSettings: {
    email: {
      systemAlerts: boolean;
      maintenanceUpdates: boolean;
      weeklyReports: boolean;
      dataImportResults: boolean;
    };
    inApp: {
      systemAlerts: boolean;
      maintenanceUpdates: boolean;
      userMentions: boolean;
      dataUpdates: boolean;
    };
  };
  dashboardSettings: {
    defaultWidgets: string[];
    refreshInterval: number;
    compactMode: boolean;
  };
  reportSettings: {
    defaultFormat: string;
    autoSchedule: boolean;
    includeCharts: boolean;
  };
}

export interface DataUsage {
  totalStorage: string;
  breakdown: Array<{
    type: string;
    size: string;
    lastUpdated: string;
  }>;
  retentionSettings: {
    surveyData: string;
    systemLogs: string;
    reportCache: string;
  };
}

class SettingsService {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Profile management
  async getProfile(token: string): Promise<UserProfile> {
    const response = await axios.get(`${API_BASE_URL}/api/settings/profile`, {
      headers: this.getAuthHeaders(token),
    });
    return response.data.user;
  }

  async updateProfile(token: string, profileData: { firstName: string; lastName: string }): Promise<UserProfile> {
    const response = await axios.put(`${API_BASE_URL}/api/settings/profile`, profileData, {
      headers: this.getAuthHeaders(token),
    });
    return response.data.user;
  }

  // Password management
  async changePassword(token: string, passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    await axios.put(`${API_BASE_URL}/api/settings/password`, passwordData, {
      headers: this.getAuthHeaders(token),
    });
  }

  // 2FA management
  async toggle2FA(token: string, enabled: boolean): Promise<{ secret?: string; qrCodeUrl?: string; is2faEnabled: boolean }> {
    const response = await axios.put(`${API_BASE_URL}/api/settings/2fa/toggle`, { enabled }, {
      headers: this.getAuthHeaders(token),
    });
    return response.data;
  }

  // User preferences
  async getPreferences(token: string): Promise<UserPreferences> {
    const response = await axios.get(`${API_BASE_URL}/api/settings/preferences`, {
      headers: this.getAuthHeaders(token),
    });
    return response.data.preferences;
  }

  async updatePreferences(token: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await axios.put(`${API_BASE_URL}/api/settings/preferences`, preferences, {
      headers: this.getAuthHeaders(token),
    });
    return response.data.preferences;
  }

  // Data usage and management
  async getDataUsage(token: string): Promise<DataUsage> {
    const response = await axios.get(`${API_BASE_URL}/api/settings/data-usage`, {
      headers: this.getAuthHeaders(token),
    });
    return response.data.dataUsage;
  }

  async cleanupData(token: string, type: 'logs' | 'reports' | 'temp'): Promise<{ cleanedSize: string; message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/api/settings/data/${type}`, {
      headers: this.getAuthHeaders(token),
    });
    return response.data;
  }
}

export default new SettingsService();
