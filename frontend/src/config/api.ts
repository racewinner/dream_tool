/**
 * API Configuration
 * Centralized configuration for all API endpoints using environment variables
 */

// Get API base URL from environment variables (should include /api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000/api/python';

// Validate environment configuration
if (!API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL not configured. Please check your .env file.');
}

// API Configuration object
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  PYTHON_BASE_URL: PYTHON_API_BASE_URL,
  ENDPOINTS: {
    // Authentication endpoints
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    
    // Import endpoints
    IMPORT: {
      KOBO_SURVEYS: '/import/kobo/surveys',
      KOBO_RECENT: '/import/kobo/surveys/recent',
      CSV_UPLOAD: '/v2/imports',
      EXTERNAL_API: '/import/external',
      HEALTH: '/import/health',
      STATUS: '/import/status',
      CLEAR: '/import/clear-surveys',
    },
    
    // Survey endpoints
    SURVEYS: {
      LIST: '/surveys',
      DETAIL: '/surveys',
      ANALYTICS: '/surveys/analytics',
      REPEAT_GROUPS: '/surveys/analytics/repeat-groups',
    },
    
    // Health check
    HEALTH: '/health',
  },
  
  // Request configuration
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Get API headers with authentication
 */
export const getApiHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * API request wrapper with error handling and retries
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  retries: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const headers = getApiHeaders(token);
  
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };
  
  try {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
    
  } catch (error) {
    console.error(`❌ API Request failed: ${url}`, error);
    
    // Retry logic for network errors
    if (retries > 0 && error instanceof TypeError) {
      console.log(`🔄 Retrying API request (${retries} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      return apiRequest(endpoint, options, token, retries - 1);
    }
    
    throw error;
  }
};

export default API_CONFIG;
