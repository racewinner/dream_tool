export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'AUTH_001',
  INVALID_TOKEN = 'AUTH_002',
  USER_NOT_FOUND = 'AUTH_003',
  INVALID_CREDENTIALS = 'AUTH_004',
  
  // Validation errors
  INVALID_INPUT = 'VALID_001',
  REQUIRED_FIELD = 'VALID_002',
  INVALID_FORMAT = 'VALID_003',
  
  // Business logic errors
  RESOURCE_NOT_FOUND = 'BUS_001',
  RESOURCE_EXISTS = 'BUS_002',
  OPERATION_NOT_ALLOWED = 'BUS_003',
  
  // System errors
  INTERNAL_ERROR = 'SYS_001',
  TIMEOUT = 'SYS_002',
  RATE_LIMIT = 'SYS_003',
  
  // Third-party service errors
  EXTERNAL_SERVICE = 'EXT_001',
  API_LIMIT = 'EXT_002',
  API_ERROR = 'EXT_003'
}

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

export interface ErrorLog {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
  userId?: number;
  path: string;
  method: string;
  query?: Record<string, any>;
  body?: Record<string, any>;
  headers?: Record<string, string>;
  ip?: string;
}
