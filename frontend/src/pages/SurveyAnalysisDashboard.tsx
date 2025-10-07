import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  Paper, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Snackbar,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../contexts/AuthContext';

// Interface for survey data from /api/surveys endpoint
interface SurveyData {
  id: number;
  externalId: string;
  facilityName: string;
  region: string;
  district: string;
  facilityType: string;
  completionDate: string;
  completeness: number;
  qualityScore: number;
  departmentCount: number;
  equipmentCount: number;
  powerSource: string;
}

interface SurveySummary {
  totalSurveys: number;
  completedSurveys: number;
  averageCompleteness: number;
  totalResponses: number;
  lastUpdated: string;
}

interface SurveyResponse {
  surveys: SurveyData[];
  summary: SurveySummary;
}

/**
 * Dashboard for survey analysis visualizations - Connected to real backend data
 */
const SurveyAnalysisDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30');
  const [facilityType, setFacilityType] = useState<string>('all');
  const [surveyData, setSurveyData] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { token } = useAuth();

  // Load dashboard data from the working /api/surveys endpoint
  useEffect(() => {
    loadDashboardData();
  }, [timeRange, facilityType, token]);

  const loadDashboardData = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading survey data from /api/surveys...');
      
      // Fetch data from the working backend endpoint
      const response = await fetch('/api/surveys', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SurveyResponse = await response.json();
      console.log('📊 Survey data loaded:', data);
      
      // Filter data based on selected facility type if not 'all'
      if (facilityType !== 'all') {
        const filteredSurveys = data.surveys.filter(survey => 
          survey.facilityType.toLowerCase().includes(facilityType.toLowerCase())
        );
        
        // Recalculate summary for filtered data
        const filteredSummary: SurveySummary = {
          totalSurveys: filteredSurveys.length,
          completedSurveys: filteredSurveys.filter(s => s.completeness >= 80).length,
          averageCompleteness: filteredSurveys.length > 0 ? 
            Math.round(filteredSurveys.reduce((sum, s) => sum + s.completeness, 0) / filteredSurveys.length) : 0,
          totalResponses: filteredSurveys.reduce((sum, s) => sum + s.departmentCount + s.equipmentCount, 0),
          lastUpdated: data.summary.lastUpdated
        };
        
        setSurveyData({
          surveys: filteredSurveys,
          summary: filteredSummary
        });
      } else {
        setSurveyData(data);
      }

    } catch (err: any) {
      console.error('❌ Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  const handleFacilityTypeChange = (event: SelectChangeEvent) => {
    setFacilityType(event.target.value);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleExport = async () => {
    if (!surveyData) return;
    
    try {
      // Create CSV content
      const csvHeaders = ['Facility Name', 'Region', 'District', 'Facility Type', 'Completion Date', 'Completeness %', 'Quality Score %', 'Departments', 'Equipment', 'Power Source'];
      const csvRows = surveyData.surveys.map(survey => [
        survey.facilityName,
        survey.region,
        survey.district,
        survey.facilityType,
        survey.completionDate,
        survey.completeness,
        survey.qualityScore,
        survey.departmentCount,
        survey.equipmentCount,
        survey.powerSource
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Export completed successfully!');
    } catch (err: any) {
      setError(err.message || 'Export failed');
    }
  };

  // Calculate facility type distribution
  const getFacilityTypeDistribution = () => {
    if (!surveyData) return {};
    
    const distribution: { [key: string]: number } = {};
    surveyData.surveys.forEach(survey => {
      distribution[survey.facilityType] = (distribution[survey.facilityType] || 0) + 1;
    });
    return distribution;
  };

  // Calculate power source distribution
  const getPowerSourceDistribution = () => {
    if (!surveyData) return {};
    
    const distribution: { [key: string]: number } = {};
    surveyData.surveys.forEach(survey => {
      distribution[survey.powerSource] = (distribution[survey.powerSource] || 0) + 1;
    });
    return distribution;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  const facilityTypeDistribution = getFacilityTypeDistribution();
  const powerSourceDistribution = getPowerSourceDistribution();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Survey Analysis Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={loading || !surveyData}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 3 months</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Facility Type</InputLabel>
              <Select
                value={facilityType}
                label="Facility Type"
                onChange={handleFacilityTypeChange}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="hospital">Hospital</MenuItem>
                <MenuItem value="health center">Health Center</MenuItem>
                <MenuItem value="health post">Health Post</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Showing data for {surveyData?.summary.totalSurveys || 0} surveys
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards - Now using real backend data */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Surveys
                  </Typography>
                  <Typography variant="h4">
                    {surveyData?.summary.totalSurveys || 0}
                  </Typography>
                </Box>
                <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Surveys
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {surveyData?.summary.completedSurveys || 0}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Completeness
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {surveyData?.summary.averageCompleteness || 0}%
                  </Typography>
                </Box>
                <AssessmentIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Responses
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {surveyData?.summary.totalResponses || 0}
                  </Typography>
                </Box>
                <AssessmentIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Facility Type Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Facility Type Distribution
            </Typography>
            <Box>
              {Object.entries(facilityTypeDistribution).map(([type, count]) => (
                <Box key={type} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">{type}</Typography>
                  <Chip label={count} size="small" color="primary" />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Power Source Distribution
            </Typography>
            <Box>
              {Object.entries(powerSourceDistribution).map(([source, count]) => (
                <Box key={source} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">{source}</Typography>
                  <Chip label={count} size="small" color="secondary" />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Survey Data Table */}
      <Paper sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Survey Details
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Facility Name</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>District</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Completeness</TableCell>
                <TableCell>Quality Score</TableCell>
                <TableCell>Departments</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Power Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {surveyData?.surveys.slice(0, 10).map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell>{survey.facilityName}</TableCell>
                  <TableCell>{survey.region}</TableCell>
                  <TableCell>{survey.district}</TableCell>
                  <TableCell>{survey.facilityType}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${survey.completeness}%`} 
                      color={survey.completeness >= 80 ? 'success' : survey.completeness >= 60 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${survey.qualityScore}%`} 
                      color={survey.qualityScore >= 80 ? 'success' : survey.qualityScore >= 60 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{survey.departmentCount}</TableCell>
                  <TableCell>{survey.equipmentCount}</TableCell>
                  <TableCell>{survey.powerSource}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {surveyData && surveyData.surveys.length > 10 && (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">
              Showing first 10 of {surveyData.surveys.length} surveys
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Last Updated */}
      {surveyData?.summary.lastUpdated && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Last updated: {new Date(surveyData.summary.lastUpdated).toLocaleString()}
        </Typography>
      )}
    </Container>
  );
};

export default SurveyAnalysisDashboard;
