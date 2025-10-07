import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BuildIcon from '@mui/icons-material/Build';
import SpeedIcon from '@mui/icons-material/Speed';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

/**
 * Maintenance Analytics Page - Detailed analytics on maintenance performance
 */
const MaintenanceAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30');
  const [site, setSite] = useState<string>('all');
  
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };
  
  const handleSiteChange = (event: SelectChangeEvent) => {
    setSite(event.target.value);
  };

  // Sample key performance indicators
  const kpis = {
    systemUptime: {
      value: 98.7,
      trend: '+0.5%',
      isPositive: true
    },
    maintenanceEfficiency: {
      value: 87,
      trend: '+2.3%',
      isPositive: true
    },
    avgResponseTime: {
      value: 5.3,
      trend: '-0.8',
      isPositive: true
    },
    failureRate: {
      value: 2.1,
      trend: '+0.3%',
      isPositive: false
    }
  };

  // Sample issue breakdown data
  const issueBreakdown = [
    { category: 'Inverter Issues', count: 12, percentage: 35 },
    { category: 'Battery Problems', count: 8, percentage: 23 },
    { category: 'Panel Failures', count: 5, percentage: 15 },
    { category: 'Wiring/Connection', count: 4, percentage: 12 },
    { category: 'Controller Faults', count: 3, percentage: 9 },
    { category: 'Other', count: 2, percentage: 6 }
  ];
  
  // Sample site performance data
  const sitePerformance = [
    { site: 'Mombasa Health Clinic', uptime: 96.3, issues: 5, response: 4.8 },
    { site: 'Nairobi Community Center', uptime: 99.7, issues: 1, response: 2.1 },
    { site: 'Kisumu School Campus', uptime: 99.1, issues: 2, response: 6.2 },
    { site: 'Nakuru Agricultural Cooperative', uptime: 97.8, issues: 3, response: 5.5 },
    { site: 'Eldoret Water Pumping Station', uptime: 92.4, issues: 8, response: 7.1 }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Maintenance Analytics
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Performance metrics and maintenance insights
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
              <MenuItem value="365">Last Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="site-label">Site</InputLabel>
            <Select
              labelId="site-label"
              id="site"
              value={site}
              label="Site"
              onChange={handleSiteChange}
            >
              <MenuItem value="all">All Sites</MenuItem>
              <MenuItem value="nairobi">Nairobi Community Center</MenuItem>
              <MenuItem value="mombasa">Mombasa Health Clinic</MenuItem>
              <MenuItem value="kisumu">Kisumu School Campus</MenuItem>
              <MenuItem value="nakuru">Nakuru Agricultural Cooperative</MenuItem>
              <MenuItem value="eldoret">Eldoret Water Pumping Station</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                <PowerSettingsNewIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, color: 'success.main' }} />
                System Uptime
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {kpis.systemUptime.value}%
                </Typography>
                <Chip
                  size="small"
                  icon={kpis.systemUptime.isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                  label={kpis.systemUptime.trend}
                  color={kpis.systemUptime.isPositive ? "success" : "error"}
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                vs previous period
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                <BuildIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, color: 'primary.main' }} />
                Maintenance Efficiency
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {kpis.maintenanceEfficiency.value}%
                </Typography>
                <Chip
                  size="small"
                  icon={kpis.maintenanceEfficiency.isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                  label={kpis.maintenanceEfficiency.trend}
                  color={kpis.maintenanceEfficiency.isPositive ? "success" : "error"}
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                vs previous period
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                <ScheduleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, color: 'info.main' }} />
                Avg. Response Time
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {kpis.avgResponseTime.value}h
                </Typography>
                <Chip
                  size="small"
                  icon={kpis.avgResponseTime.isPositive ? <TrendingDownIcon fontSize="small" /> : <TrendingUpIcon fontSize="small" />}
                  label={kpis.avgResponseTime.trend + 'h'}
                  color={kpis.avgResponseTime.isPositive ? "success" : "error"}
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                vs previous period
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                <SpeedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, color: 'warning.main' }} />
                Failure Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {kpis.failureRate.value}%
                </Typography>
                <Chip
                  size="small"
                  icon={kpis.failureRate.isPositive ? <TrendingDownIcon fontSize="small" /> : <TrendingUpIcon fontSize="small" />}
                  label={kpis.failureRate.trend}
                  color={kpis.failureRate.isPositive ? "success" : "error"}
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                vs previous period
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Issue Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Issue Breakdown
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Distribution of maintenance issues by category
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              {issueBreakdown.map((issue) => (
                <Box key={issue.category} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{issue.category}</Typography>
                    <Typography variant="body2">{issue.count} issues ({issue.percentage}%)</Typography>
                  </Box>
                  <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                    <Box
                      sx={{
                        width: `${issue.percentage}%`,
                        bgcolor: 
                          issue.category === 'Inverter Issues' ? 'error.main' :
                          issue.category === 'Battery Problems' ? 'warning.main' :
                          issue.category === 'Panel Failures' ? 'info.main' :
                          issue.category === 'Wiring/Connection' ? 'success.main' :
                          issue.category === 'Controller Faults' ? 'secondary.main' : 'primary.main',
                        borderRadius: 1,
                        height: 8
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Site Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Site Performance
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Maintenance performance metrics by site
            </Typography>
            
            <List>
              {sitePerformance.map((site) => (
                <React.Fragment key={site.site}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={site.site}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Chip
                            size="small"
                            label={`Uptime: ${site.uptime}%`}
                            color={site.uptime > 98 ? "success" : site.uptime > 95 ? "warning" : "error"}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={`Issues: ${site.issues}`}
                            color={site.issues < 3 ? "success" : site.issues < 6 ? "warning" : "error"}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={`Resp: ${site.response}h`}
                            color={site.response < 5 ? "success" : site.response < 7 ? "warning" : "error"}
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Maintenance Trends
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Key metrics over time
            </Typography>
            
            <Box sx={{ 
              height: 300, 
              width: '100%', 
              bgcolor: 'grey.100', 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 1
            }}>
              <Typography color="textSecondary">
                Chart visualization will be implemented here
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', mr: 1 }} />
                <Typography variant="body2">Uptime</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} />
                <Typography variant="body2">Issues</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                <Typography variant="body2">Response Time</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Analytics Insights */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insights & Recommendations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Positive Trends
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Overall system uptime improved by 0.5% since last period
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Response time decreased by 0.8 hours on average
                    </Typography>
                    <Typography variant="body2">
                      • Nairobi site maintained excellent uptime of 99.7%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Areas for Improvement
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Eldoret site has below-average uptime of 92.4%
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Inverter issues account for 35% of all problems
                    </Typography>
                    <Typography variant="body2">
                      • Response time for Kisumu site is above average at 6.2h
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Recommendations
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Schedule preventive maintenance for Eldoret inverters
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Review inverter procurement standards and suppliers
                    </Typography>
                    <Typography variant="body2">
                      • Consider additional technician training for Kisumu area
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MaintenanceAnalytics;
