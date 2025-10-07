import React, { useState, useEffect } from 'react';
import { Card, Paper } from '@mui/material';
import { useApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MaintenanceRecordRequest } from '../types/solarSystem';

// Extend the SystemStatus interface with missing properties
interface SystemStatus {
  operational: boolean;
  maintenanceRequired: boolean;
  performance: number;
  alerts: string[];
  maintenanceSchedule: {
    nextMaintenance: string;
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    lastMaintenance: string;
    overdue: boolean;
    upcoming: boolean;
  };
  // Add missing properties
  healthScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  upcomingMaintenance: boolean;
  systemMetrics: {
    efficiency: number;
    output: number;
  };
  recentIssues: string[];
}

interface MaintenanceRecord extends MaintenanceRecordRequest {
  id: number;
  maintenanceDate: string;
  maintenanceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

const MaintenanceDashboard: React.FC = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<MaintenanceRecordRequest>>({});
  const api = useApi(null);
  const auth = useAuth();

  useEffect(() => {
    fetchMaintenanceRecords();
    fetchSystemStatus();
  }, []);

  const fetchMaintenanceRecords = async () => {
    try {
      const records = await api.getMaintenanceHistory(auth.selectedSystemId!);
      setMaintenanceRecords(records);
    } catch (error) {
      alert('Failed to fetch maintenance records');
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const solarSystem = await api.getSystem(auth.selectedSystemId!);
      
      // Convert SolarSystemResponse to SystemStatus
      const systemStatus: SystemStatus = {
        operational: solarSystem.status === 'ACTIVE',
        maintenanceRequired: solarSystem.status === 'MAINTENANCE',
        performance: solarSystem.performanceMetrics?.efficiency || 0,
        alerts: [],
        maintenanceSchedule: {
          nextMaintenance: solarSystem.nextMaintenanceDate,
          frequency: solarSystem.maintenanceFrequency,
          lastMaintenance: solarSystem.lastMaintenanceDate,
          overdue: new Date(solarSystem.nextMaintenanceDate) < new Date(),
          upcoming: false
        },
        // Add values for missing properties
        healthScore: 85,
        riskLevel: 'LOW',
        upcomingMaintenance: false,
        systemMetrics: {
          efficiency: solarSystem.performanceMetrics?.efficiency || 0,
          output: solarSystem.performanceMetrics?.dailyGeneration || 0
        },
        recentIssues: []
      };
      
      setSystemStatus(systemStatus);
    } catch (error) {
      alert('Failed to fetch system status');
    }
  };

  const handleAddRecord = async (values: MaintenanceRecordRequest) => {
    try {
      const newRecord = await api.createMaintenanceRecord(auth.selectedSystemId!, values);
      alert('Maintenance record added successfully');
      setMaintenanceRecords([...maintenanceRecords, newRecord]);
      setIsModalVisible(false);
    } catch (error) {
      alert('Failed to add maintenance record');
    }
  };

  const handleUpdateRecord = async (recordId: number, values: MaintenanceRecordRequest) => {
    try {
      await api.updateMaintenanceRecord(auth.selectedSystemId!, recordId, values);
      alert('Maintenance record updated successfully');
      fetchMaintenanceRecords();
    } catch (error) {
      alert('Failed to update maintenance record');
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    try {
      await api.deleteMaintenanceRecord(auth.selectedSystemId!, recordId);
      alert('Maintenance record deleted successfully');
      setMaintenanceRecords(
        maintenanceRecords.filter(record => record.id !== recordId)
      );
    } catch (error) {
      alert('Failed to delete maintenance record');
    }
  };

  const handleViewRecord = (record: MaintenanceRecord) => {
    // View record logic
    alert(`Viewing maintenance record: ${record.id}`);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>System Status</h2>
        {systemStatus ? (
          <div>
            <p>Status: {systemStatus.operational ? 'Operational' : 'Non-operational'}</p>
            <p>Maintenance Required: {systemStatus.maintenanceRequired ? 'Yes' : 'No'}</p>
            <p>Performance: {systemStatus.performance}%</p>
            <p>Next Scheduled Maintenance: {systemStatus.maintenanceSchedule.nextMaintenance}</p>
          </div>
        ) : (
          <p>Loading system status...</p>
        )}
      </div>

      <div style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>Maintenance Records</h2>
          <button 
            style={{ padding: '8px 16px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
            onClick={() => setIsModalVisible(true)}
          >
            Add Record
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px', borderBottom: '1px solid #e8e8e8', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e8e8e8', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e8e8e8', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e8e8e8', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e8e8e8', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRecords.map(record => (
              <tr key={record.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #e8e8e8' }}>{record.maintenanceDate}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e8e8e8' }}>{record.maintenanceType}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e8e8e8' }}>{record.maintenanceDescription}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e8e8e8' }}>{record.maintenanceStatus}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e8e8e8' }}>
                  <button 
                    style={{ marginRight: '8px', background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                    onClick={() => handleViewRecord(record)}
                  >
                    View
                  </button>
                  <button 
                    style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                    onClick={() => handleUpdateRecord(record.id, record)}
                  >
                    Update
                  </button>
                  <button 
                    style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                    onClick={() => handleDeleteRecord(record.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '4px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Add Maintenance Record</h2>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
                onClick={() => setIsModalVisible(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const values: MaintenanceRecordRequest = {
                solarSystemId: auth.selectedSystemId!,
                maintenanceType: formData.get('maintenanceType') as any,
                maintenanceDescription: formData.get('maintenanceDescription') as string,
                maintenanceCost: Number(formData.get('maintenanceCost')),
                laborHours: Number(formData.get('laborHours')),
                partsReplaced: [],
                nextMaintenanceDate: new Date().toISOString(),
                maintenanceReport: '',
                attachments: [],
                preventiveTasks: [],
                correctiveActions: [],
                systemImpact: 'MINOR',
                downtimeHours: 0,
                preventiveMaintenance: formData.get('preventiveMaintenance') === 'on'
              };
              handleAddRecord(values);
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Maintenance Type*</label>
                <select 
                  name="maintenanceType"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '2px' }}
                  defaultValue="ROUTINE"
                  required
                >
                  <option value="ROUTINE">Routine</option>
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="PREVENTIVE">Preventive</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="SEASONAL">Seasonal</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Description*</label>
                <textarea 
                  name="maintenanceDescription"
                  rows={4}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '2px' }}
                  required
                ></textarea>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Cost*</label>
                <input 
                  type="number"
                  name="maintenanceCost"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '2px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Labor Hours*</label>
                <input 
                  type="number"
                  name="laborHours"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '2px' }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Downtime Hours</label>
                <input 
                  type="number"
                  name="downtimeHours"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '2px' }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" name="preventiveMaintenance" defaultChecked />
                  <span style={{ marginLeft: '8px' }}>Is this preventive maintenance?</span>
                </label>
              </div>
              
              <button 
                type="submit"
                style={{ padding: '8px 16px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceDashboard;
