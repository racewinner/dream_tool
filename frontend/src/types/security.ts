export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  lastAccess: Date;
  userAgent: string;
  ipAddress: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: Record<string, any>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enabled: boolean;
  priority: number;
}

export interface SecurityRule {
  condition: string;
  action: string;
  parameters: Record<string, any>;
  priority: number;
}

export interface MFAConfig {
  enabled: boolean;
  methods: ('TOTP' | 'SMS' | 'EMAIL' | 'PUSH')[];
  backupCodes: string[];
  recoveryOptions: {
    email: boolean;
    securityQuestions: boolean;
    phone: boolean;
  };
}

export interface SessionConfig {
  timeout: number;
  idleTimeout: number;
  maxSessions: number;
  sessionValidation: boolean;
  sessionEncryption: boolean;
}

export interface RateLimitConfig {
  enabled: boolean;
  window: number;
  limit: number;
  per: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY';
  methods: string[];
  paths: string[];
}
