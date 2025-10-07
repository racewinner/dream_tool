import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface DashboardData {
  totalSystems: number;
  totalCapacity: string;
  monthlyGeneration: string;
  alerts: number;
}

// Mock data fetch function
const fetchDashboardData = async (): Promise<DashboardData> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalSystems: 12,
        totalCapacity: '45.2 MW',
        monthlyGeneration: '2.8 GWh',
        alerts: 3,
      });
    }, 500);
  });
};

const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardData>({ queryKey: ['dashboardData'], queryFn: fetchDashboardData });

  if (isLoading) {
    return <Typography>Loading dashboard data...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error loading dashboard data</Typography>;
  }

  const stats = [
    { title: 'Total Systems', value: data?.totalSystems },
    { title: 'Total Capacity', value: data?.totalCapacity },
    { title: 'Monthly Generation', value: data?.monthlyGeneration },
    { title: 'Active Alerts', value: data?.alerts },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 120,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {stat.title}
              </Typography>
              <Typography variant="h4">
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Placeholder for charts */}
      <Box mt={4}>
        <Paper sx={{ p: 2, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Performance Charts Coming Soon
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardPage;
