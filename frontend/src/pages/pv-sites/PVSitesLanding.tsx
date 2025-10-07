import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  InputAdornment,
  Divider,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PowerIcon from '@mui/icons-material/Power';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalculateIcon from '@mui/icons-material/Calculate';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import BuildIcon from '@mui/icons-material/Build';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventIcon from '@mui/icons-material/Event';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SolarSystemService, { SolarSystemData } from '../../services/solarSystemService';
import TechnoEconomicService, { TechnoEconomicResult, CostingMethodology } from '../../services/technoEconomicService';

interface MaintenanceRecord {
  id: number;
  date: string;
  type: 'routine' | 'repair' | 'inspection' | 'cleaning';
  description: string;
  technician?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  cost?: number;
  nextDue?: string;
}

interface PVSite extends SolarSystemData {
  alerts?: number;
  lastMaintenance?: string;
  installDate?: string;
  realtimeData?: {
    currentOutput: number;
    dailyGeneration: number;
    efficiency: number;
    batteryLevel?: number;
    gridConnection?: boolean;
    lastUpdated: string;
  };
  maintenanceRecords?: MaintenanceRecord[];
  nextMaintenanceDate?: string;
  maintenanceStatus?: 'current' | 'due' | 'overdue';
}

const PVSitesLanding: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sites, setSites] = useState<PVSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<PVSite | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Techno-Economic Analysis state
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<TechnoEconomicResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [costingMethod, setCostingMethod] = useState<CostingMethodology['method']>('perWatt');
  const [costingForm, setCostingForm] = useState({
    systemCostPerWatt: 2.5,
    panelCostPerKw: 800,
    batteryCostPerKwh: 300,
    inverterCostPerKw: 400,
    structureCostPerKw: 200
  });
  
  // Maintenance scheduling state
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [selectedMaintenanceSite, setSelectedMaintenanceSite] = useState<PVSite | null>(null);
  const [newMaintenanceRecord, setNewMaintenanceRecord] = useState<Partial<MaintenanceRecord>>({
    type: 'routine',
    status: 'scheduled',
    date: new Date().toISOString().split('T')[0]
  });

  // Site Creation/Editing state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [siteFormStep, setSiteFormStep] = useState(0);
  const [siteForm, setSiteForm] = useState({
    name: '',
    facilityId: '',
    capacity: '',
    type: 'off-grid' as 'grid-tied' | 'off-grid' | 'hybrid',
    location: {
      latitude: '',
      longitude: '',
      address: ''
    },
    components: {
      panels: '',
      inverters: '',
      batteries: ''
    },
    installation: {
      installDate: '',
      contractor: '',
      warranty: ''
    },
    technical: {
      panelType: '',
      inverterType: '',
      batteryType: '',
      mounting: ''
    }
  });
  
  // Load solar systems from backend
  useEffect(() => {
    loadSolarSystems();
  }, [token]);

  const loadSolarSystems = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await SolarSystemService.getSolarSystems(token, {
        limit: 100,
        offset: 0
      });

      if (response.success) {
        // Transform backend data to match PVSite interface
        const transformedSites: PVSite[] = response.data.map(system => ({
          ...system,
          alerts: Math.floor(Math.random() * 4), // Mock alerts for now
          lastMaintenance: system.maintenance?.lastMaintenance || 'N/A',
          installDate: system.installationDate || 'N/A'
        }));
        
        setSites(transformedSites);
      } else {
        throw new Error(response.message || 'Failed to load solar systems');
      }
    } catch (err: any) {
      console.error('Error loading solar systems:', err);
      setError(err.message || 'Failed to load solar systems');
      
      // Fallback to sample data if backend fails
      setSites(getSampleSites());
    } finally {
      setLoading(false);
    }
  };

  // Sample data fallback
  const getSampleSites = (): PVSite[] => [
    {
      id: 1,
      name: 'Nairobi Community Center',
      facilityId: 1,
      capacity: 5.4,
      type: 'grid-tied' as const,
      status: 'active' as const,
      location: { latitude: -1.2921, longitude: 36.8219 },
      components: { panels: 20, inverters: 1 },
      alerts: 0,
      lastMaintenance: '2023-07-01',
      installDate: '2022-03-15',
      realtimeData: {
        currentOutput: 4.2,
        dailyGeneration: 18.5,
        efficiency: 77.8,
        gridConnection: true,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      id: 2,
      name: 'Mombasa Health Clinic',
      facilityId: 2,
      capacity: 12.8,
      type: 'off-grid' as const,
      status: 'active' as const,
      location: { latitude: -4.0435, longitude: 39.6682 },
      components: { panels: 48, inverters: 2, batteries: 8 },
      alerts: 2,
      lastMaintenance: '2023-06-15',
      installDate: '2022-02-10',
      realtimeData: {
        currentOutput: 8.9,
        dailyGeneration: 42.3,
        efficiency: 69.5,
        batteryLevel: 85,
        gridConnection: false,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      id: 3,
      name: 'Kisumu School Campus',
      facilityId: 3,
      capacity: 8.2,
      type: 'hybrid' as const,
      status: 'active' as const,
      location: { latitude: -0.1022, longitude: 34.7617 },
      components: { panels: 32, inverters: 1, batteries: 4 },
      alerts: 0,
      lastMaintenance: '2023-07-10',
      installDate: '2022-05-20',
      realtimeData: {
        currentOutput: 6.1,
        dailyGeneration: 28.7,
        efficiency: 74.4,
        batteryLevel: 92,
        gridConnection: true,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      id: 4,
      name: 'Nakuru Agricultural Cooperative',
      facilityId: 4,
      capacity: 3.6,
      type: 'grid-tied' as const,
      status: 'maintenance' as const,
      location: { latitude: -0.3031, longitude: 36.0800 },
      components: { panels: 14, inverters: 1 },
      alerts: 1,
      lastMaintenance: '2023-07-20',
      installDate: '2022-04-05',
      realtimeData: {
        currentOutput: 0.8,
        dailyGeneration: 5.2,
        efficiency: 36.1,
        gridConnection: true,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      id: 5,
      name: 'Eldoret Water Pumping Station',
      facilityId: 5,
      capacity: 6.2,
      type: 'off-grid' as const,
      status: 'inactive' as const,
      location: { latitude: 0.5143, longitude: 35.2697 },
      components: { panels: 24, inverters: 1, batteries: 6 },
      alerts: 3,
      lastMaintenance: '2023-05-05',
      installDate: '2022-01-15',
      realtimeData: {
        currentOutput: 0.0,
        dailyGeneration: 0.0,
        efficiency: 0.0,
        batteryLevel: 15,
        gridConnection: false,
        lastUpdated: new Date().toISOString()
      },
      maintenanceRecords: [
        {
          id: 1,
          date: '2023-05-05',
          type: 'repair',
          description: 'Inverter malfunction repair',
          technician: 'John Smith',
          status: 'completed',
          cost: 1200,
          nextDue: '2024-02-05'
        }
      ],
      nextMaintenanceDate: '2024-02-05',
      maintenanceStatus: 'overdue'
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (site: PVSite) => {
    setSelectedSite(site);
    setDetailsOpen(true);
  };

  const handleRefresh = () => {
    loadSolarSystems();
  };

  // Techno-Economic Analysis functions
  const handleAnalyzeSite = (site: PVSite) => {
    setSelectedSite(site);
    setAnalysisDialogOpen(true);
    setAnalysisStep(0);
    setAnalysisResults(null);
  };

  const performTechnoEconomicAnalysis = async () => {
    if (!selectedSite || !token) return;

    try {
      setAnalysisLoading(true);
      setAnalysisStep(1);

      // Create costing methodology object with correct type
      const methodology = {
        method: costingMethod,
        ...(costingMethod === 'perWatt' ? {
          systemCostPerWatt: costingForm.systemCostPerWatt
        } : {
          panelCostPerKw: costingForm.panelCostPerKw,
          batteryCostPerKwh: costingForm.batteryCostPerKwh,
          inverterCostPerKw: costingForm.inverterCostPerKw,
          structureCostPerKw: costingForm.structureCostPerKw
        })
      };

      const parameters = TechnoEconomicService.getMergedParameters();
      
      const result = await TechnoEconomicService.performAnalysis(
        selectedSite.facilityId,
        methodology,
        parameters,
        token
      );

      if (result.success && result.data) {
        setAnalysisResults(result.data);
        setAnalysisStep(2);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      console.error('Techno-economic analysis failed:', err);
      setError(`Analysis failed: ${err.message}`);
      
      // Fallback to mock data for demonstration
      const mockResult = TechnoEconomicService.getMockAnalysisResult();
      setAnalysisResults(mockResult);
      setAnalysisStep(2);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisDialogOpen(false);
    setAnalysisStep(0);
    setAnalysisResults(null);
    setSelectedSite(null);
  };

  // Maintenance scheduling functions
  const handleScheduleMaintenance = (site: PVSite) => {
    setSelectedMaintenanceSite(site);
    setMaintenanceDialogOpen(true);
    setNewMaintenanceRecord({
      type: 'routine',
      status: 'scheduled',
      date: new Date().toISOString().split('T')[0],
      description: '',
      technician: ''
    });
  };

  const handleSaveMaintenance = () => {
    if (!selectedMaintenanceSite || !newMaintenanceRecord.date || !newMaintenanceRecord.description) return;

    const updatedSites = sites.map(site => {
      if (site.id === selectedMaintenanceSite.id) {
        const newRecord: MaintenanceRecord = {
          id: Date.now(),
          date: newMaintenanceRecord.date!,
          type: newMaintenanceRecord.type!,
          description: newMaintenanceRecord.description!,
          technician: newMaintenanceRecord.technician,
          status: newMaintenanceRecord.status!,
          cost: newMaintenanceRecord.cost,
          nextDue: newMaintenanceRecord.nextDue
        };

        return {
          ...site,
          maintenanceRecords: [...(site.maintenanceRecords || []), newRecord],
          nextMaintenanceDate: newMaintenanceRecord.nextDue,
          maintenanceStatus: 'current' as const
        };
      }
      return site;
    });

    setSites(updatedSites);
    setMaintenanceDialogOpen(false);
    setSelectedMaintenanceSite(null);
  };

  const getMaintenanceStatusColor = (status?: 'current' | 'due' | 'overdue') => {
    switch (status) {
      case 'current': return 'success';
      case 'due': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getMaintenanceStatusIcon = (status?: 'current' | 'due' | 'overdue') => {
    switch (status) {
      case 'current': return <BuildIcon />;
      case 'due': return <ScheduleIcon />;
      case 'overdue': return <NotificationsIcon />;
      default: return <BuildIcon />;
    }
  };

  // Site Creation/Editing functions
  const handleCreateSite = () => {
    // Reset form
    setSiteForm({
      name: '',
      facilityId: '',
      capacity: '',
      type: 'off-grid',
      location: { latitude: '', longitude: '', address: '' },
      components: { panels: '', inverters: '', batteries: '' },
      installation: { installDate: '', contractor: '', warranty: '' },
      technical: { panelType: '', inverterType: '', batteryType: '', mounting: '' }
    });
    setSiteFormStep(0);
    setCreateDialogOpen(true);
  };

  const handleEditSite = (site: PVSite) => {
    // Populate form with existing site data
    setSiteForm({
      name: site.name,
      facilityId: site.facilityId.toString(),
      capacity: site.capacity.toString(),
      type: site.type,
      location: {
        latitude: typeof site.location === 'object' ? site.location.latitude.toString() : '',
        longitude: typeof site.location === 'object' ? site.location.longitude.toString() : '',
        address: typeof site.location === 'string' ? site.location : ''
      },
      components: {
        panels: site.components.panels?.toString() || '',
        inverters: site.components.inverters?.toString() || '',
        batteries: site.components.batteries?.toString() || ''
      },
      installation: {
        installDate: site.installDate || '',
        contractor: '',
        warranty: ''
      },
      technical: {
        panelType: '',
        inverterType: '',
        batteryType: '',
        mounting: ''
      }
    });
    setSelectedSite(site);
    setSiteFormStep(0);
    setEditDialogOpen(true);
  };

  const handleSaveSite = async () => {
    try {
      // Convert form data to API format
      const siteData = {
        name: siteForm.name,
        facilityId: parseInt(siteForm.facilityId),
        capacity: parseFloat(siteForm.capacity),
        type: siteForm.type,
        location: {
          latitude: parseFloat(siteForm.location.latitude),
          longitude: parseFloat(siteForm.location.longitude)
        },
        components: {
          panels: parseInt(siteForm.components.panels),
          inverters: parseInt(siteForm.components.inverters),
          batteries: siteForm.components.batteries ? parseInt(siteForm.components.batteries) : undefined
        },
        installationDate: siteForm.installation.installDate
      };

      if (editDialogOpen && selectedSite) {
        // Update existing site
        // TODO: Call update API
        console.log('Updating site:', siteData);
      } else {
        // Create new site
        // TODO: Call create API
        console.log('Creating site:', siteData);
      }

      // Close dialog and refresh data
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
      loadSolarSystems();
    } catch (err: any) {
      setError(`Failed to save site: ${err.message}`);
    }
  };

  const closeSiteDialog = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSiteFormStep(0);
    setSelectedSite(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'inactive': return 'error';
      case 'planned': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <PowerIcon />;
      case 'maintenance': return <WarningIcon />;
      case 'inactive': return <PowerIcon />;
      default: return <PowerIcon />;
    }
  };

  // Filter sites based on search term and status
  const filteredSites = sites.filter(site => {
    const locationString = typeof site.location === 'object' ? 
      `${site.location.latitude}, ${site.location.longitude}` : 
      String(site.location || '');
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         locationString.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalCapacity = sites.reduce((sum, site) => sum + site.capacity, 0);
  const activeSites = sites.filter(site => site.status === 'active').length;
  const totalAlerts = sites.reduce((sum, site) => sum + (site.alerts || 0), 0);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          PV Sites Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BuildIcon />}
            onClick={() => navigate('/design')}
            sx={{ mr: 2 }}
          >
            Design Systems
          </Button>
          <Button
            variant="outlined"
            startIcon={<CompareArrowsIcon />}
            onClick={() => navigate('/mcda')}
            sx={{ mr: 2 }}
          >
            MCDA Analysis
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSolarSystems}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add New Site
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Total Sites
                  </Typography>
                  <Typography variant="h4">
                    {sites.length}
                  </Typography>
                </div>
                <LocationOnIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.6 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Active Sites
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {activeSites}
                  </Typography>
                </div>
                <PowerIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.6 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Total Capacity
                  </Typography>
                  <Typography variant="h4">
                    {totalCapacity.toFixed(1)} kW
                  </Typography>
                </div>
                <WbSunnyIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.6 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Active Alerts
                  </Typography>
                  <Typography variant="h4" color={totalAlerts > 0 ? "error.main" : "success.main"}>
                    {totalAlerts}
                  </Typography>
                </div>
                <WarningIcon sx={{ fontSize: 40, color: totalAlerts > 0 ? 'error.main' : 'success.main', opacity: 0.6 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Real-time Performance Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Real-time Performance
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Total Output
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    {sites.reduce((sum, site) => sum + (site.realtimeData?.currentOutput || 0), 0).toFixed(1)} kW
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Currently generating
                  </Typography>
                </div>
                <ElectricBoltIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.6 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Daily Generation
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {sites.reduce((sum, site) => sum + (site.realtimeData?.dailyGeneration || 0), 0).toFixed(1)} kWh
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Today so far
                  </Typography>
                </div>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.6 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Efficiency
                  </Typography>
                  <Typography variant="h5" color={
                    sites.filter(s => s.realtimeData).length > 0 ? 
                    (sites.reduce((sum, site) => sum + (site.realtimeData?.efficiency || 0), 0) / sites.filter(s => s.realtimeData).length) > 70 ? 
                    'success.main' : 'warning.main' : 'textSecondary'
                  }>
                    {sites.filter(s => s.realtimeData).length > 0 ? 
                      (sites.reduce((sum, site) => sum + (site.realtimeData?.efficiency || 0), 0) / sites.filter(s => s.realtimeData).length).toFixed(1) 
                      : '0'}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Portfolio average
                  </Typography>
                </div>
                <WbSunnyIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.6 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Battery Status
                  </Typography>
                  <Typography variant="h5" color="info.main">
                    {sites.filter(s => s.realtimeData?.batteryLevel).length > 0 ? 
                      (sites.reduce((sum, site) => sum + (site.realtimeData?.batteryLevel || 0), 0) / 
                       sites.filter(s => s.realtimeData?.batteryLevel).length).toFixed(0) 
                      : 'N/A'}
                    {sites.filter(s => s.realtimeData?.batteryLevel).length > 0 && '%'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {sites.filter(s => s.realtimeData?.batteryLevel).length} systems
                  </Typography>
                </div>
                <BatteryFullIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.6 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Trends Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            <ShowChartIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Performance Trends
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TimelineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Daily Generation Trend
              </Typography>
              <Box sx={{ mt: 2 }}>
                {sites.slice(0, 3).map((site, index) => (
                  <Box key={site.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{site.name}</Typography>
                      <Typography variant="body2" color="primary">
                        {site.realtimeData?.dailyGeneration?.toFixed(1) || '0.0'} kWh
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, ((site.realtimeData?.dailyGeneration || 0) / (site.capacity * 8)) * 100)}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: index === 0 ? 'success.main' : index === 1 ? 'primary.main' : 'warning.main'
                        }
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {(((site.realtimeData?.dailyGeneration || 0) / (site.capacity * 8)) * 100).toFixed(1)}% of daily target
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ElectricBoltIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Current Output Distribution
              </Typography>
              <Box sx={{ mt: 2 }}>
                {sites.filter(s => s.status === 'active').map((site, index) => (
                  <Box key={site.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{site.name}</Typography>
                      <Typography variant="body2" color="primary">
                        {site.realtimeData?.currentOutput?.toFixed(1) || '0.0'} kW
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, ((site.realtimeData?.currentOutput || 0) / site.capacity) * 100)}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: ((site.realtimeData?.currentOutput || 0) / site.capacity) > 0.7 ? 'success.main' : 
                                         ((site.realtimeData?.currentOutput || 0) / site.capacity) > 0.4 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {(((site.realtimeData?.currentOutput || 0) / site.capacity) * 100).toFixed(1)}% of capacity
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WbSunnyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Efficiency Performance
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  {sites.filter(s => s.realtimeData).map((site) => (
                    <Grid item xs={6} key={site.id}>
                      <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 2 }}>
                        <Typography variant="body2" noWrap>{site.name}</Typography>
                        <Typography 
                          variant="h6" 
                          color={
                            (site.realtimeData?.efficiency || 0) > 70 ? 'success.main' : 
                            (site.realtimeData?.efficiency || 0) > 50 ? 'warning.main' : 'error.main'
                          }
                        >
                          {site.realtimeData?.efficiency?.toFixed(1) || '0.0'}%
                        </Typography>
                        <Chip 
                          size="small" 
                          label={
                            (site.realtimeData?.efficiency || 0) > 70 ? 'Excellent' : 
                            (site.realtimeData?.efficiency || 0) > 50 ? 'Good' : 'Needs Attention'
                          }
                          color={
                            (site.realtimeData?.efficiency || 0) > 70 ? 'success' : 
                            (site.realtimeData?.efficiency || 0) > 50 ? 'warning' : 'error'
                          }
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BatteryFullIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Battery Health Monitor
              </Typography>
              <Box sx={{ mt: 2 }}>
                {sites.filter(s => s.realtimeData?.batteryLevel !== undefined).map((site) => (
                  <Box key={site.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">{site.name}</Typography>
                      <Chip 
                        size="small"
                        label={`${site.realtimeData?.batteryLevel}%`}
                        color={
                          (site.realtimeData?.batteryLevel || 0) > 70 ? 'success' :
                          (site.realtimeData?.batteryLevel || 0) > 30 ? 'warning' : 'error'
                        }
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={site.realtimeData?.batteryLevel || 0}
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: (site.realtimeData?.batteryLevel || 0) > 70 ? 'success.main' :
                                         (site.realtimeData?.batteryLevel || 0) > 30 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {site.components.batteries || 0} battery units • 
                      {site.realtimeData?.gridConnection ? ' Grid Connected' : ' Off-Grid'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search sites..."
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
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Status Filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
              <option value="planned">Planned</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => {/* TODO: Advanced filters */}}
            >
              Advanced Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* View Toggle Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="view toggle">
          <Tab icon={<ListAltIcon />} label="List View" />
          <Tab icon={<MapIcon />} label="Map View" />
        </Tabs>
      </Paper>

      {/* Content based on selected tab */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Site Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Capacity (kW)</TableCell>
                <TableCell>Current Output</TableCell>
                <TableCell>Efficiency</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Maintenance</TableCell>
                <TableCell>Alerts</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      {site.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {typeof site.location === 'string' 
                      ? site.location 
                      : `${site.location.latitude.toFixed(4)}, ${site.location.longitude.toFixed(4)}`
                    }
                  </TableCell>
                  <TableCell>{site.capacity} kW</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <ElectricBoltIcon sx={{ mr: 0.5, fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" color={site.realtimeData?.currentOutput ? 'primary.main' : 'text.secondary'}>
                        {site.realtimeData?.currentOutput?.toFixed(1) || '0.0'} kW
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <WbSunnyIcon sx={{ mr: 0.5, fontSize: 16, color: 'warning.main' }} />
                      <Typography 
                        variant="body2" 
                        color={
                          site.realtimeData?.efficiency 
                            ? site.realtimeData.efficiency > 70 ? 'success.main' : 'warning.main'
                            : 'text.secondary'
                        }
                      >
                        {site.realtimeData?.efficiency?.toFixed(1) || '0.0'}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={site.type} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(site.status)}
                      label={site.status.charAt(0).toUpperCase() + site.status.slice(1)}
                      color={getStatusColor(site.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {site.maintenanceStatus ? (
                      <Chip
                        icon={getMaintenanceStatusIcon(site.maintenanceStatus)}
                        label={site.maintenanceStatus.charAt(0).toUpperCase() + site.maintenanceStatus.slice(1)}
                        color={getMaintenanceStatusColor(site.maintenanceStatus) as any}
                        size="small"
                      />
                    ) : (
                      <Chip label="N/A" size="small" variant="outlined" />
                    )}
                    {site.nextMaintenanceDate && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        Next: {new Date(site.nextMaintenanceDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {site.alerts && site.alerts > 0 ? (
                      <Chip
                        label={site.alerts}
                        color="error"
                        size="small"
                        icon={<WarningIcon />}
                      />
                    ) : (
                      <Chip label="0" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(site)}
                      title="View Details"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleAnalyzeSite(site)}
                      title="Techno-Economic Analysis"
                      color="primary"
                    >
                      <CalculateIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleScheduleMaintenance(site)}
                      title="Schedule Maintenance"
                      color="secondary"
                    >
                      <BuildIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditSite(site)}
                      title="Edit Site"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 2, minHeight: 600 }}>
          <Typography variant="h6" gutterBottom>
            PV Sites Map View
          </Typography>
          <Box sx={{ position: 'relative', height: 500, bgcolor: 'grey.100', borderRadius: 1 }}>
            {/* Map Container */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              {/* Site Markers */}
              {filteredSites.map((site, index) => (
                <Box
                  key={site.id}
                  sx={{
                    position: 'absolute',
                    left: `${20 + (index % 3) * 25}%`,
                    top: `${20 + Math.floor(index / 3) * 20}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translate(-50%, -50%) scale(1.1)'
                    }
                  }}
                  onClick={() => handleViewDetails(site)}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: getStatusColor(site.status) === 'success' ? 'success.main' : 
                              getStatusColor(site.status) === 'warning' ? 'warning.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxShadow: 2,
                      border: '2px solid white'
                    }}
                  >
                    {site.capacity}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      whiteSpace: 'nowrap',
                      mt: 0.5
                    }}
                  >
                    {site.name}
                  </Typography>
                </Box>
              ))}

              {/* Map Placeholder Content */}
              <Box sx={{ textAlign: 'center', opacity: 0.6 }}>
                <MapIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">
                  Interactive Map Placeholder
                </Typography>
                <Typography variant="caption">
                  Click on site markers to view details
                </Typography>
              </Box>
            </Box>

            {/* Map Controls */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Button
                variant="contained"
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
                onClick={() => {/* TODO: Zoom in */}}
              >
                +
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
                onClick={() => {/* TODO: Zoom out */}}
              >
                -
              </Button>
              <IconButton
                size="small"
                sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
                onClick={() => {/* TODO: Reset view */}}
              >
                <RefreshIcon />
              </IconButton>
            </Box>

            {/* Map Legend */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                bgcolor: 'white',
                p: 1,
                borderRadius: 1,
                boxShadow: 1
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                Site Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="caption">Active</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                  <Typography variant="caption">Maintenance</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                  <Typography variant="caption">Inactive</Typography>
                </Box>
              </Box>
            </Box>

            {/* Site Summary Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: 'white',
                p: 2,
                borderRadius: 1,
                boxShadow: 1,
                minWidth: 200
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Portfolio Overview
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Total Sites</Typography>
                  <Typography variant="body2" fontWeight="bold">{filteredSites.length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Total Capacity</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {filteredSites.reduce((sum, site) => sum + site.capacity, 0).toFixed(1)} kW
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Active</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {filteredSites.filter(site => site.status === 'active').length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Alerts</Typography>
                  <Typography variant="body2" fontWeight="bold" color={
                    filteredSites.reduce((sum, site) => sum + (site.alerts || 0), 0) > 0 ? "error.main" : "success.main"
                  }>
                    {filteredSites.reduce((sum, site) => sum + (site.alerts || 0), 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Site Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSite?.name} - System Details
        </DialogTitle>
        <DialogContent>
          {selectedSite && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  System Information
                </Typography>
                <Typography variant="body2">
                  <strong>Capacity:</strong> {selectedSite.capacity} kW
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedSite.type}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedSite.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Installation Date:</strong> {selectedSite.installDate}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Components
                </Typography>
                <Typography variant="body2">
                  <strong>Solar Panels:</strong> {selectedSite.components.panels}
                </Typography>
                <Typography variant="body2">
                  <strong>Inverters:</strong> {selectedSite.components.inverters}
                </Typography>
                {selectedSite.components.batteries && (
                  <Typography variant="body2">
                    <strong>Batteries:</strong> {selectedSite.components.batteries}
                  </Typography>
                )}
              </Grid>
              {selectedSite.performance && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Data
                  </Typography>
                  <Typography variant="body2">
                    <strong>Current Output:</strong> {selectedSite.performance.currentOutput} kW
                  </Typography>
                  <Typography variant="body2">
                    <strong>Daily Generation:</strong> {selectedSite.performance.dailyGeneration} kWh
                  </Typography>
                  <Typography variant="body2">
                    <strong>Efficiency:</strong> {selectedSite.performance.efficiency}%
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => {/* TODO: Edit site */}}>
            Edit System
          </Button>
        </DialogActions>
      </Dialog>

      {/* Techno-Economic Analysis Dialog */}
      <Dialog
        open={analysisDialogOpen}
        onClose={resetAnalysis}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoneyIcon />
            Techno-Economic Analysis - {selectedSite?.name}
          </Box>
          {analysisLoading && <LinearProgress sx={{ mt: 1 }} />}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={analysisStep} sx={{ mb: 4 }}>
              <Step>
                <StepLabel>Configure Costing</StepLabel>
              </Step>
              <Step>
                <StepLabel>Running Analysis</StepLabel>
              </Step>
              <Step>
                <StepLabel>Results</StepLabel>
              </Step>
            </Stepper>

            {/* Step 0: Costing Configuration */}
            {analysisStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select Costing Methodology
                </Typography>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Choose costing approach:</FormLabel>
                  <RadioGroup
                    value={costingMethod}
                    onChange={(e) => setCostingMethod(e.target.value as CostingMethodology['method'])}
                  >
                    <FormControlLabel
                      value="perWatt"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1">Per Watt ($/W)</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Simple system-wide cost calculation
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="componentBased"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1">Component-Based</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Detailed breakdown by panels, batteries, inverters
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>

                <Box sx={{ mt: 3 }}>
                  {costingMethod === 'perWatt' && (
                    <TextField
                      fullWidth
                      label="System Cost per Watt ($/W)"
                      type="number"
                      value={costingForm.systemCostPerWatt}
                      onChange={(e) => setCostingForm(prev => ({ ...prev, systemCostPerWatt: parseFloat(e.target.value) }))}
                      sx={{ mb: 2 }}
                    />
                  )}
                  
                  {costingMethod === 'componentBased' && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Panel Cost ($/kW)"
                          type="number"
                          value={costingForm.panelCostPerKw}
                          onChange={(e) => setCostingForm(prev => ({ ...prev, panelCostPerKw: parseFloat(e.target.value) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Battery Cost ($/kWh)"
                          type="number"
                          value={costingForm.batteryCostPerKwh}
                          onChange={(e) => setCostingForm(prev => ({ ...prev, batteryCostPerKwh: parseFloat(e.target.value) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Inverter Cost ($/kW)"
                          type="number"
                          value={costingForm.inverterCostPerKw}
                          onChange={(e) => setCostingForm(prev => ({ ...prev, inverterCostPerKw: parseFloat(e.target.value) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Structure Cost ($/kW)"
                          type="number"
                          value={costingForm.structureCostPerKw}
                          onChange={(e) => setCostingForm(prev => ({ ...prev, structureCostPerKw: parseFloat(e.target.value) }))}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              </Box>
            )}

            {/* Step 1: Analysis Progress */}
            {analysisStep === 1 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalculateIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Performing Analysis for {selectedSite?.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Calculating optimal system sizing, costs, and comparing with current setup...
                </Typography>
                <LinearProgress />
              </Box>
            )}

            {/* Step 2: Results */}
            {analysisStep === 2 && analysisResults && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <CompareArrowsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Analysis Results
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  Analysis based on facility survey data for {selectedSite?.name}
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>
                          Optimized Solar PV System
                        </Typography>
                        <Typography variant="h4" color="primary">
                          ${analysisResults.pv.initialCost.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Initial Investment
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            System Size: <strong>{analysisResults.pv.systemSize.toFixed(1)} kW</strong>
                          </Typography>
                          <Typography variant="body2">
                            Battery Storage: <strong>{analysisResults.pv.batteryCapacity.toFixed(1)} kWh</strong>
                          </Typography>
                          <Typography variant="body2">
                            Annual O&M: <strong>${analysisResults.pv.annualMaintenance.toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2">
                            20-year LCOE: <strong>${analysisResults.pv.lifecycleCost.toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            IRR: <strong>{(analysisResults.pv.irr * 100).toFixed(1)}%</strong>
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="warning.main" gutterBottom>
                          Current Diesel Alternative
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          ${analysisResults.diesel.initialCost.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Generator + Infrastructure
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            Annual Fuel: <strong>${analysisResults.diesel.annualMaintenance.toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2">
                            20-year Total: <strong>${analysisResults.diesel.lifecycleCost.toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            IRR: <strong>{(analysisResults.diesel.irr * 100).toFixed(1)}%</strong>
                          </Typography>
                        </Box>
                        <Alert severity="success" sx={{ mt: 2 }}>
                          Solar PV saves <strong>${(analysisResults.diesel.lifecycleCost - analysisResults.pv.lifecycleCost).toLocaleString()}</strong> over 20 years
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Site Comparison with Current Installation
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Current Capacity</Typography>
                            <Typography variant="h6">{selectedSite?.capacity} kW</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">Recommended Capacity</Typography>
                            <Typography variant="h6" color="primary">{analysisResults.pv.systemSize.toFixed(1)} kW</Typography>
                          </Grid>
                        </Grid>
                        {Math.abs(selectedSite!.capacity - analysisResults.pv.systemSize) > 0.5 && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            {analysisResults.pv.systemSize > selectedSite!.capacity 
                              ? `Consider expanding by ${(analysisResults.pv.systemSize - selectedSite!.capacity).toFixed(1)} kW for optimal performance`
                              : `Current system may be oversized by ${(selectedSite!.capacity - analysisResults.pv.systemSize).toFixed(1)} kW`
                            }
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetAnalysis}>Close</Button>
          {analysisStep === 0 && (
            <Button 
              variant="contained" 
              onClick={performTechnoEconomicAnalysis}
              startIcon={<CalculateIcon />}
            >
              Run Analysis
            </Button>
          )}
          {analysisStep === 2 && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {/* TODO: Save analysis results */}}
            >
              Save Results
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Site Creation/Editing Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onClose={closeSiteDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editDialogOpen ? 'Edit PV Site' : 'Create New PV Site'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={siteFormStep} sx={{ mb: 4 }}>
              <Step>
                <StepLabel>Basic Information</StepLabel>
              </Step>
              <Step>
                <StepLabel>Location & Components</StepLabel>
              </Step>
              <Step>
                <StepLabel>Technical Details</StepLabel>
              </Step>
            </Stepper>

            {/* Step 0: Basic Information */}
            {siteFormStep === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site Name"
                    value={siteForm.name}
                    onChange={(e) => setSiteForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Facility ID"
                    type="number"
                    value={siteForm.facilityId}
                    onChange={(e) => setSiteForm(prev => ({ ...prev, facilityId: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="System Capacity (kW)"
                    type="number"
                    value={siteForm.capacity}
                    onChange={(e) => setSiteForm(prev => ({ ...prev, capacity: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>System Type</InputLabel>
                    <Select
                      value={siteForm.type}
                      label="System Type"
                      onChange={(e) => setSiteForm(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <MenuItem value="grid-tied">Grid-Tied</MenuItem>
                      <MenuItem value="off-grid">Off-Grid</MenuItem>
                      <MenuItem value="hybrid">Hybrid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Installation Date"
                    type="date"
                    value={siteForm.installation.installDate}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      installation: { ...prev.installation, installDate: e.target.value }
                    }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            )}

            {/* Step 1: Location & Components */}
            {siteFormStep === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Location Information
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    value={siteForm.location.latitude}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, latitude: e.target.value }
                    }))}
                    inputProps={{ step: 0.000001 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    value={siteForm.location.longitude}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, longitude: e.target.value }
                    }))}
                    inputProps={{ step: 0.000001 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={siteForm.location.address}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, address: e.target.value }
                    }))}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    System Components
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Number of Panels"
                    type="number"
                    value={siteForm.components.panels}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      components: { ...prev.components, panels: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Number of Inverters"
                    type="number"
                    value={siteForm.components.inverters}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      components: { ...prev.components, inverters: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Number of Batteries"
                    type="number"
                    value={siteForm.components.batteries}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      components: { ...prev.components, batteries: e.target.value }
                    }))}
                    helperText="Optional for grid-tied systems"
                  />
                </Grid>
              </Grid>
            )}

            {/* Step 2: Technical Details */}
            {siteFormStep === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Technical Specifications
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Panel Type/Model"
                    value={siteForm.technical.panelType}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      technical: { ...prev.technical, panelType: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Inverter Type/Model"
                    value={siteForm.technical.inverterType}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      technical: { ...prev.technical, inverterType: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Battery Type/Model"
                    value={siteForm.technical.batteryType}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      technical: { ...prev.technical, batteryType: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Mounting System"
                    value={siteForm.technical.mounting}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      technical: { ...prev.technical, mounting: e.target.value }
                    }))}
                    placeholder="e.g., Roof-mounted, Ground-mounted"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Installation Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Contractor/Installer"
                    value={siteForm.installation.contractor}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      installation: { ...prev.installation, contractor: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Warranty Period (years)"
                    type="number"
                    value={siteForm.installation.warranty}
                    onChange={(e) => setSiteForm(prev => ({ 
                      ...prev, 
                      installation: { ...prev.installation, warranty: e.target.value }
                    }))}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSiteDialog}>Cancel</Button>
          {siteFormStep > 0 && (
            <Button onClick={() => setSiteFormStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          {siteFormStep < 2 ? (
            <Button 
              variant="contained" 
              onClick={() => setSiteFormStep(prev => prev + 1)}
              disabled={!siteForm.name || !siteForm.capacity}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleSaveSite}
              disabled={!siteForm.name || !siteForm.capacity}
            >
              {editDialogOpen ? 'Update Site' : 'Create Site'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Maintenance Scheduling Dialog */}
      <Dialog
        open={maintenanceDialogOpen}
        onClose={() => setMaintenanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BuildIcon sx={{ mr: 1 }} />
            Schedule Maintenance - {selectedMaintenanceSite?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Maintenance Type</InputLabel>
                  <Select
                    value={newMaintenanceRecord.type || 'routine'}
                    onChange={(e) => setNewMaintenanceRecord(prev => ({ 
                      ...prev, 
                      type: e.target.value as MaintenanceRecord['type']
                    }))}
                  >
                    <MenuItem value="routine">Routine Maintenance</MenuItem>
                    <MenuItem value="inspection">Inspection</MenuItem>
                    <MenuItem value="cleaning">Panel Cleaning</MenuItem>
                    <MenuItem value="repair">Repair</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Scheduled Date"
                  value={newMaintenanceRecord.date || ''}
                  onChange={(e) => setNewMaintenanceRecord(prev => ({ 
                    ...prev, 
                    date: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  placeholder="Describe the maintenance activities..."
                  value={newMaintenanceRecord.description || ''}
                  onChange={(e) => setNewMaintenanceRecord(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Assigned Technician"
                  value={newMaintenanceRecord.technician || ''}
                  onChange={(e) => setNewMaintenanceRecord(prev => ({ 
                    ...prev, 
                    technician: e.target.value 
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Cost ($)"
                  value={newMaintenanceRecord.cost || ''}
                  onChange={(e) => setNewMaintenanceRecord(prev => ({ 
                    ...prev, 
                    cost: parseFloat(e.target.value) || undefined
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Next Due Date"
                  value={newMaintenanceRecord.nextDue || ''}
                  onChange={(e) => setNewMaintenanceRecord(prev => ({ 
                    ...prev, 
                    nextDue: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newMaintenanceRecord.status || 'scheduled'}
                    onChange={(e) => setNewMaintenanceRecord(prev => ({ 
                      ...prev, 
                      status: e.target.value as MaintenanceRecord['status']
                    }))}
                  >
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Existing Maintenance Records */}
            {selectedMaintenanceSite?.maintenanceRecords && selectedMaintenanceSite.maintenanceRecords.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  <EventIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Maintenance History
                </Typography>
                {selectedMaintenanceSite.maintenanceRecords.map((record) => (
                  <Card key={record.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <Typography variant="body1" fontWeight="bold">
                            {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {record.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(record.date).toLocaleDateString()} 
                            {record.technician && ` • ${record.technician}`}
                            {record.cost && ` • $${record.cost}`}
                          </Typography>
                        </div>
                        <Chip
                          label={record.status}
                          color={record.status === 'completed' ? 'success' : record.status === 'cancelled' ? 'error' : 'primary'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveMaintenance}
            disabled={!newMaintenanceRecord.date || !newMaintenanceRecord.description}
            startIcon={<ScheduleIcon />}
          >
            Schedule Maintenance
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PVSitesLanding;
