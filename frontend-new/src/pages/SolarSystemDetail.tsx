import React from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Divider,
  Chip,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ShowChart as ShowChartIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// Mock data fetch function
const fetchSolarSystem = async (id: string) => {
  // In a real app, this would be an API call with the system ID
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        name: `Solar System ${id.split('-')[1]}`,
        location: `Location ${Math.floor(Math.random() * 100) + 1}`,
        capacity: (Math.random() * 10 + 1).toFixed(2) + ' kW',
        status: ['active', 'inactive', 'maintenance'][Math.floor(Math.random() * 3)],
        installationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        efficiency: (Math.random() * 20 + 80).toFixed(1) + '%',
        dailyProduction: (Math.random() * 50 + 10).toFixed(1) + ' kWh',
        monthlyProduction: (Math.random() * 1000 + 200).toFixed(0) + ' kWh',
        annualProduction: (Math.random() * 12000 + 2400).toFixed(0) + ' kWh',
        alerts: Math.floor(Math.random() * 5),
        warnings: Math.floor(Math.random() * 3),
      });
    }, 500);
  });
};

const SolarSystemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);

  const { data: system, isLoading, error } = useQuery(
    ['solarSystem', id],
    () => fetchSolarSystem(id!)
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusChip = () => {
    if (!system) return null;
    
    const status = system.status;
    const color = status === 'active' 
      ? 'success' 
      : status === 'maintenance' 
        ? 'warning' 
        : 'error';
    
    return (
      <Chip 
        label={status} 
        color={color as any}
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  if (error || !system) {
    return <Typography color="error">Error loading solar system details</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {system.name}
        </Typography>
        <Box sx={{ ml: 2 }}>
          {getStatusChip()}
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => navigate(`/solar-systems/${id}/settings`)}
          sx={{ mr: 1 }}
        >
          Settings
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/solar-systems/${id}/edit`)}
        >
          Edit
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Performance" />
        <Tab label="Alerts" />
        <Tab label="Maintenance" />
        <Tab label="Documents" />
      </Tabs>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              System Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Location</Typography>
                <Typography variant="body1">{system.location}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Capacity</Typography>
                <Typography variant="body1">{system.capacity}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Installation Date</Typography>
                <Typography variant="body1">
                  {format(new Date(system.installationDate), 'MMMM d, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Last Maintenance</Typography>
                <Typography variant="body1">
                  {format(new Date(system.lastMaintenance), 'MMMM d, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Efficiency</Typography>
                <Typography variant="body1">{system.efficiency}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Alerts</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    icon={<ErrorIcon />} 
                    label={`${system.alerts} Alerts`} 
                    color="error" 
                    size="small"
                  />
                  <Chip 
                    icon={<WarningIcon />} 
                    label={`${system.warnings} Warnings`} 
                    color="warning" 
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Production Stats" 
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <IconButton onClick={() => navigate(`/solar-systems/${id}/performance`)}>
                  <ShowChartIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Daily Production</Typography>
                <Typography variant="h6">{system.dailyProduction}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Monthly Production</Typography>
                <Typography variant="h6">{system.monthlyProduction}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Annual Production</Typography>
                <Typography variant="h6">{system.annualProduction}</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardHeader 
              title="Quick Actions" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mb: 1 }}
                onClick={() => navigate(`/solar-systems/${id}/maintenance/new`)}
              >
                Schedule Maintenance
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mb: 1 }}
                onClick={() => navigate(`/solar-systems/${id}/report`)}
              >
                Generate Report
              </Button>
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                onClick={() => navigate(`/solar-systems/${id}/monitor`)}
              >
                Live Monitoring
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {tabValue === 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography color="textSecondary">No recent activity to display</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SolarSystemDetailPage;
