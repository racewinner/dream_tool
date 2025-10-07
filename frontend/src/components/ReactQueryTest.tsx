import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// Test component using real React Query via our adapter
const ReactQueryTest: React.FC = () => {
  // Use the real useQuery hook from our adapter
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['test-query'],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `React Query is working! Last fetch: ${new Date().toLocaleTimeString()}`;
    },
    // Configure query behavior
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // 30 seconds
  });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>React Query Test (Simulated)</h1>
      
      <div style={{ 
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>Status</h3>
        {isLoading && <div style={{ color: 'blue' }}>Loading...</div>}
        {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
        {data && <div style={{ color: 'green' }}>Data: {data}</div>}
        
        <button 
          onClick={() => refetch()}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
        <h3>React Query Integration Note</h3>
        <p>
          This is a simplified implementation that <strong>simulates</strong> React Query's behavior 
          using React's built-in hooks. The actual React Query v5 integration is facing TypeScript 
          compatibility issues that are being resolved.
        </p>
        <p>
          Key features simulated:
        </p>
        <ul>
          <li>Data fetching</li>
          <li>Loading state</li>
          <li>Error handling</li>
          <li>Refetch functionality</li>
          <li>Automatic refetch interval</li>
        </ul>
      </div>
    </div>
  );
};

export default ReactQueryTest;
