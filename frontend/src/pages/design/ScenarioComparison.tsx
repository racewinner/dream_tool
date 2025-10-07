import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Tabs, Tab, LinearProgress
} from '@mui/material';
import {
  Compare as CompareIcon,
  TrendingUp, TrendingDown, BatteryChargingFull,
  Lightbulb, Assessment, Timeline, Delete as DeleteIcon,
  Refresh as RefreshIcon, Download as DownloadIcon
} from '@mui/icons-material';
import { scenarioComparisonService, Scenario, Equipment, type ScenarioComparison } from '../../services/scenarioComparisonService';
import { useAuth } from '../../contexts/AuthContext';

interface ScenarioComparisonProps {
  selectedSurvey?: any;
  idealScenarioData?: {
    facilityName: string;
    facilityType: string;
    equipment: Equipment[];
  };
}

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  selectedSurvey,
  idealScenarioData
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Load Scenarios',
    'Generate Analysis',
    'Compare Results',
    'Review Recommendations'
  ];

  useEffect(() => {
    if (selectedSurvey && idealScenarioData) {
      generateComparison();
    }
  }, [selectedSurvey, idealScenarioData]);

  const generateComparison = async () => {
    if (!selectedSurvey || !idealScenarioData) return;

    setLoading(true);
    setError(null);
    setAnalysisProgress(0);

    try {
      // Step 1: Generate current scenario from survey
      setCurrentStep(0);
      setAnalysisProgress(25);
      const currentScenario = scenarioComparisonService.generateCurrentScenarioFromSurvey(selectedSurvey);
      
      // Step 2: Generate ideal scenario
      setCurrentStep(1);
      setAnalysisProgress(50);
      const idealScenario = scenarioComparisonService.generateIdealScenario(
        idealScenarioData.facilityName,
        idealScenarioData.facilityType,
        idealScenarioData.equipment
      );

      // Step 3: Perform comparison analysis
      setCurrentStep(2);
      setAnalysisProgress(75);
      const comparisonResult = await scenarioComparisonService.compareScenarios(
        currentScenario,
        idealScenario
      );

      setCurrentStep(3);
      setAnalysisProgress(100);
      setComparison(comparisonResult);

      // Save scenarios for future reference
      scenarioComparisonService.saveScenario(currentScenario);
      scenarioComparisonService.saveScenario(idealScenario);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      console.error('Scenario comparison failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatKW = (value: number) => `${value.toFixed(1)} kW`;
  const formatKWh = (value: number) => `${value.toFixed(1)} kWh`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatYears = (value: number) => `${value.toFixed(1)} years`;

  const ScenarioCard: React.FC<{ scenario: Scenario; title: string; color: string }> = ({ 
    scenario, title, color 
  }) => (
    <Card sx={{ height: '100%', border: `2px solid ${color}` }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6" color={color} sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Chip 
            label={scenario.type.toUpperCase()} 
            size="small" 
            sx={{ ml: 1, bgcolor: color, color: 'white' }}
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          {scenario.facilityName} • {scenario.facilityType.replace('_', ' ')}
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              Peak Demand
            </Typography>
            <Typography variant="h6">
              {formatKW(scenario.peakDemand)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              Daily Consumption
            </Typography>
            <Typography variant="h6">
              {formatKWh(scenario.dailyConsumption)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              Annual Consumption
            </Typography>
            <Typography variant="h6">
              {formatKWh(scenario.annualConsumption)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              Equipment Count
            </Typography>
            <Typography variant="h6">
              {scenario.equipment.length} items
            </Typography>
          </Grid>
        </Grid>

        {scenario.pvAnalysis && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="textSecondary">
              PV System Analysis
            </Typography>
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  System: {formatKW(scenario.pvAnalysis.pv.systemSize)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Battery: {formatKWh(scenario.pvAnalysis.pv.batteryCapacity)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Cost: {formatCurrency(scenario.pvAnalysis.pv.initialCost)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  IRR: {formatPercent(scenario.pvAnalysis.pv.irr)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const ComparisonMetricsCard: React.FC = () => {
    if (!comparison) return null;

    const metrics = [
      {
        label: 'Demand Reduction',
        value: formatKW(comparison.comparison.demandReduction),
        trend: comparison.comparison.demandReduction > 0 ? 'down' : 'up',
        icon: <TrendingDown />,
        color: comparison.comparison.demandReduction > 0 ? 'success' : 'error'
      },
      {
        label: 'Annual Savings',
        value: formatKWh(comparison.comparison.consumptionReduction),
        trend: comparison.comparison.consumptionReduction > 0 ? 'down' : 'up',
        icon: <BatteryChargingFull />,
        color: comparison.comparison.consumptionReduction > 0 ? 'success' : 'error'
      },
      {
        label: 'Cost Savings',
        value: formatCurrency(Math.abs(comparison.comparison.costSavings)),
        trend: comparison.comparison.costSavings > 0 ? 'down' : 'up',
        icon: <TrendingUp />,
        color: comparison.comparison.costSavings > 0 ? 'success' : 'warning'
      },
      {
        label: 'Payback Period',
        value: comparison.comparison.paybackPeriod < 999 ? formatYears(comparison.comparison.paybackPeriod) : 'N/A',
        trend: 'neutral',
        icon: <Timeline />,
        color: comparison.comparison.paybackPeriod < 10 ? 'success' : 'warning'
      }
    ];

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <CompareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Comparison Summary
          </Typography>
          
          <Grid container spacing={2}>
            {metrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box 
                  sx={{ 
                    p: 2, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ color: `${metric.color}.main` }}>
                    {metric.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      {metric.label}
                    </Typography>
                    <Typography variant="h6" color={`${metric.color}.main`}>
                      {metric.value}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {comparison.comparison.carbonReduction > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                The ideal scenario would reduce CO₂ emissions by{' '}
                <strong>{Math.round(comparison.comparison.carbonReduction)} kg/year</strong>
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const EquipmentComparisonTable: React.FC = () => {
    if (!comparison) return null;

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Equipment</TableCell>
              <TableCell>Current Scenario</TableCell>
              <TableCell>Ideal Scenario</TableCell>
              <TableCell>Power Difference</TableCell>
              <TableCell>Efficiency Gain</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comparison.idealScenario.equipment.map((idealEq, index) => {
              const currentEq = comparison.currentScenario.equipment.find(
                eq => eq.category === idealEq.category
              ) || null;

              const powerDiff = currentEq 
                ? (currentEq.powerRating * currentEq.quantity) - (idealEq.powerRating * idealEq.quantity)
                : -(idealEq.powerRating * idealEq.quantity);

              const efficiencyDiff = currentEq 
                ? idealEq.efficiency - currentEq.efficiency
                : idealEq.efficiency;

              return (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {idealEq.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {idealEq.category.replace('_', ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {currentEq ? (
                      <>
                        <Typography variant="body2">
                          {currentEq.powerRating}W × {currentEq.quantity}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatPercent(currentEq.efficiency)} efficient
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Not present
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {idealEq.powerRating}W × {idealEq.quantity}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatPercent(idealEq.efficiency)} efficient
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={powerDiff > 0 ? `-${powerDiff}W` : `+${Math.abs(powerDiff)}W`}
                      size="small"
                      color={powerDiff > 0 ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={efficiencyDiff > 0 ? `+${formatPercent(efficiencyDiff)}` : formatPercent(efficiencyDiff)}
                      size="small"
                      color={efficiencyDiff > 0 ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analyzing Scenarios
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {steps[currentStep]}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analysisProgress} 
              sx={{ width: '300px', mx: 'auto' }}
            />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button onClick={generateComparison} startIcon={<RefreshIcon />}>
            Retry
          </Button>
        }>
          <Typography variant="h6">Analysis Failed</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!comparison) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          No scenario data available
        </Typography>
        <Button 
          variant="contained" 
          onClick={generateComparison}
          sx={{ mt: 2 }}
          disabled={!selectedSurvey || !idealScenarioData}
        >
          Generate Comparison
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Scenario Comparison
        </Typography>
        <Box>
          <Button 
            startIcon={<RefreshIcon />}
            onClick={generateComparison}
            sx={{ mr: 1 }}
          >
            Refresh Analysis
          </Button>
          <Button 
            startIcon={<DownloadIcon />}
            variant="contained"
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Scenario Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ScenarioCard 
            scenario={comparison.currentScenario} 
            title="Current Scenario"
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ScenarioCard 
            scenario={comparison.idealScenario} 
            title="Ideal Scenario"
            color="#4caf50"
          />
        </Grid>
      </Grid>

      {/* Comparison Metrics */}
      <Box sx={{ mb: 3 }}>
        <ComparisonMetricsCard />
      </Box>

      {/* Detailed Analysis Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Equipment Comparison" icon={<Lightbulb />} />
            <Tab label="Financial Analysis" icon={<Assessment />} />
            <Tab label="Implementation Plan" icon={<Timeline />} />
          </Tabs>
        </Box>
        
        <CardContent>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Equipment Comparison Analysis
              </Typography>
              <EquipmentComparisonTable />
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Financial Impact Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Scenario PV System
                  </Typography>
                  {comparison.currentScenario.pvAnalysis && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Initial Investment</TableCell>
                            <TableCell align="right">
                              {formatCurrency(comparison.currentScenario.pvAnalysis.pv.initialCost)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Annual Maintenance</TableCell>
                            <TableCell align="right">
                              {formatCurrency(comparison.currentScenario.pvAnalysis.pv.annualMaintenance)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>20-Year Lifecycle Cost</TableCell>
                            <TableCell align="right">
                              {formatCurrency(comparison.currentScenario.pvAnalysis.pv.lifecycleCost)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>IRR</TableCell>
                            <TableCell align="right">
                              {formatPercent(comparison.currentScenario.pvAnalysis.pv.irr)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Ideal Scenario PV System
                  </Typography>
                  {comparison.idealScenario.pvAnalysis && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Initial Investment</TableCell>
                            <TableCell align="right">
                              {formatCurrency(comparison.idealScenario.pvAnalysis.pv.initialCost)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Annual Maintenance</TableCell>
                            <TableCell align="right">
                              {formatCurrency(comparison.idealScenario.pvAnalysis.pv.annualMaintenance)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>20-Year Lifecycle Cost</TableCell>
                            <TableCell align="right">
                              {formatCurrency(comparison.idealScenario.pvAnalysis.pv.lifecycleCost)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>IRR</TableCell>
                            <TableCell align="right">
                              {formatPercent(comparison.idealScenario.pvAnalysis.pv.irr)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Implementation Recommendations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="subtitle2">Recommended Implementation Strategy</Typography>
                    <Typography variant="body2">
                      1. Replace high-power consuming equipment with energy-efficient alternatives<br/>
                      2. Implement load management and usage optimization<br/>
                      3. Install right-sized PV system based on optimized load profile<br/>
                      4. Monitor and maintain equipment efficiency over time
                    </Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Priority Equipment Upgrades
                  </Typography>
                  <Box>
                    {comparison.idealScenario.equipment
                      .filter(eq => eq.priority === 'essential')
                      .map((eq, index) => (
                        <Chip 
                          key={index}
                          label={eq.name}
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Expected Outcomes
                  </Typography>
                  <Typography variant="body2">
                    • Payback period: {formatYears(comparison.comparison.paybackPeriod)}<br/>
                    • Annual carbon reduction: {Math.round(comparison.comparison.carbonReduction)} kg CO₂<br/>
                    • System efficiency improvement: {formatPercent(comparison.comparison.efficiencyImprovement)}<br/>
                    • Implementation cost: {formatCurrency(comparison.comparison.implementationCost)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ScenarioComparison;
