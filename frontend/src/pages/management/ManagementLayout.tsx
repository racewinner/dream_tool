import React, { useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, Badge, Tooltip, LinearProgress, Chip } from '@mui/material';
import { RefreshOutlined as RefreshIcon } from '@mui/icons-material';
import { ManagementContext } from './ManagementLanding';
import { useAuth } from '../../contexts/AuthContext';
import { UserPermissions } from '../../types/auth';

interface TabPermission {
  id: string;
  label: string;
  permission?: keyof UserPermissions;
}

export const ManagementLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Improved tab extraction logic with debugging
  const pathnameParts = location.pathname.split('/');
  let currentTab = 'overview'; // Default to overview tab
  
  if (pathnameParts.length > 2 && pathnameParts[2]) {
    currentTab = pathnameParts[2];
    // Debug log for tab detection
    console.log(`📋 ManagementLayout: Detected tab '${currentTab}' from path ${location.pathname}`);
  } else {
    // If we're at exactly /management, log the situation
    console.log(`📋 ManagementLayout: At root management path, defaulting to 'overview' tab`);
    
    // Add a small delay to allow React to render before redirecting
    // This helps avoid potential race conditions with useEffects
    setTimeout(() => {
      navigate('/management/overview', { replace: true });
    }, 0);
  }
  
  const { refreshData, isRefreshing, lastRefreshed } = useContext(ManagementContext);
  const { hasPermission } = useAuth();

  // Add permission checks to tabs
  const tabsWithPermissions: TabPermission[] = [
    { id: 'overview', label: 'Overview' }, // Everyone can see overview
    { id: 'users', label: 'Users', permission: 'manageUsers' },
    { id: 'roles', label: 'Roles', permission: 'manageRoles' },
    { id: 'permissions', label: 'Permissions', permission: 'managePermissions' },
    { id: 'system', label: 'System', permission: 'manageSystem' },
    { id: 'logs', label: 'Logs', permission: 'viewLogs' },
  ];

  // Filter tabs based on user permissions
  const visibleTabs = tabsWithPermissions.filter(tab => 
    !tab.permission || hasPermission(tab.permission)
  );

  // Format the last refreshed time
  const formatRefreshTime = () => {
    if (!lastRefreshed) return 'Not yet refreshed';
    
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(lastRefreshed);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper sx={{ boxShadow: 'none', borderBottom: 1, borderColor: 'divider' }}>
        {isRefreshing && (
          <LinearProgress sx={{ height: 2 }} />
        )}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => {
              console.log(`📋 ManagementLayout: Tab changed to '${newValue}'`);
              navigate(`/management/${newValue}`);
            }}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="management tabs"
            sx={{ flex: 1 }}
          >
            {visibleTabs.map(tab => (
              <Tab 
                key={tab.id} 
                value={tab.id} 
                label={tab.label} 
                sx={{ textTransform: 'none', fontWeight: 500 }}
              />
            ))}
          </Tabs>
          
          <Box pr={2} display="flex" alignItems="center">
            {lastRefreshed && (
              <Tooltip title={`Last refreshed: ${formatRefreshTime()}`}>
                <Chip 
                  size="small" 
                  label={formatRefreshTime()} 
                  color="default" 
                  variant="outlined"
                  icon={<RefreshIcon fontSize="small" />}
                  onClick={refreshData}
                  disabled={isRefreshing}
                  sx={{ mr: 1, cursor: 'pointer' }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {isRefreshing ? (
          <Box sx={{ opacity: 0.7 }}>
            <Outlet />
          </Box>
        ) : (
          <Outlet />
        )}
      </Box>
    </Box>
  );
};

export default ManagementLayout;
