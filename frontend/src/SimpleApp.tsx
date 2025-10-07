import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Typography, Box } from '@mui/material';
import theme from './theme';

const SimplePage: React.FC = () => (
  <Container maxWidth="lg" sx={{ mt: 4 }}>
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" color="primary" gutterBottom>
        🌞 DREAM TOOL - Solar PV Management
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        RBAC System Testing
      </Typography>
      <Typography variant="body1" paragraph>
        Frontend connection is working! This confirms the basic React application is functional.
      </Typography>
    </Box>
  </Container>
);

const SimpleApp: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="*" element={<SimplePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default SimpleApp;
