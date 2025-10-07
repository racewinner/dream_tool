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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  Cell,
} from 'recharts';
import { formatNumber } from './utils/format';
import { PortfolioData, SiteData } from '../types/site';
import { format } from 'date-fns';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
        {payload.map((item, index) => (
          <Typography key={index} variant="body2">
            <Box component="span" sx={{ color: item.color }}>
              {item.name}:
            </Box>
            {` ${formatNumber(item.value)} ${item.unit || ''}`}
          </Typography>
        ))}
      </Paper>
    );
  }

  return null;
};

interface PortfolioAnalyticsProps {
  data: PortfolioData;
}

interface SiteRowProps {
  site: SiteData;
  index: number;
}

const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [openSiteDialog, setOpenSiteDialog] = React.useState(false);
  const [selectedSite, setSelectedSite] = React.useState<SiteData | null>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenSiteDialog = (site: SiteData) => {
    setSelectedSite(site);
    setOpenSiteDialog(true);
  };

  const handleCloseSiteDialog = () => {
    setSelectedSite(null);
    setOpenSiteDialog(false);
  };

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    const totalEnergyProduction = data.sites.reduce((sum: number, site: SiteData) => 
      sum + site.analysis.pv.energyProduction.yearly, 0);

    const totalDieselConsumption = data.sites.reduce((sum: number, site: SiteData) => 
      sum + site.analysis.diesel.fuelConsumption.yearly, 0);

    const totalCo2Reduction = data.sites.reduce((sum: number, site: SiteData) => 
      sum + site.analysis.pv.environmentalImpact.co2Reduction, 0);

    const totalCo2Emissions = data.sites.reduce((sum: number, site: SiteData) => 
      sum + site.analysis.diesel.environmentalImpact.co2Emissions, 0);

    const totalNpv = data.sites.reduce((sum: number, site: SiteData) => 
      sum + site.analysis.pv.financial.npv, 0);

    const totalIrr = data.sites.reduce((sum: number, site: SiteData) => 
      sum + site.analysis.pv.financial.irr, 0) / data.sites.length;

    return {
      totalEnergyProduction,
      totalDieselConsumption,
      totalCo2Reduction,
      totalCo2Emissions,
      totalNpv,
      totalIrr,
      paybackPeriod: data.portfolioAnalysis.paybackPeriod
    };
  };

  const portfolioMetrics = calculatePortfolioMetrics();

  // Site performance data
  const sitePerformanceData = data.sites.map((site: SiteData, index: number) => ({
    name: site.name,
    energyProduction: site.analysis.pv.energyProduction.yearly,
    dieselConsumption: site.analysis.diesel.fuelConsumption.yearly,
    co2Reduction: site.analysis.pv.environmentalImpact.co2Reduction,
    co2Emissions: site.analysis.diesel.environmentalImpact.co2Emissions,
    systemEfficiency: site.analysis.pv.energyProduction.yearly / 
      (site.analysis.pv.energyProduction.yearly + site.analysis.diesel.fuelConsumption.yearly) * 100,
    npv: site.analysis.pv.financial.npv,
    irr: site.analysis.pv.financial.irr
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Portfolio Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Portfolio Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Total Energy Production
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {formatNumber(portfolioMetrics.totalEnergyProduction)} kWh
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Total Diesel Savings
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {formatNumber(portfolioMetrics.totalDieselConsumption)} liters
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Total CO2 Impact
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {formatNumber(portfolioMetrics.totalCo2Reduction)} kg CO2
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Financial Metrics
                    </Typography>
                    <Typography variant="h4" color="primary">
                      ${formatNumber(portfolioMetrics.totalNpv)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Energy Production" />
            <Tab label="CO2 Impact" />
          </Tabs>

          {activeTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Energy Production by Site
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sitePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="energyProduction" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                CO2 Impact by Site
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sitePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="co2Reduction" fill="#4CAF50" />
                  <Bar dataKey="co2Emissions" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Grid>

        {/* Site Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Site Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Site Name</TableCell>
                      <TableCell align="right">Energy Production</TableCell>
                      <TableCell align="right">Diesel Consumption</TableCell>
                      <TableCell align="right">CO2 Impact</TableCell>
                      <TableCell align="right">System Efficiency</TableCell>
                      <TableCell align="right">Financial Metrics</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.sites.map((site: SiteData, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" component="div">
                              {site.name}
                            </Typography>
                            <Tooltip title="View Details" placement="right">
                              <IconButton size="small" onClick={() => handleOpenSiteDialog(site)}>
                                <ArrowDownward />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(site.analysis.pv.energyProduction.yearly)} kWh
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(site.analysis.diesel.fuelConsumption.yearly)} liters
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`+${formatNumber(site.analysis.pv.environmentalImpact.co2Reduction)} kg`}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            label={`-${formatNumber(site.analysis.diesel.environmentalImpact.co2Emissions)} kg`}
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <LinearProgress
                            variant="determinate"
                            value={sitePerformanceData[index].systemEfficiency}
                            sx={{
                              height: 10,
                              borderRadius: 2,
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Typography variant="caption" align="right">
                            {Math.round(sitePerformanceData[index].systemEfficiency)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            NPV: ${formatNumber(site.analysis.pv.financial.npv)}<br />
                            IRR: {site.analysis.pv.financial.irr.toFixed(1)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Site Details Dialog */}
        <Dialog open={openSiteDialog} onClose={handleCloseSiteDialog} maxWidth="md" fullWidth>
          <DialogTitle>Site Details - {selectedSite?.name}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Energy Production
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedSite?.analysis.pv.energyProduction.monthly.map((val: number, i: number) => ({
                    month: format(new Date(2024, i), 'MMM'),
                    value: val,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#4CAF50" />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Diesel Consumption
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedSite?.analysis.diesel.fuelConsumption.monthly.map((val: number, i: number) => ({
                    month: format(new Date(2024, i), 'MMM'),
                    value: val,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#F44336" />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSiteDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default PortfolioAnalytics;
