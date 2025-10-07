import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import EnergyAnalytics from '../components/EnergyAnalytics';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

interface EnergyData {
  dailyUsage: number;
  peakHours: number;
  equipment: Array<{
    name: string;
    power: number;
    hours: number;
    efficiency: number;
    critical: boolean;
  }>;
  latitude: number;
  longitude: number;
  location: string;
  solarPanelEfficiency: number;
  batteryEfficiency: number;
  gridAvailability: number;
}

interface CostAnalysis {
  pv: {
    initialCost: number;
    annualMaintenance: number;
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
    initialCost: number;
    annualMaintenance: number;
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
}

const EnergyDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CostAnalysis | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.post<CostAnalysis>(
          `${import.meta.env.VITE_API_URL}/api/techno-economic/analyze`,
          {
            dailyUsage: 1000, // Example data - should be from user input
            peakHours: 8,
            equipment: [
              { name: 'Pumps', power: 500, hours: 12, efficiency: 0.9, critical: true },
              { name: 'Lights', power: 200, hours: 6, efficiency: 0.85, critical: false },
            ],
            latitude: 37.7749, // Example coordinates
            longitude: -122.4194,
            location: 'San Francisco',
            solarPanelEfficiency: 0.18,
            batteryEfficiency: 0.9,
            gridAvailability: 0.85,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch energy analysis data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Energy System Analysis Dashboard
      </Typography>
      <EnergyAnalytics data={data} />
    </Box>
  );
};

export default EnergyDashboard;
