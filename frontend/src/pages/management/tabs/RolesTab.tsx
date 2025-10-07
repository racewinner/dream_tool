import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, Button, Divider } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Security as SecurityIcon } from '@mui/icons-material';

export const RolesTab = () => {
  // Mock data - replace with real data from your API
  const roles = [
    {
      id: 1,
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['users:read', 'users:write', 'roles:manage', 'system:configure'],
      userCount: 3,
    },
    {
      id: 2,
      name: 'Manager',
      description: 'Team management access',
      permissions: ['users:read', 'reports:generate', 'data:view'],
      userCount: 12,
    },
    {
      id: 3,
      name: 'Viewer',
      description: 'Read-only access',
      permissions: ['dashboard:view', 'reports:view'],
      userCount: 45,
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Role Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Role
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 3 }}>
        {roles.map((role) => (
          <Paper key={role.id} elevation={2}>
            <Box p={3}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <SecurityIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {role.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {role.description}
                  </Typography>
                </Box>
                <Box>
                  <Button size="small" startIcon={<EditIcon />} sx={{ mr: 1 }}>
                    Edit
                  </Button>
                  <Button size="small" color="error" startIcon={<DeleteIcon />} disabled={role.userCount > 0}>
                    Delete
                  </Button>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                  <strong>{role.userCount}</strong> users with this role
                </Typography>
                <Chip 
                  label={role.userCount > 0 ? 'In Use' : 'Unused'} 
                  size="small" 
                  color={role.userCount > 0 ? 'primary' : 'default'}
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>Permissions:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {role.permissions.map((permission, index) => (
                  <Chip 
                    key={index} 
                    label={permission} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default RolesTab;
