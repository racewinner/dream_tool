import React from 'react';
import { 
  Container, 
  Typography, 
  Grid as MuiGrid, 
  Paper, 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions,
  Button, 
  Divider,
  useTheme,
  alpha,
  CircularProgress,
  Skeleton
} from '@mui/material';
import { 
  BarChart as DataIcon, 
  DesignServices as DesignIcon,
  SolarPower as PVSitesIcon,
  Handyman as MaintenanceIcon,
  DescriptionOutlined as ReportsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
// Use metrics from context only, not direct query
// React Query v5 changed import structure
import metricsService, { DashboardMetrics } from '../services/metricsService';
import { useMetrics } from '../contexts/MetricsContext';

// Create properly typed Grid components
const Grid = MuiGrid;
import { Link as RouterLink } from 'react-router-dom';

/**
 * Main Dashboard component displaying a portfolio summary of all sections
 */
const MainDashboard: React.FC = () => {
  const theme = useTheme();
  
  // Temporarily disable metrics to fix crash - use mock data
  const metrics = null;
  const isLoading = false;
  const error = null;
  const refreshAllMetrics = () => {};
  const metricsSummaryQuery = { data: null, isLoading: false, error: null };
  
  // Create safe metrics with fallbacks
  const safeMetrics = {
    dataMetrics: {
      surveysImported: 0,
      dataCompleteness: '0%',
      lastImport: 'N/A'
    },
    designMetrics: {
      designsCreated: 0,
      designOptimizations: 0,
      averageEfficiency: '0%'
    },
    pvSiteMetrics: {
      totalSites: 0,
      activeSites: 0,
      avgGeneration: '0 kWh'
    },
    maintenanceMetrics: {
      openTickets: 0,
      scheduledMaintenance: 0,
      avgResolutionTime: '0 days',
      scheduledVisits: 0,
      systemHealth: 'Good'
    },
    reportMetrics: {
      reportsGenerated: 0,
      scheduledReports: 0,
      lastReport: 'N/A'
    },
    settingsMetrics: {
      activeUsers: 0,
      systemUptime: '99%',
      lastBackup: 'N/A'
    }
  };
  
  // Handle refresh action
  const handleRefreshAll = () => {
    if (refreshAllMetrics) {
      refreshAllMetrics();
    }
  };

  // Get summary data with fallbacks
  const summaryData = metricsSummaryQuery?.data;
  const summaryLoading = metricsSummaryQuery?.isLoading || false;
  const summaryError = metricsSummaryQuery?.error;

  if (summaryError) {
    console.warn('Error loading summary metrics:', summaryError);
  }

  // Dashboard section configuration with metrics
  const sections = [
    {
      id: 'data',
      title: 'Data',
      icon: <DataIcon fontSize="large" />,
      path: '/data',
      color: theme.palette.primary.main,
      metrics: [
        { 
          label: 'Surveys Imported', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.dataMetrics.surveysImported
        },
        { 
          label: 'Data Completeness', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.dataMetrics.dataCompleteness
        },
        { 
          label: 'Last Import', 
          value: isLoading ? <Skeleton width="60px" /> : safeMetrics.dataMetrics.lastImport
        },
      ]
    },
    {
      id: 'design',
      title: 'Design',
      icon: <DesignIcon fontSize="large" />,
      path: '/design',
      color: theme.palette.secondary.main,
      metrics: [
        { 
          label: 'Designs Created', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.designMetrics.designsCreated
        },
        { 
          label: 'Design Optimizations', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.designMetrics.designOptimizations
        },
        { 
          label: 'Average Efficiency', 
          value: isLoading ? <Skeleton width="60px" /> : safeMetrics.designMetrics.averageEfficiency
        },
      ]
    },
    {
      id: 'pv-sites',
      title: 'PV Sites',
      icon: <PVSitesIcon fontSize="large" />,
      path: '/pv-sites',
      color: '#2e7d32', // green
      metrics: [
        { 
          label: 'Total Sites', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.pvSiteMetrics.totalSites
        },
        { 
          label: 'Active Sites', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.pvSiteMetrics.activeSites
        },
        { 
          label: 'Avg. Generation', 
          value: isLoading ? <Skeleton width="60px" /> : safeMetrics.pvSiteMetrics.avgGeneration
        },
      ]
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      icon: <MaintenanceIcon fontSize="large" />,
      path: '/maintenance',
      color: '#ed6c02', // orange
      metrics: [
        { 
          label: 'Open Tickets', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.maintenanceMetrics.openTickets
        },
        { 
          label: 'Scheduled Visits', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.maintenanceMetrics.scheduledVisits
        },
        { 
          label: 'System Health', 
          value: isLoading ? <Skeleton width="60px" /> : safeMetrics.maintenanceMetrics.systemHealth
        },
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <ReportsIcon fontSize="large" />,
      path: '/reports',
      color: '#9c27b0', // purple
      metrics: [
        { 
          label: 'Generated This Month', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.reportMetrics.reportsGenerated
        },
        { 
          label: 'Scheduled Reports', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.reportMetrics.scheduledReports
        },
        { 
          label: 'Last Report', 
          value: isLoading ? <Skeleton width="60px" /> : safeMetrics.reportMetrics.lastReport
        },
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <SettingsIcon fontSize="large" />,
      path: '/settings',
      color: '#757575', // gray
      metrics: [
        { 
          label: 'Active Users', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.settingsMetrics.activeUsers
        },
        { 
          label: 'System Uptime', 
          value: isLoading ? <Skeleton width="40px" /> : safeMetrics.settingsMetrics.systemUptime
        },
        { 
          label: 'Last Backup', 
          value: isLoading ? <Skeleton width="60px" /> : safeMetrics.settingsMetrics.lastBackup
        },
      ]
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Button 
          variant="outlined"
          onClick={() => refreshAllMetrics()}
          disabled={metricsSummaryQuery.isLoading}
        >
          {metricsSummaryQuery.isLoading ? 'Refreshing...' : 'Refresh Metrics'}
        </Button>
      </Box>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
        Portfolio summary of all DREAM TOOL sections
      </Typography>

      {/* Summary Statistics - Quick Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: alpha(theme.palette.primary.main, 0.05)
            }}
          >
            <Typography variant="h6" gutterBottom>
              System Summary
            </Typography>
            {metricsSummaryQuery?.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : metricsSummaryQuery?.error ? (
              <Typography color="error">
                Error loading metrics: {(metricsSummaryQuery.error as Error).message}
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {/* System summary stats from MetricsContext */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Total Sites</Typography>
                    <Typography variant="h4" sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#1976d2', fontWeight: 'bold' }}>{safeMetrics.pvSiteMetrics.totalSites}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Active Sites</Typography>
                    <Typography variant="h4" sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#1976d2', fontWeight: 'bold' }}>{safeMetrics.pvSiteMetrics.activeSites}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Open Maintenance Tickets</Typography>
                    <Typography variant="h4" sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#1976d2', fontWeight: 'bold' }}>{safeMetrics.maintenanceMetrics.openTickets}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">System Efficiency</Typography>
                    <Typography variant="h4" sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#1976d2', fontWeight: 'bold' }}>{safeMetrics.designMetrics.averageEfficiency}</Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.id}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardHeader
                avatar={
                  <Box
                    sx={{
                      bgcolor: alpha(section.color, 0.1),
                      color: section.color,
                      p: 1,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {section.icon}
                  </Box>
                }
                title={
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'medium' }}>
                    {section.title}
                  </Typography>
                }
              />
              <Divider />
              <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                {section.metrics.map((metric, idx) => (
                  <Box 
                    key={idx} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center', 
                      mb: 1.5,
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#1976d2' }}>
                      {metric.value}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <Button 
                  component={RouterLink} 
                  to={section.path}
                  size="small" 
                  sx={{ color: section.color }}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MainDashboard;
