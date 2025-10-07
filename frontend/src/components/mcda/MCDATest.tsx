/**
 * Simple test component to verify MCDA imports work
 */

import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const MCDATest: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          MCDA Test Page
        </Typography>
        <Typography variant="body1">
          This is a simple test to verify MCDA components are working correctly.
        </Typography>
      </Box>
    </Container>
  );
};

export default MCDATest;
