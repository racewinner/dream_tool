import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { GeographicalSite } from '../../services/surveyAnalyticsService';
import 'leaflet/dist/leaflet.css';

// Import leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface SurveyMapProps {
  sites: GeographicalSite[];
  loading?: boolean;
  error?: string | null;
  onSiteSelect?: (site: GeographicalSite | null) => void;
  selectedRegion?: string;
  selectedFacilityType?: string;
  selectedPowerSource?: string;
}

// Component to fit map bounds to markers
const FitBounds: React.FC<{ sites: GeographicalSite[] }> = ({ sites }) => {
  const map = useMap();
  
  useEffect(() => {
    if (sites.length > 0) {
      const bounds = new LatLngBounds(
        sites.map(site => [site.latitude, site.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [sites, map]);
  
  return null;
};

// Custom marker icons for different power sources
const getMarkerIcon = (powerSource: string): Icon => {
  const getMarkerColor = (source: string): string => {
    switch (source.toLowerCase()) {
      case 'national grid': return '#4CAF50'; // Green
      case 'generator': return '#FF9800'; // Orange  
      case 'solar': return '#FFC107'; // Amber
      case 'battery': return '#2196F3'; // Blue
      case 'no power': return '#F44336'; // Red
      default: return '#9E9E9E'; // Grey
    }
  };
  
  const color = getMarkerColor(powerSource);
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 19.4036 12.5 41 12.5 41S25 19.4036 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="${color}"/>
        <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      </svg>
    `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Get completeness color
const getCompletenessColor = (completeness: number): string => {
  if (completeness >= 80) return '#4CAF50'; // Green
  if (completeness >= 60) return '#FFC107'; // Amber
  if (completeness >= 40) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

const SurveyMap: React.FC<SurveyMapProps> = ({
  sites,
  loading = false,
  error = null,
  onSiteSelect,
  selectedRegion,
  selectedFacilityType,
  selectedPowerSource
}) => {
  const [filteredSites, setFilteredSites] = useState<GeographicalSite[]>(sites);

  // Apply filters
  useEffect(() => {
    let filtered = sites;
    
    if (selectedRegion) {
      filtered = filtered.filter(site => site.region === selectedRegion);
    }
    
    if (selectedFacilityType) {
      filtered = filtered.filter(site => site.facilityType === selectedFacilityType);
    }
    
    if (selectedPowerSource) {
      filtered = filtered.filter(site => site.powerSource === selectedPowerSource);
    }
    
    setFilteredSites(filtered);
  }, [sites, selectedRegion, selectedFacilityType, selectedPowerSource]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height: 500 }}>
        <Alert severity="error">
          Error loading map data: {error}
        </Alert>
      </Paper>
    );
  }

  if (filteredSites.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          No survey sites found with GPS coordinates
        </Typography>
      </Paper>
    );
  }

  // Default center (Somalia approximate center)
  const defaultCenter: [number, number] = [5.1521, 46.1996];
  const centerLat = filteredSites.reduce((sum, site) => sum + site.latitude, 0) / filteredSites.length;
  const centerLng = filteredSites.reduce((sum, site) => sum + site.longitude, 0) / filteredSites.length;
  const mapCenter: [number, number] = [centerLat || defaultCenter[0], centerLng || defaultCenter[1]];

  return (
    <Paper sx={{ height: 500, overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Survey Sites Map
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`${filteredSites.length} Sites`} 
            color="primary" 
            size="small" 
          />
          <Chip 
            label="🟢 National Grid" 
            size="small" 
            variant="outlined"
          />
          <Chip 
            label="🟠 Generator" 
            size="small" 
            variant="outlined"
          />
          <Chip 
            label="🟡 Solar" 
            size="small" 
            variant="outlined"
          />
          <Chip 
            label="🔴 No Power" 
            size="small" 
            variant="outlined"
          />
        </Box>
      </Box>
      
      <Box sx={{ height: 'calc(100% - 80px)' }}>
        <MapContainer
          center={mapCenter}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <FitBounds sites={filteredSites} />
          
          {filteredSites.map((site) => (
            <Marker
              key={site.id}
              position={[site.latitude, site.longitude]}
              icon={getMarkerIcon(site.powerSource)}
              eventHandlers={{
                click: () => onSiteSelect?.(site),
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {site.name}
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Location:</strong> {site.district}, {site.region}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Type:</strong> {site.facilityType}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Power Source:</strong> {site.powerSource}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Completeness:</strong>
                    </Typography>
                    <Chip
                      label={`${site.completeness}%`}
                      size="small"
                      sx={{
                        backgroundColor: getCompletenessColor(site.completeness),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary">
                    <strong>Last Survey:</strong> {site.lastSurveyDate}
                  </Typography>
                  
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    GPS: {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
};

export default SurveyMap;
