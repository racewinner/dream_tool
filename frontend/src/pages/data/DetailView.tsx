import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  InputAdornment,
  Box,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { SurveyDataService, Survey, SurveyDetail } from '../../services/surveyDataService';

// Survey interfaces are now imported from surveyDataService

const DetailView: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSurveys = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await SurveyDataService.getSurveys();
      setSurveys(data.surveys || []);
    } catch (error: any) {
      console.error('Error fetching surveys:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(error.response?.data?.error || error.message || 'Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveyDetail = async (surveyId: number) => {
    setLoadingDetail(true);
    try {
      const data = await SurveyDataService.getSurveyDetail(surveyId);
      setSelectedSurvey(data);
      setDetailDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching survey detail:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(error.response?.data?.error || error.message || 'Failed to load survey details');
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const filteredSurveys = surveys.filter(survey =>
    survey.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.externalId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return 'success';
    if (completeness >= 60) return 'warning';
    return 'error';
  };

  const renderQuestionSection = (title: string, data: any, prefix: string = '') => {
    if (!data || typeof data !== 'object') return null;

    return (
      <Accordion key={title}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">{title}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {Object.entries(data).map(([key, value]) => {
              const fullKey = prefix ? `${prefix}/${key}` : key;
              
              // Show placeholder for empty/missing values instead of hiding them
              let displayValue = value;
              let isPlaceholder = false;
              
              if (value === null || value === undefined || value === '') {
                displayValue = '[No data provided]';
                isPlaceholder = true;
              } else if (Array.isArray(value) && value.length === 0) {
                displayValue = '[No items recorded]';
                isPlaceholder = true;
              } else if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
                displayValue = '[No details available]';
                isPlaceholder = true;
              }

              if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
                return (
                  <Grid item xs={12} key={key}>
                    {renderQuestionSection(key.replace(/_/g, ' ').toUpperCase(), value, fullKey)}
                  </Grid>
                );
              }

              return (
                <Grid item xs={12} sm={6} key={key}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontStyle: isPlaceholder ? 'italic' : 'normal',
                        color: isPlaceholder ? 'text.secondary' : 'text.primary',
                        opacity: isPlaceholder ? 0.7 : 1
                      }}
                    >
                      {isPlaceholder ? String(displayValue) : (Array.isArray(value) ? value.join(', ') : String(value))}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

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
          Error loading survey data: {error}
        </Alert>
        <Button onClick={fetchSurveys} variant="outlined">
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Survey Detail View
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and view detailed information for each imported survey response
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by facility name, region, district, or survey ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Survey List */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Survey ID</TableCell>
                <TableCell>Facility</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Completion Date</TableCell>
                <TableCell>Completeness</TableCell>
                <TableCell>Questions Answered</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSurveys.map((survey) => (
                <TableRow key={survey.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {survey.externalId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <BusinessIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      {survey.facilityName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LocationOnIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2">{survey.region}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {survey.district}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={survey.facilityType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {new Date(survey.completionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${survey.completeness}%`}
                      color={getCompletenessColor(survey.completeness) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {survey.questionsAnswered} questions
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => fetchSurveyDetail(survey.id)}
                      disabled={loadingDetail}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredSurveys.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'No surveys match your search criteria.' : 'No survey data found.'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Survey Details: {selectedSurvey?.survey.externalId}
            </Typography>
            <Chip 
              label={`${selectedSurvey?.survey.completeness}% Complete`}
              color={getCompletenessColor(selectedSurvey?.survey.completeness || 0) as any}
            />
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {loadingDetail ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : selectedSurvey ? (
            <Box>
              {/* Facility Information - Expanded */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Facility Information
                  </Typography>
                  
                  {/* Basic Info */}
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Basic Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Facility Name</Typography>
                      <Typography variant="body1">{selectedSurvey.survey.facilityName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                      <Typography variant="body1">{selectedSurvey.survey.facilityType}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Region</Typography>
                      <Typography variant="body1">{selectedSurvey.survey.region}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">District</Typography>
                      <Typography variant="body1">{selectedSurvey.survey.district}</Typography>
                    </Grid>
                    {selectedSurvey.facilityData?.longitude && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Coordinates</Typography>
                        <Typography variant="body1">
                          {selectedSurvey.facilityData?.latitude}, {selectedSurvey.facilityData?.longitude}
                        </Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.ownership && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Ownership</Typography>
                        <Typography variant="body1">{selectedSurvey.facilityData.ownership}</Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Operations */}
                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Operations</Typography>
                  <Grid container spacing={2}>
                    {selectedSurvey.facilityData?.operationalDays > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Operational Days</Typography>
                        <Typography variant="body1">{selectedSurvey.facilityData.operationalDays} days/week</Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.operationalHours && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Hours Per Day</Typography>
                        <Typography variant="body1">
                          Day: {selectedSurvey.facilityData.operationalHours.day}h, 
                          Night: {selectedSurvey.facilityData.operationalHours.night}h
                        </Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.catchmentPopulation > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Catchment Population</Typography>
                        <Typography variant="body1">{selectedSurvey.facilityData.catchmentPopulation?.toLocaleString()}</Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.averageMonthlyPatients > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Monthly Patients</Typography>
                        <Typography variant="body1">{selectedSurvey.facilityData.averageMonthlyPatients?.toLocaleString()}</Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.numberOfBeds > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Number of Beds</Typography>
                        <Typography variant="body1">{selectedSurvey.facilityData.numberOfBeds}</Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Staff */}
                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Staffing</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">Support Staff</Typography>
                      <Typography variant="body1">{selectedSurvey.facilityData?.supportStaff || 0}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">Technical Staff</Typography>
                      <Typography variant="body1">{selectedSurvey.facilityData?.technicalStaff || 0}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">Night Staff</Typography>
                      <Typography variant="body1">{selectedSurvey.facilityData?.nightStaff ? 'Yes' : 'No'}</Typography>
                    </Grid>
                  </Grid>

                  {/* Infrastructure */}
                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Infrastructure</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Water Access</Typography>
                      <Typography variant="body1">{selectedSurvey.facilityData?.infrastructure?.waterAccess ? 'Yes' : 'No'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">National Grid Connection</Typography>
                      <Typography variant="body1">{selectedSurvey.facilityData?.infrastructure?.nationalGrid ? 'Yes' : 'No'}</Typography>
                    </Grid>
                    {selectedSurvey.facilityData?.infrastructure?.transportationAccess && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Transportation Access</Typography>
                        <Typography variant="body1">{selectedSurvey.facilityData.infrastructure.transportationAccess}</Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.hasFacilityPhone !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Facility Phone</Typography>
                        <Typography variant="body1">{selectedSurvey.facilityData.hasFacilityPhone ? 'Yes' : 'No'}</Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Buildings */}
                  {selectedSurvey.facilityData?.buildings && (
                    <>
                      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Buildings & Rooms</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Total Buildings</Typography>
                          <Typography variant="body1">{selectedSurvey.facilityData.numberOfBuildings || selectedSurvey.facilityData.buildings.total || 0}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Total Rooms</Typography>
                          <Typography variant="body1">{selectedSurvey.facilityData.buildings.rooms || 0}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Rooms with Power</Typography>
                          <Typography variant="body1">{selectedSurvey.facilityData.buildings.roomsWithConnection || 0}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Wired Departments</Typography>
                          <Typography variant="body1">{selectedSurvey.facilityData.buildings.departmentsWithWiring || 0}</Typography>
                        </Grid>
                      </Grid>
                    </>
                  )}

                  {/* Electricity & Power */}
                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Power & Electricity</Typography>
                  <Grid container spacing={2}>
                    {selectedSurvey.facilityData?.electricitySource && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Primary Power Source</Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedSurvey.facilityData.electricitySource}</Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.secondaryElectricitySource && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Secondary Power Source</Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedSurvey.facilityData.secondaryElectricitySource}</Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.monthlyDieselCost > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Monthly Diesel Cost</Typography>
                        <Typography variant="body1">${selectedSurvey.facilityData.monthlyDieselCost?.toLocaleString()}</Typography>
                      </Grid>
                    )}
                    {selectedSurvey.facilityData?.electricityAvailability !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">Electricity Availability</Typography>
                        <Typography variant="body1">{selectedSurvey.facilityData.electricityAvailability}%</Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Equipment Summary */}
                  {selectedSurvey.facilityData?.equipment && selectedSurvey.facilityData.equipment.length > 0 && (
                    <>
                      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Equipment ({selectedSurvey.facilityData.equipment.length} items)</Typography>
                      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                        {selectedSurvey.facilityData.equipment.map((item: any, index: number) => (
                          <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{item.name || `Equipment ${index + 1}`}</Typography>
                            {item.quantity && <Typography variant="caption" color="textSecondary">Quantity: {item.quantity}</Typography>}
                            {item.powerRating && <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>Power: {item.powerRating}W</Typography>}
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}

                  {/* Services */}
                  {selectedSurvey.facilityData?.coreServices && selectedSurvey.facilityData.coreServices.length > 0 && (
                    <>
                      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Core Services</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedSurvey.facilityData.coreServices.map((service: string, index: number) => (
                          <Chip key={index} label={service} variant="outlined" size="small" />
                        ))}
                      </Box>
                    </>
                  )}

                  {/* Critical Needs */}
                  {selectedSurvey.facilityData?.mostImportantNeed && (
                    <>
                      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Most Important Need</Typography>
                      <Typography variant="body2" sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                        {selectedSurvey.facilityData.mostImportantNeed}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Survey Questions */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Survey Questions & Responses
              </Typography>
              <Box sx={{ mb: 2 }}>
                {(() => {
                  // Use rawData if available, fallback to facilityData (matches backend pattern)
                  const questionData = (selectedSurvey.rawData && Object.keys(selectedSurvey.rawData).length > 0) 
                    ? selectedSurvey.rawData 
                    : selectedSurvey.facilityData || {};
                    
                  return Object.keys(questionData).length > 0 ? (
                    Object.entries(questionData).map(([sectionKey, sectionData]) => {
                      if (typeof sectionData === 'object' && sectionData !== null) {
                        return renderQuestionSection(
                          sectionKey.replace(/_/g, ' ').toUpperCase(),
                          sectionData,
                          sectionKey
                        );
                      }
                      return null;
                    })
                  ) : (
                    <Alert severity="info">
                      No detailed question data available for this survey.
                    </Alert>
                  );
                })()}
              </Box>

              {/* Repeat Groups */}
              {selectedSurvey.survey.repeatGroups && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Departments & Equipment
                  </Typography>
                  
                  {selectedSurvey.survey.repeatGroups.departments.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          Departments ({selectedSurvey.survey.repeatGroups.departments.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {selectedSurvey.survey.repeatGroups.departments.map((dept: any, index: number) => (
                            <Grid item xs={12} sm={6} key={index}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Department {index + 1}
                                  </Typography>
                                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                    {JSON.stringify(dept, null, 2)}
                                  </pre>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {selectedSurvey.survey.repeatGroups.equipment.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          Equipment ({selectedSurvey.survey.repeatGroups.equipment.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {selectedSurvey.survey.repeatGroups.equipment.map((equip: any, index: number) => (
                            <Grid item xs={12} sm={6} key={index}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Equipment {index + 1}
                                  </Typography>
                                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                    {JSON.stringify(equip, null, 2)}
                                  </pre>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DetailView;
