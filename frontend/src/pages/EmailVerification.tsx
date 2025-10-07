import React, { useState } from 'react';
import { Box, Button, Typography, Container, Alert, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error, loading } = useAuth();
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const token = new URLSearchParams(location.search).get('token');

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/auth/email-verification', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerificationSuccess(true);
      navigate('/login');
    } catch (err: any) {
      setVerificationError(err.message);
    }
  };

  React.useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      navigate('/login');
    }
  }, [token, navigate]);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Verify Email
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        {verificationError && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {verificationError}
          </Alert>
        )}

        {verificationSuccess ? (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            Email verified successfully! You can now log in.
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <Typography variant="body1" sx={{ mt: 2 }}>
                Verifying your email address...
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
