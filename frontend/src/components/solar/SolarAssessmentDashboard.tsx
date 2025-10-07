import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  PhotoCamera, 
  Visibility, 
  BarChart, 
  PictureAsPdf, 
  Refresh, 
  FilterList,
  Sort
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { solarAnalysisService, AssessmentListItem } from '../../services/solarAnalysisService';
import { format } from 'date-fns';

interface SolarAssessmentDashboardProps {
  facilityId: number;
}

const statusColors = {
  pending: 'default',
  processing: 'info',
  completed: 'success',
  failed: 'error'
};

const SolarAssessmentDashboard: React.FC<SolarAssessmentDashboardProps> = ({ facilityId }) => {
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssessments();
  }, [facilityId, statusFilter, sortOrder]);

  const fetchAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await solarAnalysisService.listAssessments({
        facilityId: facilityId,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      let sortedAssessments = [...result.assessments];
      if (sortOrder === 'newest') {
        sortedAssessments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        sortedAssessments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      
      setAssessments(sortedAssessments);
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
      setError("Failed to load solar assessments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = () => {
    navigate(`/facilities/${facilityId}/solar/new-assessment`);
  };

  const handleViewAssessment = (assessmentId: string) => {
    navigate(`/facilities/${facilityId}/solar/assessments/${assessmentId}`);
  };

  const handleGenerateReport = (assessmentId: string) => {
    navigate(`/facilities/${facilityId}/solar/assessments/${assessmentId}/report`);
  };

  const getStatusChipColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    return statusColors[status as keyof typeof statusColors] as any || 'default';
  };

  const renderAssessmentCards = () => {
    if (assessments.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No solar assessments found for this facility.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<PhotoCamera />} 
            sx={{ mt: 2 }}
            onClick={handleCreateAssessment}
          >
            Create New Assessment
          </Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {assessments.map((assessment) => (
          <Grid item xs={12} md={6} lg={4} key={assessment.id}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div" noWrap>
                    Assessment {assessment.id.substring(0, 8)}
                  </Typography>
                  <Chip 
                    label={assessment.analysis_status} 
                    color={getStatusChipColor(assessment.analysis_status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date: {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                </Typography>
                
                {assessment.surveyor_name && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Surveyor: {assessment.surveyor_name}
                  </Typography>
                )}
                
                {assessment.overall_confidence_score !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      Confidence:
                    </Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={assessment.overall_confidence_score * 100} 
                        size={24}
                        color={assessment.overall_confidence_score > 0.7 ? "success" : 
                               assessment.overall_confidence_score > 0.4 ? "warning" : "error"}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" component="div" color="text.secondary">
                          {Math.round(assessment.overall_confidence_score * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<Visibility />}
                  onClick={() => handleViewAssessment(assessment.id)}
                >
                  View
                </Button>
                {assessment.analysis_status === 'completed' && (
                  <Button 
                    size="small" 
                    startIcon={<PictureAsPdf />}
                    onClick={() => handleGenerateReport(assessment.id)}
                  >
                    Report
                  </Button>
                )}
                {assessment.analysis_status === 'completed' && (
                  <Button 
                    size="small" 
                    startIcon={<BarChart />}
                    onClick={() => navigate(`/facilities/${facilityId}/solar/assessments/${assessment.id}/analytics`)}
                  >
                    Analytics
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Solar PV Assessments
        </Typography>
        
        <Box>
          <Button 
            variant="contained" 
            startIcon={<PhotoCamera />}
            onClick={handleCreateAssessment}
            sx={{ mr: 1 }}
          >
            New Assessment
          </Button>
          <IconButton onClick={fetchAssessments} size="small">
            <Tooltip title="Refresh">
              <Refresh />
            </Tooltip>
          </IconButton>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1 }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Sort sx={{ mr: 1 }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-order-label">Sort</InputLabel>
              <Select
                labelId="sort-order-label"
                id="sort-order"
                value={sortOrder}
                label="Sort"
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderAssessmentCards()
      )}
    </Box>
  );
};

export default SolarAssessmentDashboard;
