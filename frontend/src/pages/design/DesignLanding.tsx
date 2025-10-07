import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalculateIcon from '@mui/icons-material/Calculate';
import SettingsIcon from '@mui/icons-material/Settings';
import EnergyIcon from '@mui/icons-material/ElectricalServices';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import TechnoEconomicService, { 
  TechnoEconomicParameters, 
  CostingMethodology, 
  TechnoEconomicResult 
} from '../../services/technoEconomicService';
import EnergyService, { LoadProfile, Equipment, FacilityData } from '../../services/energyService';

/**
 * Design Landing Page - Hub for PV system design activities with integrated techno-economic analysis
 */
const DesignLanding: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // Component state
  const [loadProfile, setLoadProfile] = useState<LoadProfile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<TechnoEconomicResult | null>(null);
  const [designDialogOpen, setDesignDialogOpen] = useState(false);
  const [parametersDialogOpen, setParametersDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for new design
  const [designForm, setDesignForm] = useState({
    name: '',
    location: '',
    facilityId: 1, // This should be selected from available facilities
    costingMethod: 'perWatt' as CostingMethodology['method'],
    systemCostPerWatt: 0.4,
    panelCostPerWatt: 0.4,
    panelCostPerKw: 400,
    batteryCostPerKwh: 300,
    inverterCostPerKw: 300,
    structureCostPerKw: 150,
    fixedCosts: 0,
    numPanels: 20,
    panelRating: 400
  });

  const [parameters, setParameters] = useState<TechnoEconomicParameters>(
    TechnoEconomicService.getMergedParameters()
  );

  // Sample design projects with techno-economic results
  const designProjects = [
    {
      id: 1,
      name: 'Community Center System',
      location: 'Nairobi, Kenya',
      status: 'In Progress',
      lastUpdated: '2023-07-15',
      capacity: '5.4',
      dailyUsage: '15.5',
      costingMethod: 'perWatt',
      pvCost: 8500,
      paybackPeriod: 6.2,
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      name: 'Health Clinic Microgrid',
      location: 'Mombasa, Kenya',
      status: 'Completed',
      lastUpdated: '2023-07-01',
      capacity: '12.8',
      dailyUsage: '42.3',
      costingMethod: 'componentBased',
      pvCost: 18900,
      paybackPeriod: 4.8,
      image: 'https://images.unsplash.com/photo-1617696618050-b0fef0c666af?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      name: 'School Campus Array',
      location: 'Kisumu, Kenya',
      status: 'Draft',
      lastUpdated: '2023-07-12',
      capacity: '8.2',
      dailyUsage: '28.7',
      costingMethod: 'fixedVariable',
      pvCost: 12300,
      paybackPeriod: 5.5,
      image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'info';
      case 'Draft':
        return 'default';
      case 'Under Review':
        return 'warning';
      default:
        return 'default';
    }
  };

  const steps = ['Load Profile', 'Costing Method', 'Analysis', 'Results'];

  useEffect(() => {
    // Load load profile using new backend energy service
    loadInitialProfile();
  }, []);

  const loadInitialProfile = async () => {
    try {
      console.log('🔄 Loading initial load profile using backend energy service...');
      
      // Create sample equipment for demonstration
      const sampleEquipment: Equipment[] = [
        {
          id: 'led_lights',
          name: 'LED Lights',
          category: 'lighting',
          powerRating: 20,
          hoursPerDay: 12,
          efficiency: 0.9,
          priority: 'essential',
          facilityTypes: ['health_clinic'],
          description: 'LED lighting for facility',
          quantity: 10
        },
        {
          id: 'medical_fridge',
          name: 'Medical Refrigerator',
          category: 'medical',
          powerRating: 150,
          hoursPerDay: 24,
          efficiency: 0.8,
          priority: 'essential',
          facilityTypes: ['health_clinic'],
          description: 'Vaccine storage refrigerator',
          quantity: 1
        },
        {
          id: 'ceiling_fans',
          name: 'Ceiling Fans',
          category: 'cooling',
          powerRating: 75,
          hoursPerDay: 10,
          efficiency: 0.85,
          priority: 'important',
          facilityTypes: ['health_clinic'],
          description: 'Cooling fans for patient comfort',
          quantity: 4
        }
      ];

      // Generate load profile using backend service
      const result = await EnergyService.generateLoadProfile({
        equipment: sampleEquipment,
        options: {
          includeSeasonalVariation: true,
          safetyMargin: 1.2,
          systemEfficiency: 0.85
        }
      });

      // Convert backend LoadProfile to TechnoEconomic LoadProfile format
      const technoProfile = {
        dailyUsage: result.dailyConsumption,
        peakHours: 6, // Typical peak sun hours
        equipment: sampleEquipment.map(eq => ({
          name: eq.name,
          power: eq.powerRating,
          hours: eq.hoursPerDay,
          quantity: eq.quantity,
          efficiency: eq.efficiency,
          critical: eq.priority === 'essential'
        })),
        latitude: 2.0469, // Somalia coordinates
        longitude: 45.3182,
        location: 'Somalia',
        solarPanelEfficiency: 0.2,
        batteryEfficiency: 0.9,
        gridAvailability: 0.3
      };

      setLoadProfile(technoProfile);
      console.log('✅ Load profile loaded using backend energy service');
      
    } catch (error) {
      console.error('❌ Error loading load profile, using mock data:', error);
      // Fallback to mock data
      const mockProfile = TechnoEconomicService.getMockLoadProfile();
      setLoadProfile(mockProfile);
    }
  };

  const handleNewDesign = async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Creating new design using backend energy service...');

      // Step 1: Create load profile using backend energy service
      await loadInitialProfile();
      setActiveStep(1);
      
      console.log('✅ New design created successfully');

    } catch (err) {
      setError('Failed to create new design');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCostingMethodChange = (method: CostingMethodology['method']) => {
    setDesignForm(prev => ({ ...prev, costingMethod: method }));
  };

  const performAnalysis = async () => {
    if (!token || !loadProfile) {
      setError('Missing required data for analysis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const costingMethod: CostingMethodology = {
        method: designForm.costingMethod,
        systemCostPerWatt: designForm.systemCostPerWatt,
        panelCostPerWatt: designForm.panelCostPerWatt,
        panelCostPerKw: designForm.panelCostPerKw,
        batteryCostPerKwh: designForm.batteryCostPerKwh,
        inverterCostPerKw: designForm.inverterCostPerKw,
        structureCostPerKw: designForm.structureCostPerKw,
        fixedCosts: designForm.fixedCosts,
        numPanels: designForm.numPanels,
        panelRating: designForm.panelRating
      };

      const result = await TechnoEconomicService.performAnalysis(
        designForm.facilityId,
        costingMethod,
        parameters,
        token
      );

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        setActiveStep(3);
      } else {
        // Use mock data if API fails
        const mockResult = TechnoEconomicService.getMockAnalysisResult();
        setAnalysisResult(mockResult);
        setActiveStep(3);
        setError('Using mock data - API not available');
      }

    } catch (err) {
      setError('Analysis failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveParameters = () => {
    TechnoEconomicService.saveUserParameters(parameters);
    setParametersDialogOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            PV System Design & Techno-Economic Analysis
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Design, model, and analyze photovoltaic systems with integrated cost analysis
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<SettingsIcon />}
            component={Link}
            to="/design/parameters"
          >
            Parameters
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setDesignDialogOpen(true)}
          >
            New Design
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Design Projects */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Your Design Projects
          </Typography>
          <Grid container spacing={3}>
            {/* Equipment Selection & Scenario Comparison Feature Card */}
            <Grid item xs={12} sm={6}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={() => navigate('/design/equipment-selection')}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EnergyIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                        Equipment Selection
                      </Typography>
                      <Chip label="NEW FEATURE" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 0.5 }} />
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                    Design ideal energy scenarios by selecting efficient equipment and comparing them with current setups
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip label="Load Profiling" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                    <Chip label="Equipment Database" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                    <Chip label="Scenario Analysis" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                    <Chip label="Cost Comparison" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    • Select facility type and equipment<br/>
                    • Generate realistic load profiles<br/>
                    • Compare current vs ideal scenarios<br/>
                    • Get financial and technical recommendations
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                    startIcon={<CompareArrowsIcon />}
                  >
                    Start Equipment Selection
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            {designProjects.map(project => (
              <Grid item xs={12} sm={6} key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={project.image}
                    alt={project.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h2">
                        {project.name}
                      </Typography>
                      <Chip
                        label={project.status}
                        size="small"
                        color={getStatusColor(project.status) as any}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {project.location}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        Capacity: {project.capacity} kW
                      </Typography>
                      <Typography variant="body2">
                        Usage: {project.dailyUsage} kWh/day
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="primary">
                        Cost: ${project.pvCost.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Payback: {project.paybackPeriod} years
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      Method: {project.costingMethod} • Updated: {project.lastUpdated}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" title="View design">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title="Edit design">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title="More options" sx={{ marginLeft: 'auto' }}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            <Grid item>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  <EnergyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Analysis Tools
                </Typography>
                <List dense>
                  <ListItem button onClick={() => setDesignDialogOpen(true)}>
                    <ListItemText 
                      primary="Techno-Economic Analysis" 
                      secondary="PV vs Diesel cost comparison" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem button component={Link} to="/design/equipment-selection">
                    <ListItemText 
                      primary="Equipment Selection" 
                      secondary="Design ideal energy scenarios" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem button>
                    <ListItemText 
                      primary="Load Profile Generator" 
                      secondary="Create from survey data" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem button>
                    <ListItemText 
                      primary="System Sizing Calculator" 
                      secondary="PV, battery & inverter sizing" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem button onClick={() => setParametersDialogOpen(true)}>
                    <ListItemText 
                      primary="Cost Parameters" 
                      secondary="Configure default pricing" 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Costing Methods
                </Typography>
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Per Watt ($/W):</strong> Simple system-wide cost per installed watt
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Fixed + Variable:</strong> Fixed costs plus component-based variable costs
                  </Typography>
                  <Typography variant="body2">
                    <strong>Component-based:</strong> Detailed breakdown by panels, batteries, inverters
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* New Design Dialog */}
      <Dialog open={designDialogOpen} onClose={() => setDesignDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Create New PV System Design
          {loading && <LinearProgress sx={{ mt: 1 }} />}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 0: Load Profile */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Load Profile from Survey Data</Typography>
                {loadProfile ? (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Load profile generated from facility survey data
                    </Alert>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Daily Usage: <strong>{loadProfile.dailyUsage.toFixed(1)} kWh</strong>
                      </Typography>
                      <Typography variant="subtitle1" gutterBottom>
                        Peak Hours: <strong>{loadProfile.peakHours.toFixed(1)} hours</strong>
                      </Typography>
                    </Paper>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Equipment</TableCell>
                            <TableCell align="right">Power (W)</TableCell>
                            <TableCell align="right">Hours/Day</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Daily Energy (kWh)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loadProfile.equipment.map((item, index) => {
                            const dailyEnergy = (item.power * item.hours * item.quantity) / 1000;
                            return (
                              <TableRow key={index}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell align="right">{item.power}</TableCell>
                                <TableCell align="right">{item.hours}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">{dailyEnergy.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  <Alert severity="warning">No survey data available for load profile generation</Alert>
                )}
              </Box>
            )}

            {/* Step 1: Costing Method */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Select Costing Methodology</Typography>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Choose costing approach:</FormLabel>
                  <RadioGroup
                    value={designForm.costingMethod}
                    onChange={(e) => handleCostingMethodChange(e.target.value as CostingMethodology['method'])}
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
                      value="fixedVariable"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1">Fixed + Variable Costs</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Fixed installation costs plus component-based variables
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

                {/* Cost input fields based on method */}
                <Box sx={{ mt: 3 }}>
                  {designForm.costingMethod === 'perWatt' && (
                    <TextField
                      fullWidth
                      label="System Cost per Watt ($/W)"
                      type="number"
                      value={designForm.systemCostPerWatt}
                      onChange={(e) => setDesignForm(prev => ({ ...prev, systemCostPerWatt: parseFloat(e.target.value) }))}
                      sx={{ mb: 2 }}
                    />
                  )}
                  
                  {(designForm.costingMethod === 'fixedVariable' || designForm.costingMethod === 'componentBased') && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Panel Cost ($/kW)"
                          type="number"
                          value={designForm.panelCostPerKw}
                          onChange={(e) => setDesignForm(prev => ({ ...prev, panelCostPerKw: parseFloat(e.target.value) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Battery Cost ($/kWh)"
                          type="number"
                          value={designForm.batteryCostPerKwh}
                          onChange={(e) => setDesignForm(prev => ({ ...prev, batteryCostPerKwh: parseFloat(e.target.value) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Inverter Cost ($/kW)"
                          type="number"
                          value={designForm.inverterCostPerKw}
                          onChange={(e) => setDesignForm(prev => ({ ...prev, inverterCostPerKw: parseFloat(e.target.value) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Structure Cost ($/kW)"
                          type="number"
                          value={designForm.structureCostPerKw}
                          onChange={(e) => setDesignForm(prev => ({ ...prev, structureCostPerKw: parseFloat(e.target.value) }))}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              </Box>
            )}

            {/* Step 2: Analysis Progress */}
            {activeStep === 2 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalculateIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Performing Techno-Economic Analysis
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Calculating system sizing, costs, and comparing PV vs diesel options...
                </Typography>
                <LinearProgress sx={{ mb: 2 }} />
              </Box>
            )}

            {/* Step 3: Results */}
            {activeStep === 3 && analysisResult && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <CompareArrowsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Analysis Results
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>
                          Solar PV System
                        </Typography>
                        <Typography variant="h4" color="primary">
                          ${analysisResult.pv.initialCost.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Initial Cost
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            System Size: <strong>{analysisResult.pv.systemSize.toFixed(1)} kW</strong>
                          </Typography>
                          <Typography variant="body2">
                            Battery: <strong>{analysisResult.pv.batteryCapacity.toFixed(1)} kWh</strong>
                          </Typography>
                          <Typography variant="body2">
                            Annual Maintenance: <strong>${analysisResult.pv.annualMaintenance.toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2">
                            20-year Cost: <strong>${analysisResult.pv.lifecycleCost.toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            IRR: <strong>{(analysisResult.pv.irr * 100).toFixed(1)}%</strong>
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="warning.main" gutterBottom>
                          Diesel Generator
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          ${analysisResult.diesel.initialCost.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Initial Cost
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            Annual Fuel: <strong>${analysisResult.diesel.annualMaintenance.toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2">
                            20-year Cost: <strong>${analysisResult.diesel.lifecycleCost.toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            IRR: <strong>{(analysisResult.diesel.irr * 100).toFixed(1)}%</strong>
                          </Typography>
                        </Box>
                        <Alert severity="info" sx={{ mt: 2 }}>
                          PV saves <strong>${(analysisResult.diesel.lifecycleCost - analysisResult.pv.lifecycleCost).toLocaleString()}</strong> over 20 years
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDesignDialogOpen(false)}>Cancel</Button>
          {activeStep === 0 && (
            <Button 
              variant="contained" 
              onClick={() => setActiveStep(1)}
              disabled={!loadProfile}
            >
              Next: Choose Method
            </Button>
          )}
          {activeStep === 1 && (
            <>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setActiveStep(2);
                  performAnalysis();
                }}
              >
                Run Analysis
              </Button>
            </>
          )}
          {activeStep === 3 && (
            <>
              <Button 
                variant="outlined"
                onClick={() => {
                  setDesignDialogOpen(false);
                  setActiveStep(0);
                }}
                sx={{ mr: 2 }}
              >
                Save Design
              </Button>
              <Button 
                variant="contained"
                onClick={() => {
                  setDesignDialogOpen(false);
                  navigate('/mcda', { 
                    state: { 
                      fromDesign: true, 
                      designResults: analysisResult,
                      selectedFacility: designForm.facilityId 
                    } 
                  });
                }}
                startIcon={<CompareArrowsIcon />}
              >
                Analyze with MCDA
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Parameters Configuration Dialog */}
      <Dialog open={parametersDialogOpen} onClose={() => setParametersDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Techno-Economic Parameters</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Battery Autonomy Factor"
                  type="number"
                  value={parameters.batteryAutonomyFactor}
                  onChange={(e) => setParameters(prev => ({ ...prev, batteryAutonomyFactor: parseFloat(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Battery DoD"
                  type="number"
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  value={parameters.batteryDepthOfDischarge}
                  onChange={(e) => setParameters(prev => ({ ...prev, batteryDepthOfDischarge: parseFloat(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Battery Type</InputLabel>
                  <Select
                    value={parameters.batteryType}
                    label="Battery Type"
                    onChange={(e) => setParameters(prev => ({ ...prev, batteryType: e.target.value as 'lithium' | 'lead_acid' }))}
                  >
                    <MenuItem value="lithium">Lithium Ion</MenuItem>
                    <MenuItem value="lead_acid">Lead Acid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Inverter Efficiency"
                  type="number"
                  inputProps={{ min: 0, max: 1, step: 0.01 }}
                  value={parameters.inverterEfficiency}
                  onChange={(e) => setParameters(prev => ({ ...prev, inverterEfficiency: parseFloat(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Discount Rate (%)"
                  type="number"
                  value={parameters.discountRate * 100}
                  onChange={(e) => setParameters(prev => ({ ...prev, discountRate: parseFloat(e.target.value) / 100 }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Project Lifetime (years)"
                  type="number"
                  value={parameters.projectLifetime}
                  onChange={(e) => setParameters(prev => ({ ...prev, projectLifetime: parseInt(e.target.value) }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParametersDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveParameters}>Save Parameters</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DesignLanding;
