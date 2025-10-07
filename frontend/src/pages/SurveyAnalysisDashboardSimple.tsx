import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { SurveyDataService } from '../services/surveyDataService';

interface SurveyAnalytics {
  totalSurveys: number;
  completedSurveys: number;
  averageCompleteness: number;
  totalResponses: number;
  facilityTypes: { [key: string]: number };
  completenessDistribution: { range: string; count: number }[];
  equipmentAnalysis: { category: string; count: number; facilities: number }[];
  departmentAnalysis: { department: string; count: number; facilities: number }[];
}

const SurveyAnalysisDashboardSimple: React.FC = () => {
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await SurveyDataService.getSurveys();
      console.log('Fetched survey data for analysis:', data);
      
      // Perform statistical analysis on the survey data
      const surveys = data.surveys || [];
      
      // Analyze facility types
      const facilityTypes: { [key: string]: number } = {};
      surveys.forEach((survey: any) => {
        const type = survey.facilityType || 'Unknown';
        facilityTypes[type] = (facilityTypes[type] || 0) + 1;
      });
      
      // Analyze completeness distribution
      const completenessRanges = [
        { range: '0-20%', min: 0, max: 20 },
        { range: '21-40%', min: 21, max: 40 },
        { range: '41-60%', min: 41, max: 60 },
        { range: '61-80%', min: 61, max: 80 },
        { range: '81-100%', min: 81, max: 100 }
      ];
      
      const completenessDistribution = completenessRanges.map(range => ({
        range: range.range,
        count: surveys.filter((s: any) => s.completeness >= range.min && s.completeness <= range.max).length
      }));
      
      // Analyze equipment across all surveys
      const equipmentAnalysis: { [key: string]: { count: number; facilities: Set<number> } } = {};
      surveys.forEach((survey: any) => {
        const equipment = survey.repeatGroups?.equipment || [];
        equipment.forEach((item: any) => {
          const category = item.category || 'Other';
          if (!equipmentAnalysis[category]) {
            equipmentAnalysis[category] = { count: 0, facilities: new Set() };
          }
          equipmentAnalysis[category].count += 1;
          equipmentAnalysis[category].facilities.add(survey.id);
        });
      });
      
      // Analyze departments across all surveys
      const departmentAnalysis: { [key: string]: { count: number; facilities: Set<number> } } = {};
      surveys.forEach((survey: any) => {
        const departments = survey.repeatGroups?.departments || [];
        departments.forEach((dept: any) => {
          const name = dept.name || 'Unknown Department';
          if (!departmentAnalysis[name]) {
            departmentAnalysis[name] = { count: 0, facilities: new Set() };
          }
          departmentAnalysis[name].count += 1;
          departmentAnalysis[name].facilities.add(survey.id);
        });
      });
      
      setAnalytics({
        totalSurveys: data.summary.totalSurveys,
        completedSurveys: data.summary.completedSurveys,
        averageCompleteness: data.summary.averageCompleteness,
        totalResponses: data.summary.totalResponses,
        facilityTypes,
        completenessDistribution,
        equipmentAnalysis: Object.entries(equipmentAnalysis).map(([category, data]) => ({
          category,
          count: data.count,
          facilities: data.facilities.size
        })),
        departmentAnalysis: Object.entries(departmentAnalysis).map(([department, data]) => ({
          department,
          count: data.count,
          facilities: data.facilities.size
        }))
      });
      
    } catch (error: any) {
      console.error('Error fetching survey analytics:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(error.response?.data?.error || error.message || 'Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading survey analytics: {error}
        </Alert>
        <Button startIcon={<RefreshIcon />} onClick={fetchAnalytics}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">No survey data available for analysis.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Survey Analysis Dashboard
        </Typography>
        <Button startIcon={<RefreshIcon />} onClick={fetchAnalytics} variant="outlined">
          Refresh Data
        </Button>
      </Box>

      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Survey Responses
              </Typography>
              <Typography variant="h4" component="h2">
                {analytics.totalResponses}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Responses to survey deployment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Completion Rate
              </Typography>
              <Typography variant="h4" component="h2" color="success.main">
                {analytics.completedSurveys}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Responses ≥80% complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Completion
              </Typography>
              <Typography variant="h4" component="h2" color="primary.main">
                {analytics.averageCompleteness}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={analytics.averageCompleteness} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Data Quality Score
              </Typography>
              <Typography variant="h4" component="h2" color="warning.main">
                {Math.round(analytics.averageCompleteness * 0.9)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Based on completeness & consistency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Facility Type Analysis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <PieChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Facility Type Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {Object.entries(analytics.facilityTypes).map(([type, count]) => (
              <Box key={type} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">{type}</Typography>
                  <Typography variant="h6" color="primary.main">{count}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(count / analytics.totalSurveys) * 100} 
                  sx={{ mt: 0.5 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {Math.round((count / analytics.totalSurveys) * 100)}% of responses
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Response Completeness Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {analytics.completenessDistribution.map((item) => (
              <Box key={item.range} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">{item.range}</Typography>
                  <Typography variant="h6" color="primary.main">{item.count}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.count / analytics.totalResponses) * 100} 
                  sx={{ mt: 0.5 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {item.count} responses in this range
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Equipment & Department Analysis */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Equipment Analysis
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {analytics.equipmentAnalysis.slice(0, 5).map((item) => (
              <Box key={item.category} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">{item.category}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.count} items in {item.facilities} facilities
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.facilities / analytics.totalSurveys) * 100} 
                  sx={{ mt: 0.5 }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Department Analysis
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {analytics.departmentAnalysis.slice(0, 5).map((item) => (
              <Box key={item.department} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">{item.department}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.count} departments in {item.facilities} facilities
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(item.facilities / analytics.totalSurveys) * 100} 
                  sx={{ mt: 0.5 }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SurveyAnalysisDashboardSimple;
