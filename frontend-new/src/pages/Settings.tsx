import React, { useState } from 'react';

import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  TextField,
  Button,
  FormControlLabel,
  FormGroup,
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
  AlertColor,
  Snackbar,
  Grid,
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const SettingsPage: React.FC = () => {

  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'info' });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNotificationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({
      ...notifications,
      [event.target.name]: event.target.checked,
    });
  };

  const handleSaveProfile = () => {
    // Save profile logic here
    showSnackbar('Profile updated successfully', 'success');
  };

  const handleChangePassword = () => {
    // Change password logic here
    if (newPassword !== confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }
    showSnackbar('Password updated successfully', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveNotifications = () => {
    // Save notifications logic here
    showSnackbar('Notification preferences saved', 'success');
  };

  const handleDeleteAccount = () => {
    // Delete account confirmation logic
    showSnackbar('Account deletion initiated', 'warning');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Manage your account settings and preferences
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Profile" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
          <Tab label="Preferences" icon={<LanguageIcon />} iconPosition="start" />
        </Tabs>
        <Divider />

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 80, height: 80, mr: 3 }}
                  src="/path/to/avatar.jpg"
                />
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    component="label"
                    sx={{ mr: 2 }}
                  >
                    Upload Photo
                    <input type="file" hidden accept="image/*" />
                  </Button>
                  <Button color="error">Remove</Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Recommended size: 200x200 pixels. Max file size: 5MB
                  </Typography>
                </Box>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    defaultValue="John"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    defaultValue="Doe"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    defaultValue="john.doe@example.com"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={4}
                    placeholder="Tell us about yourself..."
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    sx={{ mr: 2 }}
                  >
                    Save Changes
                  </Button>
                  <Button variant="outlined" startIcon={<CancelIcon />}>
                    Cancel
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Box component="form" noValidate sx={{ mt: 1, maxWidth: 600 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="currentPassword"
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="newPassword"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleChangePassword}
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                  >
                    Update Password
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Two-Factor Authentication
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable two-factor authentication"
                  />
                </FormGroup>
                <Button variant="outlined" sx={{ mt: 2 }}>
                  Set up authenticator app
                </Button>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  This is a list of devices that have logged into your account.
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <LockIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Windows 10 - Chrome"
                      secondary="Last active: Just now - 192.168.1.1"
                    />
                    <IconButton edge="end" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LockIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="iPhone 13 - Safari"
                      secondary="Last active: 2 hours ago - 192.168.1.2"
                    />
                    <IconButton edge="end" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                </List>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Security
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleDeleteAccount}
                  startIcon={<DeleteIcon />}
                  sx={{ mt: 2 }}
                >
                  Delete Account
                </Button>
              </Box>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.email}
                      onChange={handleNotificationChange}
                      name="email"
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.push}
                      onChange={handleNotificationChange}
                      name="push"
                    />
                  }
                  label="Push Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.sms}
                      onChange={handleNotificationChange}
                      name="sms"
                    />
                  }
                  label="SMS Notifications"
                />
              </FormGroup>
              <Button
                variant="contained"
                onClick={handleSaveNotifications}
                sx={{ mt: 3 }}
              >
                Save Preferences
              </Button>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Language Preferences
              </Typography>
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Dark Mode"
                />
              </Box>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Data Preferences
              </Typography>
              <Box>
                <Button variant="outlined" sx={{ mr: 2 }}>
                  Export Data
                </Button>
                <Button variant="outlined" color="error">
                  Clear Data
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
