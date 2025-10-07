import React, { useState } from 'react';
import { Box, Button, Typography, Container, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const { user, error, loading } = useAuth();
  const [secret, setSecret] = useState<string | null>(null);
  // The otpauthUrl is what we directly use with QRCode component
  // No need for separate qrCode state as it caused type confusion
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  const setup2FA = async () => {
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup 2FA');
      }

      setSecret(data.secret);
      // We only need otpauthUrl for the QR code display
      // The qrCode field from API isn't needed anymore
      setOtpauthUrl(data.otpauthUrl);
      setRecoveryCodes(data.recoveryCodes);
    } catch (err: any) {
      setVerificationError(err.message);
    }
  };

  const verify2FA = async () => {
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ token: verificationToken }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification token');
      }

      setVerificationSuccess(true);
      navigate('/dashboard');
    } catch (err: any) {
      setVerificationError(err.message);
    }
  };

  React.useEffect(() => {
    if (!user?.is2faEnabled) {
      setup2FA();
    } else {
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
          Two-Factor Authentication Setup
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
            Two-Factor Authentication enabled successfully! Please keep your recovery codes safe.
          </Alert>
        ) : (
          <Box sx={{ mt: 2, width: '100%' }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                {secret && (
                  <>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Scan this QR code with your authenticator app:
                    </Typography>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      {/* Use proper type guard to ensure otpauthUrl is string */}
                      {otpauthUrl ? <QRCodeCanvas value={otpauthUrl} size={256} /> : <CircularProgress />}
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Or enter this secret manually: {secret}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Enter the verification code from your authenticator app:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <input
                        type="text"
                        value={verificationToken}
                        onChange={(e) => setVerificationToken(e.target.value)}
                        placeholder="Enter verification code"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                        }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={verify2FA}
                      disabled={verificationToken.length !== 6}
                      sx={{ mb: 2 }}
                    >
                      Verify
                    </Button>
                    <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                      Recovery Codes
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Keep these recovery codes safe in case you lose access to your authenticator app:
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                      {recoveryCodes.map((code, index) => (
                        <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                          {code}
                        </Typography>
                      ))}
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
