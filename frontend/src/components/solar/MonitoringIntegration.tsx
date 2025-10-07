import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  Refresh,
  Add,
  Check,
  Warning,
  Error,
  Info,
  LinkOff,
  Link,
  Visibility,
  CalendarToday,
  Speed,
  BatteryChargingFull,
  BarChart as BarChartIcon,
  CompareArrows,
  Settings
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

import { solarMonitoringService, MonitoringData, CorrelationResult } from '../../services/solarMonitoringService';
import { solarAnalysisService } from '../../services/solarAnalysisService';

interface MonitoringIntegrationProps {
  facilityId: number;
  assessmentId: string;
}

const MonitoringIntegration: React.FC<MonitoringIntegrationProps> = ({ facilityId, assessmentId }) => {
  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [siteId, setSiteId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [correlationResult, setCorrelationResult] = useState<CorrelationResult | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dataType, setDataType] = useState<string>('production');
  const [resolution, setResolution] = useState<string>('day');
  const [registerDialogOpen, setRegisterDialogOpen] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'failed'>('untested');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  
  // Load providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const result = await solarMonitoringService.getSupportedProviders();
        setProviders(result.providers);
        
        if (result.providers.length > 0) {
          setSelectedProvider(result.providers[0].id);
        }
      } catch (err) {
        console.error('Failed to load monitoring providers:', err);
        setError('Failed to load monitoring providers. Please try again.');
      }
    };
    
    loadProviders();
    
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);
  
  // Test connection
  const handleTestConnection = async () => {
    if (!selectedProvider || !siteId) {
      setError('Please select a provider and enter a site ID');
      return;
    }
    
    setTestingConnection(true);
    setError(null);
    
    try {
      const result = await solarMonitoringService.testMonitoringConnection({
        provider: selectedProvider,
        siteId: siteId,
        apiKey: apiKey || undefined
      });
      
      setConnectionStatus(result.connection_status === 'success' ? 'success' : 'failed');
    } catch (err) {
      console.error('Failed to test connection:', err);
      setError('Failed to test connection. Please check your credentials and try again.');
      setConnectionStatus('failed');
    } finally {
      setTestingConnection(false);
    }
  };
  
  // Register monitoring system
  const handleRegisterSystem = async () => {
    if (!selectedProvider || !siteId || !facilityId) {
      setError('Please select a provider and enter a site ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await solarMonitoringService.registerMonitoringSystem({
        facilityId: facilityId,
        provider: selectedProvider,
        siteId: siteId,
        apiKey: apiKey || undefined,
        siteName: `Facility ${facilityId} Monitoring`
      });
      
      setRegisterDialogOpen(false);
      
      // Load monitoring data after registration
      await loadMonitoringData();
    } catch (err) {
      console.error('Failed to register monitoring system:', err);
      setError('Failed to register monitoring system. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load monitoring data
  const loadMonitoringData = async () => {
    if (!selectedProvider || !siteId || !facilityId) {
      setError('Please select a provider and enter a site ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await solarMonitoringService.getMonitoringData({
        facilityId: facilityId,
        provider: selectedProvider,
        siteId: siteId,
        startDate: startDate,
        endDate: endDate,
        dataType: dataType,
        resolution: resolution
      });
      
      setMonitoringData(data);
      
      // Clear correlation result when new data is loaded
      setCorrelationResult(null);
    } catch (err) {
      console.error('Failed to load monitoring data:', err);
      setError('Failed to load monitoring data. Please check your settings and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Correlate with assessment
  const handleCorrelate = async () => {
    if (!assessmentId || !selectedProvider || !siteId) {
      setError('Please select a provider and enter a site ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await solarMonitoringService.correlateWithAssessment({
        assessmentId: assessmentId,
        provider: selectedProvider,
        siteId: siteId,
        startDate: startDate,
        endDate: endDate,
        dataType: dataType,
        resolution: resolution
      });
      
      setCorrelationResult(result);
    } catch (err) {
      console.error('Failed to correlate monitoring data:', err);
      setError('Failed to correlate monitoring data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format chart data
  const formatChartData = (data: MonitoringData | null) => {
    if (!data || !data.values) return [];
    
    return data.values.map(point => ({
      date: format(parseISO(point.date), 'MMM dd'),
      value: point.value,
      fullDate: point.date
    }));
  };
  
  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <Error color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };
  
  // Render monitoring data chart
  const renderMonitoringChart = () => {
    const chartData = formatChartData(monitoringData);
    
    if (chartData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No monitoring data available
          </Typography>
        </Box>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip
            formatter={(value: number) => [`${value} ${monitoringData?.unit}`, dataType]}
            labelFormatter={(label: string) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name={dataType}
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render correlation chart
  const renderCorrelationChart = () => {
    if (!correlationResult) return null;
    
    const chartData = [
      {
        name: 'Expected',
        value: correlationResult.expected_production || 0
      },
      {
        name: 'Actual',
        value: correlationResult.monitoring_summary.total || 0
      }
    ];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <RechartsTooltip
            formatter={(value: number) => [`${value} Wh`, 'Energy']}
          />
          <Legend />
          <Bar dataKey="value" name="Energy" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Solar Monitoring Integration
      </Typography>
      
      {/* Connection Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="provider-label">Monitoring Provider</InputLabel>
              <Select
                labelId="provider-label"
                id="provider"
                value={selectedProvider}
                label="Monitoring Provider"
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                {providers.map((provider) => (
                  <MenuItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Site ID"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="API Key (optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={testingConnection || !selectedProvider || !siteId}
                startIcon={testingConnection ? <CircularProgress size={20} /> : <LinkOff />}
              >
                Test Connection
              </Button>
              
              <Button
                variant="contained"
                onClick={() => setRegisterDialogOpen(true)}
                startIcon={<Add />}
              >
                Register
              </Button>
            </Box>
          </Grid>
          
          {connectionStatus !== 'untested' && (
            <Grid item xs={12}>
              <Alert severity={connectionStatus === 'success' ? 'success' : 'error'}>
                {connectionStatus === 'success'
                  ? 'Connection successful! You can now load monitoring data.'
                  : 'Connection failed. Please check your credentials and try again.'}
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Data Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Selection
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="data-type-label">Data Type</InputLabel>
              <Select
                labelId="data-type-label"
                id="data-type"
                value={dataType}
                label="Data Type"
                onChange={(e) => setDataType(e.target.value)}
              >
                <MenuItem value="production">Production</MenuItem>
                <MenuItem value="consumption">Consumption</MenuItem>
                <MenuItem value="power">Power</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="resolution-label">Resolution</InputLabel>
              <Select
                labelId="resolution-label"
                id="resolution"
                value={resolution}
                label="Resolution"
                onChange={(e) => setResolution(e.target.value)}
              >
                <MenuItem value="quarter_hour">15 Minutes</MenuItem>
                <MenuItem value="hour">Hour</MenuItem>
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={loadMonitoringData}
                disabled={loading || !selectedProvider || !siteId}
                startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
                fullWidth
              >
                Load Data
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Monitoring Data */}
      {monitoringData && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Monitoring Data
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {renderMonitoringChart()}
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardHeader title="Summary" />
                <CardContent>
                  <Grid container spacing={2}>
                    {monitoringData.summary.total !== undefined && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Total</Typography>
                        <Typography variant="body1">{monitoringData.summary.total.toLocaleString()} {monitoringData.unit}</Typography>
                      </Grid>
                    )}
                    
                    {monitoringData.summary.average !== undefined && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Average</Typography>
                        <Typography variant="body1">{monitoringData.summary.average.toLocaleString()} {monitoringData.unit}</Typography>
                      </Grid>
                    )}
                    
                    {monitoringData.summary.max !== undefined && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Maximum</Typography>
                        <Typography variant="body1">{monitoringData.summary.max.toLocaleString()} {monitoringData.unit}</Typography>
                      </Grid>
                    )}
                    
                    {monitoringData.summary.min !== undefined && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Minimum</Typography>
                        <Typography variant="body1">{monitoringData.summary.min.toLocaleString()} {monitoringData.unit}</Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Data Points</Typography>
                      <Typography variant="body1">{monitoringData.summary.count}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleCorrelate}
                  disabled={loading || !assessmentId}
                  startIcon={loading ? <CircularProgress size={20} /> : <CompareArrows />}
                  fullWidth
                >
                  Correlate with Assessment
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Correlation Results */}
      {correlationResult && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Correlation Results
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Performance Analysis" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Expected Production</Typography>
                      <Typography variant="body1">
                        {correlationResult.expected_production
                          ? `${(correlationResult.expected_production * 1000).toLocaleString()} Wh`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Actual Production</Typography>
                      <Typography variant="body1">
                        {correlationResult.monitoring_summary.total
                          ? `${correlationResult.monitoring_summary.total.toLocaleString()} Wh`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Performance Ratio</Typography>
                      <Typography variant="body1">
                        {correlationResult.performance_ratio
                          ? `${(correlationResult.performance_ratio * 100).toFixed(1)}%`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Monitoring Period</Typography>
                      <Typography variant="body1">
                        {correlationResult.monitoring_period.days.toFixed(1)} days
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {renderCorrelationChart()}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader 
                  title="Issues Correlation" 
                  subheader={`${correlationResult.correlation_summary.correlated_issues} of ${correlationResult.correlation_summary.total_issues} issues correlated with monitoring data`}
                />
                <CardContent>
                  <List dense>
                    {correlationResult.correlated_issues
                      .filter(issue => issue.monitoring_evidence)
                      .map((issue) => (
                        <ListItem key={issue.id}>
                          <ListItemIcon>
                            {getSeverityIcon(issue.severity)}
                          </ListItemIcon>
                          <ListItemText
                            primary={issue.issue_type.replace(/_/g, ' ')}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {issue.monitoring_evidence}
                                </Typography>
                                <br />
                                <Typography variant="caption" component="span">
                                  Confidence: {(issue.adjusted_confidence || issue.confidence_score) * 100}%
                                  {issue.adjusted_confidence && issue.adjusted_confidence > issue.confidence_score && (
                                    <span> (+{((issue.adjusted_confidence - issue.confidence_score) * 100).toFixed(0)}%)</span>
                                  )}
                                </Typography>
                              </>
                            }
                          />
                          <Chip
                            label={issue.severity}
                            size="small"
                            color={getSeverityColor(issue.severity) as any}
                          />
                        </ListItem>
                      ))}
                  </List>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    New Issues Detected from Monitoring
                  </Typography>
                  
                  {correlationResult.monitoring_issues.length > 0 ? (
                    <List dense>
                      {correlationResult.monitoring_issues.map((issue, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {getSeverityIcon(issue.severity)}
                          </ListItemIcon>
                          <ListItemText
                            primary={issue.issue_type.replace(/_/g, ' ')}
                            secondary={issue.description}
                          />
                          <Chip
                            label={issue.severity}
                            size="small"
                            color={getSeverityColor(issue.severity) as any}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No new issues detected from monitoring data
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Register Dialog */}
      <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)}>
        <DialogTitle>Register Monitoring System</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1" paragraph>
              Register this monitoring system for Facility #{facilityId}?
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Provider"
                  value={providers.find(p => p.id === selectedProvider)?.name || selectedProvider}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Site ID"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key (optional)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRegisterSystem}
            variant="contained"
            disabled={loading || !selectedProvider || !siteId}
          >
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonitoringIntegration;
