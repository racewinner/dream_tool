import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress, 
  Divider,
  Button,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Storage as StorageIcon, 
  Memory as MemoryIcon, 
  Dns as DnsIcon,
  Cloud as CloudIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { ManagementContext } from '../ManagementLanding';
import { useAuth } from '../../../contexts/AuthContext';
import { API_CONFIG } from '../../../config/api';

interface SystemInfo {
  version: string;
  status: 'operational' | 'warning' | 'critical' | 'maintenance';
  lastBackup: string;
  nextBackup: string;
  uptime: string;
  environment: string;
}

interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'warning' | 'stopped' | 'starting';
  lastCheck: string;
}

interface SystemSettings {
  maintenanceMode: boolean;
  autoUpdates: boolean;
  debugMode: boolean;
  analytics: boolean;
}

const SystemTab = () => {
  const { refreshData, isRefreshing } = useContext(ManagementContext);
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // State for system data
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: '1.2.3',
    status: 'operational',
    lastBackup: '2025-09-22 03:00:00',
    nextBackup: '2025-09-23 03:00:00',
    uptime: '15d 7h 23m',
    environment: 'production',
  });

  const [resources, setResources] = useState<ResourceUsage>({
    cpu: 45,
    memory: 72,
    disk: 38,
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Server', status: 'running', lastCheck: '1 min ago' },
    { name: 'Database', status: 'running', lastCheck: '1 min ago' },
    { name: 'Cache', status: 'running', lastCheck: '1 min ago' },
    { name: 'Background Jobs', status: 'running', lastCheck: '1 min ago' },
  ]);

  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    autoUpdates: true,
    debugMode: false,
    analytics: true,
  });
  
  // Fetch system data
  const fetchSystemData = async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, uncomment this code to fetch from API
      /*
      if (token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/management/system`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSystemInfo(data.systemInfo);
        setResources(data.resources);
        setServices(data.services);
        setSettings(data.settings);
      } else {
        throw new Error('Authentication token is missing');
      }
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For development, just update with slightly different mock data to show changes
      setResources({
        cpu: Math.floor(Math.random() * 30) + 30, // Between 30-60%
        memory: Math.floor(Math.random() * 40) + 50, // Between 50-90%
        disk: Math.floor(Math.random() * 20) + 30, // Between 30-50%
      });
      
      setServices(prev => prev.map(service => ({
        ...service,
        lastCheck: '1 min ago',
      })));
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle settings changes
  const handleSettingChange = (setting: keyof SystemSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      [setting]: event.target.checked,
    });
  };
  
  // Handle save settings
  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, uncomment this code to save to API
      /*
      if (token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/management/system/settings`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ settings }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        throw new Error('Authentication token is missing');
      }
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaveSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };
  
  // Run backup manually
  const handleRunBackup = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update backup times
      const now = new Date();
      const nextBackup = new Date();
      nextBackup.setDate(nextBackup.getDate() + 1); // Next backup in 1 day
      
      setSystemInfo({
        ...systemInfo,
        lastBackup: now.toISOString().replace('T', ' ').substring(0, 19),
        nextBackup: nextBackup.toISOString().replace('T', ' ').substring(0, 19),
      });
      
      setSaveSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to run backup');
    } finally {
      setLoading(false);
    }
  };
  
  // Connect to ManagementContext refresh
  useEffect(() => {
    if (isRefreshing) {
      fetchSystemData();
    }
  }, [isRefreshing]);
  
  // Initial data fetch
  useEffect(() => {
    fetchSystemData();
  }, [token]);
  
  // Handle close success message
  const handleCloseSuccess = () => {
    setSaveSuccess(false);
  };

  // Show loading state
  if (loading && !isRefreshing) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Success message */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        message="Operation completed successfully"
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSuccess}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">System Status</Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchSystemData}
          disabled={loading || isRefreshing}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">System Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Version</Typography>
                <Typography>{systemInfo.version}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Box display="flex" alignItems="center">
                  {systemInfo.status === 'operational' ? (
                    <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                  ) : (
                    <WarningIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                  )}
                  <Typography>{systemInfo.status}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Uptime</Typography>
                <Typography>{systemInfo.uptime}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Environment</Typography>
                <Typography>{systemInfo.environment}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Resource Usage</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="subtitle2">CPU Usage</Typography>
                  <Typography variant="body2">{resources.cpu}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={resources.cpu} 
                  color={resources.cpu > 80 ? 'error' : resources.cpu > 60 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="subtitle2">Memory Usage</Typography>
                  <Typography variant="body2">{resources.memory}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={resources.memory} 
                  color={resources.memory > 80 ? 'error' : resources.memory > 60 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
              
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="subtitle2">Disk Usage</Typography>
                  <Typography variant="body2">{resources.disk}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={resources.disk} 
                  color={resources.disk > 80 ? 'error' : resources.disk > 60 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DnsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Services Status</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {services.map((service, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: index < services.length - 1 ? 1.5 : 0,
                    pb: index < services.length - 1 ? 1.5 : 0,
                    borderBottom: index < services.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">{service.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last checked: {service.lastCheck}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Box 
                      component="span" 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: service.status === 'running' ? 'success.main' : 'error.main',
                        mr: 1
                      }} 
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {service.status}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CloudIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Backup & Maintenance</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Last Backup</Typography>
                <Typography>{systemInfo.lastBackup}</Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Next Scheduled Backup</Typography>
                <Typography>{systemInfo.nextBackup}</Typography>
              </Box>
              
              <Box pr={2} display="flex" alignItems="center" gap={1}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleRunBackup}
                  disabled={loading}
                >
                  Run Backup Now
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="warning"
                  disabled={loading}
                >
                  System Cleanup
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SecurityIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">System Settings</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={settings.maintenanceMode} color="primary" />}
                label="Maintenance Mode"
              />
              <Typography variant="caption" color="text.secondary" display="block" ml={3.5}>
                When enabled, only administrators can access the system
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={settings.autoUpdates} color="primary" />}
                label="Automatic Updates"
              />
              <Typography variant="caption" color="text.secondary" display="block" ml={3.5}>
                System will automatically apply security updates
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={settings.debugMode} color="primary" />}
                label="Debug Mode"
              />
              <Typography variant="caption" color="text.secondary" display="block" ml={3.5}>
                Enables detailed logs and performance metrics
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={settings.analytics} color="primary" />}
                label="Usage Analytics"
              />
              <Typography variant="caption" color="text.secondary" display="block" ml={3.5}>
                Collect anonymous usage data to improve the system
              </Typography>
            </Grid>
          </Grid>
          
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button 
              variant="contained" 
              startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
              onClick={handleSaveSettings}
              disabled={loading}
            >
              Save Settings
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemTab;
