import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Link,
  CircularProgress,
  Alert,
  Collapse,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [formError, setFormError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    
    // Simple validation
    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both email and password');
      return;
    }

    if (show2FA && !otp.trim()) {
      setFormError('Please enter your 2FA code');
      return;
    }

    try {
      await login(email, password, show2FA ? otp : undefined);
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Check if 2FA is required
      if (err.message?.includes('2FA') || err.message?.includes('two-factor')) {
        setShow2FA(true);
        setFormError('Please enter your 2FA authentication code');
      } else {
        setFormError(err.message || 'Login failed. Please check your credentials and try again.');
      }
    }
  };

  const handleResend2FA = async () => {
    // This would typically call a resend 2FA endpoint
    setSuccessMessage('2FA code resent to your device');
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
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Sign In
          </Typography>
          
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Welcome back to DREAM TOOL
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {(formError || error) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError || error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus={!show2FA}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Collapse in={show2FA}>
              <TextField
                margin="normal"
                required={show2FA}
                fullWidth
                name="otp"
                label="2FA Authentication Code"
                type="text"
                id="otp"
                autoComplete="one-time-code"
                autoFocus={show2FA}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                placeholder="Enter 6-digit code"
                inputProps={{ maxLength: 6 }}
                helperText="Enter the 6-digit code from your authenticator app"
              />
              
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleResend2FA}
                  disabled={loading}
                >
                  Resend Code
                </Button>
              </Box>
            </Collapse>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : show2FA ? (
                'Verify & Sign In'
              ) : (
                'Sign In'
              )}
            </Button>

            <Grid container>
              <Grid item xs>
                <Link component={RouterLink} to="/password-reset" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>

            {show2FA && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setShow2FA(false);
                    setOtp('');
                    setFormError('');
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
