import React from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useMetrics } from '../contexts/MetricsContext';

/**
 * Test component to verify React Query v5 integration with MetricsContext
 */
const MetricsTest: React.FC = () => {
  // Get metrics from the global context
  const metricsContext = useMetrics();
  
  if (!metricsContext) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          MetricsContext is not available. Make sure this component is wrapped with MetricsProvider.
        </Alert>
      </Box>
    );
  }

  const { 
    metricsSummaryQuery,
    solarMetricsQuery,
    maintenanceMetricsQuery,
    dashboardMetricsQuery,
    refreshAllMetrics
  } = metricsContext;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        React Query v5 Integration Test
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <button onClick={refreshAllMetrics}>
          Refresh All Metrics
        </button>
      </Box>

      {/* Test 1: Metrics Summary */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Metrics Summary Query
        </Typography>
        
        {metricsSummaryQuery.isLoading && <CircularProgress size={24} />}
        
        {metricsSummaryQuery.error ? (
          <Alert severity="error">
            Error: {metricsSummaryQuery.error instanceof Error ? metricsSummaryQuery.error.message : 'An unexpected error occurred'}
          </Alert>
        ) : null}
        
        {metricsSummaryQuery.data && (
          <pre>{JSON.stringify(metricsSummaryQuery.data, null, 2)}</pre>
        )}
      </Paper>

      {/* Test 2: Dashboard Metrics */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Dashboard Metrics Query
        </Typography>
        
        {dashboardMetricsQuery.isLoading && <CircularProgress size={24} />}
        
        {dashboardMetricsQuery.error && (
          <Alert severity="error">
            Error: {dashboardMetricsQuery.error instanceof Error ? dashboardMetricsQuery.error.message : 'An unexpected error occurred'}
          </Alert>
        )}
        
        {dashboardMetricsQuery.data && (
          <pre>{JSON.stringify(dashboardMetricsQuery.data, null, 2)}</pre>
        )}
      </Paper>

      {/* Query State Information */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Query States
        </Typography>
        
        <Typography variant="body2">
          Summary Query: {metricsSummaryQuery.isLoading ? 'Loading' : metricsSummaryQuery.error ? 'Error' : 'Success'}
        </Typography>
        
        <Typography variant="body2">
          Solar Query: {solarMetricsQuery.isLoading ? 'Loading' : solarMetricsQuery.error ? 'Error' : 'Success'}
        </Typography>
        
        <Typography variant="body2">
          Maintenance Query: {maintenanceMetricsQuery.isLoading ? 'Loading' : maintenanceMetricsQuery.error ? 'Error' : 'Success'}
        </Typography>
        
        <Typography variant="body2">
          Dashboard Query: {dashboardMetricsQuery.isLoading ? 'Loading' : dashboardMetricsQuery.error ? 'Error' : 'Success'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MetricsTest;
