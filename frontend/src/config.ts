// Frontend configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Other configuration constants
export const APP_NAME = 'DREAM TOOL';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
  },
  METRICS: {
    DASHBOARD: '/metrics/dashboard',
    SUMMARY: '/metrics/summary',
    SOLAR: '/metrics/solar',
    MAINTENANCE: '/metrics/maintenance',
    DATA: '/metrics/data',
    DESIGN: '/metrics/design',
    PV_SITES: '/metrics/pv-sites',
    REPORTS: '/metrics/reports',
  },
  VISUALIZATION: {
    CHARTS: '/visualization/charts',
    ANALYTICS: '/visualization/analytics',
  },
} as const;

export default {
  API_BASE_URL,
  APP_NAME,
  APP_VERSION,
  API_ENDPOINTS,
};
