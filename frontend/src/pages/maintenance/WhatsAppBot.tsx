import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  TextField,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Tab,
  Tabs
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SettingsIcon from '@mui/icons-material/Settings';
import MessageIcon from '@mui/icons-material/Message';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

/**
 * WhatsApp Bot configuration page for maintenance communications
 */
const WhatsAppBot: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [botEnabled, setBotEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome to DREAM TOOL Maintenance Bot. How can I help you today? Reply with:\n1. Report an issue\n2. Check system status\n3. Request maintenance\n4. Speak with a technician"
  );
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Sample automated responses
  const automatedResponses = [
    {
      id: 1,
      trigger: "report issue",
      response: "Please provide the following details about the issue:\n- Site name/location\n- Issue description\n- Urgency (Low/Medium/High)\n- Any error messages or codes"
    },
    {
      id: 2,
      trigger: "check status",
      response: "Your system is currently operational. Last check: {{date}}. Power output: {{power_output}} kW. Battery charge: {{battery_level}}%."
    },
    {
      id: 3,
      trigger: "maintenance",
      response: "Thank you for your maintenance request. A technician will be scheduled to visit your site. Please confirm a good date and time for the visit."
    },
    {
      id: 4,
      trigger: "technician",
      response: "We'll connect you with a technician shortly. During business hours (8 AM - 5 PM), response time is typically within 30 minutes."
    },
    {
      id: 5,
      trigger: "thank you",
      response: "You're welcome! Is there anything else I can help you with today?"
    }
  ];
  
  // Sample recent messages
  const recentMessages = [
    {
      id: 1,
      contact: "John Doe",
      phone: "+254712345678",
      site: "Mombasa Health Clinic",
      message: "Having issues with inverter, showing error E-14",
      timestamp: "2023-07-25 09:32",
      type: "Incoming",
      status: "Responded"
    },
    {
      id: 2,
      contact: "DREAM Bot",
      phone: "System",
      site: "Mombasa Health Clinic",
      message: "Thank you for reporting this issue. Error E-14 indicates an inverter communication fault. Please check if the inverter display is powered on and try cycling the DC disconnect switch.",
      timestamp: "2023-07-25 09:34",
      type: "Outgoing",
      status: "Delivered"
    },
    {
      id: 3,
      contact: "Jane Smith",
      phone: "+254723456789",
      site: "Nakuru Agricultural Cooperative",
      message: "When is our next scheduled maintenance?",
      timestamp: "2023-07-25 08:15",
      type: "Incoming",
      status: "Responded"
    },
    {
      id: 4,
      contact: "DREAM Bot",
      phone: "System",
      site: "Nakuru Agricultural Cooperative",
      message: "Your next scheduled maintenance visit is on August 5, 2023. The technician assigned is Robert Mwangi.",
      timestamp: "2023-07-25 08:16",
      type: "Outgoing",
      status: "Delivered"
    }
  ];
  
  // Sample registered contacts
  const registeredContacts = [
    {
      id: 1,
      name: "John Doe",
      phone: "+254712345678",
      site: "Mombasa Health Clinic",
      role: "Site Manager",
      permissions: ["Report Issues", "View Status"]
    },
    {
      id: 2,
      name: "Jane Smith",
      phone: "+254723456789",
      site: "Nakuru Agricultural Cooperative",
      role: "Administrator",
      permissions: ["Report Issues", "View Status", "Request Maintenance"]
    },
    {
      id: 3,
      name: "Robert Mwangi",
      phone: "+254734567890",
      site: "Multiple",
      role: "Technician",
      permissions: ["All"]
    },
    {
      id: 4,
      name: "Sarah Ochieng",
      phone: "+254745678901",
      site: "Eldoret Water Pumping Station",
      role: "Operator",
      permissions: ["Report Issues", "View Status"]
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <WhatsAppIcon sx={{ fontSize: 36, color: '#25D366', mr: 2 }} />
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            WhatsApp Maintenance Bot
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Configure and manage automated WhatsApp communications for maintenance
          </Typography>
        </div>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="whatsapp bot tabs">
          <Tab icon={<SettingsIcon />} label="Bot Configuration" />
          <Tab icon={<MessageIcon />} label="Automated Responses" />
          <Tab icon={<PeopleIcon />} label="Contacts" />
          <Tab icon={<BuildIcon />} label="Issue Handling" />
        </Tabs>
      </Box>

      {/* Bot Configuration Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Bot Settings
              </Typography>
              <FormGroup>
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={botEnabled} 
                      onChange={() => setBotEnabled(!botEnabled)} 
                      color="primary"
                    />
                  } 
                  label={botEnabled ? "Bot is enabled" : "Bot is disabled"} 
                />
              </FormGroup>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="WhatsApp Business Phone Number"
                  defaultValue="+254700000000"
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Welcome Message"
                  multiline
                  rows={4}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Business Hours"
                  defaultValue="8:00 AM - 5:00 PM EAT (Monday - Friday)"
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="After Hours Message"
                  multiline
                  rows={2}
                  defaultValue="Thank you for contacting us outside business hours. We'll respond to your message when we return on the next business day."
                  margin="normal"
                />
              </Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                sx={{ mt: 2 }}
              >
                Save Settings
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <FormGroup>
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Send notifications for new issues" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Send maintenance reminders" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Send system alerts" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Send weekly status reports" 
                />
              </FormGroup>
              
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Admin Notifications
              </Typography>
              <TextField
                fullWidth
                label="Admin Phone Numbers (comma separated)"
                defaultValue="+254712345678, +254723456789"
                margin="normal"
              />
              <FormGroup>
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Forward critical issues to admins" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Daily summary to admins" 
                />
              </FormGroup>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Integration Status
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <WhatsAppIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="WhatsApp Business API" 
                    secondary="Connected" 
                  />
                  <Chip label="Active" color="success" size="small" />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon>
                    <BuildIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Maintenance System" 
                    secondary="Connected" 
                  />
                  <Chip label="Active" color="success" size="small" />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contact Database" 
                    secondary="Connected" 
                  />
                  <Chip label="Active" color="success" size="small" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Messages
                </Typography>
                <Button size="small">View All</Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                {recentMessages.map((message) => (
                  <ListItem key={message.id} sx={{ 
                    bgcolor: message.type === 'Incoming' ? 'grey.50' : 'primary.50',
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">
                            {message.contact} ({message.site})
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {message.timestamp}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">{message.message}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" color="textSecondary">
                              {message.type}
                            </Typography>
                            <Chip 
                              label={message.status} 
                              size="small" 
                              color={message.status === 'Delivered' || message.status === 'Responded' ? 'success' : 'warning'}
                              sx={{ ml: 1, height: 20 }} 
                            />
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Automated Responses Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Automated Responses
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Add Response
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {automatedResponses.map((response) => (
                <Card key={response.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Trigger: <Chip label={response.trigger} size="small" color="primary" />
                      </Typography>
                      <Box>
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {response.response}
                    </Typography>
                    {response.response.includes('{{') && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Variables: {response.response.match(/\{\{([^}]+)\}\}/g)?.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Response Variables
              </Typography>
              <Typography variant="body2" paragraph>
                Use these variables in your automated responses to provide dynamic information.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="{{site_name}}" 
                    secondary="The name of the site" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="{{date}}" 
                    secondary="Current date" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="{{power_output}}" 
                    secondary="Current power output in kW" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="{{battery_level}}" 
                    secondary="Current battery charge percentage" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="{{technician_name}}" 
                    secondary="Name of assigned technician" 
                  />
                </ListItem>
              </List>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Response Testing
              </Typography>
              <Typography variant="body2" paragraph>
                Test your automated responses with simulated messages.
              </Typography>
              <TextField
                fullWidth
                label="Test Message"
                placeholder="Type a message that should trigger a response..."
                margin="normal"
              />
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 1 }}
              >
                Test Response
              </Button>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2">Response Preview:</Typography>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  No response yet. Send a test message.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Contacts Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Registered Contacts
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Add Contact
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                {registeredContacts.map((contact) => (
                  <Grid item xs={12} md={6} lg={4} key={contact.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1">
                            {contact.name}
                          </Typography>
                          <Chip 
                            label={contact.role} 
                            size="small" 
                            color={contact.role === 'Technician' ? 'secondary' : 'primary'} 
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {contact.phone}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Site: {contact.site}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {contact.permissions.map((permission, index) => (
                            <Chip 
                              key={index} 
                              label={permission} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button size="small">Edit</Button>
                        <Button size="small" color="error">Remove</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Issue Handling Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Issue Handling Configuration
              </Typography>
              <Typography variant="body2" paragraph>
                Configure how the bot should handle and escalate maintenance issues.
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Issue Categories
              </Typography>
              <Grid container spacing={2}>
                {['Inverter', 'Battery', 'Solar Panel', 'Wiring', 'General'].map((category) => (
                  <Grid item xs={12} sm={6} key={category}>
                    <TextField
                      fullWidth
                      label={`${category} Keywords`}
                      defaultValue={`${category.toLowerCase()}, ${category.toLowerCase()} issue`}
                      size="small"
                      margin="dense"
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Escalation Rules
              </Typography>
              <FormGroup>
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Automatically create tickets for reported issues" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Notify technicians of high priority issues immediately" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Follow up on unresolved issues after 24 hours" 
                />
                <FormControlLabel 
                  control={<Switch defaultChecked color="primary" />} 
                  label="Send issue status updates to reporters" 
                />
              </FormGroup>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Issue Response Templates
              </Typography>
              
              <TextField
                fullWidth
                label="New Issue Acknowledgement"
                multiline
                rows={3}
                defaultValue="Thank you for reporting this issue. We've created ticket #{{ticket_id}} and a technician will review it shortly. We'll keep you updated on the status."
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Issue Status Update"
                multiline
                rows={3}
                defaultValue="Update on ticket #{{ticket_id}}: {{status_update}}. The current status is: {{current_status}}."
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Issue Resolution"
                multiline
                rows={3}
                defaultValue="Good news! Ticket #{{ticket_id}} has been resolved. The solution was: {{resolution_details}}. Please let us know if you experience any further issues."
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Technician Dispatch"
                multiline
                rows={3}
                defaultValue="A technician ({{technician_name}}) has been dispatched to address ticket #{{ticket_id}}. Expected arrival: {{arrival_time}}."
                margin="normal"
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Card sx={{ bgcolor: '#25D366', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WhatsAppIcon sx={{ fontSize: 36, mr: 2 }} />
                  <Typography variant="h6">
                    WhatsApp Bot is Active
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  Your maintenance WhatsApp bot is configured and ready to handle communications. Users can interact with it by sending messages to +254700000000.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: 'white', color: '#25D366', '&:hover': { bgcolor: '#f8f8f8' } }}
                  >
                    Test Bot
                  </Button>
                  <Button 
                    variant="outlined" 
                    sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                  >
                    View Documentation
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default WhatsAppBot;
