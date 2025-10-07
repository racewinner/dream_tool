import React, { useContext, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Button, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSystemData } from '../hooks';
import { MetricCard } from '../components';
import { ManagementContext } from '../ManagementLanding';

export const OverviewTab = () => {
  const { data, loading, error, refresh } = useSystemData();
  const { refreshData, isRefreshing } = useContext(ManagementContext);
  
  // Connect the useSystemData refresh function to the ManagementContext
  useEffect(() => {
    // When ManagementContext triggers refresh, refresh our system data
    if (isRefreshing) {
      refresh();
    }
  }, [isRefreshing, refresh]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading system data: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">System Overview</Typography>
        <Tooltip title="Refresh system data">
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={() => refreshData()}
            disabled={loading || isRefreshing}
          >
            Refresh
          </Button>
        </Tooltip>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <MetricCard 
            title="Total Users" 
            value={data?.totalUsers || 0} 
            trend="up"
            trendValue="12%"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard 
            title="Active Users" 
            value={data?.activeUsers || 0} 
            trend="up"
            trendValue="5%"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard 
            title="System Health" 
            value={data?.systemHealth || 'N/A'} 
            status={data?.systemHealth === 'healthy' ? 'success' : 'error'}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Activity</Typography>
        {/* Add activity timeline or logs here */}
      </Paper>
    </Box>
  );
};

export default OverviewTab;
