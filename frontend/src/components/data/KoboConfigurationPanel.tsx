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
  Link,
  Divider,
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
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { pythonDataService } from '../../services/pythonDataService';

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

const KoboConfigurationPanel: React.FC = () => {
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

  // Load saved configuration on component mount
  useEffect(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = () => {
    const savedConfig = localStorage.getItem('kobo_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        if (parsed.apiToken) {
          setActiveStep(1);
        }
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  };

  const saveConfig = (newConfig: KoboConfig) => {
    localStorage.setItem('kobo_config', JSON.stringify(newConfig));
    setConfig(newConfig);
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
      const response = await pythonDataService.testKoboConnection({
        baseUrl: config.baseUrl,
        apiToken: config.apiToken,
      });

      if (response.success) {
        setConnectionStatus({
          connected: true,
          message: 'Successfully connected to KoboToolbox!',
          forms: response.data.forms || [],
        });
        setAvailableForms(response.data.forms || []);
        setActiveStep(2);
      } else {
        setConnectionStatus({
          connected: false,
          message: response.message || 'Connection failed',
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        connected: false,
        message: error.message || 'Connection test failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof KoboConfig, value: string) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    // Auto-save configuration
    if (field === 'apiToken' && value) {
      saveConfig(newConfig);
    }
  };

  const selectForm = (formId: string) => {
    const newConfig = { ...config, formId };
    saveConfig(newConfig);
    setActiveStep(3);
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
      description: 'Choose which survey form to import data from',
    },
    {
      label: 'Ready to Import',
      description: 'Configuration complete - ready to import data',
    },
  ];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            KoboToolbox Configuration
          </Typography>
          <Tooltip title="Help & Documentation">
            <IconButton 
              size="small" 
              onClick={() => setHelpDialogOpen(true)}
              sx={{ ml: 1 }}
            >
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
                    helperText="Usually https://kf.kobotoolbox.org for KoboToolbox or your custom server URL"
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
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      To get your API token:
                      <br />
                      1. Log into your KoboToolbox account
                      <br />
                      2. Go to Account Settings → Security
                      <br />
                      3. Generate or copy your API token
                    </Typography>
                    <Link 
                      href="https://support.kobotoolbox.org/api.html" 
                      target="_blank" 
                      sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                    >
                      View KoboToolbox API Documentation
                      <LaunchIcon sx={{ ml: 0.5, fontSize: 16 }} />
                    </Link>
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

          {/* Step 3: Select Form */}
          <Step>
            <StepLabel>Select Survey Form</StepLabel>
            <StepContent>
              {availableForms.length > 0 ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Select the survey form you want to import data from:
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {availableForms.map((form) => (
                      <Grid item xs={12} key={form.uid}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            cursor: 'pointer',
                            border: config.formId === form.uid ? 2 : 1,
                            borderColor: config.formId === form.uid ? 'primary.main' : 'divider',
                            '&:hover': { borderColor: 'primary.main' }
                          }}
                          onClick={() => selectForm(form.uid)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <Box>
                                <Typography variant="h6">
                                  {form.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Form ID: {form.uid}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Created: {new Date(form.date_created).toLocaleDateString()}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Chip 
                                  label={`${form.deployment__submission_count} submissions`}
                                  size="small"
                                  color="primary"
                                />
                                {config.formId === form.uid && (
                                  <CheckIcon sx={{ color: 'success.main', ml: 1 }} />
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Alert severity="warning">
                  No forms found in your KoboToolbox account. Make sure you have created and deployed at least one survey form.
                </Alert>
              )}
            </StepContent>
          </Step>

          {/* Step 4: Ready */}
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
                  <strong>Form ID:</strong> {config.formId}
                </Typography>
                <Typography variant="body2">
                  <strong>Selected Form:</strong> {availableForms.find(f => f.uid === config.formId)?.name || 'Unknown'}
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
              </Box>
            </StepContent>
          </Step>
        </Stepper>

        {/* Help Dialog */}
        <Dialog 
          open={helpDialogOpen} 
          onClose={() => setHelpDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            KoboToolbox Integration Help
          </DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Getting Started with KoboToolbox
            </Typography>
            
            <Typography variant="body1" paragraph>
              KoboToolbox is a free, open-source suite of tools for field data collection. 
              This integration allows you to import survey data directly into DREAM Tool for analysis.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              How to Get Your API Token
            </Typography>
            
            <Box component="ol" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" paragraph>
                Visit <Link href="https://kf.kobotoolbox.org" target="_blank">kf.kobotoolbox.org</Link> and log into your account
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Click on your username in the top-right corner
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Select "Account Settings" from the dropdown menu
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Navigate to the "Security" tab
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Find the "API Token" section and copy your token
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Supported Data Types
            </Typography>
            
            <Typography variant="body2" paragraph>
              The DREAM Tool can import and analyze the following data from your KoboToolbox surveys:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">Facility information (name, type, location)</Typography>
              <Typography component="li" variant="body2">GPS coordinates and geographic data</Typography>
              <Typography component="li" variant="body2">Equipment inventories and specifications</Typography>
              <Typography component="li" variant="body2">Operational data (hours, staff, population served)</Typography>
              <Typography component="li" variant="body2">Energy consumption and infrastructure data</Typography>
            </Box>

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

export default KoboConfigurationPanel;
