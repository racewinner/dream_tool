import { Box, Typography } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Facility {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  status: 'survey' | 'design' | 'installed';
}

const customMarker = new Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function Map() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities/coordinates');
      const data = await response.json();
      setFacilities(data);
      
      // Set map center to the first facility if available
      if (data.length > 0) {
        setCenter([data[0].latitude, data[0].longitude]);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  return (
    <Box sx={{ height: '600px', width: '100%' }}>
      <MapContainer center={center} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {facilities.map((facility) => (
          <Marker
            key={facility.id}
            position={[facility.latitude, facility.longitude]}
            icon={customMarker}
          >
            <Popup>
              <Typography variant="h6">{facility.name}</Typography>
              <Typography>Status: {facility.status}</Typography>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
