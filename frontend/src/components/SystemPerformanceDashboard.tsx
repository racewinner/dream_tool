import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Divider, 
  Grid, 
  Box, 
  LinearProgress, 
  Alert as MuiAlert,
  Button as MuiButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../services/api';
import { SystemStatus } from '../types/solarSystem';

// Define SystemPerformanceMetrics interface locally
interface SystemPerformanceMetrics {
  energyGeneration: number;
  systemEfficiency: number;
  uptime: number;
  maintenanceScore: number;
  efficiency: number;
  systemAvailability: number;
  dailyGeneration: number;
  monthlyGeneration: number;
  yearlyGeneration: number;
  maintenanceCosts: {
    total: number;
    averagePerKw: number;
  };
}

// Mock performance data for charts
const mockPerformanceData = [
  { time: '00:00', generation: 0, efficiency: 0 },
  { time: '06:00', generation: 25, efficiency: 85 },
  { time: '12:00', generation: 100, efficiency: 92 },
  { time: '18:00', generation: 45, efficiency: 88 },
  { time: '24:00', generation: 0, efficiency: 0 }
];

interface SystemPerformanceDashboardProps {
  systemId: number;
}

const SystemPerformanceDashboard: React.FC<SystemPerformanceDashboardProps> = ({ systemId }) => {
  const { token } = useAuth();
  const api = useApi(token);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<SystemPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([]);

  useEffect(() => {
    fetchSystemData();
  }, [systemId]);

  const fetchSystemData = async () => {
    try {
      // Mock data since API methods don't exist
      const status = null;
      const metrics = null;
      const schedule: any[] = [];
      setSystemStatus(status);
      setPerformanceMetrics(metrics);
      setMaintenanceSchedule(schedule);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system data');
      setLoading(false);
    }
  };

  const maintenanceColumns = [
    {
      title: 'Date',
      dataIndex: 'nextDate',
      key: 'nextDate',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Type',
      dataIndex: 'maintenanceType',
      key: 'maintenanceType'
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority'
    },
    {
      title: 'Facility',
      dataIndex: 'facility',
      key: 'facility'
    }
  ];

  const getHealthColor = (healthScore: number) => {
    if (healthScore >= 90) return 'success';
    if (healthScore >= 70) return 'processing';
    if (healthScore >= 50) return 'warning';
    return 'error';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'success';
      case 'MODERATE':
        return 'processing';
      case 'HIGH':
        return 'warning';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        System Performance Dashboard
      </Typography>
      
      {error && (
        <MuiAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </MuiAlert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>System Health</Typography>
            <Typography variant="h4" sx={{ color: getHealthColor(systemStatus?.healthScore || 0) }}>
              {systemStatus?.healthScore || 0}/100
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={systemStatus?.healthScore || 0} 
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Risk Level</Typography>
            <Typography variant="h4" sx={{ color: getRiskColor(systemStatus?.riskLevel || 'LOW') }}>
              {systemStatus?.riskLevel || 'LOW'}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={systemStatus?.healthScore || 0} 
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Efficiency</Typography>
            <Typography variant="h4" color="success.main">
              {performanceMetrics?.efficiency || 0}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={performanceMetrics?.efficiency || 0} 
              color="success"
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>System Uptime</Typography>
            <Typography variant="h4" color="primary.main">
              {performanceMetrics?.systemAvailability || 0}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={performanceMetrics?.systemAvailability || 0} 
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={0}>
          <Tab label="Performance Metrics" />
          <Tab label="Maintenance Schedule" />
          <Tab label="System Alerts" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Energy Generation Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="generation" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>System Efficiency</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Maintenance Schedule Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Maintenance Schedule
        </Typography>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Facility</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {maintenanceSchedule.slice(0, 5).map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(item.nextDate).toLocaleDateString()}</TableCell>
                  <TableCell>{item.maintenanceType}</TableCell>
                  <TableCell>{item.priority}</TableCell>
                  <TableCell>{item.facility}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* System Alerts Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          System Alerts
        </Typography>
        {systemStatus?.alerts?.map((alert, index) => (
          <MuiAlert
            key={index}
            severity="warning"
            sx={{ mb: 2 }}
          >
            {alert}
          </MuiAlert>
        )) || (
          <Typography color="text.secondary">
            No active alerts
          </Typography>
        )}
      </Box>

      {/* Recent Maintenance History Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Maintenance History
        </Typography>
        {maintenanceSchedule.length > 0 ? (
          <Box sx={{ pl: 2 }}>
            {maintenanceSchedule.slice(0, 3).map((item, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {new Date(item.nextDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  {item.maintenanceType} - {item.facility}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Priority: {item.priority}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">
            No maintenance history available
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default SystemPerformanceDashboard;
