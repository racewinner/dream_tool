import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Typography } from '@mui/material';
import theme from './theme';

const HomePage: React.FC = () => (
  <Container maxWidth="lg" sx={{ mt: 4 }}>
    <Typography variant="h3" color="primary" gutterBottom>
      DREAM TOOL - Minimal Test
    </Typography>
    <Typography variant="body1">
      If you can see this text, the React app is working!
    </Typography>
  </Container>
);

const MinimalApp: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default MinimalApp;
