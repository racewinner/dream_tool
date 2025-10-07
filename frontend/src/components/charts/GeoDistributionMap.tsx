import React, { useEffect, useRef } from 'react';
import { Paper, Typography, CircularProgress, Box } from '@mui/material';
import { GeoDataPoint } from '../../services/visualizationService';
import { useTheme } from '@mui/material/styles';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoDistributionMapProps {
  data: GeoDataPoint[];
  title?: string;
  loading?: boolean;
  error?: string;
  height?: number;
}

/**
 * Component for visualizing geographical distribution
 */
const GeoDistributionMap: React.FC<GeoDistributionMapProps> = ({
  data,
  title = 'Geographical Distribution',
  loading = false,
  error,
  height = 400
}) => {
  const theme = useTheme();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize map only after data is loaded
    if (loading || error || !data.length || !mapContainerRef.current) {
      return;
    }

    // If map already initialized, clean it up
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([0, 0], 2);
    mapRef.current = map;

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Create bounds to fit all markers
    const bounds = L.latLngBounds([]);

    // Add markers for each data point
    data.forEach(point => {
      // Create marker
      const marker = L.circleMarker(
        [point.latitude, point.longitude],
        {
          radius: Math.max(5, Math.min(15, Math.sqrt(point.value) * 2)), // Scale radius based on value
          fillColor: point.color || theme.palette.primary.main,
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }
      ).addTo(map);

      // Add popup
      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif;">
          <strong>${point.label}</strong><br/>
          ${point.value} ${point.value === 1 ? 'survey' : 'surveys'}
        </div>
      `);

      // Extend bounds to include this marker
      bounds.extend([point.latitude, point.longitude]);
    });

    // Fit map to bounds if we have points
    if (data.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    // Clean up map on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data, loading, error, theme]);

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: height + 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: height + 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (!data.length) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: height + 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="textSecondary">No location data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Box 
        ref={mapContainerRef} 
        sx={{ 
          height, 
          width: '100%', 
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      />
    </Paper>
  );
};

export default GeoDistributionMap;
