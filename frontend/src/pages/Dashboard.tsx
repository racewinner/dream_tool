import React, { useRef, useState, useCallback } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  ButtonGroup,
  Button,
  MenuItem,
  TextField,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Timeline as TimelineIcon,
  Equalizer as EqualizerIcon,
  BatteryChargingFull as BatteryIcon,
  SolarPower as SolarIcon,
  ShowChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ChartData, ChartOptions, registerables, Chart } from 'chart.js';
import { Chart as ReactChart } from 'react-chartjs-2';

// Import our chart components
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import ChartContainer from '../components/charts/ChartContainer';
import { generateColorPalette } from '../components/charts/utils';
import { handleDownloadClick, ExportOptions } from '../components/charts/exportUtils';

// Register ChartJS components
ChartJS.register(...registerables);

// Sample data for the dashboard
const generateSampleData = (theme: any) => {
  const colors = generateColorPalette(theme);
  
  // Energy production data (hourly for a day)
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const energyData = Array.from({ length: 24 }, (_, i) => {
    // Simulate solar production curve
    const hour = i % 24;
    let value = 0;
    if (hour >= 6 && hour <= 18) {
      // Parabolic curve between 6am and 6pm
      const x = (hour - 6) / 6 - 1; // -1 to 1
      value = Math.round(100 * (1 - x * x) * (Math.random() * 0.2 + 0.9)); // 90-110% of curve
    }
    return Math.max(0, value);
  });

  // System status data
  const systemStatus = [
    { name: 'Online', value: 24, color: colors[0] },
    { name: 'Maintenance', value: 3, color: colors[1] },
    { name: 'Offline', value: 1, color: colors[2] },
  ];

  // Performance metrics
  const performanceData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Efficiency (%)',
        data: [85, 78, 92, 88, 95, 82, 90],
        borderColor: colors[3],
        backgroundColor: theme.palette.mode === 'dark' 
          ? `${colors[3]}40` 
          : `${colors[3]}20`,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Energy production by source
  const energyBySource = {
    labels: ['Solar PV', 'Battery', 'Grid'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [colors[0], colors[1], colors[2]],
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
      },
    ],
  };

  // Recent alerts
  const recentAlerts = [
    { id: 1, message: 'High temperature detected at Inverter A', severity: 'high', time: '10:30 AM' },
    { id: 2, message: 'Scheduled maintenance completed', severity: 'info', time: 'Yesterday' },
    { id: 3, message: 'Battery level below 20%', severity: 'medium', time: '2 days ago' },
  ];

  // KPI data
  const kpis = [
    { 
      title: 'Daily Production', 
      value: '1,245 kWh', 
      change: 12.5, 
      icon: <SolarIcon fontSize="large" color="primary" />,
      color: colors[0],
    },
    { 
      title: 'System Efficiency', 
      value: '92.5%', 
      change: 2.3, 
      icon: <EqualizerIcon fontSize="large" color="secondary" />,
      color: colors[1],
    },
    { 
      title: 'Battery Level', 
      value: '78%', 
      change: -5.2, 
      icon: <BatteryIcon fontSize="large" color="success" />,
      color: colors[2],
    },
  ];

  return {
    hours,
    energyData,
    systemStatus,
    performanceData,
    energyBySource,
    recentAlerts,
    kpis,
  };
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [timeRange, setTimeRange] = useState<string>('week');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Generate sample data
  const {
    hours,
    energyData,
    systemStatus,
    performanceData,
    energyBySource,
    recentAlerts,
    kpis,
  } = generateSampleData(theme);

  // Refs for charts to enable export
  const energyChartRef = useRef<Chart>(null);
  const performanceChartRef = useRef<Chart>(null);
  const sourceChartRef = useRef<Chart>(null);
  const statusChartRef = useRef<Chart>(null);

  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
    // In a real app, you would fetch new data based on the selected range
    // For now, we'll just regenerate sample data
    // fetchData(event.target.value);
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
      // In a real app, you would fetch new data here
      // fetchData(timeRange);
    }, 1000);
  }, [timeRange]);

  // Handle chart export
  const handleExportChart = (chartRef: React.RefObject<Chart>, title: string, format: 'png' | 'jpeg' | 'pdf' = 'png') => {
    if (chartRef.current) {
      const options: Partial<ExportOptions> = {
        chart: chartRef.current,
        title: title,
        format: format,
        backgroundColor: theme.palette.background.default,
      };
      
      handleDownloadClick(chartRef.current, options);
    }
  };

  // Chart options
  const energyChartData: ChartData<'line'> = {
    labels: hours,
    datasets: [
      {
        label: 'Energy Production (kWh)',
        data: energyData,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.mode === 'dark' 
          ? `${theme.palette.primary.main}40` 
          : `${theme.palette.primary.main}20`,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const energyChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'kWh',
        },
      },
    },
  };

  const statusChartData: ChartData<'doughnut'> = {
    labels: systemStatus.map(item => item.name),
    datasets: [
      {
        data: systemStatus.map(item => item.value),
        backgroundColor: systemStatus.map(item => item.color),
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
      },
    ],
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
              size="small"
            >
              <MenuItem value="day">Last 24 Hours</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      {kpi.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {kpi.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {kpi.change >= 0 ? (
                        <ArrowUpwardIcon color="success" fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon color="error" fontSize="small" />
                      )}
                      <Typography 
                        variant="body2" 
                        color={kpi.change >= 0 ? 'success.main' : 'error.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {Math.abs(kpi.change)}% {kpi.change >= 0 ? 'increase' : 'decrease'} from last period
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? `${kpi.color}20` 
                        : `${kpi.color}10`,
                      borderRadius: '50%',
                      width: 60,
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {kpi.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Charts */}
      <Grid container spacing={3}>
        {/* Energy Production Chart */}
        <Grid item xs={12} lg={8}>
          <ChartContainer
            title="Energy Production"
            subtitle="Hourly energy production for today"
            loading={isRefreshing}
            onRefresh={handleRefresh}
            onDownload={() => handleExportChart(energyChartRef, 'energy-production')}
            height={400}
          >
            <Box sx={{ position: 'relative', height: 350 }}>
              <LineChart
                data={energyChartData}
                options={energyChartOptions}
                height={350}
              />
              <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                <ButtonGroup size="small" variant="contained" color="primary">
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChart(energyChartRef, 'Energy Production', 'png');
                    }}
                    title="Download as PNG"
                  >
                    <DownloadIcon fontSize="small" />
                  </Button>
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChart(energyChartRef, 'Energy Production', 'pdf');
                    }}
                    title="Download as PDF"
                  >
                    <PictureAsPdfIcon fontSize="small" />
                  </Button>
                </ButtonGroup>
              </Box>
            </Box>
          </ChartContainer>
        </Grid>

        {/* System Status */}
        <Grid item xs={12} lg={4}>
          <ChartContainer
            title="System Status"
            subtitle="Current system status overview"
            loading={isRefreshing}
            height={400}
          >
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <PieChart
                data={statusChartData}
                donut
                donutThickness={0.6}
                showLabels
                legendPosition="bottom"
              />
            </Box>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <ButtonGroup size="small" sx={{ mb: 1 }}>
                <Button 
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportChart(statusChartRef, 'System Status', 'png')}
                >
                  PNG
                </Button>
                <Button 
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportChart(statusChartRef, 'System Status', 'pdf')}
                >
                  PDF
                </Button>
                <Button startIcon={<FullscreenIcon />}>Fullscreen</Button>
              </ButtonGroup>
            </Box>
          </ChartContainer>
        </Grid>

        {/* Performance Trend */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Performance Trend"
            subtitle="Weekly system efficiency"
            loading={isRefreshing}
            height={350}
          >
            <Box sx={{ position: 'relative', height: 250 }}>
              <LineChart
                data={performanceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      min: 70,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Efficiency (%)',
                      },
                    },
                  },
                }}
                height={250}
              />
              <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                <ButtonGroup size="small" variant="contained" color="primary">
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChart(performanceChartRef, 'Performance Trend', 'png');
                    }}
                    title="Download as PNG"
                  >
                    <DownloadIcon fontSize="small" />
                  </Button>
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChart(performanceChartRef, 'Performance Trend', 'pdf');
                    }}
                    title="Download as PDF"
                  >
                    <PictureAsPdfIcon fontSize="small" />
                  </Button>
                </ButtonGroup>
              </Box>
            </Box>
          </ChartContainer>
        </Grid>

        {/* Energy by Source */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Energy by Source"
            subtitle="Current energy distribution"
            loading={isRefreshing}
            height={350}
          >
            <Box sx={{ position: 'relative', height: 250 }}>
              <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center' }}>
                <BarChart
                  data={energyBySource}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </Box>
              <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                <ButtonGroup size="small" variant="contained" color="primary">
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChart(sourceChartRef, 'Energy by Source', 'png');
                    }}
                    title="Download as PNG"
                  >
                    <DownloadIcon fontSize="small" />
                  </Button>
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportChart(sourceChartRef, 'Energy by Source', 'pdf');
                    }}
                    title="Download as PDF"
                  >
                    <PictureAsPdfIcon fontSize="small" />
                  </Button>
                </ButtonGroup>
              </Box>
            </Box>
          </ChartContainer>
        </Grid>
      </Grid>

      {/* Recent Alerts */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    Recent Alerts
                  </Typography>
                </Box>
              }
              action={
                <Button size="small" color="primary">
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {recentAlerts.map((alert, index) => (
                <Box 
                  key={alert.id} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    py: 1.5,
                    borderBottom: index < recentAlerts.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 
                        alert.severity === 'high' ? 'error.main' : 
                        alert.severity === 'medium' ? 'warning.main' : 'info.main',
                      mr: 2,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {alert.time}
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
