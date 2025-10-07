export interface DataValidationRules {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: (value: any) => boolean | Promise<boolean>;
  errorMessage?: string;
}

export interface FieldValidation {
  [fieldName: string]: DataValidationRules;
}

export interface ValidationState {
  isValid: boolean;
  errors: { [fieldName: string]: string };
}

export interface DataStore {
  saveData: (data: any, key: string) => Promise<void>;
  getData: (key: string) => Promise<any>;
  removeData: (key: string) => Promise<void>;
  clearStore: () => Promise<void>;
}

export interface OfflineData {
  id: string;
  data: any;
  timestamp: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

export interface BackupConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  retentionPeriod: number;
  storageLocation: string;
  encryptionEnabled: boolean;
  encryptionKey: string;
}

export interface BackupMetadata {
  id: string;
  timestamp: number;
  size: number;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}
