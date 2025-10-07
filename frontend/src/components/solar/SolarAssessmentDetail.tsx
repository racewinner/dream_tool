import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Tabs, 
  Tab, 
  Chip, 
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  PhotoCamera, 
  Warning, 
  CheckCircle, 
  Error, 
  Info,
  PictureAsPdf,
  ArrowBack,
  Lightbulb,
  BatteryFull,
  ElectricalServices,
  Settings,
  Download,
  MonitorOff,
  Description
} from '@mui/icons-material';
import MonitoringIntegration from './MonitoringIntegration';
import ReportGenerator from './ReportGenerator';
import { useParams, useNavigate } from 'react-router-dom';
import { solarAnalysisService, SolarSystemAssessment, SolarComponentDetected, DetectedIssue, UpgradeRecommendation } from '../../services/solarAnalysisService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SolarAssessmentDetail: React.FC = () => {
  const { facilityId, assessmentId } = useParams<{ facilityId: string, assessmentId: string }>();
  const [assessment, setAssessment] = useState<SolarSystemAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment(assessmentId);
    }
  }, [assessmentId]);

  const fetchAssessment = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await solarAnalysisService.getAssessment(id);
      setAssessment(result);
    } catch (err) {
      console.error("Failed to fetch assessment:", err);
      setError("Failed to load assessment details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackClick = () => {
    navigate(`/facilities/${facilityId}/solar`);
  };

  const handleGenerateReport = () => {
    navigate(`/facilities/${facilityId}/solar/assessments/${assessmentId}/report`);
  };

  const getComponentIcon = (componentType: string) => {
    switch (componentType) {
      case 'solar_panel':
        return <Lightbulb />;
      case 'battery':
        return <BatteryFull />;
      case 'inverter':
        return <ElectricalServices />;
      case 'mppt':
        return <Settings />;
      default:
        return <Info />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Warning color="action" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const renderOverview = () => {
    if (!assessment) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Assessment Information</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Assessment Date</Typography>
                  <Typography variant="body1">
                    {new Date(assessment.assessment_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={assessment.analysis_status} 
                    color={
                      assessment.analysis_status === 'completed' ? 'success' :
                      assessment.analysis_status === 'processing' ? 'info' :
                      assessment.analysis_status === 'failed' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </Grid>
                
                {assessment.surveyor_name && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Surveyor</Typography>
                    <Typography variant="body1">{assessment.surveyor_name}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Source</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {assessment.submission_source.replace('_', ' ')}
                  </Typography>
                </Grid>
                
                {assessment.overall_confidence_score !== undefined && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Confidence Score</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={assessment.overall_confidence_score * 100} 
                        size={24}
                        sx={{ mr: 1 }}
                        color={
                          assessment.overall_confidence_score > 0.7 ? 'success' :
                          assessment.overall_confidence_score > 0.4 ? 'warning' : 'error'
                        }
                      />
                      <Typography variant="body1">
                        {Math.round(assessment.overall_confidence_score * 100)}%
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>System Capacity</Typography>
              <Divider sx={{ mb: 2 }} />
              
              {assessment.capacity ? (
                <Grid container spacing={2}>
                  {assessment.capacity.solar_capacity_kw !== undefined && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Solar Capacity</Typography>
                      <Typography variant="body1">{assessment.capacity.solar_capacity_kw.toFixed(1)} kW</Typography>
                    </Grid>
                  )}
                  
                  {assessment.capacity.battery_capacity_kwh !== undefined && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Battery Capacity</Typography>
                      <Typography variant="body1">{assessment.capacity.battery_capacity_kwh.toFixed(1)} kWh</Typography>
                    </Grid>
                  )}
                  
                  {assessment.capacity.inverter_capacity_kw !== undefined && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Inverter Capacity</Typography>
                      <Typography variant="body1">{assessment.capacity.inverter_capacity_kw.toFixed(1)} kW</Typography>
                    </Grid>
                  )}
                  
                  {assessment.capacity.estimated_backup_hours !== undefined && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Est. Backup Hours</Typography>
                      <Typography variant="body1">{assessment.capacity.estimated_backup_hours.toFixed(1)} hours</Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">System Balance</Typography>
                    <Chip 
                      label={assessment.capacity.system_balance_status.replace('_', ' ')} 
                      color={assessment.capacity.is_balanced ? 'success' : 'warning'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No capacity data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Issues & Recommendations</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Detected Issues</Typography>
                  {assessment.issues.length > 0 ? (
                    <List dense>
                      {assessment.issues.slice(0, 3).map((issue) => (
                        <ListItem key={issue.id}>
                          <ListItemIcon>
                            {getSeverityIcon(issue.severity)}
                          </ListItemIcon>
                          <ListItemText 
                            primary={issue.issue_type.replace('_', ' ')} 
                            secondary={`${issue.component_type} - ${issue.severity}`} 
                          />
                        </ListItem>
                      ))}
                      {assessment.issues.length > 3 && (
                        <ListItem>
                          <ListItemText 
                            primary={`+${assessment.issues.length - 3} more issues`}
                            primaryTypographyProps={{ color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No issues detected
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>Recommendations</Typography>
                  {assessment.recommendations.length > 0 ? (
                    <List dense>
                      {assessment.recommendations.slice(0, 3).map((rec) => (
                        <ListItem key={rec.id}>
                          <ListItemIcon>
                            {getSeverityIcon(rec.priority)}
                          </ListItemIcon>
                          <ListItemText 
                            primary={rec.title} 
                            secondary={`${rec.recommendation_type.replace('_', ' ')} - ${rec.priority}`} 
                          />
                        </ListItem>
                      ))}
                      {assessment.recommendations.length > 3 && (
                        <ListItem>
                          <ListItemText 
                            primary={`+${assessment.recommendations.length - 3} more recommendations`}
                            primaryTypographyProps={{ color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No recommendations available
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderComponents = () => {
    if (!assessment) return null;

    return (
      <Grid container spacing={3}>
        {assessment.components.map((component) => (
          <Grid item xs={12} sm={6} md={4} key={component.id}>
            <Card variant="outlined">
              <CardMedia
                component="img"
                height="200"
                image={solarAnalysisService.getAuthenticatedImageUrl(component.annotated_photo_url || component.photo_url)}
                alt={`${component.component_type} photo`}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" component="div" sx={{ textTransform: 'capitalize' }}>
                    {component.component_type.replace('_', ' ')}
                  </Typography>
                  <Chip 
                    label={`${Math.round(component.detection_confidence * 100)}%`}
                    color={
                      component.detection_confidence > 0.7 ? 'success' :
                      component.detection_confidence > 0.4 ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                {component.analysis_results && (
                  <Box sx={{ mt: 1 }}>
                    {Object.entries(component.analysis_results).map(([key, value]) => {
                      // Skip complex nested objects
                      if (typeof value === 'object') return null;
                      
                      return (
                        <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}:
                          </Typography>
                          <Typography variant="body2">
                            {value?.toString()}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button size="small" variant="outlined">View Details</Button>
                  {component.annotated_photo_url && (
                    <Tooltip title="Download Annotated Photo">
                      <IconButton size="small" color="primary">
                        <Download />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        {assessment.components.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No components have been detected yet. Upload component photos to begin analysis.
            </Alert>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderIssues = () => {
    if (!assessment) return null;

    const issuesBySeverity = {
      critical: assessment.issues.filter(issue => issue.severity === 'critical'),
      high: assessment.issues.filter(issue => issue.severity === 'high'),
      medium: assessment.issues.filter(issue => issue.severity === 'medium'),
      low: assessment.issues.filter(issue => issue.severity === 'low')
    };

    return (
      <Box>
        {Object.entries(issuesBySeverity).map(([severity, issues]) => {
          if (issues.length === 0) return null;
          
          return (
            <Box key={severity} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                {severity} Issues ({issues.length})
              </Typography>
              
              <Grid container spacing={2}>
                {issues.map(issue => (
                  <Grid item xs={12} md={6} key={issue.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ mr: 1 }}>
                            {getSeverityIcon(issue.severity)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                              {issue.issue_type.replace(/_/g, ' ')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {issue.component_type.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Typography variant="body2" paragraph>
                          {issue.description}
                        </Typography>
                        
                        {issue.impact_description && (
                          <Typography variant="body2" color="text.secondary" paragraph>
                            <strong>Impact:</strong> {issue.impact_description}
                          </Typography>
                        )}
                        
                        {issue.estimated_power_loss_percent !== undefined && (
                          <Typography variant="body2" color="error">
                            Estimated Power Loss: {issue.estimated_power_loss_percent}%
                          </Typography>
                        )}
                        
                        {issue.photo_evidence_url && (
                          <Box sx={{ mt: 2 }}>
                            <Button size="small" variant="outlined">
                              View Evidence Photo
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
        
        {assessment.issues.length === 0 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            No issues detected in this solar system.
          </Alert>
        )}
      </Box>
    );
  };

  const renderRecommendations = () => {
    if (!assessment) return null;

    const recsByPriority = {
      critical: assessment.recommendations.filter(rec => rec.priority === 'critical'),
      high: assessment.recommendations.filter(rec => rec.priority === 'high'),
      medium: assessment.recommendations.filter(rec => rec.priority === 'medium'),
      low: assessment.recommendations.filter(rec => rec.priority === 'low')
    };

    return (
      <Box>
        {Object.entries(recsByPriority).map(([priority, recs]) => {
          if (recs.length === 0) return null;
          
          return (
            <Box key={priority} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                {priority} Priority Recommendations ({recs.length})
              </Typography>
              
              <Grid container spacing={2}>
                {recs.map(rec => (
                  <Grid item xs={12} key={rec.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ mr: 1 }}>
                            {getSeverityIcon(rec.priority)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1">
                              {rec.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {rec.recommendation_type.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Typography variant="body2" paragraph>
                          {rec.description}
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {rec.current_value && rec.recommended_value && (
                            <>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Current Value</Typography>
                                <Typography variant="body1">{rec.current_value}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Recommended Value</Typography>
                                <Typography variant="body1">{rec.recommended_value}</Typography>
                              </Grid>
                            </>
                          )}
                          
                          {rec.estimated_cost_usd !== undefined && (
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
                              <Typography variant="body1">${rec.estimated_cost_usd.toLocaleString()}</Typography>
                            </Grid>
                          )}
                          
                          {rec.estimated_annual_savings_usd !== undefined && (
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Annual Savings</Typography>
                              <Typography variant="body1">${rec.estimated_annual_savings_usd.toLocaleString()}/year</Typography>
                            </Grid>
                          )}
                          
                          {rec.payback_period_months !== undefined && (
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Payback Period</Typography>
                              <Typography variant="body1">
                                {rec.payback_period_months < 12 ? 
                                  `${rec.payback_period_months} months` : 
                                  `${(rec.payback_period_months / 12).toFixed(1)} years`}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                        
                        {rec.implementation_notes && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Implementation Notes:</strong>
                            </Typography>
                            <Typography variant="body2">
                              {rec.implementation_notes}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
        
        {assessment.recommendations.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No recommendations available for this solar system.
          </Alert>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />} 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Back to Assessments
        </Button>
      </Box>
    );
  }

  if (!assessment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Assessment not found</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />} 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Back to Assessments
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBackClick} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1">
            Solar Assessment Details
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<PictureAsPdf />}
          onClick={handleGenerateReport}
          disabled={assessment.analysis_status !== 'completed'}
        >
          Generate Report
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="assessment tabs">
          <Tab label="Overview" />
          <Tab label="Components" />
          <Tab label="Issues" />
          <Tab label="Recommendations" />
          <Tab label="Monitoring" icon={<MonitorOff sx={{ fontSize: 16, ml: 1 }} />} iconPosition="end" />
          <Tab label="Reports" icon={<Description sx={{ fontSize: 16, ml: 1 }} />} iconPosition="end" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {renderOverview()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderComponents()}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderIssues()}
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        {renderRecommendations()}
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        {facilityId && assessmentId && (
          <MonitoringIntegration facilityId={Number(facilityId)} assessmentId={assessmentId} />
        )}
      </TabPanel>
      <TabPanel value={tabValue} index={5}>
        {facilityId && assessmentId && (
          <ReportGenerator facilityId={Number(facilityId)} assessmentId={assessmentId} />
        )}
      </TabPanel>
    </Box>
  );
};

export default SolarAssessmentDetail;
