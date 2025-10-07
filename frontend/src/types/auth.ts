export type UserRole = 'admin' | 'technical_expert' | 'technical_junior' | 'non_technical';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  is2faEnabled: boolean;
  createdAt?: string;
}

export interface UserPermissions {
  // Existing permissions
  user_management: boolean;
  system_config: boolean;
  view_all_data: boolean;
  modify_methodologies: boolean;
  technical_config: boolean;
  export_data: boolean;
  manage_reports: boolean;
  whatsapp_config: boolean;
  
  // Management dashboard specific permissions
  manageUsers: boolean;
  manageRoles: boolean;
  managePermissions: boolean;
  manageSystem: boolean;
  viewLogs: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    user_management: true,
    system_config: true,
    view_all_data: true,
    modify_methodologies: true,
    technical_config: true,
    export_data: true,
    manage_reports: true,
    whatsapp_config: true,
    // Management dashboard permissions
    manageUsers: true,
    manageRoles: true,
    managePermissions: true,
    manageSystem: true,
    viewLogs: true,
  },
  technical_expert: {
    user_management: false,
    system_config: false,
    view_all_data: true,
    modify_methodologies: true,
    technical_config: true,
    export_data: true,
    manage_reports: true,
    whatsapp_config: false,
    // Management dashboard permissions
    manageUsers: false,
    manageRoles: false,
    managePermissions: false,
    manageSystem: true,
    viewLogs: true,
  },
  technical_junior: {
    user_management: false,
    system_config: false,
    view_all_data: true,
    modify_methodologies: false,
    technical_config: false,
    export_data: true,
    manage_reports: false,
    whatsapp_config: false,
    // Management dashboard permissions
    manageUsers: false,
    manageRoles: false,
    managePermissions: false,
    manageSystem: false,
    viewLogs: true,
  },
  non_technical: {
    user_management: false,
    system_config: false,
    view_all_data: true,
    modify_methodologies: false,
    technical_config: false,
    export_data: true,
    manage_reports: true,
    whatsapp_config: false,
    // Management dashboard permissions
    manageUsers: false,
    manageRoles: false,
    managePermissions: false,
    manageSystem: false,
    viewLogs: false,
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'System Administrator',
  technical_expert: 'Technical Expert',
  technical_junior: 'Technical Junior',
  non_technical: 'Non-Technical User',
};

export const hasPermission = (role: UserRole, permission: keyof UserPermissions): boolean => {
  return ROLE_PERMISSIONS[role]?.[permission] || false;
};

export const getUserPermissions = (role: UserRole): UserPermissions => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.non_technical;
};
