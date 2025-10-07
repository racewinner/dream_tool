import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, Typography, Divider, Chip, Box } from '@mui/material';

const UserInfo: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Card variant="outlined" sx={{ maxWidth: 500, margin: '20px auto', p: 2 }}>
        <Typography variant="h6">Not authenticated</Typography>
        <Typography>Please log in to view your user information.</Typography>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ maxWidth: 500, margin: '20px auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          User Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box mb={2}>
          <Typography variant="subtitle1" color="textSecondary">Name</Typography>
          <Typography variant="body1">{`${user.firstName} ${user.lastName}`}</Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" color="textSecondary">Email</Typography>
          <Typography variant="body1">{user.email}</Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" color="textSecondary">Role</Typography>
          <Chip 
            label={user.role} 
            color={
              user.role === 'admin' ? 'primary' : 
              user.role.startsWith('technical') ? 'secondary' : 'default'
            } 
          />
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle1" color="textSecondary">Status</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={user.isVerified ? 'Verified' : 'Not Verified'} 
              color={user.isVerified ? 'success' : 'default'} 
              size="small" 
            />
            <Chip 
              label={user.is2faEnabled ? '2FA Enabled' : '2FA Disabled'} 
              color={user.is2faEnabled ? 'success' : 'default'} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" color="textSecondary">Permissions</Typography>
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {getPermissionsForRole(user.role).map((permission, index) => (
            <Chip key={index} label={permission} size="small" variant="outlined" />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Helper function to get permissions based on role
function getPermissionsForRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    admin: [
      'view_dashboard', 'manage_users', 'manage_surveys', 'view_reports',
      'import_data', 'export_data', 'system_settings'
    ],
    technical_expert: [
      'view_dashboard', 'manage_surveys', 'view_reports', 'import_data'
    ],
    technical_junior: [
      'view_dashboard', 'view_surveys', 'view_reports'
    ],
    non_technical: [
      'view_dashboard', 'view_reports'
    ]
  };

  return permissions[role] || ['basic_access'];
}

export default UserInfo;
