import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  RegionalBreakdown,
  EquipmentAnalytics,
  GeographicalSite
} from '../../services/surveyAnalyticsService';

interface AnalyticsChartsProps {
  regionalData?: RegionalBreakdown[];
  equipmentData?: EquipmentAnalytics[];
  sitesData?: GeographicalSite[];
}

// Color palettes
const FACILITY_TYPE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
const POWER_SOURCE_COLORS = ['#6C5CE7', '#FD79A8', '#FDCB6E', '#E17055', '#74B9FF'];
const REGION_COLORS = ['#A29BFE', '#FD79A8', '#FDCB6E', '#E17055', '#6C5CE7', '#74B9FF'];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <Typography variant="body2" fontWeight="bold">
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  regionalData = [],
  equipmentData = [],
  sitesData = []
}) => {
  // Process data for facility type pie chart
  const facilityTypeData = sitesData.reduce((acc: any, site) => {
    const type = site.facilityType;
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, []);

  // Process data for power source pie chart  
  const powerSourceData = sitesData.reduce((acc: any, site) => {
    const source = site.powerSource;
    const existing = acc.find((item: any) => item.name === source);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: source, value: 1 });
    }
    return acc;
  }, []);

  // Process regional distribution data
  const regionalDistributionData = regionalData.map(region => ({
    name: `${region.district}, ${region.region}`,
    facilities: region.facilityCounts.total,
    completeness: region.dataQuality.averageCompleteness
  })).sort((a, b) => b.facilities - a.facilities).slice(0, 10);

  // Process equipment data for bar chart (top 10)
  const equipmentChartData = equipmentData
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 10)
    .map(equipment => ({
      name: equipment.category.length > 20 
        ? `${equipment.category.substring(0, 17)}...` 
        : equipment.category,
      count: equipment.totalCount,
      facilities: equipment.facilitiesWithEquipment
    }));

  // Data completeness scatter plot data
  const completenessScatterData = sitesData.map((site, index) => ({
    x: index + 1,
    y: site.completeness,
    name: site.name,
    region: site.region,
    facilityType: site.facilityType
  }));

  return (
    <Grid container spacing={3}>
      {/* Facility Types Pie Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Facility Type Distribution
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={facilityTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {facilityTypeData.map((entry: any, index: number) => (
                  <Cell 
                    key={`facility-type-${index}`} 
                    fill={FACILITY_TYPE_COLORS[index % FACILITY_TYPE_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Power Source Pie Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Power Source Distribution
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={powerSourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {powerSourceData.map((entry: any, index: number) => (
                  <Cell 
                    key={`power-source-${index}`} 
                    fill={POWER_SOURCE_COLORS[index % POWER_SOURCE_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Regional Distribution Bar Chart */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Top 10 Districts by Facility Count
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={regionalDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="facilities" fill="#8884d8" name="Facilities" />
              <Bar dataKey="completeness" fill="#82ca9d" name="Avg Completeness %" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Equipment Analysis Bar Chart */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Top 10 Equipment Categories
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={equipmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="count" fill="#FF6B6B" name="Total Count" />
              <Bar dataKey="facilities" fill="#4ECDC4" name="Facilities" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Data Completeness Scatter Plot */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Survey Data Completeness by Site
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Site Index" 
                domain={[1, sitesData.length]}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Completeness" 
                domain={[0, 100]}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Paper sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {data.name}
                        </Typography>
                        <Typography variant="body2">
                          Region: {data.region}
                        </Typography>
                        <Typography variant="body2">
                          Type: {data.facilityType}
                        </Typography>
                        <Typography variant="body2">
                          Completeness: {data.y}%
                        </Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                data={completenessScatterData} 
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Summary Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Sites with GPS
                </Typography>
                <Typography variant="h4" component="h2">
                  {sitesData.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Completeness
                </Typography>
                <Typography variant="h4" component="h2" color="primary">
                  {sitesData.length > 0 ? 
                    Math.round(sitesData.reduce((sum, site) => sum + site.completeness, 0) / sitesData.length) : 0
                  }%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Regions Covered
                </Typography>
                <Typography variant="h4" component="h2" color="secondary">
                  {new Set(sitesData.map(site => site.region)).size}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Equipment Types
                </Typography>
                <Typography variant="h4" component="h2" color="success.main">
                  {equipmentData.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AnalyticsCharts;
