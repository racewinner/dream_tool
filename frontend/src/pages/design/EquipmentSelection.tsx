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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import CompareIcon from '@mui/icons-material/Compare';
import PowerIcon from '@mui/icons-material/Power';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SchoolIcon from '@mui/icons-material/School';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BusinessIcon from '@mui/icons-material/Business';
import ScenarioComparison from './ScenarioComparison';
import { scenarioComparisonService } from '../../services/scenarioComparisonService';
import EnergyService, { Equipment as EnergyEquipment } from '../../services/energyService';

interface Equipment {
  id: string;
  name: string;
  category: 'medical' | 'lighting' | 'cooling' | 'computing' | 'kitchen' | 'other';
  powerRating: number; // Watts
  hoursPerDay: number;
  efficiency: number; // 0-1
  priority: 'essential' | 'important' | 'optional';
  facilityTypes: string[];
  description: string;
  unitCost?: number;
}

interface SelectedEquipment extends Equipment {
  quantity: number;
  customHours?: number;
  customPower?: number;
}

interface LoadProfile {
  hour: number;
  demand: number; // kW
  equipmentBreakdown: { [key: string]: number };
}

interface FacilityType {
  id: string;
  name: string;
  icon: React.ReactElement;
  description: string;
  typicalSize: string;
  commonEquipment: string[];
}

const EquipmentSelection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [facilityType, setFacilityType] = useState('');
  const [facilityDetails, setFacilityDetails] = useState({
    name: '',
    size: '',
    operatingHours: { start: '', end: '' },
    peakHours: { start: '', end: '' },
    specialRequirements: ''
  });
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);
  const [loadProfile, setLoadProfile] = useState<LoadProfile[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [showScenarioComparison, setShowScenarioComparison] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [totalDailyConsumption, setTotalDailyConsumption] = useState(0);

  const facilityTypes: FacilityType[] = [
    {
      id: 'health_clinic',
      name: 'Health Clinic',
      icon: <LocalHospitalIcon />,
      description: 'Primary healthcare facility serving communities',
      typicalSize: '50-200 m²',
      commonEquipment: ['medical_fridge', 'examination_lights', 'computers', 'fans']
    },
    {
      id: 'hospital',
      name: 'Hospital',
      icon: <LocalHospitalIcon />,
      description: 'Large healthcare facility with multiple departments',
      typicalSize: '500-2000 m²',
      commonEquipment: ['medical_equipment', 'lighting', 'hvac', 'kitchen', 'laundry']
    },
    {
      id: 'school',
      name: 'School',
      icon: <SchoolIcon />,
      description: 'Educational institution',
      typicalSize: '300-1000 m²',
      commonEquipment: ['classroom_lights', 'computers', 'fans', 'projectors']
    },
    {
      id: 'community_center',
      name: 'Community Center',
      icon: <HomeWorkIcon />,
      description: 'Multi-purpose community facility',
      typicalSize: '200-500 m²',
      commonEquipment: ['lighting', 'sound_system', 'computers', 'kitchen']
    },
    {
      id: 'office',
      name: 'Office Building',
      icon: <BusinessIcon />,
      description: 'Commercial office space',
      typicalSize: '100-1000 m²',
      commonEquipment: ['computers', 'lighting', 'hvac', 'printers']
    }
  ];

  const equipmentDatabase: Equipment[] = [
    // Medical Equipment
    {
      id: 'medical_fridge',
      name: 'Medical Refrigerator',
      category: 'medical',
      powerRating: 150,
      hoursPerDay: 24,
      efficiency: 0.85,
      priority: 'essential',
      facilityTypes: ['health_clinic', 'hospital'],
      description: 'Vaccine and medicine storage',
      unitCost: 800
    },
    {
      id: 'sterilizer',
      name: 'Autoclave/Sterilizer',
      category: 'medical',
      powerRating: 2000,
      hoursPerDay: 4,
      efficiency: 0.9,
      priority: 'essential',
      facilityTypes: ['health_clinic', 'hospital'],
      description: 'Medical equipment sterilization',
      unitCost: 1500
    },
    {
      id: 'ultrasound',
      name: 'Ultrasound Machine',
      category: 'medical',
      powerRating: 300,
      hoursPerDay: 6,
      efficiency: 0.8,
      priority: 'important',
      facilityTypes: ['hospital'],
      description: 'Diagnostic imaging equipment',
      unitCost: 5000
    },
    // Lighting
    {
      id: 'led_lights_general',
      name: 'LED General Lighting (per 10 units)',
      category: 'lighting',
      powerRating: 200,
      hoursPerDay: 12,
      efficiency: 0.95,
      priority: 'essential',
      facilityTypes: ['health_clinic', 'hospital', 'school', 'community_center', 'office'],
      description: 'Energy-efficient LED lighting',
      unitCost: 300
    },
    {
      id: 'examination_lights',
      name: 'Medical Examination Lights',
      category: 'lighting',
      powerRating: 100,
      hoursPerDay: 8,
      efficiency: 0.9,
      priority: 'essential',
      facilityTypes: ['health_clinic', 'hospital'],
      description: 'High-intensity examination lighting',
      unitCost: 400
    },
    // Computing
    {
      id: 'desktop_computer',
      name: 'Desktop Computer',
      category: 'computing',
      powerRating: 200,
      hoursPerDay: 8,
      efficiency: 0.85,
      priority: 'important',
      facilityTypes: ['health_clinic', 'hospital', 'school', 'community_center', 'office'],
      description: 'Standard desktop workstation',
      unitCost: 600
    },
    {
      id: 'laptop',
      name: 'Laptop Computer',
      category: 'computing',
      powerRating: 65,
      hoursPerDay: 8,
      efficiency: 0.9,
      priority: 'important',
      facilityTypes: ['health_clinic', 'hospital', 'school', 'community_center', 'office'],
      description: 'Portable laptop computer',
      unitCost: 800
    },
    // Cooling
    {
      id: 'ceiling_fan',
      name: 'Ceiling Fan',
      category: 'cooling',
      powerRating: 75,
      hoursPerDay: 10,
      efficiency: 0.9,
      priority: 'important',
      facilityTypes: ['health_clinic', 'hospital', 'school', 'community_center', 'office'],
      description: 'Energy-efficient ceiling fan',
      unitCost: 100
    },
    {
      id: 'air_conditioner',
      name: 'Split AC Unit (1.5 Ton)',
      category: 'cooling',
      powerRating: 1500,
      hoursPerDay: 8,
      efficiency: 0.75,
      priority: 'optional',
      facilityTypes: ['hospital', 'office'],
      description: 'Air conditioning for comfort',
      unitCost: 800
    },
    // Kitchen
    {
      id: 'refrigerator',
      name: 'Kitchen Refrigerator',
      category: 'kitchen',
      powerRating: 200,
      hoursPerDay: 24,
      efficiency: 0.8,
      priority: 'important',
      facilityTypes: ['hospital', 'community_center'],
      description: 'Food storage refrigerator',
      unitCost: 600
    },
    {
      id: 'microwave',
      name: 'Microwave Oven',
      category: 'kitchen',
      powerRating: 1200,
      hoursPerDay: 2,
      efficiency: 0.7,
      priority: 'optional',
      facilityTypes: ['hospital', 'community_center', 'office'],
      description: 'Food heating appliance',
      unitCost: 150
    }
  ];

  const steps = [
    'Select Facility Type',
    'Facility Details', 
    'Equipment Selection',
    'Load Profile Review'
  ];

  const getFilteredEquipment = () => {
    if (!facilityType) return [];
    return equipmentDatabase.filter(eq => 
      eq.facilityTypes.includes(facilityType)
    ).sort((a, b) => {
      const priorityOrder = { 'essential': 0, 'important': 1, 'optional': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const addEquipment = (equipment: Equipment, quantity: number = 1) => {
    const existing = selectedEquipment.find(eq => eq.id === equipment.id);
    if (existing) {
      setSelectedEquipment(prev => 
        prev.map(eq => eq.id === equipment.id 
          ? { ...eq, quantity: eq.quantity + quantity }
          : eq
        )
      );
    } else {
      setSelectedEquipment(prev => [...prev, { ...equipment, quantity }]);
    }
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipment(prev => 
      prev.filter(eq => eq.id !== equipmentId)
    );
  };

  const updateEquipmentQuantity = (equipmentId: string, quantity: number) => {
    if (quantity <= 0) {
      removeEquipment(equipmentId);
      return;
    }
    setSelectedEquipment(prev => 
      prev.map(eq => eq.id === equipmentId 
        ? { ...eq, quantity }
        : eq
      )
    );
  };

  const generateLoadProfile = () => {
    const profile: LoadProfile[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      let totalDemand = 0;
      const equipmentBreakdown: { [key: string]: number } = {};
      
      selectedEquipment.forEach(equipment => {
        let isActive = false;
        let loadFactor = 1;
        
        // Determine if equipment is active at this hour
        switch (equipment.category) {
          case 'medical':
            isActive = equipment.hoursPerDay === 24 || 
                      (hour >= 8 && hour < 18); // Medical hours
            break;
          case 'lighting':
            isActive = hour < 6 || hour >= 18; // Dawn/dusk + night
            loadFactor = hour >= 20 || hour < 6 ? 1 : 0.7; // Full at night
            break;
          case 'computing':
            isActive = hour >= 8 && hour < 18; // Office hours
            break;
          case 'cooling':
            isActive = hour >= 10 && hour < 22; // Daytime comfort
            loadFactor = hour >= 12 && hour < 16 ? 1 : 0.6; // Peak afternoon
            break;
          case 'kitchen':
            isActive = equipment.name.includes('Refrigerator') ? true : 
                      (hour >= 6 && hour < 9) || (hour >= 12 && hour < 14) || 
                      (hour >= 18 && hour < 20); // Meal times
            break;
          default:
            isActive = hour >= 8 && hour < 18;
        }
        
        if (isActive) {
          const power = (equipment.customPower || equipment.powerRating) * 
                       equipment.quantity * 
                       loadFactor * 
                       equipment.efficiency / 1000; // Convert to kW
          
          totalDemand += power;
          equipmentBreakdown[equipment.name] = power;
        }
      });
      
      profile.push({
        hour,
        demand: Math.round(totalDemand * 100) / 100,
        equipmentBreakdown
      });
    }
    
    setLoadProfile(profile);
    
    // Calculate total daily consumption
    const totalDailyConsumption = loadProfile.reduce((sum, hour) => sum + hour.demand, 0);
    setTotalDailyConsumption(Math.round(totalDailyConsumption * 100) / 100);
  };

  useEffect(() => {
    if (selectedEquipment.length > 0) {
      generateLoadProfile();
    }
  }, [selectedEquipment]);

  const handleCreateScenarioComparison = () => {
    // Get a sample survey or use mock data if no survey is available
    const mockSurvey = {
      id: 1,
      facilityData: {
        name: facilityDetails.name || 'Sample Facility',
        facilityType: facilityType || 'health_clinic',
        equipment: [
          {
            type: 'Old Lighting System',
            powerRating: 100,
            hoursPerDay: 12,
            condition: 'poor',
            quantity: 20
          },
          {
            type: 'Basic Refrigerator',
            powerRating: 300,
            hoursPerDay: 24,
            condition: 'fair',
            quantity: 2
          },
          {
            type: 'Desktop Computer',
            powerRating: 150,
            hoursPerDay: 8,
            condition: 'good',
            quantity: 3
          }
        ]
      }
    };
    
    setSelectedSurvey(mockSurvey);
    setShowScenarioComparison(true);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 2) {
        generateLoadProfile();
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'error';
      case 'important': return 'warning';
      case 'optional': return 'info';
      default: return 'default';
    }
  };

  const getTimeLabel = (hour: number) => {
    return hour === 0 ? '12 AM' : 
           hour < 12 ? `${hour} AM` : 
           hour === 12 ? '12 PM' : 
           `${hour - 12} PM`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <PowerIcon sx={{ verticalAlign: 'middle', mr: 2 }} />
          Equipment Selection & Load Profile Builder
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Design your ideal energy scenario by selecting appropriate equipment for your facility type
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Facility Type Selection */}
        {currentStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Your Facility Type
            </Typography>
            <Grid container spacing={3}>
              {facilityTypes.map(facility => (
                <Grid item xs={12} sm={6} md={4} key={facility.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: facilityType === facility.id ? 2 : 1,
                      borderColor: facilityType === facility.id ? 'primary.main' : 'grey.300'
                    }}
                    onClick={() => setFacilityType(facility.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {facility.icon}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {facility.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {facility.description}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Typical Size: {facility.typicalSize}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {facility.commonEquipment.slice(0, 3).map(eq => (
                          <Chip key={eq} label={eq.replace('_', ' ')} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                        {facility.commonEquipment.length > 3 && (
                          <Chip label={`+${facility.commonEquipment.length - 3} more`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Step 2: Facility Details */}
        {currentStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Facility Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Facility Name"
                  value={facilityDetails.name}
                  onChange={(e) => setFacilityDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Facility Size (m²)"
                  type="number"
                  value={facilityDetails.size}
                  onChange={(e) => setFacilityDetails(prev => ({ ...prev, size: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Daily Operating Hours</InputLabel>
                  <Select
                    value={facilityDetails.operatingHours.start}
                    onChange={(e) => setFacilityDetails(prev => ({ ...prev, operatingHours: { start: e.target.value, end: prev.operatingHours.end } }))}
                  >
                    <MenuItem value="8">8 hours (Day shift)</MenuItem>
                    <MenuItem value="16">16 hours (Extended hours)</MenuItem>
                    <MenuItem value="24">24 hours (Continuous)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Peak Hours (e.g., 8-18)"
                  value={facilityDetails.peakHours.start}
                  onChange={(e) => setFacilityDetails(prev => ({ ...prev, peakHours: { start: e.target.value, end: prev.peakHours.end } }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Special Requirements"
                  placeholder="Any specific energy requirements or constraints..."
                  value={facilityDetails.specialRequirements}
                  onChange={(e) => setFacilityDetails(prev => ({ ...prev, specialRequirements: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 3: Equipment Selection */}
        {currentStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Equipment for {facilityTypes.find(f => f.id === facilityType)?.name}
            </Typography>
            
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
              <Tab label="Available Equipment" />
              <Tab label={`Selected Equipment (${selectedEquipment.length})`} />
            </Tabs>

            {/* Available Equipment Tab */}
            {tabValue === 0 && (
              <Grid container spacing={2}>
                {getFilteredEquipment().map(equipment => (
                  <Grid item xs={12} md={6} key={equipment.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Typography variant="h6">
                            {equipment.name}
                          </Typography>
                          <Chip 
                            label={equipment.priority} 
                            color={getPriorityColor(equipment.priority) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {equipment.description}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" display="block">
                            Power: {equipment.powerRating}W | Hours/Day: {equipment.hoursPerDay}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Efficiency: {(equipment.efficiency * 100).toFixed(0)}%
                            {equipment.unitCost && ` | Cost: $${equipment.unitCost}`}
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => addEquipment(equipment)}
                          >
                            Add
                          </Button>
                          <TextField
                            type="number"
                            size="small"
                            defaultValue={1}
                            inputProps={{ min: 1, max: 50, style: { width: 60 } }}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              // Store quantity for bulk add
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Selected Equipment Tab */}
            {tabValue === 1 && (
              <Box>
                {selectedEquipment.length === 0 ? (
                  <Alert severity="info">
                    No equipment selected yet. Switch to "Available Equipment" tab to add items.
                  </Alert>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Equipment</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Power (W)</TableCell>
                          <TableCell>Hours/Day</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Total Power (W)</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedEquipment.map(equipment => (
                          <TableRow key={equipment.id}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">{equipment.name}</Typography>
                                <Chip 
                                  label={equipment.priority}
                                  color={getPriorityColor(equipment.priority) as any}
                                  size="small"
                                />
                              </Box>
                            </TableCell>
                            <TableCell>{equipment.category}</TableCell>
                            <TableCell>{equipment.customPower || equipment.powerRating}</TableCell>
                            <TableCell>{equipment.customHours || equipment.hoursPerDay}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => updateEquipmentQuantity(equipment.id, equipment.quantity - 1)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                                <Typography>{equipment.quantity}</Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => updateEquipmentQuantity(equipment.id, equipment.quantity + 1)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {(equipment.customPower || equipment.powerRating) * equipment.quantity}W
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Remove">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeEquipment(equipment.id)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Step 4: Load Profile Review */}
        {currentStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Generated Load Profile
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Hourly Demand Profile
                    </Typography>
                    <Box sx={{ height: 400, overflowY: 'auto' }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Hour</TableCell>
                              <TableCell>Demand (kW)</TableCell>
                              <TableCell>Major Equipment Active</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {loadProfile.map(hour => (
                              <TableRow key={hour.hour}>
                                <TableCell>{getTimeLabel(hour.hour)}</TableCell>
                                <TableCell>
                                  <strong>{hour.demand}</strong>
                                </TableCell>
                                <TableCell>
                                  {Object.entries(hour.equipmentBreakdown)
                                    .filter(([_, power]) => power > 0.1)
                                    .slice(0, 2)
                                    .map(([name, power]) => (
                                      <Chip 
                                        key={name}
                                        label={`${name.split(' ')[0]} (${power.toFixed(1)}kW)`}
                                        size="small"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                    ))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Peak Demand</Typography>
                      <Typography variant="h4" color="primary">
                        {Math.max(...loadProfile.map(h => h.demand)).toFixed(2)} kW
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Daily Consumption</Typography>
                      <Typography variant="h4" color="secondary">
                        {totalDailyConsumption} kWh
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" gutterBottom>Equipment Summary:</Typography>
                    {selectedEquipment.map(eq => (
                      <Typography key={eq.id} variant="caption" display="block">
                        {eq.quantity}x {eq.name}
                      </Typography>
                    ))}
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CompareIcon />}
                        onClick={handleCreateScenarioComparison}
                      >
                        Compare with Current Scenario
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EquipmentSelection;
