/**
 * Import Service Types
 * These types define the interface for the import service and related data structures
 */

/**
 * Import source types
 */
export enum ImportSourceType {
  KOBO_TOOLBOX = 'kobo',
  CSV = 'csv',
  API = 'api',
}

/**
 * Import schedule options
 */
export enum ImportSchedule {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Import job status
 */
export enum ImportStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

/**
 * Validation level for imported data
 */
export enum ValidationLevel {
  LENIENT = 'lenient',
  STANDARD = 'standard', 
  STRICT = 'strict',
}

/**
 * Strategy for handling duplicate records
 */
export enum DuplicateStrategy {
  UPDATE = 'update',
  SKIP = 'skip',
  CREATE = 'create',
}

/**
 * Actions to perform after import completes
 */
export enum PostImportAction {
  NONE = 'none',
  ANALYZE = 'analyze',
}

/**
 * Import configuration interface
 */
export interface ImportConfig {
  source: ImportSourceType;
  schedule?: ImportSchedule;
  startDate?: Date;
  fileContents?: File;
  apiEndpoint?: string;
  apiKey?: string;
  validationLevel?: ValidationLevel;
  duplicateStrategy?: DuplicateStrategy;
  postImportAction?: PostImportAction;
}

/**
 * Import preview record
 */
export interface ImportPreviewRecord {
  id: string;
  data: Record<string, any>;
  valid: boolean;
  validationErrors?: string[];
}

/**
 * Import preview response
 */
export interface ImportPreviewResponse {
  records: ImportPreviewRecord[];
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  sampleSize: number;
}

/**
 * Import job progress
 */
export interface ImportProgress {
  processed: number;
  total: number;
  successful: number;
  failed: number;
  percentComplete: number;
  currentRecord?: any;
  lastError?: string;
  logs?: ImportLogEntry[];
}

/**
 * Import log entry
 */
export interface ImportLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  recordId?: string;
  details?: any;
}

/**
 * Import job
 */
export interface ImportJob {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  config: ImportConfig;
  status: ImportStatus;
  progress: ImportProgress;
  logs: ImportLogEntry[];
  errors?: string[];
  result?: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    duration: number;
  };
}

/**
 * Import history filter options
 */
export interface ImportHistoryFilters {
  status?: ImportStatus[];
  source?: ImportSourceType[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Import history paginated response
 */
export interface ImportHistoryResponse {
  items: ImportJob[];
  total: number;
  page: number;
  pageSize: number;
}
