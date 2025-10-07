import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '../../components/ErrorBoundary';
import ManagementLayout from './ManagementLayout';
import { CircularProgress, Box, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Import tab components
import OverviewTab from './tabs/OverviewTab';
import UsersTab from './tabs/UsersTab';
import RolesTab from './tabs/RolesTab';
import PermissionsTab from './tabs/PermissionsTab';
import SystemTab from './tabs/SystemTab';
import LogsTab from './tabs/LogsTab';

// Management Context for shared state between tabs
export interface ManagementContextType {
  refreshData: () => void;
  isRefreshing: boolean;
  lastRefreshed: Date | null;
}

export const ManagementContext = createContext<ManagementContextType>({
  refreshData: () => {},
  isRefreshing: false,
  lastRefreshed: null
});

/**
 * Management Landing Page - RBAC System Management
 * Uses nested routing for tab navigation with authentication and RBAC protection
 */
const ManagementLanding = () => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (!loading && !user) {
      // If not logged in, redirect will be handled by protected route
      console.log('User not authenticated for management dashboard');
    }
  }, [user, loading]);

  // Shared refresh function for tabs
  const refreshData = () => {
    setIsRefreshing(true);
    
    // Simulate refresh delay - replace with actual data refresh logic
    setTimeout(() => {
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <Alert severity="error">
        You must be logged in to access the management dashboard.
      </Alert>
    );
  }

  // Handle potential redirects more explicitly
  useEffect(() => {
    // If we're at exactly /management, redirect to /management/overview
    if (location.pathname === '/management') {
      console.log('Redirecting from /management to /management/overview');
      navigate('overview', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <ErrorBoundary>
      <ManagementContext.Provider value={{ refreshData, isRefreshing, lastRefreshed }}>
        <Routes>
          <Route path="/*" element={<ManagementLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            
            {/* RBAC protected routes */}
            <Route path="overview" element={<OverviewTab />} />
            
            <Route 
              path="users" 
              element={
                hasPermission('manageUsers') ? 
                <UsersTab /> : 
                <Alert severity="warning">You don't have permission to access user management.</Alert>
              } 
            />
            
            <Route 
              path="roles" 
              element={
                hasPermission('manageRoles') ? 
                <RolesTab /> : 
                <Alert severity="warning">You don't have permission to access role management.</Alert>
              } 
            />
            
            <Route 
              path="permissions" 
              element={
                hasPermission('managePermissions') ? 
                <PermissionsTab /> : 
                <Alert severity="warning">You don't have permission to access permission management.</Alert>
              } 
            />
            
            <Route 
              path="system" 
              element={
                hasPermission('manageSystem') ? 
                <SystemTab /> : 
                <Alert severity="warning">You don't have permission to access system settings.</Alert>
              } 
            />
            
            <Route 
              path="logs" 
              element={
                hasPermission('viewLogs') ? 
                <LogsTab /> : 
                <Alert severity="warning">You don't have permission to access system logs.</Alert>
              } 
            />
            
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Route>
        </Routes>
      </ManagementContext.Provider>
    </ErrorBoundary>
  );
};

export default ManagementLanding;
