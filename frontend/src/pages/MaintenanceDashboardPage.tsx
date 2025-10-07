import React from 'react';
import MaintenanceDashboard from '../components/MaintenanceDashboard';
import MaintenanceSchedule from '../components/MaintenanceSchedule';
import MaintenanceAnalytics from '../components/MaintenanceAnalytics';
import SystemSelection from '../components/SystemSelection';

const MaintenanceDashboardPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <SystemSelection />
      </div>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 50%' }}>
          <MaintenanceSchedule />
        </div>
        <div style={{ flex: '1 1 50%' }}>
          <MaintenanceAnalytics />
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <MaintenanceDashboard />
      </div>
    </div>
  );
};

export default MaintenanceDashboardPage;
