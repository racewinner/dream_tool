import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

interface CalculationResults {
  dailyEnergyUsage: number;
  peakHours: number;
  systemSize: number;
  panelCount: number;
  initialCost: number;
  annualSavings: number;
  paybackPeriod: number;
  co2Savings: number;
  roi: number;
}

export default function TechnoEconomic() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState<string>('');
  const [peakHours, setPeakHours] = useState<string>('');
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleCalculate = () => {
    setLoading(true);
    setError(null);

    // Validate inputs
    const dailyUsageNum = parseFloat(dailyUsage);
    const peakHoursNum = parseFloat(peakHours);

    if (!dailyUsageNum || !peakHoursNum || dailyUsageNum <= 0 || peakHoursNum <= 0) {
      setError('Please enter valid positive numbers for both fields');
      setLoading(false);
      return;
    }

    // Simulate API call with real calculations
    setTimeout(() => {
      try {
        // Solar PV calculation logic
        const systemSize = (dailyUsageNum / peakHoursNum) * 1.2; // kW with 20% safety margin
        const panelCount = Math.ceil(systemSize / 0.4); // Assuming 400W panels
        const costPerWatt = 1.5; // $1.5 per watt installed
        const initialCost = systemSize * 1000 * costPerWatt; // Total system cost
        const electricityRate = 0.15; // $0.15 per kWh
        const annualSavings = dailyUsageNum * 365 * electricityRate;
        const paybackPeriod = initialCost / annualSavings;
        const co2Savings = dailyUsageNum * 365 * 0.4; // kg CO2 per year
        const roi = (annualSavings * 25 - initialCost) / initialCost * 100; // 25-year ROI

        const calculationResults: CalculationResults = {
          dailyEnergyUsage: dailyUsageNum,
          peakHours: peakHoursNum,
          systemSize: Math.round(systemSize * 100) / 100,
          panelCount,
          initialCost: Math.round(initialCost),
          annualSavings: Math.round(annualSavings),
          paybackPeriod: Math.round(paybackPeriod * 10) / 10,
          co2Savings: Math.round(co2Savings),
          roi: Math.round(roi)
        };

        setResults(calculationResults);
      } catch (err) {
        setError('Calculation failed. Please check your inputs.');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Techno-Economic Analysis
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Energy Data Input
              </Typography>
              
              <TextField
                fullWidth
                label="Daily Energy Usage (kWh)"
                type="number"
                margin="normal"
                value={dailyUsage}
                onChange={(e) => setDailyUsage(e.target.value)}
                placeholder="e.g., 25"
              />
              
              <TextField
                fullWidth
                label="Peak Sun Hours"
                type="number"
                margin="normal"
                value={peakHours}
                onChange={(e) => setPeakHours(e.target.value)}
                placeholder="e.g., 5.5"
                helperText="Average daily peak sun hours in your location"
              />
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleCalculate}
                disabled={loading}
                sx={{ mt: 2 }}
                fullWidth
              >
                {loading ? 'Calculating...' : 'Calculate Analysis'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {!results && !error && (
                <Typography color="textSecondary">
                  Enter energy data and click Calculate Analysis to see results
                </Typography>
              )}

              {results && (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Parameter</strong></TableCell>
                        <TableCell align="right"><strong>Value</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Required System Size</TableCell>
                        <TableCell align="right">{results.systemSize} kW</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Number of Solar Panels</TableCell>
                        <TableCell align="right">{results.panelCount} panels</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Initial Investment</TableCell>
                        <TableCell align="right">${results.initialCost.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Annual Savings</TableCell>
                        <TableCell align="right">${results.annualSavings.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Payback Period</TableCell>
                        <TableCell align="right">{results.paybackPeriod} years</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>CO₂ Savings/Year</TableCell>
                        <TableCell align="right">{results.co2Savings} kg</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>25-Year ROI</TableCell>
                        <TableCell align="right">{results.roi}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
