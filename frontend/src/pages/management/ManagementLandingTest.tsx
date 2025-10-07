import React from 'react';

/**
 * Management Landing Page - SIMPLE TEST
 */
const ManagementLanding = () => {
  console.log('🚨 SIMPLE TEST MANAGEMENT COMPONENT - ' + Date.now());
  console.log('🚨 EXECUTING AT: ' + new Date().toISOString());
  
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#ff0000', 
      color: 'white', 
      fontSize: '24px',
      minHeight: '100vh'
    }}>
      <h1>🚨 TEST MANAGEMENT PAGE WORKS!</h1>
      <p>Timestamp: {new Date().toISOString()}</p>
      <p>Random ID: {Math.random()}</p>
    </div>
  );
};

export default ManagementLanding;
