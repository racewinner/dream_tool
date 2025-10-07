import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

interface KoboConfig {
  baseUrl: string;
  apiToken: string;
  formId: string;
}

interface KoboForm {
  uid: string;
  name: string;
  asset_type: string;
  date_created: string;
  date_modified: string;
  deployment__submission_count: number;
}

interface ConnectionStatus {
  connected: boolean;
  message: string;
  forms?: KoboForm[];
}

const KoboConfigurationPanelFixed: React.FC = () => {
  const [config, setConfig] = useState<KoboConfig>({
    baseUrl: 'https://kf.kobotoolbox.org',
    apiToken: '',
    formId: '',
  });
  
  const [activeStep, setActiveStep] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [availableForms, setAvailableForms] = useState<KoboForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load saved configuration on component mount
  useEffect(() => {
    try {
      loadSavedConfig();
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError('Failed to load configuration');
    }
  }, []);

  const loadSavedConfig = () => {
    try {
      const savedConfig = localStorage.getItem('kobo_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        if (parsed.apiToken) {
          setActiveStep(1);
        }
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
      setError('Failed to load saved configuration');
    }
  };

  const saveConfig = (newConfig: KoboConfig) => {
    try {
      localStorage.setItem('kobo_config', JSON.stringify(newConfig));
      setConfig(newConfig);
      setError(null);
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Failed to save configuration');
    }
  };

  const handleConfigChange = (field: keyof KoboConfig, value: string) => {
    try {
      const newConfig = { ...config, [field]: value };
      saveConfig(newConfig);
    } catch (error) {
      console.error('Error updating config:', error);
      setError('Failed to update configuration');
    }
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
    setError(null);
    
    try {
      // Call Python backend API for connection test
      const response = await fetch('/api/python/data-import/kobo/connection-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          baseUrl: config.baseUrl,
          apiToken: config.apiToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus({
          connected: true,
          message: result.message || 'Successfully connected to KoboToolbox!',
          forms: result.forms || [],
        });
        setAvailableForms(result.forms || []);
        setActiveStep(2);
      } else {
        setConnectionStatus({
          connected: false,
          message: result.message || 'Connection test failed',
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus({
        connected: false,
        message: error instanceof Error ? error.message : 'Connection test failed. Please check your credentials.',
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
      label: 'Select Form',
      description: 'Choose your survey form for data import',
    },
  ];

  // Error boundary wrapper
  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Configuration Error</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
          <Button 
            variant="outlined" 
            onClick={() => {
              setError(null);
              loadSavedConfig();
            }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              KoboToolbox Configuration
            </Typography>
          </Box>
          <Tooltip title="Help & Setup Instructions">
            <IconButton onClick={() => setHelpDialogOpen(true)}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
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
                    Continue to Form Selection
                  </Button>
                </Box>
              )}
            </StepContent>
          </Step>

          {/* Step 3: Form Selection */}
          <Step>
            <StepLabel>Select Form</StepLabel>
            <StepContent>
              {availableForms.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Available Forms:
                  </Typography>
                  {availableForms.map((form) => (
                    <Card 
                      key={form.uid} 
                      variant="outlined" 
                      sx={{ 
                        mb: 1, 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        ...(config.formId === form.uid && { bgcolor: 'primary.light' })
                      }}
                      onClick={() => handleConfigChange('formId', form.uid)}
                    >
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="subtitle2">{form.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Submissions: {form.deployment__submission_count}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {config.formId && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body1">
                        🎉 Configuration complete! Ready to import data from KoboToolbox.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  No forms found. Please ensure your API token has access to forms.
                </Alert>
              )}
            </StepContent>
          </Step>
        </Stepper>

        {/* Help Dialog */}
        <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md">
          <DialogTitle>
            KoboToolbox Setup Instructions
          </DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Step 1: Get Your API Token
            </Typography>
            <Typography variant="body2" paragraph>
              1. Log into your KoboToolbox account<br />
              2. Click on your profile icon (top right)<br />
              3. Select "Account Settings"<br />
              4. Go to the "Security" tab<br />
              5. Find "API Token" section<br />
              6. Click "Generate Token" or copy existing token
            </Typography>

            <Typography variant="h6" gutterBottom>
              Step 2: Server URL
            </Typography>
            <Typography variant="body2" paragraph>
              • For KoboToolbox: https://kf.kobotoolbox.org<br />
              • For KoBo Humanitarian: https://kobo.humanitarianresponse.info<br />
              • For custom installations: Your custom server URL
            </Typography>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Privacy & Security:</strong> Your API token is stored locally in your browser 
                and is only used to connect to KoboToolbox. We never store your credentials on our servers.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHelpDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default KoboConfigurationPanelFixed;
