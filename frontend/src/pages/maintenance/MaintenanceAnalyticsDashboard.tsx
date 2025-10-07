import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SpeedIcon from '@mui/icons-material/Speed';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import WhatsAppAnalyticsService from '../../services/whatsappAnalyticsService';

interface AnalyticsPeriod {
  value: string;
  label: string;
}

const MaintenanceAnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [whatsappData, setWhatsappData] = useState<any>(null);

  const periods: AnalyticsPeriod[] = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' }
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [token]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always load mock data first to ensure page renders
      const mockData = getMockAnalyticsData();
      setAnalyticsData(mockData);
      setWhatsappData(WhatsAppAnalyticsService.getMockAnalytics());

      // Try to load real data in background if token available
      if (token) {
        try {
          const whatsappResponse = await WhatsAppAnalyticsService.getAnalytics(token);
          if (whatsappResponse.success) {
            setWhatsappData(whatsappResponse.data);
          }
        } catch (apiError) {
          console.log('API not available, using mock data');
        }
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data');
      
      // Ensure fallback data is set
      setAnalyticsData(getMockAnalyticsData());
      setWhatsappData(WhatsAppAnalyticsService.getMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const getMockAnalyticsData = () => ({
    performanceMetrics: {
      totalTickets: 156,
      resolvedTickets: 142,
      avgResolutionTime: 4.2,
      systemUptime: 98.7,
      costSavings: 15420,
      preventiveMaintenance: 78
    },
    ticketTrends: [
      { month: 'Jan', created: 24, resolved: 22, preventive: 8 },
      { month: 'Feb', created: 28, resolved: 26, preventive: 12 },
      { month: 'Mar', created: 32, resolved: 30, preventive: 15 },
      { month: 'Apr', created: 26, resolved: 28, preventive: 10 },
      { month: 'May', created: 22, resolved: 24, preventive: 14 },
      { month: 'Jun', created: 24, resolved: 22, preventive: 9 }
    ],
    maintenanceTypes: [
      { name: 'Preventive', value: 45, color: '#4CAF50' },
      { name: 'Corrective', value: 30, color: '#FF9800' },
      { name: 'Emergency', value: 15, color: '#F44336' },
      { name: 'Routine', value: 10, color: '#2196F3' }
    ],
    costAnalysis: [
      { month: 'Jan', preventive: 2400, corrective: 4200, emergency: 1800 },
      { month: 'Feb', preventive: 2800, corrective: 3600, emergency: 2200 },
      { month: 'Mar', preventive: 3200, corrective: 4800, emergency: 1600 },
      { month: 'Apr', preventive: 2600, corrective: 3200, emergency: 2000 },
      { month: 'May', preventive: 2200, corrective: 2800, emergency: 1400 },
      { month: 'Jun', preventive: 2400, corrective: 3400, emergency: 1800 }
    ],
    sitePerformance: [
      { site: 'Nairobi Community Center', uptime: 99.2, efficiency: 94.5, lastMaintenance: '2024-01-15' },
      { site: 'Kisumu School Campus', uptime: 97.8, efficiency: 91.2, lastMaintenance: '2024-01-10' },
      { site: 'Mombasa Market Kiosk', uptime: 98.5, efficiency: 93.8, lastMaintenance: '2024-01-18' },
      { site: 'Eldoret Hospital', uptime: 96.3, efficiency: 88.7, lastMaintenance: '2024-01-08' },
      { site: 'Nakuru Water Station', uptime: 99.1, efficiency: 95.2, lastMaintenance: '2024-01-20' }
    ]
  });

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <LinearProgress sx={{ width: 200 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 2 }} />
            Maintenance Analytics Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={selectedPeriod}
                label="Time Period"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {periods.map((period) => (
                  <MenuItem key={period.value} value={period.value}>
                    {period.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/maintenance')}
            >
              Back to Maintenance
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {analyticsData?.performanceMetrics?.totalTickets || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Tickets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {analyticsData?.performanceMetrics?.resolvedTickets || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {analyticsData?.performanceMetrics?.avgResolutionTime || 0}h
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Resolution
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {analyticsData?.performanceMetrics?.systemUptime || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                System Uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                ${analyticsData?.performanceMetrics?.costSavings?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Cost Savings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {analyticsData?.performanceMetrics?.preventiveMaintenance || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Preventive Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Ticket Trends */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Maintenance Ticket Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.ticketTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="created" stackId="1" stroke="#2196F3" fill="#2196F3" fillOpacity={0.6} />
                <Area type="monotone" dataKey="resolved" stackId="2" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.6} />
                <Area type="monotone" dataKey="preventive" stackId="3" stroke="#FF9800" fill="#FF9800" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Maintenance Types Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Maintenance Types
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.maintenanceTypes || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {(analyticsData?.maintenanceTypes || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Cost Analysis */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <MonetizationOnIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Maintenance Cost Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.costAnalysis || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, '']} />
                <Bar dataKey="preventive" stackId="a" fill="#4CAF50" />
                <Bar dataKey="corrective" stackId="a" fill="#FF9800" />
                <Bar dataKey="emergency" stackId="a" fill="#F44336" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* WhatsApp Analytics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              WhatsApp Support Metrics
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Total Messages</Typography>
              <Typography variant="h5">{whatsappData?.totalMessages || 0}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Active Chats</Typography>
              <Typography variant="h5">{whatsappData?.activeChats || 0}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Issues Reported</Typography>
              <Typography variant="h5">{whatsappData?.issuesReported || 0}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Avg Response Time</Typography>
              <Typography variant="h5">{whatsappData?.avgResponseTime || 0}h</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Site Performance Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <SpeedIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Site Performance Overview
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Site Name</TableCell>
                    <TableCell align="center">Uptime</TableCell>
                    <TableCell align="center">Efficiency</TableCell>
                    <TableCell align="center">Last Maintenance</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(analyticsData?.sitePerformance || []).map((site: any) => (
                    <TableRow key={site.site}>
                      <TableCell>{site.site}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {site.uptime}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={site.uptime} 
                            sx={{ width: 60, height: 6 }}
                            color={site.uptime > 98 ? 'success' : site.uptime > 95 ? 'warning' : 'error'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {site.efficiency}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={site.efficiency} 
                            sx={{ width: 60, height: 6 }}
                            color={site.efficiency > 90 ? 'success' : site.efficiency > 85 ? 'warning' : 'error'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {new Date(site.lastMaintenance).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={site.uptime > 98 && site.efficiency > 90 ? 'Excellent' : 
                                site.uptime > 95 && site.efficiency > 85 ? 'Good' : 'Needs Attention'}
                          color={site.uptime > 98 && site.efficiency > 90 ? 'success' : 
                                site.uptime > 95 && site.efficiency > 85 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MaintenanceAnalyticsDashboard;
