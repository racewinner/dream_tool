// Import source types
export enum ImportSourceType {
  CSV = 'CSV',
  API = 'API',
  KOBO = 'KOBO'
}

// Import schedule options
export enum ImportSchedule {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

// Import status enum
export enum ImportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  VALIDATING = 'VALIDATING',
  TRANSFORMING = 'TRANSFORMING',
  IMPORTING = 'IMPORTING'
}

// Duplicate handling strategies
export enum DuplicateStrategy {
  SKIP = 'SKIP',
  REPLACE = 'REPLACE',
  APPEND = 'APPEND',
  ERROR = 'ERROR'
}

// Validation level for imports
export enum ValidationLevel {
  NONE = 'NONE',
  BASIC = 'BASIC',
  STRICT = 'STRICT'
}

// Post-import actions
export enum PostImportAction {
  NONE = 'NONE',
  ANALYZE = 'ANALYZE',
  NOTIFY = 'NOTIFY',
  ARCHIVE = 'ARCHIVE'
}

// Import configuration interface
export interface ImportConfig {
  sourceType: ImportSourceType;
  sourcePath?: string;
  sourceUrl?: string;
  apiKey?: string;
  schedule?: ImportSchedule;
  duplicateStrategy: DuplicateStrategy;
  validationLevel: ValidationLevel;
  transformationRules?: Record<string, string>;
  postImportActions?: PostImportAction[];
}

// Import job interface for tracking import status
export interface ImportJob {
  id: string;
  status: ImportStatus;
  config: ImportConfig;
  startedAt: string;
  completedAt?: string;
  progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  };
  error?: string;
  logs: string[];
}

// Import preview response
export interface ImportPreviewResponse {
  sourceType: ImportSourceType;
  sampleRecords: Record<string, any>[];
  totalAvailableRecords: number;
  columns: {
    name: string;
    type: string;
    sampleValues: any[];
  }[];
  validationResults?: {
    valid: boolean;
    errors: {
      field: string;
      message: string;
      recordIndexes: number[];
    }[];
  };
}

// Import history filters
export interface ImportHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  status?: ImportStatus[];
  sourceType?: ImportSourceType[];
}

// Import result
export interface ImportResult {
  jobId: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  duration: number; // in milliseconds
  details?: any;
}

// Import error
export interface ImportError {
  message: string;
  code: string;
  details?: any;
}

// Import validation error
export interface ImportValidationError {
  field: string;
  message: string;
  recordIndexes?: number[];
}

// Import log entry
export interface ImportLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  details?: any;
}
