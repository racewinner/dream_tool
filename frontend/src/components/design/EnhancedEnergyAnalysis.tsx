/**
 * Enhanced Energy Analysis Component
 * Integrates TypeScript and Python energy services for comprehensive analysis
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Slider,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Science as ScienceIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  CompareArrows as CompareIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

// Import both services
import EnergyService from '../../services/energyService';
import PythonEnergyService, {
  PythonFacilityData,
  PythonEnergyAnalysisOptions,
  PythonEnergyAnalysisResponse
} from '../../services/pythonEnergyService';

interface EnhancedEnergyAnalysisProps {
  facilityData: any;
  onAnalysisComplete?: (results: any) => void;
}

interface AnalysisResults {
  typescript: any;
  python: PythonEnergyAnalysisResponse | null;
  comparison: any;
}

const EnhancedEnergyAnalysis: React.FC<EnhancedEnergyAnalysisProps> = ({
  facilityData,
  onAnalysisComplete
}) => {
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'advanced' | 'comparison'>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Advanced analysis options
  const [advancedOptions, setAdvancedOptions] = useState<PythonEnergyAnalysisOptions>({
    include_seasonal_variation: true,
    safety_margin: 1.2,
    system_efficiency: 0.85,
    battery_autonomy: 24,
    ambient_temperature: 25
  });

  const handleBasicAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Running basic TypeScript energy analysis...');
      
      // Use existing TypeScript energy service
      const mockSurveyData = {
        id: facilityData.id || 1,
        facilityData: {
          name: facilityData.name || 'Test Facility',
          facilityType: facilityData.facilityType || 'health_clinic',
          latitude: facilityData.latitude || 2.0469,
          longitude: facilityData.longitude || 45.3182,
          operationalHours: facilityData.operationalHours || 12,
          staffCount: facilityData.staffCount || 5,
          equipment: facilityData.equipment || [
            { type: 'LED Lights', powerRating: 20, hoursPerDay: 12, quantity: 10, condition: 'good' },
            { type: 'Medical Refrigerator', powerRating: 150, hoursPerDay: 24, quantity: 1, condition: 'good' },
            { type: 'Ceiling Fans', powerRating: 75, hoursPerDay: 10, quantity: 4, condition: 'fair' }
          ]
        }
      };

      const typescriptResult = await EnergyService.generateScenarioFromSurvey(mockSurveyData);
      
      setResults({
        typescript: typescriptResult,
        python: null,
        comparison: null
      });
      
      console.log('✅ Basic analysis completed');
      
      if (onAnalysisComplete) {
        onAnalysisComplete({ basic: typescriptResult });
      }
      
    } catch (err) {
      console.error('❌ Basic analysis failed:', err);
      setError(`Basic analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🐍 Running advanced Python energy analysis...');
      
      // Convert facility data to Python format
      const pythonFacilityData: PythonFacilityData = PythonEnergyService.convertToPythonFacility(facilityData);
      
      // Perform comprehensive analysis using Python services
      const pythonResult = await PythonEnergyService.performComprehensiveAnalysis({
        facility_data: pythonFacilityData,
        scenario_type: 'optimized',
        options: advancedOptions
      });
      
      setResults({
        typescript: null,
        python: pythonResult,
        comparison: null
      });
      
      console.log('✅ Advanced analysis completed');
      
      if (onAnalysisComplete) {
        onAnalysisComplete({ advanced: pythonResult });
      }
      
    } catch (err) {
      console.error('❌ Advanced analysis failed:', err);
      setError(`Advanced analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleComparisonAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Running comparison analysis (TypeScript vs Python)...');
      
      // Run both analyses in parallel
      const [typescriptResult, pythonResult] = await Promise.all([
        // TypeScript analysis
        (async () => {
          const mockSurveyData = {
            id: facilityData.id || 1,
            facilityData: {
              name: facilityData.name || 'Test Facility',
              facilityType: facilityData.facilityType || 'health_clinic',
              latitude: facilityData.latitude || 2.0469,
              longitude: facilityData.longitude || 45.3182,
              operationalHours: facilityData.operationalHours || 12,
              staffCount: facilityData.staffCount || 5,
              equipment: facilityData.equipment || []
            }
          };
          return await EnergyService.generateScenarioFromSurvey(mockSurveyData);
        })(),
        
        // Python analysis
        (async () => {
          const pythonFacilityData = PythonEnergyService.convertToPythonFacility(facilityData);
          return await PythonEnergyService.performComprehensiveAnalysis({
            facility_data: pythonFacilityData,
            scenario_type: 'optimized',
            options: advancedOptions
          });
        })()
      ]);
      
      // Compare results
      const comparison = {
        peak_demand_diff: pythonResult.scenario.analysis_result.peak_demand - typescriptResult.analysis.peakDemand,
        daily_consumption_diff: pythonResult.scenario.analysis_result.daily_consumption - typescriptResult.analysis.dailyConsumption,
        system_size_diff: pythonResult.system_sizing.pv_system_size - (typescriptResult.sizing?.pvSystemSize || 0),
        recommendations_count: {
          typescript: typescriptResult.recommendations?.length || 0,
          python: pythonResult.recommendations.length
        }
      };
      
      setResults({
        typescript: typescriptResult,
        python: pythonResult,
        comparison
      });
      
      console.log('✅ Comparison analysis completed');
      
      if (onAnalysisComplete) {
        onAnalysisComplete({ 
          typescript: typescriptResult, 
          python: pythonResult, 
          comparison 
        });
      }
      
    } catch (err) {
      console.error('❌ Comparison analysis failed:', err);
      setError(`Comparison analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderBasicResults = () => {
    if (!results?.typescript) return null;
    
    const { analysis, sizing } = results.typescript;
    
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Basic Energy Analysis Results
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Energy Demand
                </Typography>
                <Typography variant="h6">
                  {analysis.peakDemand.toFixed(2)} kW peak
                </Typography>
                <Typography variant="body2">
                  {analysis.dailyConsumption.toFixed(2)} kWh daily
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  System Sizing
                </Typography>
                <Typography variant="h6">
                  {sizing?.pvSystemSize?.toFixed(2) || 'N/A'} kW PV
                </Typography>
                <Typography variant="body2">
                  {sizing?.batteryCapacity?.toFixed(2) || 'N/A'} kWh Battery
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderAdvancedResults = () => {
    if (!results?.python) return null;
    
    const { scenario, system_sizing, recommendations } = results.python;
    const analysis = scenario.analysis_result;
    
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Advanced Energy Analysis Results
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Energy Metrics
                </Typography>
                <Typography variant="h6">
                  {analysis.peak_demand.toFixed(2)} kW peak
                </Typography>
                <Typography variant="body2">
                  {analysis.daily_consumption.toFixed(2)} kWh daily
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Load Factor: {analysis.load_factor.toFixed(3)}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Optimized System
                </Typography>
                <Typography variant="h6">
                  {system_sizing.pv_system_size.toFixed(2)} kW PV
                </Typography>
                <Typography variant="body2">
                  {system_sizing.battery_capacity.toFixed(2)} kWh Battery
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {system_sizing.panel_count} panels
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Analysis Quality
                </Typography>
                <Typography variant="h6">
                  {analysis.peak_hours.length} peak hours
                </Typography>
                <Typography variant="body2">
                  Variability: {(analysis.load_variability * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Base Load: {analysis.base_load.toFixed(2)} kW
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {recommendations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI-Generated Recommendations
              </Typography>
              <List dense>
                {recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TrendingUpIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderComparisonResults = () => {
    if (!results?.comparison || !results?.typescript || !results?.python) return null;
    
    const { comparison, typescript, python } = results;
    
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <CompareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Analysis Comparison Results
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">TypeScript Service</TableCell>
                  <TableCell align="right">Python Service</TableCell>
                  <TableCell align="right">Difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Peak Demand (kW)</TableCell>
                  <TableCell align="right">{typescript.analysis.peakDemand.toFixed(2)}</TableCell>
                  <TableCell align="right">{python.scenario.analysis_result.peak_demand.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${comparison.peak_demand_diff > 0 ? '+' : ''}${comparison.peak_demand_diff.toFixed(2)}`}
                      color={Math.abs(comparison.peak_demand_diff) < 0.5 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Daily Consumption (kWh)</TableCell>
                  <TableCell align="right">{typescript.analysis.dailyConsumption.toFixed(2)}</TableCell>
                  <TableCell align="right">{python.scenario.analysis_result.daily_consumption.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${comparison.daily_consumption_diff > 0 ? '+' : ''}${comparison.daily_consumption_diff.toFixed(2)}`}
                      color={Math.abs(comparison.daily_consumption_diff) < 2 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Recommendations</TableCell>
                  <TableCell align="right">{comparison.recommendations_count.typescript}</TableCell>
                  <TableCell align="right">{comparison.recommendations_count.python}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${comparison.recommendations_count.python - comparison.recommendations_count.typescript} more`}
                      color="info"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Analysis Summary:</strong> The Python service provides more detailed analysis with 
              advanced features like load factor calculation, variability analysis, and AI-generated recommendations.
              Small differences in energy calculations are expected due to different modeling approaches.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Enhanced Energy Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose your analysis approach: Basic (TypeScript), Advanced (Python), or Comparison mode.
          </Typography>
          
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Analysis Mode</FormLabel>
            <RadioGroup
              row
              value={analysisMode}
              onChange={(e) => setAnalysisMode(e.target.value as any)}
            >
              <FormControlLabel 
                value="basic" 
                control={<Radio />} 
                label="Basic Analysis" 
              />
              <FormControlLabel 
                value="advanced" 
                control={<Radio />} 
                label="Advanced Analysis" 
              />
              <FormControlLabel 
                value="comparison" 
                control={<Radio />} 
                label="Comparison Mode" 
              />
            </RadioGroup>
          </FormControl>
          
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                onClick={analysisMode === 'basic' ? handleBasicAnalysis : 
                         analysisMode === 'advanced' ? handleAdvancedAnalysis : 
                         handleComparisonAnalysis}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
              >
                {loading ? 'Analyzing...' : `Run ${analysisMode} Analysis`}
              </Button>
            </Grid>
            
            {analysisMode === 'advanced' && (
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={() => setDialogOpen(true)}
                  startIcon={<SettingsIcon />}
                >
                  Advanced Options
                </Button>
              </Grid>
            )}
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Render results based on analysis mode */}
      {analysisMode === 'basic' && renderBasicResults()}
      {analysisMode === 'advanced' && renderAdvancedResults()}
      {analysisMode === 'comparison' && renderComparisonResults()}
      
      {/* Advanced Options Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Advanced Analysis Options</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={advancedOptions.include_seasonal_variation}
                  onChange={(e) => setAdvancedOptions({
                    ...advancedOptions,
                    include_seasonal_variation: e.target.checked
                  })}
                />
              }
              label="Include Seasonal Variation"
            />
            
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>Safety Margin: {advancedOptions.safety_margin}</Typography>
              <Slider
                value={advancedOptions.safety_margin}
                onChange={(_, value) => setAdvancedOptions({
                  ...advancedOptions,
                  safety_margin: value as number
                })}
                min={1.0}
                max={2.0}
                step={0.1}
                marks={[
                  { value: 1.0, label: '1.0' },
                  { value: 1.5, label: '1.5' },
                  { value: 2.0, label: '2.0' }
                ]}
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>System Efficiency: {advancedOptions.system_efficiency}</Typography>
              <Slider
                value={advancedOptions.system_efficiency}
                onChange={(_, value) => setAdvancedOptions({
                  ...advancedOptions,
                  system_efficiency: value as number
                })}
                min={0.5}
                max={1.0}
                step={0.05}
                marks={[
                  { value: 0.5, label: '50%' },
                  { value: 0.75, label: '75%' },
                  { value: 1.0, label: '100%' }
                ]}
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>Battery Autonomy (hours): {advancedOptions.battery_autonomy}</Typography>
              <Slider
                value={advancedOptions.battery_autonomy}
                onChange={(_, value) => setAdvancedOptions({
                  ...advancedOptions,
                  battery_autonomy: value as number
                })}
                min={12}
                max={72}
                step={6}
                marks={[
                  { value: 12, label: '12h' },
                  { value: 24, label: '24h' },
                  { value: 48, label: '48h' },
                  { value: 72, label: '72h' }
                ]}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setDialogOpen(false)} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedEnergyAnalysis;
