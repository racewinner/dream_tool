import React, { useState } from 'react';
import { Box, Button, Typography, Container, Alert, CircularProgress, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function TwoFactorDisable() {
  const navigate = useNavigate();
  const { user, error, loading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disableSuccess, setDisableSuccess] = useState(false);

  const disable2FA = async () => {
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentPassword,
          recoveryCode
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setDisableSuccess(true);
      navigate('/dashboard');
    } catch (err: any) {
      setDisableError(err.message);
    }
  };

  React.useEffect(() => {
    if (!user?.is2faEnabled) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
          Disable Two-Factor Authentication
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        {disableError && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {disableError}
          </Alert>
        )}

        {disableSuccess ? (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            Two-Factor Authentication disabled successfully!
          </Alert>
        ) : (
          <Box sx={{ mt: 2, width: '100%' }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  To disable 2FA, please enter your current password and a recovery code:
                </Typography>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Recovery Code"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={disable2FA}
                  disabled={!currentPassword || !recoveryCode}
                  sx={{ mb: 2 }}
                >
                  Disable 2FA
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
