/**
 * Import job types for transformation between backend models and frontend API responses
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
  mappingProfile?: string;
  startDate?: Date;
  endDate?: Date;
  apiEndpoint?: string;
  apiKey?: string;
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
