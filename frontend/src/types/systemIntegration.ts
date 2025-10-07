export interface IoTIntegrationConfig {
  protocol: 'MQTT' | 'HTTP' | 'WebSocket';
  endpoint: string;
  authentication: {
    type: 'TOKEN' | 'BASIC' | 'CERTIFICATE';
    credentials: any;
  };
  topics: string[];
  qos: number;
  keepAlive: number;
  retryInterval: number;
}

export interface SCADAIntegration {
  protocol: 'MODBUS' | 'DNP3' | 'IEC60870' | 'OPC-UA';
  host: string;
  port: number;
  pollingInterval: number;
  tags: {
    [tagName: string]: {
      address: string;
      type: string;
      multiplier: number;
    };
  };
}

export interface RealTimeMonitoringConfig {
  updateInterval: number;
  metrics: {
    energyGeneration: boolean;
    systemPerformance: boolean;
    temperature: boolean;
    irradiance: boolean;
    windSpeed: boolean;
  };
  alertThresholds: {
    performance: number;
    temperature: number;
    irradiance: number;
    windSpeed: number;
  };
}

export interface NotificationConfig {
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';
  recipients: string[];
  templates: {
    [templateName: string]: string;
  };
  triggers: {
    maintenanceDue: boolean;
    performanceAlert: boolean;
    systemAlert: boolean;
  };
}

export interface MaintenanceManagementConfig {
  integrationType: 'CMMS' | 'ERP' | 'CRM';
  endpoint: string;
  authentication: {
    type: 'API_KEY' | 'OAUTH' | 'TOKEN';
    credentials: any;
  };
  syncInterval: number;
  fieldsMapping: {
    [fieldName: string]: string;
  };
}
