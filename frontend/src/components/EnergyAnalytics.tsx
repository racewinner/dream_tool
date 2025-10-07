import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { COLORS } from './utils/format';
import { formatNumber } from './utils/format';

interface EnergyAnalyticsProps {
  data: {
    pv: {
      lifecycleCost: number;
      npv: number;
      irr: number;
      energyProduction: {
        yearly: number;
        monthly: number[];
        seasonal: {
          winter: number;
          spring: number;
          summer: number;
          fall: number;
        };
      };
      environmentalImpact: {
        co2Reduction: number;
        waterSaved: number;
        landRequired: number;
      };
    };
    diesel: {
      lifecycleCost: number;
      npv: number;
      irr: number;
      fuelConsumption: {
        yearly: number;
        monthly: number[];
        seasonal: {
          winter: number;
          spring: number;
          summer: number;
          fall: number;
        };
      };
      environmentalImpact: {
        co2Emissions: number;
        noisePollution: number;
        maintenanceWaste: number;
      };
    };
  };
}

const EnergyAnalytics: React.FC<EnergyAnalyticsProps> = ({ data }) => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [timePeriod, setTimePeriod] = React.useState('monthly');
  const [showEnvironmentalImpact, setShowEnvironmentalImpact] = React.useState(true);
  const [showFinancialAnalysis, setShowFinancialAnalysis] = React.useState(true);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const monthlyData = Array(12).fill(0).map((_, i) => ({
    month: format(new Date(2024, i), 'MMM'),
    pv: data.pv.energyProduction.monthly[i],
    diesel: data.diesel.fuelConsumption.monthly[i],
  }));

  const seasonalLabels = ['Winter', 'Spring', 'Summer', 'Fall'];

  const financialData = [
    {
      name: 'Initial Cost',
      pv: data.pv.lifecycleCost,
      diesel: data.diesel.lifecycleCost,
    },
    {
      name: 'Annual Maintenance',
      pv: data.pv.energyProduction.yearly * 0.02,
      diesel: data.diesel.fuelConsumption.yearly * 0.05,
    },
    {
      name: 'Lifecycle Cost',
      pv: data.pv.lifecycleCost,
      diesel: data.diesel.lifecycleCost,
    },
  ];

  const seasonalData = [
    { name: 'PV Production', data: Object.values(data.pv.energyProduction.seasonal) },
    { name: 'Diesel Consumption', data: Object.values(data.diesel.fuelConsumption.seasonal) },
  ];

  const seasonalDataItem = (item: { name: string; data: number[] }, index: number) => (
    <Grid item xs={12} md={6} key={index}>
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          {item.name}
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={seasonalLabels.map((label, i) => ({
            name: label,
            value: item.data[i],
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill={index === 0 ? '#4CAF50' : '#F44336'} />
            <ChartTooltip />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Analysis Controls */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Overview" />
              <Tab label="Financial Analysis" />
              <Tab label="Environmental Impact" />
              <Tab label="Technical Analysis" />
            </Tabs>
          </Paper>
        </Grid>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Metrics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1">
                        Annual Energy Production
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatNumber(data.pv.energyProduction.yearly)} kWh
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1">
                        CO2 Reduction
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatNumber(data.pv.environmentalImpact.co2Reduction)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1">
                        Water Saved
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatNumber(data.pv.environmentalImpact.waterSaved)} m³
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Time Period Selection */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Analysis Controls
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Time Period</InputLabel>
                    <Select
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value as string)}
                      label="Time Period"
                    >
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="seasonal">Seasonal</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showEnvironmentalImpact}
                        onChange={(e) => setShowEnvironmentalImpact(e.target.checked)}
                      />
                    }
                    label="Show Environmental Impact"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showFinancialAnalysis}
                        onChange={(e) => setShowFinancialAnalysis(e.target.checked)}
                      />
                    }
                    label="Show Financial Analysis"
                  />
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Financial Analysis Tab */}
        {activeTab === 1 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={financialData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="pv"
                      nameKey="name"
                    >
                      {financialData.map((entry, index) => (
                        <Cell key={`pv-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Pie
                      data={financialData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={110}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="diesel"
                      nameKey="name"
                    >
                      {financialData.map((entry, index) => (
                        <Cell key={`diesel-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ position: 'absolute', right: 0, top: 0 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Environmental Impact Tab */}
        {activeTab === 2 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environmental Impact Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart outerRadius={150} width={500} height={500} data={[
                    {
                      subject: 'CO2 Reduction',
                      A: data.pv.environmentalImpact.co2Reduction,
                      fullMark: 10000,
                    },
                    {
                      subject: 'Water Saved',
                      A: data.pv.environmentalImpact.waterSaved,
                      fullMark: 1000,
                    },
                    {
                      subject: 'Land Required',
                      A: data.pv.environmentalImpact.landRequired,
                      fullMark: 10000,
                    },
                    {
                      subject: 'CO2 Emissions',
                      A: data.diesel.environmentalImpact.co2Emissions,
                      fullMark: 10000,
                    },
                    {
                      subject: 'Noise Pollution',
                      A: data.diesel.environmentalImpact.noisePollution,
                      fullMark: 100,
                    },
                    {
                      subject: 'Maintenance Waste',
                      A: data.diesel.environmentalImpact.maintenanceWaste,
                      fullMark: 1000,
                    },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                    <Radar
                      name="PV vs Diesel"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Technical Analysis Tab */}
        {activeTab === 3 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Technical Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      PV System Performance
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" gutterBottom>
                        System Efficiency: {Math.round(data.pv.energyProduction.yearly / (data.pv.energyProduction.yearly + data.diesel.fuelConsumption.yearly) * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.round(data.pv.energyProduction.yearly / (data.pv.energyProduction.yearly + data.diesel.fuelConsumption.yearly) * 100)}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Diesel System Performance
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" gutterBottom>
                        System Efficiency: {Math.round(data.diesel.fuelConsumption.yearly / (data.pv.energyProduction.yearly + data.diesel.fuelConsumption.yearly) * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.round(data.diesel.fuelConsumption.yearly / (data.pv.energyProduction.yearly + data.diesel.fuelConsumption.yearly) * 100)}
                        color="secondary"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Monthly Comparison Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Energy Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Line
                    type="monotone"
                    dataKey="pv"
                    stroke="#4CAF50"
                    name="PV Production"
                  />
                  <Line
                    type="monotone"
                    dataKey="diesel"
                    stroke="#F44336"
                    name="Diesel Consumption"
                  />
                  <ChartTooltip />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Seasonal Comparison */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seasonal Comparison
              </Typography>
              <Grid container spacing={2}>
                {seasonalData.map((item, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {item.name}
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={seasonalLabels.map((label, i) => ({
                          name: label,
                          value: item.data[i],
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Bar dataKey="value" fill={index === 0 ? '#4CAF50' : '#F44336'} />
                          <ChartTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Environmental Impact */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Environmental Impact
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Positive Impact
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Chip
                          label={`CO2 Reduction: ${formatNumber(data.pv.environmentalImpact.co2Reduction)} kg`}
                          color="success"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Chip
                          label={`Water Saved: ${formatNumber(data.pv.environmentalImpact.waterSaved)} m³`}
                          color="success"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Chip
                          label={`Land Required: ${formatNumber(data.pv.environmentalImpact.landRequired)} m²`}
                          color="success"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Negative Impact
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Chip
                          label={`CO2 Emissions: ${formatNumber(data.diesel.environmentalImpact.co2Emissions)} kg`}
                          color="error"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Chip
                          label={`Noise Pollution: ${formatNumber(data.diesel.environmentalImpact.noisePollution)} dB`}
                          color="error"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Chip
                          label={`Maintenance Waste: ${formatNumber(data.diesel.environmentalImpact.maintenanceWaste)} kg`}
                          color="error"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenDialog(true)}
            >
              View Detailed Report
            </Button>
            <Button variant="contained" color="success">
              Download Report
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Detailed Report Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Detailed Energy Analysis Report</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            {/* Add detailed report content here */}
            <Typography variant="body1">
              This is where the detailed report content will be displayed. It will include:
              <ul>
                <li>Monthly breakdown of production and consumption</li>
                <li>Detailed environmental impact analysis</li>
                <li>Financial analysis over project lifetime</li>
                <li>Seasonal variations and trends</li>
              </ul>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button variant="contained" color="success">
            Export to PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnergyAnalytics;
