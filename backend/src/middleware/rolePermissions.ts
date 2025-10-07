import { Request, Response, NextFunction } from 'express';

// Define role-based permissions
export const PERMISSIONS = {
  // Admin permissions - full access
  admin: {
    user_management: true,
    system_config: true,
    view_all_data: true,
    modify_methodologies: true,
    technical_config: true,
    export_data: true,
    manage_reports: true,
    whatsapp_config: true,
  },
  
  // Technical Expert - advanced technical control
  technical_expert: {
    user_management: false,
    system_config: false,
    view_all_data: true,
    modify_methodologies: true,
    technical_config: true,
    export_data: true,
    manage_reports: true,
    whatsapp_config: false,
  },
  
  // Technical Junior - limited technical access
  technical_junior: {
    user_management: false,
    system_config: false,
    view_all_data: true,
    modify_methodologies: false,
    technical_config: false,
    export_data: true,
    manage_reports: false,
    whatsapp_config: false,
  },
  
  // Non-Technical - operational and viewing access
  non_technical: {
    user_management: false,
    system_config: false,
    view_all_data: true,
    modify_methodologies: false,
    technical_config: false,
    export_data: true,
    manage_reports: true,
    whatsapp_config: false,
  },
} as const;

// Enhanced request interface with user role
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: keyof typeof PERMISSIONS;
  };
}

// Permission checker middleware factory
export const requirePermission = (permission: keyof typeof PERMISSIONS['admin']) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const rolePermissions = PERMISSIONS[userRole as keyof typeof PERMISSIONS];
    const hasPermission = rolePermissions?.[permission];

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userRole: userRole
      });
    }

    next();
  };
};

// Role-based access middleware
export const requireRole = (...allowedRoles: Array<keyof typeof PERMISSIONS>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Check if user has specific permission
export const hasPermission = (userRole: keyof typeof PERMISSIONS, permission: keyof typeof PERMISSIONS['admin']): boolean => {
  const rolePermissions = PERMISSIONS[userRole as keyof typeof PERMISSIONS];
  return rolePermissions?.[permission] || false;
};

// Get all permissions for a role
export const getRolePermissions = (role: keyof typeof PERMISSIONS) => {
  return PERMISSIONS[role] || {};
};

// Middleware to add user permissions to response
export const addUserPermissions = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user) {
    res.locals.userPermissions = getRolePermissions(req.user.role);
  }
  next();
};
