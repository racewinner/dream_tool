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
  CircularProgress,
  Alert,
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
import { useNavigate, useParams } from 'react-router-dom';

interface WeatherData {
  date: string;
  temperature: number;
  humidity: number;
  solarRadiation: number;
  precipitation: number;
}

interface SolarAnalysisResult {
  dailyEnergyProduction: number;
  monthlyEnergyProduction: number[];
  yearlyEnergyProduction: number;
  optimalTiltAngle: number;
  optimalOrientation: string;
  temperatureImpact: number;
  shadingImpact: number;
  systemEfficiency: number;
}

export default function WeatherAnalysis() {
  const navigate = useNavigate();
  const { facilityId } = useParams();
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [solarAnalysis, setSolarAnalysis] = useState<SolarAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, [facilityId]);

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(`/api/weather/${facilityId}`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      setWeatherData(data);
      
      // Fetch solar analysis
      const solarResponse = await fetch(`/api/weather/${facilityId}/solar-analysis`);
      if (solarResponse.ok) {
        const solarData = await solarResponse.json();
        setSolarAnalysis(solarData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderWeatherChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={weatherData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="temperature" fill="#8884d8" name="Temperature (°C)" />
        <Bar dataKey="solarRadiation" fill="#82ca9d" name="Solar Radiation (W/m²)" />
        <Bar dataKey="precipitation" fill="#ffc658" name="Precipitation (%)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderSolarAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Solar Production Analysis
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Chip label="Daily" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Average Daily Production"
                  secondary={`${solarAnalysis?.dailyEnergyProduction?.toFixed(1)} kWh`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Chip label="Yearly" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Yearly Production"
                  secondary={`${solarAnalysis?.yearlyEnergyProduction?.toFixed(1)} kWh`}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Optimization
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Chip label="Tilt" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Optimal Tilt Angle"
                  secondary={`${solarAnalysis?.optimalTiltAngle}°`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Chip label="Orientation" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Optimal Orientation"
                  secondary={solarAnalysis?.optimalOrientation}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Production
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Jan', value: solarAnalysis?.monthlyEnergyProduction?.[0] || 0 },
                { name: 'Feb', value: solarAnalysis?.monthlyEnergyProduction?.[1] || 0 },
                { name: 'Mar', value: solarAnalysis?.monthlyEnergyProduction?.[2] || 0 },
                { name: 'Apr', value: solarAnalysis?.monthlyEnergyProduction?.[3] || 0 },
                { name: 'May', value: solarAnalysis?.monthlyEnergyProduction?.[4] || 0 },
                { name: 'Jun', value: solarAnalysis?.monthlyEnergyProduction?.[5] || 0 },
                { name: 'Jul', value: solarAnalysis?.monthlyEnergyProduction?.[6] || 0 },
                { name: 'Aug', value: solarAnalysis?.monthlyEnergyProduction?.[7] || 0 },
                { name: 'Sep', value: solarAnalysis?.monthlyEnergyProduction?.[8] || 0 },
                { name: 'Oct', value: solarAnalysis?.monthlyEnergyProduction?.[9] || 0 },
                { name: 'Nov', value: solarAnalysis?.monthlyEnergyProduction?.[10] || 0 },
                { name: 'Dec', value: solarAnalysis?.monthlyEnergyProduction?.[11] || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Weather and Solar Analysis
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weather Data
              </Typography>
              {renderWeatherChart()}
            </CardContent>
          </Card>

          {solarAnalysis && renderSolarAnalysis()}
        </>
      )}
    </Box>
  );
}
