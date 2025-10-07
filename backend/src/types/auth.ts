export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  TECHNICAL_EXPERT = 'technical_expert',
  TECHNICAL_JUNIOR = 'technical_junior',
  NON_TECHNICAL = 'non_technical'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface RolePermission {
  id: number;
  role: UserRole;
  resource: string;
  actions: string[];
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  timestamp: Date;
  details: Record<string, any>;
}
