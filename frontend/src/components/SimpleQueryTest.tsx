import React from 'react';

// Simple test component without React Query imports to verify basic functionality
const SimpleQueryTest: React.FC = () => {
  const [data, setData] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData('Test data loaded successfully!');
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Query Test (No React Query)</h2>
      
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {data && <div style={{ color: 'green' }}>Data: {data}</div>}
      
      <button onClick={fetchData} disabled={loading}>
        Refresh Data
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        This component tests basic React functionality without React Query imports.
        If this works, the issue is specifically with React Query integration.
      </div>
    </div>
  );
};

export default SimpleQueryTest;
