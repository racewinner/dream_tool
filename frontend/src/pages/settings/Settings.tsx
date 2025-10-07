import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Divider,
  FormGroup,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  AccountCircle as AccountCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';

/**
 * Settings Page - Global application settings and configuration
 */
const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  // Set active tab based on URL
  useEffect(() => {
    const tabFromUrl = location.pathname.split('/').pop();
    const tabIndex = tabFromUrl === 'profile' ? 0 :
                    tabFromUrl === 'security' ? 1 :
                    tabFromUrl === 'notifications' ? 2 :
                    tabFromUrl === 'data' ? 3 : 0;
    setActiveTab(tabIndex);
  }, [location]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSuccess('Profile updated successfully');
      setLoading(false);
    }, 1000);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const tabPath = ['profile', 'security', 'notifications', 'data'][newValue] || '';
    navigate(`/settings/${tabPath}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Settings
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<AccountCircleIcon />}
          onClick={() => navigate('/settings/profile')}
        >
          View Profile
        </Button>
      </Box>
      
      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Sidebar Navigation */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ mb: { xs: 3, md: 0 } }}>
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={activeTab}
              onChange={handleTabChange}
              sx={{ 
                '& .MuiTabs-indicator': {
                  left: 0,
                  right: 'auto',
                  width: 4,
                  backgroundColor: 'primary.main',
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  alignItems: 'flex-start',
                  padding: '12px 24px',
                  minHeight: 48,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                },
              }}
            >
              <Tab 
                icon={<PersonIcon />} 
                iconPosition="start"
                label={
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body1">Profile</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Personal information
                    </Typography>
                  </Box>
                } 
              />
              <Tab 
                icon={<SecurityIcon />} 
                iconPosition="start"
                label={
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body1">Security</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Password, 2FA, sessions
                    </Typography>
                  </Box>
                } 
              />
              <Tab 
                icon={<NotificationsIcon />} 
                iconPosition="start"
                label={
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body1">Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Email, push notifications
                    </Typography>
                  </Box>
                } 
              />
              <Tab 
                icon={<StorageIcon />} 
                iconPosition="start"
                label={
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body1">Data & Storage</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Storage usage, data export
                    </Typography>
                  </Box>
                } 
              />
            </Tabs>
          </Paper>
        </Grid>
        
        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Profile Tab */}
          {activeTab === 0 && (
            <Paper sx={{ p: 4, minHeight: '60vh' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Profile Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleInputChange}
                    margin="normal"
                    disabled
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Security Settings */}
          {activeTab === 1 && (
            <Paper sx={{ p: 4, minHeight: '60vh' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Security Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Password
              </Typography>
              <TextField 
                fullWidth 
                label="Current Password" 
                type="password" 
                margin="normal"
                sx={{ mb: 2 }}
              />
              <TextField 
                fullWidth 
                label="New Password" 
                type="password" 
                margin="normal"
                sx={{ mb: 2 }}
              />
              <TextField 
                fullWidth 
                label="Confirm New Password" 
                type="password" 
                margin="normal"
                sx={{ mb: 3 }}
              />
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<SaveIcon />}
              >
                Update Password
              </Button>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Two-Factor Authentication
              </Typography>
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel 
                  control={<Switch />} 
                  label="Enable two-factor authentication" 
                />
              </FormGroup>
              
              <Button 
                variant="outlined" 
                sx={{ mb: 4 }}
              >
                Configure Two-Factor
              </Button>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                Session Management
              </Typography>
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Automatically log out after 30 minutes of inactivity" 
                />
              </FormGroup>
              
              <Button 
                variant="outlined" 
                color="error"
              >
                Log Out of All Devices
              </Button>
            </Paper>
          )}

          {/* Notifications Settings */}
          {activeTab === 2 && (
            <Paper sx={{ p: 4, minHeight: '60vh' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <NotificationsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Notification Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Email Notifications
              </Typography>
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="System alerts" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Maintenance updates" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Weekly reports" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Data import results" 
                />
              </FormGroup>
              
              <Typography variant="subtitle1" gutterBottom>
                In-App Notifications
              </Typography>
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="System alerts" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Maintenance updates" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="User mentions" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Data updates" 
                />
              </FormGroup>
              
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<SaveIcon />}
              >
                Save Notification Preferences
              </Button>
            </Paper>
          )}
          
          {/* Data & Storage Settings */}
          {activeTab === 3 && (
            <Paper sx={{ p: 4, minHeight: '60vh' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Data & Storage
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Data Management
              </Typography>
              <List sx={{ mb: 3 }}>
                <ListItem>
                  <ListItemText 
                    primary="Survey Data" 
                    secondary={`${Math.round(Math.random() * 20)} GB · Last import: ${new Date().toLocaleDateString()}`} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end">
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="System Logs" 
                    secondary={`${(Math.random() * 5).toFixed(1)} GB · Auto-cleanup after 90 days`} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end">
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              
              <Typography variant="subtitle1" gutterBottom>
                Storage Settings
              </Typography>
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Automatically clean up old data" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Compress reports and exports" 
                />
              </FormGroup>
              
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<SaveIcon />}
              >
                Save Storage Settings
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings;
