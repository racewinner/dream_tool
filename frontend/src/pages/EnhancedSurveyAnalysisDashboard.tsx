import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  AppBar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Assessment as AssessmentIcon,
  Map as MapIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  SurveyAnalyticsService,
  GeographicalAnalytics,
  RegionalAnalytics,
  EquipmentAnalyticsResponse
} from '../services/surveyAnalyticsService';
import SurveyMap from '../components/analytics/SurveyMap';
import AnalyticsCharts from '../components/analytics/AnalyticsCharts';
import SurveyFilters from '../components/analytics/SurveyFilters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`survey-tabpanel-${index}`}
      aria-labelledby={`survey-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

/**
 * Enhanced Survey Analysis Dashboard with interactive map, charts, and filtering
 */
const EnhancedSurveyAnalysisDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Data state
  const [geographicalData, setGeographicalData] = useState<GeographicalAnalytics | null>(null);
  const [regionalData, setRegionalData] = useState<RegionalAnalytics | null>(null);
  const [equipmentData, setEquipmentData] = useState<EquipmentAnalyticsResponse | null>(null);
  
  // Filter state
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedFacilityType, setSelectedFacilityType] = useState('');
  const [selectedPowerSource, setSelectedPowerSource] = useState('');
  const [selectedSite, setSelectedSite] = useState<any>(null);
  
  const { token } = useAuth();

  // Load enhanced analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [token]);

  const loadAnalyticsData = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading enhanced analytics data...');
      
      // Load all analytics data in parallel
      const [geoData, regData, equipData] = await Promise.all([
        SurveyAnalyticsService.getGeographicalAnalytics(),
        SurveyAnalyticsService.getRegionalAnalytics(),
        SurveyAnalyticsService.getEquipmentAnalytics()
      ]);
      
      setGeographicalData(geoData);
      setRegionalData(regData);
      setEquipmentData(equipData);
      
      console.log('📊 Enhanced analytics data loaded successfully');
      
    } catch (err: any) {
      console.error('❌ Error loading analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };
  
  const handleClearFilters = () => {
    setSelectedRegion('');
    setSelectedDistrict('');
    setSelectedFacilityType('');
    setSelectedPowerSource('');
    setSelectedSite(null);
  };

  const handleExport = async () => {
    if (!geographicalData) return;
    
    try {
      // Create CSV content from geographical data
      const csvHeaders = ['Site Name', 'Latitude', 'Longitude', 'Region', 'District', 'Facility Type', 'Power Source', 'Completeness %', 'Last Survey Date'];
      const csvRows = geographicalData.sites.map(site => [
        site.name,
        site.latitude,
        site.longitude,
        site.region,
        site.district,
        site.facilityType,
        site.powerSource,
        site.completeness,
        site.lastSurveyDate
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Export completed successfully!');
    } catch (err: any) {
      setError(err.message || 'Export failed');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column" gap={2}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="textSecondary">
            Loading Survey Analytics...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Filter sites based on current selections
  const getFilteredSites = () => {
    if (!geographicalData) return [];
    
    return geographicalData.sites.filter(site => {
      return (
        (!selectedRegion || site.region === selectedRegion) &&
        (!selectedDistrict || site.district === selectedDistrict) &&
        (!selectedFacilityType || site.facilityType === selectedFacilityType) &&
        (!selectedPowerSource || site.powerSource === selectedPowerSource)
      );
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Enhanced Survey Analytics
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Interactive analysis of survey data with mapping and visualizations
          </Typography>
        </Box>
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
            disabled={loading || !geographicalData}
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

      {/* Filters */}
      {geographicalData && regionalData && (
        <SurveyFilters
          sites={geographicalData.sites}
          regionalData={regionalData.breakdown}
          selectedRegion={selectedRegion}
          selectedDistrict={selectedDistrict}
          selectedFacilityType={selectedFacilityType}
          selectedPowerSource={selectedPowerSource}
          onRegionChange={setSelectedRegion}
          onDistrictChange={setSelectedDistrict}
          onFacilityTypeChange={setSelectedFacilityType}
          onPowerSourceChange={setSelectedPowerSource}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Tabs */}
      <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            icon={<MapIcon />} 
            label="Interactive Map" 
            id="survey-tab-0"
            aria-controls="survey-tabpanel-0"
          />
          <Tab 
            icon={<ChartIcon />} 
            label="Analytics & Charts" 
            id="survey-tab-1"
            aria-controls="survey-tabpanel-1"
          />
        </Tabs>
      </AppBar>

      {/* Map Tab */}
      <TabPanel value={tabValue} index={0}>
        {geographicalData && (
          <SurveyMap
            sites={getFilteredSites()}
            loading={loading}
            error={error}
            onSiteSelect={setSelectedSite}
            selectedRegion={selectedRegion}
            selectedFacilityType={selectedFacilityType}
            selectedPowerSource={selectedPowerSource}
          />
        )}
      </TabPanel>

      {/* Charts Tab */}
      <TabPanel value={tabValue} index={1}>
        {geographicalData && regionalData && equipmentData && (
          <AnalyticsCharts
            regionalData={regionalData.breakdown}
            equipmentData={equipmentData.equipment}
            sitesData={getFilteredSites()}
          />
        )}
      </TabPanel>
    </Container>
  );
};

export default EnhancedSurveyAnalysisDashboard;
