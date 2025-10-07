export interface SystemSettings {
  id: string;
  name: string;
  description: string;
  value: any;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  category: string;
  subcategory: string;
  editable: boolean;
  validation: Validation;
  metadata: Record<string, any>;
}

export interface Validation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  custom?: (value: any) => boolean;
}

export interface BackupConfig {
  enabled: boolean;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  retention: number;
  location: string;
  encryption: {
    enabled: boolean;
    key: string;
    algorithm: string;
  };
  compression: {
    enabled: boolean;
    level: number;
  };
}

export interface DisasterRecoveryConfig {
  enabled: boolean;
  recoveryPointObjective: number;
  recoveryTimeObjective: number;
  backupLocations: string[];
  failoverStrategy: 'MANUAL' | 'AUTOMATIC';
  failoverServers: string[];
  recoveryProcedure: string;
}

export interface SystemHealthCheck {
  id: string;
  name: string;
  description: string;
  type: 'PERFORMANCE' | 'SECURITY' | 'STORAGE' | 'NETWORK';
  frequency: number;
  thresholds: Threshold[];
  actions: Action[];
  lastCheck: Date;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface Threshold {
  metric: string;
  value: number;
  operator: '<' | '>' | '<=' | '>=';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Action {
  type: 'NOTIFY' | 'RESTART' | 'SCALE' | 'BACKUP';
  conditions: Record<string, any>;
  parameters: Record<string, any>;
  delay: number;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    swap: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    upload: number;
    download: number;
    latency: number;
    packets: {
      sent: number;
      received: number;
      lost: number;
    };
  };
}

export interface SystemLogs {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
  details: Record<string, any>;
  userId?: string;
}

export interface SystemStatus {
  uptime: number;
  version: string;
  lastUpdate: Date;
  health: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  alerts: Alert[];
  maintenanceMode: boolean;
}

export interface Alert {
  id: string;
  type: 'SYSTEM' | 'PERFORMANCE' | 'SECURITY' | 'STORAGE' | 'NETWORK';
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  status: 'ACTIVE' | 'RESOLVED' | 'IGNORED';
  details: Record<string, any>;
}

export interface UpdateConfig {
  enabled: boolean;
  channel: 'STABLE' | 'BETA' | 'DEVELOPMENT';
  autoDownload: boolean;
  autoInstall: boolean;
  schedule: {
    type: 'IMMEDIATE' | 'DELAYED' | 'SCHEDULED';
    delay: number;
    time: string;
  };
  sources: UpdateSource[];
}

export interface UpdateSource {
  id: string;
  name: string;
  url: string;
  type: 'HTTP' | 'HTTPS' | 'FTP' | 'SFTP';
  authentication: {
    type: 'BASIC' | 'TOKEN' | 'CERTIFICATE';
    credentials: Record<string, string>;
  };
}
