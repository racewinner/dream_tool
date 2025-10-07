import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  PieChart as PieChartIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { visualizationService } from '../../services/visualizationService';
import SurveyCompletenessChart from '../../components/charts/SurveyCompletenessChart';

// Mock data - Replace with actual API calls in production
interface SurveyDetail {
  id: number;
  facilityName: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  completeness: number;
  facility: {
    name: string;
    location: string;
    type: string;
    capacity: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  sections: {
    [key: string]: {
      name: string;
      completeness: number;
      questions: Array<{
        id: string;
        question: string;
        answer: string | number | boolean | string[];
        type: string;
        required: boolean;
        completed: boolean;
      }>;
    };
  };
}

const mockSurveyDetail = (id: number): SurveyDetail => ({
  id,
  facilityName: `Facility ${id}`,
  submissionDate: new Date().toISOString().split('T')[0],
  submittedBy: 'John Doe',
  status: id % 3 === 0 ? 'Complete' : id % 3 === 1 ? 'Incomplete' : 'Needs Review',
  completeness: id % 3 === 0 ? 100 : Math.floor(Math.random() * 80 + 10),
  facility: {
    name: `Facility ${id}`,
    location: 'Sample Location',
    type: 'Healthcare Facility',
    capacity: '150 beds',
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
  },
  sections: {
    general: {
      name: 'General Information',
      completeness: 100,
      questions: [
        {
          id: 'q1',
          question: 'Facility Name',
          answer: `Facility ${id}`,
          type: 'text',
          required: true,
          completed: true,
        },
        {
          id: 'q2',
          question: 'Facility Type',
          answer: 'Healthcare Facility',
          type: 'text',
          required: true,
          completed: true,
        },
        {
          id: 'q3',
          question: 'Contact Person',
          answer: 'John Smith',
          type: 'text',
          required: true,
          completed: true,
        },
      ],
    },
    technical: {
      name: 'Technical Systems',
      completeness: id % 3 === 0 ? 100 : 75,
      questions: [
        {
          id: 't1',
          question: 'PV System Installed',
          answer: 'Yes',
          type: 'radio',
          required: true,
          completed: true,
        },
        {
          id: 't2',
          question: 'System Capacity (kWp)',
          answer: '5.5',
          type: 'number',
          required: true,
          completed: true,
        },
        {
          id: 't3',
          question: 'Battery Storage',
          answer: id % 3 === 0 ? 'Yes' : 'No',
          type: 'radio',
          required: true,
          completed: true,
        },
        {
          id: 't4',
          question: 'Inverter Type',
          answer: id % 3 === 0 ? 'Hybrid' : '',
          type: 'text',
          required: true,
          completed: id % 3 === 0,
        },
      ],
    },
    maintenance: {
      name: 'Maintenance',
      completeness: id % 3 === 0 ? 100 : 50,
      questions: [
        {
          id: 'm1',
          question: 'Last Maintenance Date',
          answer: id % 3 === 0 ? '2023-05-15' : '',
          type: 'date',
          required: true,
          completed: id % 3 === 0,
        },
        {
          id: 'm2',
          question: 'Maintenance Issues Reported',
          answer: id % 3 === 0 ? 'None' : 'Inverter fault',
          type: 'text',
          required: true,
          completed: true,
        },
      ],
    },
  },
});

/**
 * Tab panel component for organizing content in tabs
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`survey-tabpanel-${index}`}
      aria-labelledby={`survey-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

/**
 * Survey Detail View Component - Shows detailed view of a single survey with edit capability
 */
const SurveyDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [surveyDetail, setSurveyDetail] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedSurvey, setEditedSurvey] = useState<SurveyDetail | null>(null);

  // Fetch survey details
  useEffect(() => {
    const fetchSurveyDetail = async () => {
      setLoading(true);
      try {
        // In production, replace with actual API call
        // const response = await axios.get(`${API_BASE_URL}/surveys/${id}`);
        // const data = response.data;
        
        // Using mock data for now
        setTimeout(() => {
          const data = mockSurveyDetail(Number(id));
          setSurveyDetail(data);
          setEditedSurvey(data);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching survey details:', err);
        setError('Failed to load survey details. Please try again.');
        setLoading(false);
      }
    };

    if (id) {
      fetchSurveyDetail();
    }
  }, [id]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Enter edit mode
  const handleEditClick = () => {
    setEditMode(true);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedSurvey(surveyDetail);
  };

  // Save edited survey
  const handleSaveSurvey = async () => {
    if (!editedSurvey) return;
    
    setLoading(true);
    try {
      // In production, replace with actual API call
      // await axios.put(`${API_BASE_URL}/surveys/${id}`, editedSurvey);
      
      // Mock update
      setTimeout(() => {
        setSurveyDetail(editedSurvey);
        setEditMode(false);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error('Error saving survey:', err);
      setError('Failed to save survey changes. Please try again.');
      setLoading(false);
    }
  };

  // Update question answer in edit mode
  const handleAnswerChange = (sectionKey: string, questionId: string, value: string | number | boolean | string[]) => {
    if (!editedSurvey) return;
    
    setEditedSurvey(prev => {
      if (!prev) return prev;
      
      const updatedSurvey = { ...prev };
      const question = updatedSurvey.sections[sectionKey].questions.find(q => q.id === questionId);
      
      if (question) {
        question.answer = value;
        question.completed = value !== '' && value !== null && value !== undefined;
      }
      
      // Recalculate section completeness
      const section = updatedSurvey.sections[sectionKey];
      const totalQuestions = section.questions.length;
      const completedQuestions = section.questions.filter(q => q.completed).length;
      section.completeness = Math.round((completedQuestions / totalQuestions) * 100);
      
      // Recalculate overall completeness
      const sections = Object.values(updatedSurvey.sections);
      const totalSectionCompleteness = sections.reduce((sum, s) => sum + s.completeness, 0);
      updatedSurvey.completeness = Math.round(totalSectionCompleteness / sections.length);
      
      return updatedSurvey;
    });
  };

  // Go back to survey list
  const handleBackClick = () => {
    navigate('/survey-analysis');
  };

  // Export survey data
  const handleExportClick = () => {
    if (!surveyDetail) return;
    
    const dataStr = JSON.stringify(surveyDetail, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `survey-${surveyDetail.id}-detail.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (loading && !surveyDetail) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Back to Survey List
        </Button>
      </Container>
    );
  }

  if (!surveyDetail) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>Survey not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Back to Survey List
        </Button>
      </Container>
    );
  }

  // Get all section keys for tabs
  const sectionKeys = Object.keys(surveyDetail.sections);

  // Create completeness chart data
  const completenessData = sectionKeys.map(key => ({
    label: surveyDetail.sections[key].name,
    value: surveyDetail.sections[key].completeness
  }));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component="button" 
          variant="body2" 
          onClick={handleBackClick}
          underline="hover"
        >
          Surveys
        </Link>
        <Typography color="text.primary">Survey #{surveyDetail.id}</Typography>
      </Breadcrumbs>
      
      {/* Header with actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {surveyDetail.facilityName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submitted: {surveyDetail.submissionDate} by {surveyDetail.submittedBy}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!editMode && (
            <>
              <Tooltip title="Edit Survey">
                <IconButton onClick={handleEditClick} color="primary">
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Survey">
                <IconButton onClick={handleExportClick}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={handleBackClick}
                variant="outlined"
              >
                Back
              </Button>
            </>
          )}
          {editMode && (
            <>
              <Button 
                startIcon={<SaveIcon />} 
                onClick={handleSaveSurvey}
                variant="contained"
                color="primary"
              >
                Save Changes
              </Button>
              <Button 
                startIcon={<CancelIcon />} 
                onClick={handleCancelEdit}
                variant="outlined"
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      {/* Status and completeness overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Facility Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {surveyDetail.facility.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {surveyDetail.facility.type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {surveyDetail.facility.location}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Capacity
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {surveyDetail.facility.capacity}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PieChartIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">
                Completeness
              </Typography>
            </Box>
            <SurveyCompletenessChart 
              data={completenessData}
              height={200}
              loading={loading}
              title=""
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: surveyDetail.completeness < 50 ? 'error.main' : 
                         surveyDetail.completeness < 80 ? 'warning.main' : 'success.main'
                }}
              >
                {surveyDetail.completeness}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Section tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            {sectionKeys.map((key, index) => (
              <Tab 
                key={key} 
                label={surveyDetail.sections[key].name} 
                id={`survey-tab-${index}`}
                aria-controls={`survey-tabpanel-${index}`}
                iconPosition="end"
                icon={
                  <Box 
                    component="span"
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      ml: 1,
                      bgcolor: surveyDetail.sections[key].completeness < 100 ? 'warning.main' : 'success.main'
                    }}
                  />
                }
              />
            ))}
            <Tab 
              label="History" 
              id="survey-tab-history"
              aria-controls="survey-tabpanel-history"
              icon={<HistoryIcon />}
              iconPosition="end"
            />
          </Tabs>
        </Box>
        
        {/* Section content */}
        {sectionKeys.map((sectionKey, index) => (
          <TabPanel key={sectionKey} value={tabIndex} index={index}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                {surveyDetail.sections[sectionKey].completeness}% Complete
              </Typography>
              
              <Grid container spacing={3}>
                {surveyDetail.sections[sectionKey].questions.map((question) => (
                  <Grid item xs={12} sm={6} md={4} key={question.id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {question.question}
                          {question.required && <span style={{ color: 'red' }}> *</span>}
                        </Typography>
                        
                        {editMode ? (
                          // Edit mode - show form fields
                          <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            value={editedSurvey?.sections[sectionKey].questions.find(q => q.id === question.id)?.answer || ''}
                            onChange={(e) => handleAnswerChange(sectionKey, question.id, e.target.value)}
                            error={question.required && !question.completed}
                            helperText={question.required && !question.completed ? "This field is required" : ""}
                            sx={{ mt: 1 }}
                          />
                        ) : (
                          // View mode - show answer
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              mt: 1,
                              color: question.completed ? 'text.primary' : 'text.disabled',
                              fontStyle: question.completed ? 'normal' : 'italic'
                            }}
                          >
                            {question.completed ? question.answer : 'Not provided'}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TabPanel>
        ))}
        
        {/* History tab */}
        <TabPanel value={tabIndex} index={sectionKeys.length}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Survey Edit History
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              History tracking will be implemented in a future update.
            </Alert>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default SurveyDetailView;
