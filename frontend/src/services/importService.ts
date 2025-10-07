import axios from 'axios';
import { API_BASE_URL } from '../config';

// Python API URL for enhanced data services
const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
import { ImportJob, ImportStatus, ImportSourceType, RecordStatus, PaginatedImportJobsResponse } from '../types/importJob';

// Re-export types and enums for use in other components
export type { ImportJob, PaginatedImportJobsResponse };
export { ImportStatus, ImportSourceType, RecordStatus };

// Import source types are now imported from '../types/importJob'

/**
 * Import schedule options
 */
export enum ImportSchedule {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Import validation levels
 */
export enum ValidationLevel {
  LENIENT = 'lenient',
  STANDARD = 'standard',
  STRICT = 'strict'
}

/**
 * Duplicate handling strategies
 */
export enum DuplicateStrategy {
  UPDATE = 'update',
  SKIP = 'skip',
  CREATE = 'create'
}

/**
 * Post-import actions
 */
export enum PostImportAction {
  NONE = 'none',
  ANALYZE = 'analyze',
  GENERATE_REPORT = 'generate_report'
}

// Import job status is now imported from '../types/importJob'

// Import record status is now imported from '../types/importJob'

/**
 * Import configuration interface
 */
export interface ImportConfig {
  source: ImportSourceType;
  schedule?: ImportSchedule;
  mappingProfile?: string;
  validationLevel?: ValidationLevel;
  duplicateStrategy?: DuplicateStrategy;
  postImportAction?: PostImportAction;
  startDate?: Date;
  endDate?: Date;
  fileContents?: File | null;
  apiEndpoint?: string;
  apiKey?: string;
}

/**
 * Import record interface
 */
export interface ImportRecord {
  id: string;
  facilityName: string;
  submissionDate: string;
  status: RecordStatus;
  errors?: string[];
}

// Import job interface is now imported from '../types/importJob'

/**
 * Response interface for import API calls
 */
interface ImportResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  message?: string;
  error?: string;
}

/**
 * Service for data import operations
 */
export const importService = {
  /**
   * Start a new import job
   * @param config Import configuration
   * @returns Promise with the created import job
   */
  async startImport(config: ImportConfig): Promise<ImportJob> {
    try {
      // Handle KoboToolbox import using Python backend
      if (config.source === ImportSourceType.KOBO_TOOLBOX) {
        console.log('🚀 Starting KoboToolbox import with Python backend...', config);
        
        // Use Enhanced Python API routes for advanced data processing
        const endpoint = (config.startDate && config.endDate) 
          ? `${PYTHON_API_URL}/api/python/data-import/kobo/import-by-date-range`
          : `${PYTHON_API_URL}/api/python/data-import/kobo/import-by-date-range`;
        
        console.log('🚀 Using Enhanced Python Import with advanced analytics...');
        
        const requestData = (config.startDate && config.endDate) 
          ? { 
              start_date: config.startDate.toISOString(), 
              end_date: config.endDate.toISOString(),
              form_id: config.apiEndpoint // Use apiEndpoint as form_id if provided
            }
          : { 
              start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
              end_date: new Date().toISOString(),
              form_id: config.apiEndpoint
            };
        
        // Get JWT token for authentication
        const token = localStorage.getItem('token');
        const response = await axios.post(
          endpoint,
          requestData,
          { 
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ KoboToolbox Python API response:', response.data);
        
        // Transform Python API response to match ImportJob interface
        const pythonResult = response.data.data || response.data;
        console.log('[IMPORT SERVICE DEBUG] Creating ImportJob with Python response:', {
          pythonSuccess: response.data.success,
          pythonImported: pythonResult.imported,
          pythonFailed: pythonResult.failed,
          pythonProcessingTime: pythonResult.processing_time_seconds,
          pythonQualityScore: pythonResult.data_quality_score
        });
        
        const importJob: ImportJob = {
          id: `kobo-python-${Date.now()}`,
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          completedAt: response.data.success ? new Date().toISOString() : undefined,
          source: ImportSourceType.KOBO_TOOLBOX,
          status: response.data.success ? ImportStatus.COMPLETED : ImportStatus.FAILED,
          config,
          progress: {
            total: (pythonResult.imported || 0) + (pythonResult.failed || 0),
            processed: (pythonResult.imported || 0) + (pythonResult.failed || 0),
            succeeded: pythonResult.imported || 0,
            failed: pythonResult.failed || 0,
            skipped: 0
          },
          records: [],
          logs: [
            response.data.message || 'Import completed with Python backend',
            `Processing time: ${pythonResult.processing_time_seconds || 0}s`,
            `Data quality score: ${pythonResult.data_quality_score || 'N/A'}`
          ],
          error: response.data.success ? undefined : response.data.message
        };
        
        console.log('[IMPORT SERVICE DEBUG] Created ImportJob:', {
          id: importJob.id,
          status: importJob.status,
          progress: importJob.progress,
          error: importJob.error
        });
        
        return importJob;
      }
      
      // Handle CSV file uploads using Python backend
      else if (config.source === ImportSourceType.CSV && config.fileContents) {
        const formData = new FormData();
        formData.append('file', config.fileContents);
        formData.append('source', 'csv_upload');
        formData.append('validate', 'true');
        formData.append('clean', 'true');
        
        // Get JWT token for authentication
        const token = localStorage.getItem('token');
        const response = await axios.post<ImportResponse<ImportJob>>(
          `${PYTHON_API_URL}/api/python/data-import/import-csv`, 
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            }
          }
        );
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to start CSV import');
        }
        
        return response.data.data;
      }
      
      // Handle other import types
      else {
        throw new Error(`Import source type '${config.source}' is not yet implemented`);
      }
    } catch (error) {
      console.error('Error starting import:', error);
      throw error;
    }
  },
  
  /**
   * Get import job status
   * @param jobId Import job ID
   * @returns Promise with the import job status
   */
  async getImportStatus(jobId: string): Promise<ImportJob> {
    try {
      const response = await axios.get<ImportResponse<ImportJob>>(
        `${API_BASE_URL}/imports/${jobId}`,
        { withCredentials: true }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get import status');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting import status:', error);
      throw error;
    }
  },
  
  /**
   * Cancel an in-progress import job
   * @param jobId Import job ID
   * @returns Promise with the cancelled import job
   */
  async cancelImport(jobId: string): Promise<ImportJob> {
    try {
      const response = await axios.post<ImportResponse<ImportJob>>(
        `${API_BASE_URL}/imports/${jobId}/cancel`,
        {},
        { withCredentials: true }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to cancel import');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error cancelling import:', error);
      throw error;
    }
  },
  
  /**
   * Get import job history
   * @param page Page number (1-based)
   * @param limit Items per page
   * @param filters Optional filters
   * @returns Promise with the import job history
   */
  async getImportHistory(
    page: number = 1, 
    limit: number = 10,
    filters?: { 
      source?: ImportSourceType, 
      status?: ImportStatus,
      startDate?: Date,
      endDate?: Date
    }
  ): Promise<{
    items: ImportJob[],
    total: number,
    page: number,
    pages: number
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filters) {
        if (filters.source) params.append('source', filters.source);
        if (filters.status) params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate.toISOString().split('T')[0]);
        if (filters.endDate) params.append('endDate', filters.endDate.toISOString().split('T')[0]);
      }
      
      const response = await axios.get<ImportResponse<{
        items: ImportJob[],
        total: number,
        page: number,
        pages: number
      }>>(
        `${API_BASE_URL}/imports?${params.toString()}`,
        { withCredentials: true }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get import history');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting import history:', error);
      throw error;
    }
  },
  
  /**
   * Validate import data
   * @param config Import configuration
   * @returns Promise with the validation results
   */
  async validateImportData(config: ImportConfig): Promise<{
    valid: boolean;
    sampleRecords: Record<string, any>[];
    validationErrors: { field: string, message: string }[];
  }> {
    try {
      // Special handling for file uploads
      if (config.source === ImportSourceType.CSV && config.fileContents) {
        const formData = new FormData();
        formData.append('file', config.fileContents);
        
        // Append other config properties
        Object.entries(config).forEach(([key, value]) => {
          if (key !== 'fileContents' && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        
        const response = await axios.post<ImportResponse<{
          valid: boolean;
          sampleRecords: Record<string, any>[];
          validationErrors: { field: string, message: string }[];
        }>>(
          `${API_BASE_URL}/imports/validate`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true
          }
        );
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to validate import data');
        }
        
        return response.data.data;
      } else {
        // Regular JSON request for non-file imports
        const response = await axios.post<ImportResponse<{
          valid: boolean;
          sampleRecords: Record<string, any>[];
          validationErrors: { field: string, message: string }[];
        }>>(
          `${API_BASE_URL}/imports/validate`, 
          config,
          { withCredentials: true }
        );
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to validate import data');
        }
        
        return response.data.data;
      }
    } catch (error) {
      console.error('Error validating import data:', error);
      throw error;
    }
  },
  
  /**
   * Re-run a failed import job
   * @param jobId Import job ID
   * @returns Promise with the new import job
   */
  async rerunImport(jobId: string): Promise<ImportJob> {
    try {
      const response = await axios.post<ImportResponse<ImportJob>>(
        `${API_BASE_URL}/imports/${jobId}/rerun`,
        {},
        { withCredentials: true }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to re-run import');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error re-running import:', error);
      throw error;
    }
  },
  
  /**
   * Get detailed logs for an import job
   * @param jobId Import job ID
   * @returns Promise with the import job logs
   */
  async getImportLogs(jobId: string): Promise<string[]> {
    try {
      const response = await axios.get<ImportResponse<string[]>>(
        `${API_BASE_URL}/imports/${jobId}/logs`,
        { withCredentials: true }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get import logs');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting import logs:', error);
      throw error;
    }
  },

  /**
   * Get available import configurations and mappings
   * @returns Promise with available configurations
   */
  async getImportConfigurations(): Promise<{
    mappingProfiles: { id: string, name: string }[],
    validationLevels: { id: ValidationLevel, name: string }[],
    duplicateStrategies: { id: DuplicateStrategy, name: string }[],
    postImportActions: { id: PostImportAction, name: string }[]
  }> {
    try {
      const response = await axios.get<ImportResponse<{
        mappingProfiles: { id: string, name: string }[],
        validationLevels: { id: ValidationLevel, name: string }[],
        duplicateStrategies: { id: DuplicateStrategy, name: string }[],
        postImportActions: { id: PostImportAction, name: string }[]
      }>>(
        `${API_BASE_URL}/imports/configurations`,
        { withCredentials: true }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get import configurations');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting import configurations:', error);
      
      // Return default values if API fails
      return {
        mappingProfiles: [
          { id: 'default', name: 'Default Mapping' },
          { id: 'custom1', name: 'Custom Mapping 1' },
          { id: 'custom2', name: 'Custom Mapping 2' }
        ],
        validationLevels: [
          { id: ValidationLevel.LENIENT, name: 'Lenient Validation' },
          { id: ValidationLevel.STANDARD, name: 'Standard Validation' },
          { id: ValidationLevel.STRICT, name: 'Strict Validation' }
        ],
        duplicateStrategies: [
          { id: DuplicateStrategy.UPDATE, name: 'Update Existing' },
          { id: DuplicateStrategy.SKIP, name: 'Skip' },
          { id: DuplicateStrategy.CREATE, name: 'Create Duplicate' }
        ],
        postImportActions: [
          { id: PostImportAction.ANALYZE, name: 'Run Analysis' },
          { id: PostImportAction.NONE, name: 'Do Nothing' }
        ]
      };
    }
  },

  /**
   * Preview import data before starting import
   * @param config Import configuration
   * @returns Promise with preview data including sample records
   */
  async previewImport(config: ImportConfig): Promise<{
    sampleRecords: Record<string, any>[];
    totalAvailableRecords: number;
    columns: { name: string; type: string; sampleValues: any[] }[];
    validationResults?: { 
      valid: boolean; 
      errors: { field: string; message: string; recordIndexes: number[] }[] 
    };
  }> {
    try {
      // For KoboToolbox, we can provide a preview based on the expected data structure
      if (config.source === ImportSourceType.KOBO_TOOLBOX) {
        // Since we don't have a dedicated preview endpoint, provide mock preview data
        // based on the KoboToolbox survey structure
        return {
          sampleRecords: [
            {
              id: 'preview-1',
              data: {
                facilityName: 'Sample Health Center',
                facilityType: 'healthcare',
                location: 'Sample Location',
                submissionDate: new Date().toISOString(),
                respondentId: 'sample-respondent'
              },
              valid: true
            },
            {
              id: 'preview-2', 
              data: {
                facilityName: 'Sample School',
                facilityType: 'education',
                location: 'Sample Location 2',
                submissionDate: new Date().toISOString(),
                respondentId: 'sample-respondent-2'
              },
              valid: true
            }
          ],
          totalAvailableRecords: 25, // Estimated based on typical survey responses
          columns: [
            { name: 'facilityName', type: 'string', sampleValues: ['Sample Health Center', 'Sample School'] },
            { name: 'facilityType', type: 'enum', sampleValues: ['healthcare', 'education', 'community'] },
            { name: 'location', type: 'string', sampleValues: ['Sample Location', 'Sample Location 2'] },
            { name: 'submissionDate', type: 'datetime', sampleValues: [new Date().toISOString()] },
            { name: 'respondentId', type: 'string', sampleValues: ['sample-respondent', 'sample-respondent-2'] }
          ],
          validationResults: {
            valid: true,
            errors: []
          }
        };
      }
      
      // For CSV file uploads, we could parse the file for preview
      else if (config.fileContents && config.source === ImportSourceType.CSV) {
        // For now, provide basic CSV preview structure
        return {
          sampleRecords: [
            {
              id: 'csv-preview-1',
              data: {
                column1: 'Sample Data 1',
                column2: 'Sample Data 2'
              },
              valid: true
            }
          ],
          totalAvailableRecords: 0, // Would need to parse file to get actual count
          columns: [
            { name: 'column1', type: 'string', sampleValues: ['Sample Data 1'] },
            { name: 'column2', type: 'string', sampleValues: ['Sample Data 2'] }
          ],
          validationResults: {
            valid: true,
            errors: []
          }
        };
      }
      
      // For other import types, provide basic preview
      else {
        return {
          sampleRecords: [],
          totalAvailableRecords: 0,
          columns: [],
          validationResults: {
            valid: true,
            errors: []
          }
        };
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      throw new Error('Failed to generate import preview');
    }
  }
};
