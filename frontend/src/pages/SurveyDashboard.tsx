import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SurveyStats {
  totalSurveys: number;
  completedSurveys: number;
  draftSurveys: number;
  averageDailyUsage: number;
  peakHours: number;
  equipmentCount: number;
  criticalEquipment: number;
}

interface EquipmentStats {
  category: string;
  count: number;
  totalPower: number;
}

export default function SurveyDashboard() {
  const [stats, setStats] = useState<SurveyStats>({
    totalSurveys: 0,
    completedSurveys: 0,
    draftSurveys: 0,
    averageDailyUsage: 0,
    peakHours: 0,
    equipmentCount: 0,
    criticalEquipment: 0,
  });
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/surveys');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setStats(data.stats);
      setEquipmentStats(data.equipmentStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStatsCard = (title: string, value: number | string, color: string) => (
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" color={color}>
        {value}
      </Typography>
    </Card>
  );

  const renderEquipmentChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={equipmentStats}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" name="Equipment Count" />
        <Bar dataKey="totalPower" fill="#82ca9d" name="Total Power (W)" />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Survey Dashboard
      </Typography>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Stats Grid */}
          <Grid item xs={12} md={3}>
            {renderStatsCard(
              'Total Surveys',
              stats.totalSurveys,
              'primary.main'
            )}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderStatsCard(
              'Completed Surveys',
              stats.completedSurveys,
              'success.main'
            )}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderStatsCard(
              'Draft Surveys',
              stats.draftSurveys,
              'warning.main'
            )}
          </Grid>
          <Grid item xs={12} md={3}>
            {renderStatsCard(
              'Average Daily Usage',
              `${stats.averageDailyUsage.toFixed(1)} kWh`,
              'info.main'
            )}
          </Grid>

          {/* Equipment Statistics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Equipment Statistics
                </Typography>
                {renderEquipmentChart()}
              </CardContent>
            </Card>
          </Grid>

          {/* Critical Equipment List */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Critical Equipment
                </Typography>
                <List>
                  {equipmentStats
                    .filter((stat) => stat.count > 0)
                    .map((stat) => (
                      <ListItem key={stat.category}>
                        <ListItemIcon>
                          <Chip
                            label={`${stat.count} items`}
                            color="primary"
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={stat.category}
                          secondary={`Total Power: ${stat.totalPower} W`}
                        />
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
