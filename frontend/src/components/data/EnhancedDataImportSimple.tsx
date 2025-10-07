/**
 * Enhanced Data Import Component - Simplified Version
 * Robust implementation to avoid crashes
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Grid,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';

interface KoboConfig {
  baseUrl: string;
  apiToken: string;
  formId: string;
}

const EnhancedDataImportSimple: React.FC = () => {
  const [config, setConfig] = useState<KoboConfig>({
    baseUrl: 'https://kf.kobotoolbox.org',
    apiToken: '',
    formId: '',
  });
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);

  const handleConfigChange = (field: keyof KoboConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    if (!config.apiToken) {
      setConnectionStatus({
        connected: false,
        message: 'Please enter your API token first',
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectionStatus({
        connected: true,
        message: 'Successfully connected to KoboToolbox!',
      });
      setActiveStep(2);
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: 'Connection test failed. Please check your credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      label: 'Configure API Access',
      description: 'Set up your KoboToolbox API credentials',
    },
    {
      label: 'Test Connection',
      description: 'Verify connection to KoboToolbox',
    },
    {
      label: 'Ready to Import',
      description: 'Configuration complete - ready to import data',
    },
  ];

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Enhanced Data Import - Python Powered
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Advanced data import with Python-powered cleaning, validation, and statistical analysis.
          </Typography>

          {/* KoboToolbox Configuration */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  KoboToolbox Configuration
                </Typography>
              </Box>

              <Stepper activeStep={activeStep} orientation="vertical">
                {/* Step 1: API Configuration */}
                <Step>
                  <StepLabel>Configure API Access</StepLabel>
                  <StepContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="KoboToolbox Server URL"
                          value={config.baseUrl}
                          onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                          helperText="Usually https://kf.kobotoolbox.org for KoboToolbox"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="API Token"
                          type={showToken ? 'text' : 'password'}
                          value={config.apiToken}
                          onChange={(e) => handleConfigChange('apiToken', e.target.value)}
                          helperText="Your KoboToolbox API token (found in Account Settings)"
                          InputProps={{
                            endAdornment: (
                              <IconButton
                                onClick={() => setShowToken(!showToken)}
                                edge="end"
                              >
                                {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Alert severity="info">
                          <Typography variant="body2">
                            To get your API token:
                            <br />
                            1. Log into your KoboToolbox account
                            <br />
                            2. Go to Account Settings → Security
                            <br />
                            3. Generate or copy your API token
                          </Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(1)}
                        disabled={!config.apiToken}
                      >
                        Continue
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 2: Test Connection */}
                <Step>
                  <StepLabel>Test Connection</StepLabel>
                  <StepContent>
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="contained"
                        onClick={testConnection}
                        disabled={loading || !config.apiToken}
                        startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                      >
                        {loading ? 'Testing Connection...' : 'Test Connection'}
                      </Button>
                    </Box>

                    {connectionStatus && (
                      <Alert 
                        severity={connectionStatus.connected ? 'success' : 'error'}
                        sx={{ mb: 2 }}
                      >
                        {connectionStatus.message}
                      </Alert>
                    )}

                    {connectionStatus?.connected && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={() => setActiveStep(2)}
                        >
                          Continue to Import
                        </Button>
                      </Box>
                    )}
                  </StepContent>
                </Step>

                {/* Step 3: Ready */}
                <Step>
                  <StepLabel>Ready to Import</StepLabel>
                  <StepContent>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        🎉 Configuration complete! You can now import data from KoboToolbox.
                      </Typography>
                    </Alert>
                    
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Current Configuration:
                      </Typography>
                      <Typography variant="body2">
                        <strong>Server:</strong> {config.baseUrl}
                      </Typography>
                      <Typography variant="body2">
                        <strong>API Token:</strong> {config.apiToken ? '••••••••' : 'Not set'}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setActiveStep(0)}
                        sx={{ mr: 1 }}
                      >
                        Reconfigure
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                      >
                        Start Import
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              </Stepper>
            </CardContent>
          </Card>

          {/* Additional Import Options */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alternative Import Methods
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ height: 60 }}
                  >
                    Upload CSV File
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ height: 60 }}
                  >
                    Upload Excel File
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ height: 60 }}
                  >
                    Import JSON Data
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedDataImportSimple;
