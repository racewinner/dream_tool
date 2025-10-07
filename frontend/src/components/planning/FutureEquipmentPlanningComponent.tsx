/**
 * Future Equipment Planning Component
 * Allows users to define future equipment scenarios for demand projections
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Timeline as TimelineIcon,
  ElectricalServices as EquipmentIcon,
  TrendingUp as GrowthIcon
} from '@mui/icons-material';

// Types for future equipment planning
interface CurrentEquipment {
  id: string;
  name: string;
  category: string;
  power_rating_w: number;
  quantity: number;
  hours_per_day: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  efficiency: number;
  annual_kwh: number;
}

interface FutureEquipment {
  id: string;
  name: string;
  category: string;
  power_rating_w: number;
  quantity: number;
  hours_per_day: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  efficiency: number;
  installation_year: number;
  replacement_for?: string; // ID of equipment being replaced
  is_new_addition: boolean;
}

interface FutureScenario {
  id: string;
  name: string;
  description: string;
  timeline_years: number;
  growth_factor: number;
  selected_current_equipment: string[];
  new_equipment: FutureEquipment[];
  equipment_replacements: { [currentId: string]: string }; // current -> future mapping
  total_projected_demand: number;
  estimated_cost: number;
}

interface FutureEquipmentPlanningProps {
  facilityId: number;
  currentEquipment: CurrentEquipment[];
  onScenarioSave: (scenario: FutureScenario) => void;
  onScenarioPreview: (scenario: FutureScenario) => void;
}

const FutureEquipmentPlanningComponent: React.FC<FutureEquipmentPlanningProps> = ({
  facilityId,
  currentEquipment,
  onScenarioSave,
  onScenarioPreview
}) => {
  // State management
  const [scenarios, setScenarios] = useState<FutureScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<FutureScenario | null>(null);
  const [isEditingScenario, setIsEditingScenario] = useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<FutureEquipment | null>(null);

  // Equipment categories for selection
  const equipmentCategories = [
    'Medical Equipment',
    'Lighting',
    'HVAC',
    'IT Equipment',
    'Laboratory Equipment',
    'Kitchen Equipment',
    'Security Systems',
    'Communication Equipment',
    'Other'
  ];

  // Priority levels
  const priorityLevels = [
    { value: 'critical', label: 'Critical', color: '#f44336' },
    { value: 'high', label: 'High', color: '#ff9800' },
    { value: 'normal', label: 'Normal', color: '#4caf50' },
    { value: 'low', label: 'Low', color: '#2196f3' }
  ];

  // Initialize with default scenario
  useEffect(() => {
    if (scenarios.length === 0) {
      const defaultScenario: FutureScenario = {
        id: 'default',
        name: 'Default Growth Scenario',
        description: 'Standard equipment growth and replacement planning',
        timeline_years: 5,
        growth_factor: 1.2,
        selected_current_equipment: currentEquipment.map(eq => eq.id),
        new_equipment: [],
        equipment_replacements: {},
        total_projected_demand: 0,
        estimated_cost: 0
      };
      setScenarios([defaultScenario]);
      setActiveScenario(defaultScenario);
    }
  }, [currentEquipment, scenarios.length]);

  // Create new scenario
  const createNewScenario = () => {
    const newScenario: FutureScenario = {
      id: `scenario_${Date.now()}`,
      name: `Scenario ${scenarios.length + 1}`,
      description: 'New equipment planning scenario',
      timeline_years: 5,
      growth_factor: 1.2,
      selected_current_equipment: [],
      new_equipment: [],
      equipment_replacements: {},
      total_projected_demand: 0,
      estimated_cost: 0
    };
    
    setScenarios([...scenarios, newScenario]);
    setActiveScenario(newScenario);
    setIsEditingScenario(true);
  };

  // Update active scenario
  const updateActiveScenario = (updates: Partial<FutureScenario>) => {
    if (!activeScenario) return;
    
    const updatedScenario = { ...activeScenario, ...updates };
    setActiveScenario(updatedScenario);
    
    const updatedScenarios = scenarios.map(s => 
      s.id === activeScenario.id ? updatedScenario : s
    );
    setScenarios(updatedScenarios);
  };

  // Add new equipment
  const addNewEquipment = (equipment: Omit<FutureEquipment, 'id'>) => {
    const newEquipment: FutureEquipment = {
      ...equipment,
      id: `future_eq_${Date.now()}`
    };
    
    updateActiveScenario({
      new_equipment: [...(activeScenario?.new_equipment || []), newEquipment]
    });
  };

  // Remove equipment
  const removeEquipment = (equipmentId: string) => {
    if (!activeScenario) return;
    
    updateActiveScenario({
      new_equipment: activeScenario.new_equipment.filter(eq => eq.id !== equipmentId)
    });
  };

  // Calculate projected demand
  const calculateProjectedDemand = (scenario: FutureScenario): number => {
    let totalDemand = 0;
    
    // Current equipment with growth factor
    const selectedCurrent = currentEquipment.filter(eq => 
      scenario.selected_current_equipment.includes(eq.id)
    );
    const currentDemand = selectedCurrent.reduce((sum, eq) => sum + eq.annual_kwh, 0);
    totalDemand += currentDemand * scenario.growth_factor;
    
    // New equipment
    const newDemand = scenario.new_equipment.reduce((sum, eq) => {
      const annualKwh = (eq.power_rating_w / 1000) * eq.hours_per_day * 365 * eq.quantity * eq.efficiency;
      return sum + annualKwh;
    }, 0);
    totalDemand += newDemand;
    
    return totalDemand;
  };

  // Equipment Dialog Component
  const EquipmentDialog = () => {
    const [equipmentForm, setEquipmentForm] = useState<Partial<FutureEquipment>>({
      name: '',
      category: '',
      power_rating_w: 0,
      quantity: 1,
      hours_per_day: 8,
      priority: 'normal',
      efficiency: 1.0,
      installation_year: new Date().getFullYear() + 1,
      is_new_addition: true
    });

    const handleSave = () => {
      if (equipmentForm.name && equipmentForm.category && equipmentForm.power_rating_w) {
        addNewEquipment(equipmentForm as Omit<FutureEquipment, 'id'>);
        setShowEquipmentDialog(false);
        setEquipmentForm({
          name: '',
          category: '',
          power_rating_w: 0,
          quantity: 1,
          hours_per_day: 8,
          priority: 'normal',
          efficiency: 1.0,
          installation_year: new Date().getFullYear() + 1,
          is_new_addition: true
        });
      }
    };

    return (
      <Dialog open={showEquipmentDialog} onClose={() => setShowEquipmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Equipment</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Equipment Name"
                value={equipmentForm.name || ''}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={equipmentForm.category || ''}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                >
                  {equipmentCategories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Power Rating (Watts)"
                type="number"
                value={equipmentForm.power_rating_w || 0}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, power_rating_w: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={equipmentForm.quantity || 1}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hours per Day"
                type="number"
                value={equipmentForm.hours_per_day || 8}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, hours_per_day: Number(e.target.value) })}
                inputProps={{ min: 0, max: 24, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={equipmentForm.priority || 'normal'}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, priority: e.target.value as any })}
                >
                  {priorityLevels.map(level => (
                    <MenuItem key={level.value} value={level.value}>
                      <Chip label={level.label} size="small" sx={{ backgroundColor: level.color, color: 'white' }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Installation Year"
                type="number"
                value={equipmentForm.installation_year || new Date().getFullYear() + 1}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, installation_year: Number(e.target.value) })}
                inputProps={{ min: new Date().getFullYear(), max: new Date().getFullYear() + 20 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography gutterBottom>Efficiency Factor</Typography>
                <Slider
                  value={equipmentForm.efficiency || 1.0}
                  onChange={(_, value) => setEquipmentForm({ ...equipmentForm, efficiency: value as number })}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '50%' },
                    { value: 1.0, label: '100%' },
                    { value: 1.5, label: '150%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEquipmentDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Add Equipment
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (!activeScenario) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading equipment planning...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          <EquipmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Future Equipment Planning
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={createNewScenario}
            sx={{ mr: 2 }}
          >
            New Scenario
          </Button>
          <Button
            variant="contained"
            startIcon={<PreviewIcon />}
            onClick={() => onScenarioPreview(activeScenario)}
          >
            Preview Demand
          </Button>
        </Box>
      </Box>

      {/* Scenario Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Active Scenario</InputLabel>
                <Select
                  value={activeScenario.id}
                  onChange={(e) => {
                    const scenario = scenarios.find(s => s.id === e.target.value);
                    if (scenario) setActiveScenario(scenario);
                  }}
                >
                  {scenarios.map(scenario => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip 
                  label={`${activeScenario.timeline_years} Years`} 
                  icon={<TimelineIcon />} 
                  color="primary" 
                />
                <Chip 
                  label={`${((activeScenario.growth_factor - 1) * 100).toFixed(0)}% Growth`} 
                  icon={<GrowthIcon />} 
                  color="secondary" 
                />
                <Chip 
                  label={`${calculateProjectedDemand(activeScenario).toLocaleString()} kWh/year`} 
                  color="success" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Scenario Configuration */}
      <Accordion expanded={isEditingScenario} onChange={() => setIsEditingScenario(!isEditingScenario)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Scenario Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Scenario Name"
                value={activeScenario.name}
                onChange={(e) => updateActiveScenario({ name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Timeline (Years)"
                type="number"
                value={activeScenario.timeline_years}
                onChange={(e) => updateActiveScenario({ timeline_years: Number(e.target.value) })}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={activeScenario.description}
                onChange={(e) => updateActiveScenario({ description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box>
                <Typography gutterBottom>Overall Growth Factor</Typography>
                <Slider
                  value={activeScenario.growth_factor}
                  onChange={(_, value) => updateActiveScenario({ growth_factor: value as number })}
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '50%' },
                    { value: 1.0, label: '100%' },
                    { value: 1.5, label: '150%' },
                    { value: 2.0, label: '200%' },
                    { value: 3.0, label: '300%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Typography variant="caption" color="textSecondary">
                  Growth factor applied to selected current equipment
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Current Equipment Selection */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Equipment Selection
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Select which current equipment will continue operating in the future scenario
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Select</TableCell>
                  <TableCell>Equipment</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Power (W)</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Annual kWh</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentEquipment.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>
                      <Checkbox
                        checked={activeScenario.selected_current_equipment.includes(equipment.id)}
                        onChange={(e) => {
                          const selected = e.target.checked
                            ? [...activeScenario.selected_current_equipment, equipment.id]
                            : activeScenario.selected_current_equipment.filter(id => id !== equipment.id);
                          updateActiveScenario({ selected_current_equipment: selected });
                        }}
                      />
                    </TableCell>
                    <TableCell>{equipment.name}</TableCell>
                    <TableCell>{equipment.category}</TableCell>
                    <TableCell>{equipment.power_rating_w.toLocaleString()}</TableCell>
                    <TableCell>{equipment.quantity}</TableCell>
                    <TableCell>
                      <Chip 
                        label={equipment.priority} 
                        size="small" 
                        color={equipment.priority === 'critical' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{equipment.annual_kwh.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* New Equipment */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              New Equipment Additions
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowEquipmentDialog(true)}
            >
              Add Equipment
            </Button>
          </Box>

          {activeScenario.new_equipment.length === 0 ? (
            <Alert severity="info">
              No new equipment added yet. Click "Add Equipment" to define future equipment additions.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Equipment</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Power (W)</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Hours/Day</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Install Year</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeScenario.new_equipment.map((equipment) => (
                    <TableRow key={equipment.id}>
                      <TableCell>{equipment.name}</TableCell>
                      <TableCell>{equipment.category}</TableCell>
                      <TableCell>{equipment.power_rating_w.toLocaleString()}</TableCell>
                      <TableCell>{equipment.quantity}</TableCell>
                      <TableCell>{equipment.hours_per_day}</TableCell>
                      <TableCell>
                        <Chip 
                          label={equipment.priority} 
                          size="small" 
                          color={equipment.priority === 'critical' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{equipment.installation_year}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit Equipment">
                          <IconButton size="small" onClick={() => setEditingEquipment(equipment)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Equipment">
                          <IconButton size="small" onClick={() => removeEquipment(equipment.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Scenario Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scenario Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {activeScenario.selected_current_equipment.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current Equipment Selected
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {activeScenario.new_equipment.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  New Equipment Added
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {calculateProjectedDemand(activeScenario).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Projected Annual kWh
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {activeScenario.timeline_years}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Planning Timeline (Years)
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => onScenarioSave(activeScenario)}
            >
              Save Scenario
            </Button>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => onScenarioPreview(activeScenario)}
            >
              Preview Energy Demand
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Equipment Dialog */}
      <EquipmentDialog />
    </Box>
  );
};

export default FutureEquipmentPlanningComponent;
