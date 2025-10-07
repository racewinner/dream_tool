/**
 * Import job types for the frontend
 * These match the structure returned by the backend API
 */

export enum ImportStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial'
}

export enum ImportSourceType {
  KOBO_TOOLBOX = 'kobo',
  CSV = 'csv',
  API = 'api',
  MANUAL = 'manual'
}

export enum ImportSchedule {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum DuplicateStrategy {
  UPDATE = 'update',
  SKIP = 'skip',
  CREATE = 'create'
}

export enum ValidationLevel {
  STANDARD = 'standard',
  STRICT = 'strict',
  LENIENT = 'lenient'
}

export enum PostImportAction {
  NONE = 'none',
  ANALYZE = 'analyze',
  GENERATE_REPORT = 'generate_report'
}

export enum RecordStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  PENDING = 'pending'
}

export interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

export interface ImportRecord {
  id: string;
  facilityName: string;
  submissionDate: string;
  status: RecordStatus;
  errors?: string[];
}

export interface ImportConfig {
  source: ImportSourceType;
  schedule?: ImportSchedule;
  validationLevel?: ValidationLevel;
  duplicateStrategy?: DuplicateStrategy;
  postImportAction?: PostImportAction;
  mappingProfile?: string;
  startDate?: Date;
  endDate?: Date;
  apiEndpoint?: string;
  apiKey?: string;
  fileContents?: File | null;
}

export interface ImportJob {
  id: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  source: ImportSourceType;
  status: ImportStatus;
  config: ImportConfig;
  progress: ImportProgress;
  records: ImportRecord[];
  logs: string[];
  error?: string;
}

export interface PaginatedImportJobsResponse {
  items: ImportJob[];
  total: number;
  page: number;
  pages: number;
}
