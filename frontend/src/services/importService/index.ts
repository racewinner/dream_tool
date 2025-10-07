import axios from 'axios';
import { API_BASE_URL } from '../../config';
import {
  ImportConfig,
  ImportHistoryFilters,
  ImportHistoryResponse,
  ImportJob,
  ImportPreviewResponse,
  ImportProgress,
  ImportSourceType,
} from './types';

/**
 * Service for managing data imports from various sources
 */
class ImportService {
  private baseUrl = `${API_BASE_URL}/api/imports`;

  /**
   * Start a new import job
   * @param config Import configuration
   * @returns Created import job
   */
  async startImport(config: ImportConfig): Promise<ImportJob> {
    try {
      // Handle file upload for CSV imports
      if (config.source === ImportSourceType.CSV && config.fileContents) {
        const formData = new FormData();
        formData.append('file', config.fileContents);
        
        // Add other config parameters as JSON
        const configWithoutFile = { ...config };
        delete configWithoutFile.fileContents;
        formData.append('config', JSON.stringify(configWithoutFile));
        
        const response = await axios.post(`${this.baseUrl}/start`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      } else {
        // Regular JSON request for other import types
        const response = await axios.post(`${this.baseUrl}/start`, config);
        return response.data;
      }
    } catch (error) {
      console.error('Error starting import:', error);
      throw this.handleApiError(error, 'Failed to start import');
    }
  }

  /**
   * Get import job status
   * @param jobId Import job ID
   * @returns Import job with current status and progress
   */
  async getImportStatus(jobId: string): Promise<ImportJob> {
    try {
      const response = await axios.get(`${this.baseUrl}/${jobId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting import status:', error);
      throw this.handleApiError(error, 'Failed to get import status');
    }
  }

  /**
   * Cancel an ongoing import job
   * @param jobId Import job ID
   * @returns Canceled import job
   */
  async cancelImport(jobId: string): Promise<ImportJob> {
    try {
      const response = await axios.post(`${this.baseUrl}/${jobId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling import:', error);
      throw this.handleApiError(error, 'Failed to cancel import');
    }
  }

  /**
   * Get preview of data to be imported
   * @param config Import configuration
   * @returns Preview of the data
   */
  async previewImport(config: ImportConfig): Promise<ImportPreviewResponse> {
    try {
      // Handle file upload for CSV imports
      if (config.source === ImportSourceType.CSV && config.fileContents) {
        const formData = new FormData();
        formData.append('file', config.fileContents);
        
        // Add other config parameters as JSON
        const configWithoutFile = { ...config };
        delete configWithoutFile.fileContents;
        formData.append('config', JSON.stringify(configWithoutFile));
        
        const response = await axios.post(`${this.baseUrl}/preview`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      } else {
        // Regular JSON request for other import types
        const response = await axios.post(`${this.baseUrl}/preview`, config);
        return response.data;
      }
    } catch (error) {
      console.error('Error previewing import data:', error);
      throw this.handleApiError(error, 'Failed to preview import data');
    }
  }

  /**
   * Get import history with filtering and pagination
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @param filters Filters to apply
   * @returns Paginated import history
   */
  async getImportHistory(
    page = 1,
    pageSize = 10,
    filters: ImportHistoryFilters = {}
  ): Promise<ImportHistoryResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/history`, {
        params: {
          page,
          pageSize,
          ...filters,
          // Convert date objects to ISO strings
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting import history:', error);
      throw this.handleApiError(error, 'Failed to get import history');
    }
  }

  /**
   * Get detailed logs for an import job
   * @param jobId Import job ID
   * @returns Import job with detailed logs
   */
  async getImportLogs(jobId: string): Promise<ImportJob> {
    try {
      const response = await axios.get(`${this.baseUrl}/${jobId}/logs`);
      return response.data;
    } catch (error) {
      console.error('Error getting import logs:', error);
      throw this.handleApiError(error, 'Failed to get import logs');
    }
  }

  /**
   * Re-run a failed import job
   * @param jobId Import job ID
   * @returns New import job
   */
  async rerunImport(jobId: string): Promise<ImportJob> {
    try {
      const response = await axios.post(`${this.baseUrl}/${jobId}/rerun`);
      return response.data;
    } catch (error) {
      console.error('Error re-running import:', error);
      throw this.handleApiError(error, 'Failed to re-run import');
    }
  }

  /**
   * Validate import data
   * @param config Import configuration
   * @returns Validation result
   */
  async validateImport(config: ImportConfig): Promise<ImportPreviewResponse> {
    try {
      // Handle file upload for CSV imports
      if (config.source === ImportSourceType.CSV && config.fileContents) {
        const formData = new FormData();
        formData.append('file', config.fileContents);
        
        // Add other config parameters as JSON
        const configWithoutFile = { ...config };
        delete configWithoutFile.fileContents;
        formData.append('config', JSON.stringify(configWithoutFile));
        
        const response = await axios.post(`${this.baseUrl}/validate`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      } else {
        // Regular JSON request for other import types
        const response = await axios.post(`${this.baseUrl}/validate`, config);
        return response.data;
      }
    } catch (error) {
      console.error('Error validating import data:', error);
      throw this.handleApiError(error, 'Failed to validate import data');
    }
  }

  /**
   * Handle API errors
   * @param error Error object
   * @param defaultMessage Default error message
   * @returns Error object with message
   */
  private handleApiError(error: any, defaultMessage: string): Error {
    if (error.response) {
      // Server responded with an error
      const serverError = error.response.data?.error || error.response.data?.message;
      return new Error(serverError || `${defaultMessage} (${error.response.status})`);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error - no response from server');
    } else {
      // Error setting up the request
      return new Error(error.message || defaultMessage);
    }
  }
}

// Export a singleton instance
export const importService = new ImportService();

// Export types
export * from './types';
