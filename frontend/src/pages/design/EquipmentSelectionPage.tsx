import React, { useState } from 'react';
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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CompareArrows as CompareIcon,
  ElectricalServices as EnergyIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Equipment {
  id: string;
  name: string;
  category: string;
  power: number;
  quantity: number;
  hours: number;
  efficiency: number;
  cost: number;
}

interface Scenario {
  id: string;
  name: string;
  equipment: Equipment[];
  totalPower: number;
  dailyEnergy: number;
  monthlyCost: number;
}

const EquipmentSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [facilityType, setFacilityType] = useState('');
  const [currentScenario, setCurrentScenario] = useState<Equipment[]>([]);
  const [idealScenario, setIdealScenario] = useState<Equipment[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const steps = ['Facility Setup', 'Current Equipment', 'Ideal Equipment', 'Comparison'];

  // Sample equipment database
  const equipmentDatabase = [
    { id: 'led_10w', name: 'LED Light 10W', category: 'Lighting', power: 10, efficiency: 90, cost: 15 },
    { id: 'led_20w', name: 'LED Light 20W', category: 'Lighting', power: 20, efficiency: 90, cost: 25 },
    { id: 'cfl_15w', name: 'CFL 15W', category: 'Lighting', power: 15, efficiency: 60, cost: 8 },
    { id: 'incandescent_60w', name: 'Incandescent 60W', category: 'Lighting', power: 60, efficiency: 20, cost: 2 },
    { id: 'fridge_150w', name: 'Energy Efficient Refrigerator', category: 'Cooling', power: 150, efficiency: 85, cost: 800 },
    { id: 'fridge_300w', name: 'Standard Refrigerator', category: 'Cooling', power: 300, efficiency: 60, cost: 500 },
    { id: 'fan_75w', name: 'Ceiling Fan', category: 'Cooling', power: 75, efficiency: 80, cost: 120 },
    { id: 'ac_1500w', name: 'Air Conditioner 1.5T', category: 'Cooling', power: 1500, efficiency: 70, cost: 600 },
    { id: 'computer_200w', name: 'Desktop Computer', category: 'Electronics', power: 200, efficiency: 75, cost: 800 },
    { id: 'laptop_65w', name: 'Laptop', category: 'Electronics', power: 65, efficiency: 85, cost: 600 },
    { id: 'tv_100w', name: 'LED TV 32"', category: 'Electronics', power: 100, efficiency: 80, cost: 400 },
    { id: 'printer_300w', name: 'Laser Printer', category: 'Electronics', power: 300, efficiency: 70, cost: 250 }
  ];

  const facilityTypes = [
    'Health Clinic',
    'School',
    'Community Center',
    'Office Building',
    'Residential',
    'Commercial Store'
  ];

  const addEquipment = (equipment: any, isIdeal: boolean = false) => {
    const newEquipment: Equipment = {
      id: Date.now().toString(),
      name: equipment.name,
      category: equipment.category,
      power: equipment.power,
      quantity: 1,
      hours: 8,
      efficiency: equipment.efficiency,
      cost: equipment.cost
    };

    if (isIdeal) {
      setIdealScenario([...idealScenario, newEquipment]);
    } else {
      setCurrentScenario([...currentScenario, newEquipment]);
    }
  };

  const updateEquipment = (id: string, field: string, value: number, isIdeal: boolean = false) => {
    const updateFn = (equipment: Equipment[]) =>
      equipment.map(eq => eq.id === id ? { ...eq, [field]: value } : eq);

    if (isIdeal) {
      setIdealScenario(updateFn);
    } else {
      setCurrentScenario(updateFn);
    }
  };

  const removeEquipment = (id: string, isIdeal: boolean = false) => {
    if (isIdeal) {
      setIdealScenario(idealScenario.filter(eq => eq.id !== id));
    } else {
      setCurrentScenario(currentScenario.filter(eq => eq.id !== id));
    }
  };

  const calculateScenarioMetrics = (equipment: Equipment[]) => {
    const totalPower = equipment.reduce((sum, eq) => sum + (eq.power * eq.quantity), 0);
    const dailyEnergy = equipment.reduce((sum, eq) => sum + (eq.power * eq.quantity * eq.hours / 1000), 0);
    const monthlyCost = dailyEnergy * 30 * 0.15; // Assuming $0.15 per kWh
    return { totalPower, dailyEnergy, monthlyCost };
  };

  const currentMetrics = calculateScenarioMetrics(currentScenario);
  const idealMetrics = calculateScenarioMetrics(idealScenario);

  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleAnalyze = () => {
    // Navigate to design page with equipment data for techno-economic analysis
    navigate('/design', {
      state: {
        fromEquipmentSelection: true,
        currentScenario,
        idealScenario,
        facilityType,
        loadProfile: {
          dailyUsage: idealMetrics.dailyEnergy,
          peakHours: 8,
          equipment: idealScenario.map(eq => ({
            name: eq.name,
            power: eq.power,
            hours: eq.hours,
            quantity: eq.quantity
          }))
        }
      }
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            Equipment Selection & Scenario Comparison
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Design ideal energy scenarios by selecting efficient equipment
          </Typography>
        </div>
        <Button
          variant="outlined"
          onClick={() => navigate('/design')}
        >
          Back to Design
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 0: Facility Setup */}
      {activeStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Facility Setup
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Facility Type</InputLabel>
                <Select
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                >
                  {facilityTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!facilityType}
            >
              Next: Current Equipment
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 1: Current Equipment */}
      {activeStep === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current Equipment Setup
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipment</TableCell>
                      <TableCell>Power (W)</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Hours/Day</TableCell>
                      <TableCell>Daily Energy (kWh)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentScenario.map((equipment) => {
                      const dailyEnergy = (equipment.power * equipment.quantity * equipment.hours) / 1000;
                      return (
                        <TableRow key={equipment.id}>
                          <TableCell>{equipment.name}</TableCell>
                          <TableCell>{equipment.power}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={equipment.quantity}
                              onChange={(e) => updateEquipment(equipment.id, 'quantity', parseInt(e.target.value))}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={equipment.hours}
                              onChange={(e) => updateEquipment(equipment.id, 'hours', parseInt(e.target.value))}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>{dailyEnergy.toFixed(2)}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => removeEquipment(equipment.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Summary:</Typography>
                <Typography variant="body2">
                  Total Power: {currentMetrics.totalPower}W | 
                  Daily Energy: {currentMetrics.dailyEnergy.toFixed(1)}kWh | 
                  Monthly Cost: ${currentMetrics.monthlyCost.toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Equipment Database</Typography>
              {['Lighting', 'Cooling', 'Electronics'].map(category => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>{category}</Typography>
                  {equipmentDatabase.filter(eq => eq.category === category).map(equipment => (
                    <Box key={equipment.id} sx={{ mb: 1, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Typography variant="body2">{equipment.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {equipment.power}W • ${equipment.cost}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addEquipment(equipment)}
                        sx={{ ml: 1 }}
                      >
                        Add
                      </Button>
                    </Box>
                  ))}
                </Box>
              ))}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext}>
                Next: Ideal Equipment
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Step 2: Ideal Equipment */}
      {activeStep === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ideal Equipment Setup
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Select energy-efficient alternatives for better performance and cost savings
              </Alert>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipment</TableCell>
                      <TableCell>Power (W)</TableCell>
                      <TableCell>Efficiency</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Hours/Day</TableCell>
                      <TableCell>Daily Energy (kWh)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {idealScenario.map((equipment) => {
                      const dailyEnergy = (equipment.power * equipment.quantity * equipment.hours) / 1000;
                      return (
                        <TableRow key={equipment.id}>
                          <TableCell>{equipment.name}</TableCell>
                          <TableCell>{equipment.power}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${equipment.efficiency}%`} 
                              color={equipment.efficiency > 80 ? 'success' : equipment.efficiency > 60 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={equipment.quantity}
                              onChange={(e) => updateEquipment(equipment.id, 'quantity', parseInt(e.target.value), true)}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={equipment.hours}
                              onChange={(e) => updateEquipment(equipment.id, 'hours', parseInt(e.target.value), true)}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>{dailyEnergy.toFixed(2)}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => removeEquipment(equipment.id, true)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Ideal Setup Summary:</Typography>
                <Typography variant="body2">
                  Total Power: {idealMetrics.totalPower}W | 
                  Daily Energy: {idealMetrics.dailyEnergy.toFixed(1)}kWh | 
                  Monthly Cost: ${idealMetrics.monthlyCost.toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Efficient Equipment</Typography>
              {['Lighting', 'Cooling', 'Electronics'].map(category => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>{category}</Typography>
                  {equipmentDatabase
                    .filter(eq => eq.category === category && eq.efficiency > 75)
                    .map(equipment => (
                    <Box key={equipment.id} sx={{ mb: 1, p: 1, border: '1px solid #4caf50', borderRadius: 1, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                      <Typography variant="body2">{equipment.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {equipment.power}W • {equipment.efficiency}% • ${equipment.cost}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addEquipment(equipment, true)}
                        sx={{ ml: 1 }}
                      >
                        Add
                      </Button>
                    </Box>
                  ))}
                </Box>
              ))}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext}>
                Compare Scenarios
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Step 3: Comparison */}
      {activeStep === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <CompareIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Scenario Comparison
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ border: '2px solid #f44336' }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom>
                        Current Setup
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h4" color="error">
                          {currentMetrics.dailyEnergy.toFixed(1)} kWh/day
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Daily Energy Consumption
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        Total Power: <strong>{currentMetrics.totalPower}W</strong>
                      </Typography>
                      <Typography variant="body2">
                        Monthly Cost: <strong>${currentMetrics.monthlyCost.toFixed(2)}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Equipment Count: <strong>{currentScenario.length}</strong>
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ border: '2px solid #4caf50' }}>
                    <CardContent>
                      <Typography variant="h6" color="success.main" gutterBottom>
                        Ideal Setup
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h4" color="success.main">
                          {idealMetrics.dailyEnergy.toFixed(1)} kWh/day
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Daily Energy Consumption
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        Total Power: <strong>{idealMetrics.totalPower}W</strong>
                      </Typography>
                      <Typography variant="body2">
                        Monthly Cost: <strong>${idealMetrics.monthlyCost.toFixed(2)}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Equipment Count: <strong>{idealScenario.length}</strong>
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {currentMetrics.dailyEnergy > 0 && idealMetrics.dailyEnergy > 0 && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Potential Savings</Typography>
                  <Typography variant="body1">
                    Energy Reduction: <strong>{((currentMetrics.dailyEnergy - idealMetrics.dailyEnergy) / currentMetrics.dailyEnergy * 100).toFixed(1)}%</strong>
                  </Typography>
                  <Typography variant="body1">
                    Monthly Savings: <strong>${(currentMetrics.monthlyCost - idealMetrics.monthlyCost).toFixed(2)}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Annual Savings: <strong>${((currentMetrics.monthlyCost - idealMetrics.monthlyCost) * 12).toFixed(2)}</strong>
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Back</Button>
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={handleAnalyze}
                disabled={idealScenario.length === 0}
              >
                Analyze with Techno-Economic Model
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default EquipmentSelectionPage;
