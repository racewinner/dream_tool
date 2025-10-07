import React, { useState, useEffect } from 'react';
import { Select, message } from 'antd';
// Temporarily using div instead of Card due to Antd typing issues
import { useApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
// import { SolarSystem } from '../types/solarSystem';

// Temporary type definition until SolarSystem export is fixed
interface SolarSystem {
  id: number;
  model: string;
  capacityKw: number;
}

const { Option } = Select;

const SystemSelection: React.FC = () => {
  const [solarSystems, setSolarSystems] = useState<SolarSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useApi(null);
  const auth = useAuth();

  useEffect(() => {
    fetchSolarSystems();
  }, []);

  const fetchSolarSystems = async () => {
    try {
      setLoading(true);
      const systems = await api.getSystems();
      setSolarSystems(systems);
    } catch (error) {
      message.error('Failed to fetch solar systems');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSelect = async (systemId: number) => {
    try {
      auth.selectSystem(systemId);
      message.success('System selected successfully');
    } catch (error) {
      message.error('Failed to select system');
    }
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
      <h3 style={{ marginBottom: '16px' }}>System Selection</h3>
      <select
        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
        onChange={(e) => handleSystemSelect(Number(e.target.value))}
        defaultValue=""
      >
        <option value="" disabled>Select a solar system</option>
        {solarSystems.map((system) => (
          <option key={system.id} value={system.id}>
            {system.model} - {system.capacityKw} kW
          </option>
        ))}
      </select>
    </div>
  );
};

export default SystemSelection;
