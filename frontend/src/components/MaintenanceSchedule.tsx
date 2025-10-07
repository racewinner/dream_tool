import React, { useState, useEffect } from 'react';
import { Calendar, message } from 'antd';
import { Card, CircularProgress, Typography } from '@mui/material';
import { useApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MaintenanceRecord } from '../types/solarSystem';

interface Event {
  title: string;
  description: string;
  type: string;
  color: string;
}

interface CellProps {
  value: Date;
  events: Event[];
}

const MaintenanceSchedule: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useApi(null);
  const auth = useAuth();

  useEffect(() => {
    fetchMaintenanceSchedule();
  }, []);

  const fetchMaintenanceSchedule = async () => {
    try {
      setLoading(true);
      const records = await api.getMaintenanceHistory(auth.selectedSystemId!);
      const events = records.map((record: MaintenanceRecord) => ({
        title: record.maintenanceType,
        description: record.maintenanceDescription,
        type: record.maintenanceType,
        color: record.maintenanceStatus === 'PENDING' ? '#108ee9' :
               record.maintenanceStatus === 'IN_PROGRESS' ? '#87d068' :
               record.maintenanceStatus === 'COMPLETED' ? '#2db7f5' : '#f50',
      }));
      setEvents(events);
    } catch (error) {
      message.error('Failed to fetch maintenance schedule');
    } finally {
      setLoading(false);
    }
  };

  const getListData = (value: Date): Event[] => {
    const date = value.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.title).toISOString().split('T')[0];
      return eventDate === date;
    });
  };

  const dateCellRender = (value: Date) => {
    const listData = getListData(value);
    return (
      <div style={{ height: '100%' }}>
        <ul className="events">
          {listData.map((item, index) => (
            <li key={index}>
              <div className="event-item" style={{ color: item.color }}>
                <span className="event-title">{item.title}</span>
                <span className="event-description">{item.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Maintenance Schedule
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Calendar
          dateCellRender={dateCellRender}
          style={{ width: '100%' }}
        />
      )}
    </Card>
  );
};

export default MaintenanceSchedule;
