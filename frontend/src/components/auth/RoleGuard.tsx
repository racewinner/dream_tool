import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, UserPermissions } from '../../types/auth';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: keyof UserPermissions;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback,
  showFallback = true,
}) => {
  const { user, hasPermission, loading } = useAuth();

  // If auth is still loading, render a loading indicator or nothing
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Handle the case when user is null after loading completed
  const userRole = user?.role || 'non_technical';

  // Check if user has required role
  const hasRequiredRole = allowedRoles ? allowedRoles.includes(userRole) : true;

  // Check if user has required permission, safely
  const hasRequiredPermission = requiredPermission ? hasPermission(requiredPermission) : true;

  // User has access if both role and permission requirements are met
  const hasAccess = hasRequiredRole && hasRequiredPermission;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showFallback) {
    return null;
  }

  // Default fallback message
  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="warning" sx={{ maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body2">
          {!hasRequiredRole && allowedRoles && (
            <>You need one of the following roles: {allowedRoles.join(', ')}</>
          )}
          {!hasRequiredPermission && requiredPermission && (
            <>You don't have the required permission: {requiredPermission}</>
          )}
          {!hasRequiredRole && !hasRequiredPermission && allowedRoles && requiredPermission && (
            <>You need the appropriate role and permissions to access this feature.</>
          )}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
          Current role: {user?.role || 'Not logged in'}
        </Typography>
      </Alert>
    </Box>
  );
};

export default RoleGuard;
