/**
 * Authentication Helper Functions
 * Common utilities for authentication across services
 */

/**
 * Get authentication header with JWT token
 * @returns Authentication header object or empty object if no token
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export default {
  getAuthHeader
};
