import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MessageIcon from '@mui/icons-material/Message';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SendIcon from '@mui/icons-material/Send';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import WhatsAppAnalyticsService, { WhatsAppAnalytics, WhatsAppChat } from '../../services/whatsappAnalyticsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`whatsapp-tabpanel-${index}`}
      aria-labelledby={`whatsapp-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WhatsAppBotPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [analytics, setAnalytics] = useState<WhatsAppAnalytics | null>(null);
  const [activeChats, setActiveChats] = useState<WhatsAppChat[]>([]);
  
  // Bot configuration state
  const [botConfig, setBotConfig] = useState({
    enabled: true,
    autoResponse: true,
    businessHours: { enabled: true, start: '08:00', end: '18:00' }
  });

  // Message sending state
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    phoneNumber: '',
    messageType: 'data_collection',
    customMessage: ''
  });

  // Instruction sending state
  const [sendInstructionOpen, setSendInstructionOpen] = useState(false);
  const [instructionForm, setInstructionForm] = useState({
    phoneNumber: '',
    instructionType: 'battery_check',
    customInstructions: ''
  });

  useEffect(() => {
    loadWhatsAppData();
  }, [token]);

  const loadWhatsAppData = async () => {
    try {
      setLoading(true);
      
      // Always use mock data for now to ensure page loads
      setAnalytics(WhatsAppAnalyticsService.getMockAnalytics());

      // Mock active chats
      setActiveChats([
        {
          id: 'chat1',
          phoneNumber: '+254701234567',
          customerName: 'John Doe',
          lastMessage: 'My solar panel is not working properly',
          lastMessageTime: new Date().toISOString(),
          status: 'active',
          assignedAgent: 'Mary Ochieng',
          siteId: 1,
          messageCount: 5
        },
        {
          id: 'chat2',
          phoneNumber: '+254702345678',
          customerName: 'Jane Smith',
          lastMessage: 'When is the next maintenance scheduled?',
          lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'waiting',
          messageCount: 3
        }
      ]);
      
      // Try to load real analytics if token is available
      if (token) {
        try {
          const analyticsResponse = await WhatsAppAnalyticsService.getAnalytics(token);
          if (analyticsResponse.success && analyticsResponse.data) {
            setAnalytics(analyticsResponse.data);
          }
        } catch (apiError) {
          console.log('API not available, using mock data');
        }
      }
      
    } catch (error) {
      console.error('Error loading WhatsApp data:', error);
      setAnalytics(WhatsAppAnalyticsService.getMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const handleSendDataCollection = async () => {
    try {
      const response = await fetch('/api/whatsapp/collect-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: messageForm.phoneNumber,
          facilityId: 1, // This should be dynamically selected
          dataType: messageForm.messageType
        }),
      });

      if (response.ok) {
        setSendMessageOpen(false);
        setMessageForm({ phoneNumber: '', messageType: 'data_collection', customMessage: '' });
        alert('Data collection message sent successfully!');
      }
    } catch (error) {
      console.error('Error sending data collection message:', error);
      alert('Failed to send message');
    }
  };

  const handleSendInstructions = async () => {
    try {
      const response = await fetch('/api/whatsapp/maintenance-instructions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: instructionForm.phoneNumber,
          facilityId: 1, // This should be dynamically selected
          instructionType: instructionForm.instructionType,
          customInstructions: instructionForm.customInstructions || undefined
        }),
      });

      if (response.ok) {
        setSendInstructionOpen(false);
        setInstructionForm({ phoneNumber: '', instructionType: 'battery_check', customInstructions: '' });
        alert('Maintenance instructions sent successfully!');
      }
    } catch (error) {
      console.error('Error sending instructions:', error);
      alert('Failed to send instructions');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          <WhatsAppIcon sx={{ verticalAlign: 'middle', mr: 2, color: '#25D366' }} />
          WhatsApp Bot Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Configure automated data collection and maintenance instruction delivery via WhatsApp
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Dashboard" icon={<TrendingUpIcon />} />
          <Tab label="Active Chats" icon={<MessageIcon />} />
          <Tab label="Configuration" icon={<SettingsIcon />} />
          <Tab label="Send Messages" icon={<SendIcon />} />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <CustomTabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Analytics Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {analytics?.totalMessages || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Messages
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {analytics?.activeChats || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Chats
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {analytics?.issuesReported || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Issues Reported
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {analytics?.avgResponseTime || 0}h
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Response Time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Issues */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Reported Issues
              </Typography>
              <List>
                {analytics?.topIssues?.slice(0, 5).map((issue, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={issue.issue}
                      secondary={`${issue.count} reports • ${issue.avgResolutionTime}h avg resolution`}
                    />
                    <Chip label={issue.count} color="primary" size="small" />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Bot Status */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Bot Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={botConfig.enabled}
                      onChange={(e) => setBotConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      color="success"
                    />
                  }
                  label="Bot Enabled"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={botConfig.autoResponse}
                      onChange={(e) => setBotConfig(prev => ({ ...prev, autoResponse: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label="Auto Response"
                />
              </Box>
              <Alert severity={botConfig.enabled ? "success" : "warning"} sx={{ mt: 2 }}>
                {botConfig.enabled ? "Bot is active and responding to messages" : "Bot is currently disabled"}
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </CustomTabPanel>

      {/* Active Chats Tab */}
      <CustomTabPanel value={tabValue} index={1}>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contact</TableCell>
                  <TableCell>Last Message</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Messages</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeChats.map((chat) => (
                  <TableRow key={chat.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {chat.customerName || chat.phoneNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {chat.phoneNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {chat.lastMessage}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(chat.lastMessageTime).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={chat.status}
                        color={chat.status === 'active' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{chat.messageCount}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => {
                        setMessageForm(prev => ({ ...prev, phoneNumber: chat.phoneNumber }));
                        setSendMessageOpen(true);
                      }}>
                        Send Data Request
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </CustomTabPanel>

      {/* Configuration Tab */}
      <CustomTabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Bot Settings
              </Typography>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch checked={botConfig.enabled} onChange={(e) => setBotConfig(prev => ({ ...prev, enabled: e.target.checked }))} />
                  }
                  label="Enable WhatsApp Bot"
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch checked={botConfig.autoResponse} onChange={(e) => setBotConfig(prev => ({ ...prev, autoResponse: e.target.checked }))} />
                  }
                  label="Auto Response to Issues"
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Business Hours
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={botConfig.businessHours.start}
                  onChange={(e) => setBotConfig(prev => ({
                    ...prev,
                    businessHours: { ...prev.businessHours, start: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={botConfig.businessHours.end}
                  onChange={(e) => setBotConfig(prev => ({
                    ...prev,
                    businessHours: { ...prev.businessHours, end: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Button variant="contained" color="primary">
                Save Configuration
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Features
              </Typography>
              <Box sx={{ mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
                <Typography variant="body2" component="span">
                  Automated issue detection and response
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
                <Typography variant="body2" component="span">
                  Structured data collection from customers
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
                <Typography variant="body2" component="span">
                  Step-by-step maintenance instructions
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
                <Typography variant="body2" component="span">
                  Real-time analytics and reporting
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
                <Typography variant="body2" component="span">
                  Maintenance ticket creation integration
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CustomTabPanel>

      {/* Send Messages Tab */}
      <CustomTabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <MessageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Send Data Collection Request
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setSendMessageOpen(true)}
                sx={{ mb: 2 }}
              >
                New Data Collection
              </Button>
              <Typography variant="body2" color="textSecondary">
                Send structured prompts to collect system status, performance data, or maintenance requests from customers.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Send Maintenance Instructions
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setSendInstructionOpen(true)}
                sx={{ mb: 2 }}
              >
                Send Instructions
              </Button>
              <Typography variant="body2" color="textSecondary">
                Send step-by-step maintenance instructions to technicians or customers for troubleshooting and repairs.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </CustomTabPanel>

      {/* Data Collection Dialog */}
      <Dialog open={sendMessageOpen} onClose={() => setSendMessageOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Data Collection Request</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              value={messageForm.phoneNumber}
              onChange={(e) => setMessageForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+254701234567"
              sx={{ mb: 3 }}
            />
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Data Collection Type</InputLabel>
              <Select
                value={messageForm.messageType}
                label="Data Collection Type"
                onChange={(e) => setMessageForm(prev => ({ ...prev, messageType: e.target.value }))}
              >
                <MenuItem value="system_status">System Status Check</MenuItem>
                <MenuItem value="power_output">Power Output Reading</MenuItem>
                <MenuItem value="maintenance_request">Maintenance Request</MenuItem>
                <MenuItem value="performance_feedback">Performance Feedback</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendMessageOpen(false)}>Cancel</Button>
          <Button onClick={handleSendDataCollection} variant="contained">Send Request</Button>
        </DialogActions>
      </Dialog>

      {/* Instruction Sending Dialog */}
      <Dialog open={sendInstructionOpen} onClose={() => setSendInstructionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Maintenance Instructions</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              value={instructionForm.phoneNumber}
              onChange={(e) => setInstructionForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+254701234567"
              sx={{ mb: 3 }}
            />
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Instruction Type</InputLabel>
              <Select
                value={instructionForm.instructionType}
                label="Instruction Type"
                onChange={(e) => setInstructionForm(prev => ({ ...prev, instructionType: e.target.value }))}
              >
                <MenuItem value="battery_check">Battery Check</MenuItem>
                <MenuItem value="panel_cleaning">Panel Cleaning</MenuItem>
                <MenuItem value="inverter_check">Inverter Inspection</MenuItem>
                <MenuItem value="system_restart">System Restart</MenuItem>
                <MenuItem value="troubleshooting">General Troubleshooting</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Custom Instructions (Optional)"
              value={instructionForm.customInstructions}
              onChange={(e) => setInstructionForm(prev => ({ ...prev, customInstructions: e.target.value }))}
              multiline
              rows={4}
              placeholder="Enter custom maintenance instructions..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendInstructionOpen(false)}>Cancel</Button>
          <Button onClick={handleSendInstructions} variant="contained">Send Instructions</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WhatsAppBotPage;
