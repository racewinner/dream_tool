import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Slider
} from '@mui/material';
import {
  Settings as SettingsIcon,
  BatteryChargingFull as BatteryIcon,
  WbSunny as SolarIcon,
  AttachMoney as MoneyIcon,
  Save as SaveIcon,
  RestoreFromTrash as ResetIcon
} from '@mui/icons-material';
import TechnoEconomicService, { TechnoEconomicParameters } from '../../services/technoEconomicService';

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
      id={`parameters-tabpanel-${index}`}
      aria-labelledby={`parameters-tab-${index}`}
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

const ParametersPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [parameters, setParameters] = useState<TechnoEconomicParameters>(
    TechnoEconomicService.getUserParameters()
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const defaultParams = TechnoEconomicService.getUserParameters();
    setParameters(defaultParams);
  }, []);

  const handleParameterChange = (field: keyof TechnoEconomicParameters, value: any) => {
    setParameters(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    TechnoEconomicService.saveUserParameters(parameters);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    const defaultParams = TechnoEconomicService.getDefaultParameters();
    setParameters(defaultParams);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            <SettingsIcon sx={{ verticalAlign: 'middle', mr: 2 }} />
            Techno-Economic Parameters
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Configure default parameters for techno-economic analysis
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Parameters
          </Button>
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaveSuccess(false)}>
          Parameters saved successfully!
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label="System Configuration" 
              icon={<SolarIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Battery & Storage" 
              icon={<BatteryIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Financial Parameters" 
              icon={<MoneyIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* System Configuration Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Sizing
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="System Sizing Factor"
                        type="number"
                        inputProps={{ min: 1, max: 3, step: 0.1 }}
                        value={parameters.systemSizingFactor}
                        onChange={(e) => handleParameterChange('systemSizingFactor', parseFloat(e.target.value))}
                        helperText="Multiplier for system size based on load (1.0 = exact match)"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Inverter Efficiency"
                        type="number"
                        inputProps={{ min: 0.8, max: 1.0, step: 0.01 }}
                        value={parameters.inverterEfficiency}
                        onChange={(e) => handleParameterChange('inverterEfficiency', parseFloat(e.target.value))}
                        helperText="Inverter efficiency (0.90 = 90%)"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography gutterBottom>
                        Solar Irradiance Factor: {parameters.solarIrradianceFactor}
                      </Typography>
                      <Slider
                        value={parameters.solarIrradianceFactor}
                        onChange={(_, value) => handleParameterChange('solarIrradianceFactor', value)}
                        min={0.5}
                        max={1.5}
                        step={0.1}
                        marks={[
                          { value: 0.5, label: '0.5' },
                          { value: 1.0, label: '1.0' },
                          { value: 1.5, label: '1.5' }
                        ]}
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Environmental Factors
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Ambient Temperature (°C)"
                        type="number"
                        value={parameters.ambientTemperature}
                        onChange={(e) => handleParameterChange('ambientTemperature', parseFloat(e.target.value))}
                        helperText="Average ambient temperature for efficiency calculations"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Wind Speed (m/s)"
                        type="number"
                        value={parameters.windSpeed}
                        onChange={(e) => handleParameterChange('windSpeed', parseFloat(e.target.value))}
                        helperText="Average wind speed for cooling calculations"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={parameters.includeSeasonalVariation}
                            onChange={(e) => handleParameterChange('includeSeasonalVariation', e.target.checked)}
                          />
                        }
                        label="Include Seasonal Variation"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Battery & Storage Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Battery Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Battery Type</InputLabel>
                        <Select
                          value={parameters.batteryType}
                          label="Battery Type"
                          onChange={(e) => handleParameterChange('batteryType', e.target.value)}
                        >
                          <MenuItem value="lithium">Lithium Ion</MenuItem>
                          <MenuItem value="lead_acid">Lead Acid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Battery Autonomy Factor"
                        type="number"
                        inputProps={{ min: 1, max: 5, step: 0.1 }}
                        value={parameters.batteryAutonomyFactor}
                        onChange={(e) => handleParameterChange('batteryAutonomyFactor', parseFloat(e.target.value))}
                        helperText="Days of battery backup (2 = 2 days)"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography gutterBottom>
                        Depth of Discharge: {(parameters.batteryDepthOfDischarge * 100).toFixed(0)}%
                      </Typography>
                      <Slider
                        value={parameters.batteryDepthOfDischarge}
                        onChange={(_, value) => handleParameterChange('batteryDepthOfDischarge', value)}
                        min={0.5}
                        max={0.9}
                        step={0.05}
                        marks={[
                          { value: 0.5, label: '50%' },
                          { value: 0.7, label: '70%' },
                          { value: 0.9, label: '90%' }
                        ]}
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Battery Performance
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Round-trip Efficiency"
                        type="number"
                        inputProps={{ min: 0.7, max: 0.99, step: 0.01 }}
                        value={parameters.batteryRoundTripEfficiency}
                        onChange={(e) => handleParameterChange('batteryRoundTripEfficiency', parseFloat(e.target.value))}
                        helperText="Battery charge/discharge efficiency"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Battery Lifetime (years)"
                        type="number"
                        inputProps={{ min: 5, max: 25 }}
                        value={parameters.batteryLifetime}
                        onChange={(e) => handleParameterChange('batteryLifetime', parseInt(e.target.value))}
                        helperText="Expected battery replacement cycle"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Temperature Derating (%/°C)"
                        type="number"
                        inputProps={{ min: 0, max: 1, step: 0.1 }}
                        value={parameters.batteryTemperatureDerating}
                        onChange={(e) => handleParameterChange('batteryTemperatureDerating', parseFloat(e.target.value))}
                        helperText="Capacity loss per degree above 25°C"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Financial Parameters Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Discount Rate (%)"
                        type="number"
                        inputProps={{ min: 0, max: 20, step: 0.1 }}
                        value={parameters.discountRate * 100}
                        onChange={(e) => handleParameterChange('discountRate', parseFloat(e.target.value) / 100)}
                        helperText="Annual discount rate for NPV calculations"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Project Lifetime (years)"
                        type="number"
                        inputProps={{ min: 10, max: 30 }}
                        value={parameters.projectLifetime}
                        onChange={(e) => handleParameterChange('projectLifetime', parseInt(e.target.value))}
                        helperText="Project analysis period"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Electricity Tariff ($/kWh)"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        value={parameters.electricityTariff}
                        onChange={(e) => handleParameterChange('electricityTariff', parseFloat(e.target.value))}
                        helperText="Cost of grid electricity (if applicable)"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Escalation
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Fuel Price Escalation (%/year)"
                        type="number"
                        inputProps={{ min: 0, max: 10, step: 0.1 }}
                        value={parameters.fuelPriceEscalation * 100}
                        onChange={(e) => handleParameterChange('fuelPriceEscalation', parseFloat(e.target.value) / 100)}
                        helperText="Annual fuel price increase"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Maintenance Cost Escalation (%/year)"
                        type="number"
                        inputProps={{ min: 0, max: 10, step: 0.1 }}
                        value={parameters.maintenanceCostEscalation * 100}
                        onChange={(e) => handleParameterChange('maintenanceCostEscalation', parseFloat(e.target.value) / 100)}
                        helperText="Annual maintenance cost increase"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={parameters.includeInflation}
                            onChange={(e) => handleParameterChange('includeInflation', e.target.checked)}
                          />
                        }
                        label="Include Inflation in Analysis"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Parameter Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="textSecondary">
              Battery Autonomy
            </Typography>
            <Typography variant="body1">
              {parameters.batteryAutonomyFactor} days
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="textSecondary">
              Discount Rate
            </Typography>
            <Typography variant="body1">
              {(parameters.discountRate * 100).toFixed(1)}%
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="textSecondary">
              Project Lifetime
            </Typography>
            <Typography variant="body1">
              {parameters.projectLifetime} years
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="textSecondary">
              Battery Type
            </Typography>
            <Typography variant="body1">
              {parameters.batteryType === 'lithium' ? 'Lithium Ion' : 'Lead Acid'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ParametersPage;
