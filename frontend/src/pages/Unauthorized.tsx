import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography component="h2" variant="h6" align="center" color="text.secondary" paragraph>
          You do not have permission to access this page.
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          {user ? (
            <>
              Your current role is {user.role}. Please contact your administrator for access.
            </>
          ) : (
            <>
              You need to be logged in to access this page. Please log in with the correct credentials.
            </>
          )}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={navigateToDashboard}
          sx={{ mt: 3 }}
        >
          Return to Dashboard
        </Button>
      </Box>
    </Container>
  );
}
