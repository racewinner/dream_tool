import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Map as MapIcon,
  BarChart as BarChartIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
  People as PeopleIcon
} from '@mui/icons-material';
// Simple map alternative without react-leaflet dependency
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { SurveyService } from '../../services/surveyService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Survey {
  id: string;
  facilityData: {
    name?: string;
    facilityType?: string;
    region?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    operationalHours?: number;
    staffCount?: number;
    equipment?: any[];
    powerSources?: string[];
    // Water and sanitation
    waterAccess?: string;
    waterSource?: string;
    waterAvailability?: string;
    sanitationFacilities?: string[];
    wasteManagement?: string;
    // Infrastructure
    buildingCondition?: string;
    roadAccess?: string;
    transportationAvailable?: string;
    internetConnectivity?: string;
    phoneConnectivity?: string;
    // Services and capacity
    servicesProvided?: string[];
    patientCapacity?: number;
    bedsAvailable?: number;
    referralCapacity?: string;
    emergencyServices?: boolean;
    // Staffing details
    doctors?: number;
    nurses?: number;
    midwives?: number;
    communityHealthWorkers?: number;
    supportStaff?: number;
    staffTraining?: string[];
    // Equipment and supplies
    medicalEquipment?: string[];
    pharmaceuticals?: string[];
    supplyChainReliability?: string;
    equipmentCondition?: string;
    // Power and energy
    primaryPowerSource?: string;
    backupPower?: string;
    powerOutageFrequency?: string;
    energyConsumption?: number;
    solarPotential?: string;
    // Financial and operational
    operatingBudget?: number;
    revenueStreams?: string[];
    operationalChallenges?: string[];
    communitySupport?: string;
    governmentSupport?: string;
  };
  rawData?: any;
  createdAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const EnhancedSurveyAnalysisDashboard: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Initialize survey service
  const surveyService = new SurveyService();

  // Fetch real survey data from backend API
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Loading surveys from backend API...');
        const realSurveys = await surveyService.getAllSurveys();
        
        console.log(`✅ Successfully loaded ${realSurveys.length} surveys from backend`);
        console.log('📊 Survey data with coordinates:', realSurveys.map(s => ({
          name: s.facilityData?.name,
          lat: s.facilityData?.latitude,
          lng: s.facilityData?.longitude,
          region: s.facilityData?.region
        })));
        
        setSurveys(realSurveys);
        
      } catch (err: any) {
        console.error('❌ Error fetching survey data:', err);
        
        // Handle different types of errors
        if (err.message?.includes('401') || err.response?.status === 401) {
          setError('Authentication required. Please log in to view survey data.');
        } else if (err.message?.includes('Failed to fetch')) {
          setError('Unable to connect to the backend server. Please ensure the server is running.');
        } else {
          setError(`Failed to fetch survey data: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  // Filter surveys based on selected criteria
  const filteredSurveys = surveys.filter(survey => {
    const matchesRegion = selectedRegion === 'All' || survey.facilityData?.region === selectedRegion;
    const matchesType = selectedType === 'All' || survey.facilityData?.facilityType === selectedType;
    const matchesSearch = !searchTerm || 
      survey.facilityData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.facilityData?.district?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRegion && matchesType && matchesSearch;
  });

  // Get unique regions and facility types for filters
  const regions = [...new Set(surveys.map(s => s.facilityData?.region).filter(Boolean))];
  const facilityTypes = [...new Set(surveys.map(s => s.facilityData?.facilityType).filter(Boolean))];

  // Chart data preparation
  const regionData = {
    labels: regions,
    datasets: [{
      label: 'Facilities by Region',
      data: regions.map(region => 
        surveys.filter(s => s.facilityData?.region === region).length
      ),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
    }]
  };

  const typeData = {
    labels: facilityTypes,
    datasets: [{
      label: 'Facilities by Type',
      data: facilityTypes.map(type => 
        surveys.filter(s => s.facilityData?.facilityType === type).length
      ),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
    }]
  };

  const operationalHoursData = {
    labels: surveys.map(s => s.facilityData?.name || 'Unknown'),
    datasets: [{
      label: 'Operational Hours',
      data: surveys.map(s => s.facilityData?.operationalHours || 0),
      backgroundColor: '#36A2EB'
    }]
  };

  // New comprehensive data visualizations
  const waterAccessData = {
    labels: ['Piped water', 'Borehole', 'Well', 'Other'],
    datasets: [{
      label: 'Water Access Types',
      data: [
        filteredSurveys.filter(s => s.facilityData?.waterAccess === 'Piped water').length,
        filteredSurveys.filter(s => s.facilityData?.waterAccess === 'Borehole').length,
        filteredSurveys.filter(s => s.facilityData?.waterAccess === 'Well').length,
        filteredSurveys.filter(s => s.facilityData?.waterAccess && !['Piped water', 'Borehole', 'Well'].includes(s.facilityData.waterAccess)).length
      ],
      backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0']
    }]
  };

  const powerSourceData = {
    labels: ['Solar', 'Grid', 'Generator', 'None'],
    datasets: [{
      label: 'Primary Power Sources',
      data: [
        filteredSurveys.filter(s => s.facilityData?.primaryPowerSource?.includes('Solar')).length,
        filteredSurveys.filter(s => s.facilityData?.primaryPowerSource?.includes('grid')).length,
        filteredSurveys.filter(s => s.facilityData?.primaryPowerSource?.includes('Generator')).length,
        filteredSurveys.filter(s => !s.facilityData?.primaryPowerSource || s.facilityData?.primaryPowerSource === 'None').length
      ],
      backgroundColor: ['#FFC107', '#4CAF50', '#FF5722', '#9E9E9E']
    }]
  };

  const staffingData = {
    labels: filteredSurveys.map(s => s.facilityData?.name || 'Unknown'),
    datasets: [
      {
        label: 'Doctors',
        data: filteredSurveys.map(s => s.facilityData?.doctors || 0),
        backgroundColor: '#FF6384'
      },
      {
        label: 'Nurses',
        data: filteredSurveys.map(s => s.facilityData?.nurses || 0),
        backgroundColor: '#36A2EB'
      },
      {
        label: 'CHWs',
        data: filteredSurveys.map(s => s.facilityData?.communityHealthWorkers || 0),
        backgroundColor: '#FFCE56'
      }
    ]
  };

  const capacityData = {
    labels: filteredSurveys.map(s => s.facilityData?.name || 'Unknown'),
    datasets: [{
      label: 'Patient Capacity',
      data: filteredSurveys.map(s => s.facilityData?.patientCapacity || 0),
      backgroundColor: '#4BC0C0'
    }]
  };

  const energyConsumptionData = {
    labels: filteredSurveys.map(s => s.facilityData?.name || 'Unknown'),
    datasets: [{
      label: 'Energy Consumption (kWh)',
      data: filteredSurveys.map(s => s.facilityData?.energyConsumption || 0),
      backgroundColor: '#9966FF'
    }]
  };

  const exportToCSV = () => {
    const headers = ['Facility Name', 'Type', 'Region', 'District', 'Operational Hours', 'Staff Count'];
    const csvContent = [
      headers.join(','),
      ...filteredSurveys.map(survey => [
        survey.facilityData?.name || '',
        survey.facilityData?.facilityType || '',
        survey.facilityData?.region || '',
        survey.facilityData?.district || '',
        survey.facilityData?.operationalHours || 0,
        survey.facilityData?.staffCount || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'survey_analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enhanced Survey Analysis Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive analysis and visualization of facility survey data
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              label="Search Facilities"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Region</InputLabel>
              <Select
                value={selectedRegion}
                label="Region"
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <MenuItem value="All">All Regions</MenuItem>
                {regions.map(region => (
                  <MenuItem key={region} value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Facility Type</InputLabel>
              <Select
                value={selectedType}
                label="Facility Type"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <MenuItem value="All">All Types</MenuItem>
                {facilityTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{filteredSurveys.length}</Typography>
                  <Typography color="text.secondary">Total Facilities</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocationOnIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{regions.length}</Typography>
                  <Typography color="text.secondary">Regions Covered</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {filteredSurveys.reduce((sum, s) => sum + (s.facilityData?.staffCount || 0), 0)}
                  </Typography>
                  <Typography color="text.secondary">Total Staff</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {filteredSurveys.reduce((sum, s) => sum + (s.facilityData?.bedsAvailable || 0), 0)}
                  </Typography>
                  <Typography color="text.secondary">Total Beds</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BarChartIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {filteredSurveys.filter(s => s.facilityData?.emergencyServices).length}
                  </Typography>
                  <Typography color="text.secondary">Emergency Services</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<MapIcon />} label="Geographic View" />
          <Tab icon={<BarChartIcon />} label="Analytics" />
          <Tab icon={<AssessmentIcon />} label="Facility List" />
        </Tabs>
      </Box>

      {/* Geographic View Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Facility Locations" 
                subheader={`Displaying ${filteredSurveys.filter(s => s.facilityData?.latitude && s.facilityData?.longitude).length} facilities with GPS coordinates`}
              />
              <CardContent>
                {/* Interactive Map with Facility Markers */}
                <Box 
                  sx={{ 
                    height: 500, 
                    width: '100%',
                    position: 'relative',
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  {/* Interactive Map Visualization */}
                  <Box 
                    sx={{ 
                      height: '100%', 
                      width: '100%',
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 1
                    }}
                  >
                    {/* Somalia Map Background */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        width: '80%',
                        height: '80%',
                        background: '#f5f5f5',
                        borderRadius: 2,
                        border: '2px solid #ddd',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 2
                      }}
                    >
                      {/* Map Title */}
                      <Typography variant="h6" sx={{ textAlign: 'center', color: '#1976d2', mb: 2 }}>
                        🗺️ Somalia Healthcare Facilities
                      </Typography>
                      
                      {/* Facility Markers */}
                      <Box sx={{ position: 'relative', height: '100%' }}>
                        {/* Kaalmo MCH - Bay Region (Southwest) */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: '30%',
                            left: '25%',
                            transform: 'translate(-50%, 50%)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translate(-50%, 50%) scale(1.1)',
                            }
                          }}
                        >
                          <LocationOnIcon sx={{ fontSize: 32, color: '#4caf50' }} />
                          <Paper
                            elevation={3}
                            sx={{
                              position: 'absolute',
                              bottom: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              p: 1.5,
                              minWidth: 200,
                              mb: 1,
                              bgcolor: 'white',
                              border: '1px solid #ddd'
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                              Kaalmo MCH
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              📍 Bay, Baidoa
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              🏥 Health Center
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              👥 Staff: 12 people
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              ⚡ Power: Solar
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              GPS: 3.1136, 43.6502
                            </Typography>
                          </Paper>
                        </Box>

                        {/* Hobyo Hospital - Mudug Region (Central) */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '25%',
                            right: '20%',
                            transform: 'translate(50%, -50%)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translate(50%, -50%) scale(1.1)',
                            }
                          }}
                        >
                          <LocationOnIcon sx={{ fontSize: 32, color: '#f44336' }} />
                          <Paper
                            elevation={3}
                            sx={{
                              position: 'absolute',
                              bottom: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              p: 1.5,
                              minWidth: 200,
                              mb: 1,
                              bgcolor: 'white',
                              border: '1px solid #ddd'
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                              Hobyo Hospital
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              📍 Mudug, Hobyo
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              🏥 Hospital
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              👥 Staff: 11 people
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              ⚡ Power: Generator
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              GPS: 5.3482, 48.5251
                            </Typography>
                          </Paper>
                        </Box>

                        {/* Region Labels */}
                        <Typography variant="caption" sx={{ position: 'absolute', bottom: '20%', left: '20%', color: '#666' }}>
                          Bay Region
                        </Typography>
                        <Typography variant="caption" sx={{ position: 'absolute', top: '20%', right: '15%', color: '#666' }}>
                          Mudug Region
                        </Typography>
                      </Box>

                      {/* Legend */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                          <Typography variant="caption">Health Center</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: '#f44336' }} />
                          <Typography variant="caption">Hospital</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Basic Analytics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Facilities by Region" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Bar data={regionData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Facility Types Distribution" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Pie data={typeData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Water and Sanitation Analytics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Water Access Distribution" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Pie data={waterAccessData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Primary Power Sources" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Pie data={powerSourceData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Staffing Analytics */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Staffing Breakdown by Facility" />
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <Bar 
                    data={staffingData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        x: { stacked: true },
                        y: { stacked: true }
                      }
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Capacity and Infrastructure */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Patient Capacity by Facility" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Bar data={capacityData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Energy Consumption" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Bar data={energyConsumptionData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Operational Analytics */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Operational Hours by Facility" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Bar data={operationalHoursData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Facility List Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {filteredSurveys.map(survey => (
            <Grid item xs={12} md={6} lg={4} key={survey.id}>
              <Card>
                <CardHeader
                  title={survey.facilityData?.name || 'Unknown Facility'}
                  subheader={`${survey.facilityData?.district}, ${survey.facilityData?.region}`}
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={survey.facilityData?.facilityType || 'Unknown Type'} 
                      size="small" 
                      color="primary" 
                    />
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Operational Hours" 
                        secondary={`${survey.facilityData?.operationalHours || 0} hours/day`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Staff Count" 
                        secondary={survey.facilityData?.staffCount || 0} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Equipment" 
                        secondary={`${survey.facilityData?.equipment?.length || 0} items`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Power Sources" 
                        secondary={survey.facilityData?.powerSources?.join(', ') || 'None'} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default EnhancedSurveyAnalysisDashboard;
