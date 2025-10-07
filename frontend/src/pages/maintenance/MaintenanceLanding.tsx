import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SolarSystemService, { SolarSystemData } from '../../services/solarSystemService';
import WhatsAppAnalyticsService, { WhatsAppAnalytics } from '../../services/whatsappAnalyticsService';
import MaintenanceSchedulingService, { MaintenanceSchedule, SchedulingRecommendation } from '../../services/maintenanceSchedulingService';

// Types for maintenance system
interface MaintenanceTicket {
  id: string;
  siteId: number;
  siteName: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Scheduled' | 'Resolved' | 'Closed';
  createdDate: string;
  assignedTo: string;
  description?: string;
  estimatedCost?: number;
  whatsappMessages?: number;
}


/**
 * Maintenance Landing Page - Hub for all maintenance activities
 */
const MaintenanceLanding: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // State management
  const [pvSites, setPvSites] = useState<SolarSystemData[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [whatsappAnalytics, setWhatsappAnalytics] = useState<WhatsAppAnalytics | null>(null);
  
  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    siteId: '',
    issue: '',
    priority: 'Medium' as MaintenanceTicket['priority'],
    description: '',
    estimatedCost: ''
  });

  // Ticket management state
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);

  // Scheduling state
  const [schedulingRecommendations, setSchedulingRecommendations] = useState<SchedulingRecommendation[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<MaintenanceSchedule[]>([]);
  
  // Load PV sites and maintenance data
  useEffect(() => {
    loadMaintenanceData();
  }, [token]);
  
  const loadMaintenanceData = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Load PV sites
      const sitesResponse = await SolarSystemService.getSolarSystems(token, { limit: 100 });
      if (sitesResponse.success) {
        setPvSites(sitesResponse.data);
      }
      
      // Load maintenance tickets (mock data for now)
      setMaintenanceTickets(getMockMaintenanceTickets(sitesResponse.data));
      
      // Load WhatsApp analytics
      const analyticsResponse = await WhatsAppAnalyticsService.getAnalytics(token);
      if (analyticsResponse.success && analyticsResponse.data) {
        setWhatsappAnalytics(analyticsResponse.data);
      } else {
        // Fallback to mock data if API fails
        setWhatsappAnalytics(WhatsAppAnalyticsService.getMockAnalytics());
      }

      // Load scheduling recommendations and upcoming schedules
      const recommendations = MaintenanceSchedulingService.generateIntelligentRecommendations(sitesResponse.data || []);
      setSchedulingRecommendations(recommendations);
      
      const scheduleResponse = await MaintenanceSchedulingService.getSchedule(token, {
        from: new Date().toISOString().split('T')[0],
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      if (scheduleResponse.success && scheduleResponse.data) {
        setUpcomingSchedules(scheduleResponse.data);
      } else {
        // Fallback to mock schedule
        setUpcomingSchedules(MaintenanceSchedulingService.getMockSchedule());
      }
      
    } catch (err: any) {
      console.error('Error loading maintenance data:', err);
      setError(err.message || 'Failed to load maintenance data');
      
      // Fallback to sample data
      const sampleSites = getSampleSites();
      setPvSites(sampleSites);
      setMaintenanceTickets(getMockMaintenanceTickets(sampleSites));
      setWhatsappAnalytics(WhatsAppAnalyticsService.getMockAnalytics());
      
      // Fallback scheduling data
      const recommendations = MaintenanceSchedulingService.generateIntelligentRecommendations(sampleSites);
      setSchedulingRecommendations(recommendations);
      setUpcomingSchedules(MaintenanceSchedulingService.getMockSchedule());
    } finally {
      setLoading(false);
    }
  };
  
  // Sample PV sites for fallback
  const getSampleSites = (): SolarSystemData[] => [
    {
      id: 1,
      name: 'Nairobi Community Center',
      facilityId: 1,
      capacity: 5.4,
      type: 'grid-tied',
      status: 'active',
      location: { latitude: -1.2921, longitude: 36.8219 },
      components: { panels: 20, inverters: 1 }
    },
    {
      id: 2,
      name: 'Mombasa Health Clinic',
      facilityId: 2,
      capacity: 12.8,
      type: 'off-grid',
      status: 'active',
      location: { latitude: -4.0435, longitude: 39.6682 },
      components: { panels: 48, inverters: 2, batteries: 8 }
    },
    {
      id: 3,
      name: 'Kisumu School Campus',
      facilityId: 3,
      capacity: 8.2,
      type: 'hybrid',
      status: 'active',
      location: { latitude: -0.1022, longitude: 34.7617 },
      components: { panels: 32, inverters: 1, batteries: 4 }
    },
    {
      id: 4,
      name: 'Nakuru Agricultural Cooperative',
      facilityId: 4,
      capacity: 3.6,
      type: 'grid-tied',
      status: 'maintenance',
      location: { latitude: -0.3031, longitude: 36.0800 },
      components: { panels: 14, inverters: 1 }
    },
    {
      id: 5,
      name: 'Eldoret Water Pumping Station',
      facilityId: 5,
      capacity: 6.2,
      type: 'off-grid',
      status: 'inactive',
      location: { latitude: 0.5143, longitude: 35.2697 },
      components: { panels: 24, inverters: 1, batteries: 6 }
    }
  ];
  
  // Generate mock maintenance tickets based on PV sites
  const getMockMaintenanceTickets = (sites: SolarSystemData[]): MaintenanceTicket[] => [
    {
      id: 'MT-2023-001',
      siteId: sites.find(s => s.name.includes('Mombasa'))?.id || 2,
      siteName: 'Mombasa Health Clinic',
      issue: 'Inverter fault - Error code E-14',
      priority: 'High',
      status: 'Open',
      createdDate: '2023-07-20',
      assignedTo: 'John Doe',
      description: 'Inverter showing error code E-14, system performance reduced by 30%',
      estimatedCost: 1500,
      whatsappMessages: 3
    },
    {
      id: 'MT-2023-002',
      siteId: sites.find(s => s.name.includes('Nakuru'))?.id || 4,
      siteName: 'Nakuru Agricultural Cooperative',
      issue: 'Battery bank undervoltage',
      priority: 'Medium',
      status: 'In Progress',
      createdDate: '2023-07-18',
      assignedTo: 'Jane Smith',
      description: 'Battery voltage dropping below threshold, affecting backup power',
      estimatedCost: 800,
      whatsappMessages: 5
    },
    {
      id: 'MT-2023-003',
      siteId: sites.find(s => s.name.includes('Eldoret'))?.id || 5,
      siteName: 'Eldoret Water Pumping Station',
      issue: 'Multiple panel failures',
      priority: 'High',
      status: 'Open',
      createdDate: '2023-07-15',
      assignedTo: 'Unassigned',
      description: 'Several panels showing reduced output, possible weather damage',
      estimatedCost: 2200,
      whatsappMessages: 8
    },
    {
      id: 'MT-2023-004',
      siteId: sites.find(s => s.name.includes('Nairobi'))?.id || 1,
      siteName: 'Nairobi Community Center',
      issue: 'Routine maintenance check',
      priority: 'Low',
      status: 'Scheduled',
      createdDate: '2023-07-12',
      assignedTo: 'John Doe',
      description: 'Scheduled quarterly maintenance and inspection',
      estimatedCost: 300,
      whatsappMessages: 1
    }
  ];
  
  // Mock WhatsApp analytics data
  const getMockWhatsAppAnalytics = (): WhatsAppAnalytics => ({
    totalMessages: 247,
    activeChats: 12,
    issuesReported: 18,
    avgResponseTime: 2.3,
    topIssues: [
      { issue: 'Inverter Error', count: 8, avgResolutionTime: 4.2 },
      { issue: 'Panel Cleaning', count: 6, avgResolutionTime: 1.5 },
      { issue: 'Battery Issues', count: 4, avgResolutionTime: 6.8 },
      { issue: 'Performance Drop', count: 3, avgResolutionTime: 3.1 },
      { issue: 'Wiring Problems', count: 2, avgResolutionTime: 5.4 }
    ],
    messagesByDay: [
      { date: '2024-01-01', count: 45 },
      { date: '2024-01-02', count: 38 },
      { date: '2024-01-03', count: 52 },
      { date: '2024-01-04', count: 41 },
      { date: '2024-01-05', count: 35 },
      { date: '2024-01-06', count: 36 }
    ],
    responseTimeMetrics: {
      under1Hour: 65,
      under4Hours: 25,
      under24Hours: 8,
      over24Hours: 2
    },
    supportTicketsGenerated: 18,
    customerSatisfaction: 4.2
  });
  
  // Create new maintenance ticket
  const handleCreateTicket = async () => {
    try {
      const selectedSite = pvSites.find(site => site.id?.toString() === newTicket.siteId);
      if (!selectedSite) {
        setError('Please select a valid site');
        return;
      }
      
      const ticket: MaintenanceTicket = {
        id: `MT-${Date.now()}`,
        siteId: selectedSite.id!,
        siteName: selectedSite.name,
        issue: newTicket.issue,
        priority: newTicket.priority,
        status: 'Open',
        createdDate: new Date().toISOString().split('T')[0],
        assignedTo: 'Unassigned',
        description: newTicket.description,
        estimatedCost: newTicket.estimatedCost ? parseFloat(newTicket.estimatedCost) : undefined,
        whatsappMessages: 0
      };
      
      setMaintenanceTickets(prev => [ticket, ...prev]);
      setCreateTicketOpen(false);
      setNewTicket({
        siteId: '',
        issue: '',
        priority: 'Medium',
        description: '',
        estimatedCost: ''
      });
      setError(null);
    } catch (err: any) {
      setError('Failed to create ticket: ' + err.message);
    }
  };

  // Update ticket status
  const handleUpdateTicketStatus = (ticketId: string, newStatus: MaintenanceTicket['status']) => {
    setMaintenanceTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus }
          : ticket
      )
    );
  };

  // View ticket details
  const handleViewTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setTicketDetailOpen(true);
  };

  // Assign technician to ticket
  const handleAssignTechnician = (ticketId: string, technician: string) => {
    setMaintenanceTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, assignedTo: technician }
          : ticket
      )
    );
  };
  
  // Sample performance metrics
  const performanceMetrics = {
    systemUptime: 98.7,
    ticketsResolved: 24,
    avgResponseTime: 5.3,
    scheduledMaintenance: 8
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'info';
      default:
        return 'default';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'error';
      case 'In Progress':
        return 'warning';
      case 'Scheduled':
        return 'info';
      case 'Resolved':
        return 'success';
      case 'Closed':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Calculate summary statistics
  const totalTickets = maintenanceTickets.length;
  const openTickets = maintenanceTickets.filter(t => t.status === 'Open').length;
  const highPriorityTickets = maintenanceTickets.filter(t => t.priority === 'High' || t.priority === 'Critical').length;
  const totalEstimatedCost = maintenanceTickets.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
  const sitesUnderMaintenance = new Set(maintenanceTickets.filter(t => t.status !== 'Closed').map(t => t.siteId)).size;
  
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Maintenance Hub
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage {pvSites.length} PV sites, track issues, and coordinate responses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateTicketOpen(true)}
          disabled={pvSites.length === 0}
        >
          Create Ticket
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Tickets
              </Typography>
              <Typography variant="h4">
                {totalTickets}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {openTickets} open
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Priority
              </Typography>
              <Typography variant="h4" color={highPriorityTickets > 0 ? "error.main" : "success.main"}>
                {highPriorityTickets}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                urgent issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Sites Under Maintenance
              </Typography>
              <Typography variant="h4">
                {sitesUnderMaintenance}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                of {pvSites.length} total sites
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Estimated Costs
              </Typography>
              <Typography variant="h4">
                ${totalEstimatedCost.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                pending work
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Main sections */}
        <Grid item xs={12} md={8}>
          {/* WhatsApp Analytics */}
          {whatsappAnalytics && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#25D366', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  <ChatIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  WhatsApp Bot Analytics
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ bgcolor: 'white', color: '#25D366', '&:hover': { bgcolor: '#f8f8f8' } }}
                  onClick={() => navigate('/maintenance/whatsapp-bot')}
                >
                  Configure Bot
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4">{whatsappAnalytics.totalMessages}</Typography>
                  <Typography variant="body2">Total Messages</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4">{whatsappAnalytics.activeChats}</Typography>
                  <Typography variant="body2">Active Chats</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4">{whatsappAnalytics.issuesReported}</Typography>
                  <Typography variant="body2">Issues Reported</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h4">{whatsappAnalytics.avgResponseTime}h</Typography>
                  <Typography variant="body2">Avg Response</Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Top Issues from WhatsApp:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {whatsappAnalytics.topIssues.slice(0, 3).map((issue, index) => (
                    <Chip 
                      key={index}
                      label={`${issue.issue} (${issue.count})`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          )}
          {/* Maintenance Tickets */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2">
                <BuildIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Active Maintenance Tickets
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setCreateTicketOpen(true)}
              >
                Create Ticket
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Site</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>WhatsApp</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceTickets.slice(0, 5).map((ticket) => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {ticket.siteName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {ticket.id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ticket.issue}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {ticket.assignedTo} • {ticket.createdDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.priority}
                          size="small"
                          color={getPriorityColor(ticket.priority) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.status}
                          size="small"
                          color={getStatusColor(ticket.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        {ticket.estimatedCost ? `$${ticket.estimatedCost.toLocaleString()}` : 'TBD'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WhatsAppIcon sx={{ fontSize: 16, mr: 0.5, color: '#25D366' }} />
                          {ticket.whatsappMessages || 0}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => {/* TODO: View ticket details */}}>
                          <NavigateNextIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {maintenanceTickets.length > 5 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button>View All {maintenanceTickets.length} Tickets</Button>
              </Box>
            )}
          </Paper>
          
          {/* PV Sites Overview */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2">
                <SolarPowerIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                PV Sites Status
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/pv-sites')}
              >
                View All Sites
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {pvSites.slice(0, 6).map((site) => {
                const siteTickets = maintenanceTickets.filter(t => t.siteId === site.id && t.status !== 'Closed');
                const hasIssues = siteTickets.length > 0;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={site.id}>
                    <Card 
                      sx={{ 
                        border: hasIssues ? '2px solid' : '1px solid',
                        borderColor: hasIssues ? 'error.main' : 'divider',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {site.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {site.capacity} kW • {site.type}
                            </Typography>
                          </Box>
                          <Chip 
                            label={site.status} 
                            size="small" 
                            color={site.status === 'active' ? 'success' : site.status === 'maintenance' ? 'warning' : 'error'}
                          />
                        </Box>
                        {hasIssues && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="error">
                              {siteTickets.length} active ticket{siteTickets.length > 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            
            {pvSites.length > 6 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Showing 6 of {pvSites.length} sites
                </Typography>
              </Box>
            )}
          </Paper>
          
          {/* Analytics Preview */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2">
                <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Maintenance Analytics
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                endIcon={<NavigateNextIcon />}
                onClick={() => navigate('/maintenance/analytics')}
              >
                Full Analytics
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">System Uptime</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="span">{performanceMetrics.systemUptime}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={performanceMetrics.systemUptime} 
                    color="success"
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Average Response Time</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="span">{performanceMetrics.avgResponseTime} hours</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    color="info"
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Tickets Resolved (Last 30 Days)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="span">{performanceMetrics.ticketsResolved}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={80} 
                    color="primary"
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Scheduled Maintenance</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="span">{performanceMetrics.scheduledMaintenance} upcoming</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={60} 
                    color="secondary"
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Intelligent Scheduling Recommendations */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  AI Recommendations
                </Typography>
                <Chip 
                  label={`${schedulingRecommendations.length} items`} 
                  size="small" 
                  color="primary" 
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              {schedulingRecommendations.slice(0, 4).map((rec, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {rec.siteName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {rec.reason}
                      </Typography>
                    </Box>
                    <Chip 
                      label={rec.priority} 
                      size="small" 
                      color={rec.priority === 'Critical' ? 'error' : rec.priority === 'High' ? 'warning' : 'success'}
                    />
                  </Box>
                  <Typography variant="caption" color="primary">
                    Suggested: {new Date(rec.suggestedDate).toLocaleDateString()}
                  </Typography>
                  {index < 3 && <Divider sx={{ mt: 1 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Scheduled Maintenance */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Scheduled Maintenance
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {upcomingSchedules.slice(0, 3).map((schedule, index) => (
                  <React.Fragment key={schedule.id}>
                    <ListItem>
                      <ListItemText 
                        primary={schedule.siteName}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {new Date(schedule.scheduledDate).toLocaleDateString()} • {schedule.maintenanceType}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Assigned: {schedule.assignedTechnician} • {schedule.estimatedDuration}h
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        label={schedule.status} 
                        size="small" 
                        color={schedule.status === 'scheduled' ? 'primary' : 'default'}
                      />
                    </ListItem>
                    {index < upcomingSchedules.length - 1 && index < 2 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
          
          {/* Quick Links */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maintenance Resources
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                <ListItem button>
                  <ListItemText 
                    primary="Maintenance Manual" 
                    secondary="Standard operating procedures" 
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem button>
                  <ListItemText 
                    primary="Spare Parts Inventory" 
                    secondary="Check availability and order parts" 
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem button>
                  <ListItemText 
                    primary="Technician Directory" 
                    secondary="Contact information for all technicians" 
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem button>
                  <ListItemText 
                    primary="Troubleshooting Guide" 
                    secondary="Common issues and solutions" 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Ticket Dialog */}
      <Dialog 
        open={createTicketOpen} 
        onClose={() => setCreateTicketOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AddIcon sx={{ mr: 1 }} />
            Create New Maintenance Ticket
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Select PV Site</InputLabel>
                  <Select
                    value={newTicket.siteId}
                    label="Select PV Site"
                    onChange={(e) => setNewTicket(prev => ({ ...prev, siteId: e.target.value }))}
                  >
                    {pvSites.map((site) => (
                      <MenuItem key={site.id} value={site.id?.toString()}>
                        {site.name} - {site.capacity} kW
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newTicket.priority}
                    label="Priority"
                    onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as MaintenanceTicket['priority'] }))}
                  >
                    <MenuItem value="Low">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Low" color="success" size="small" sx={{ mr: 1 }} />
                        Low Priority
                      </Box>
                    </MenuItem>
                    <MenuItem value="Medium">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Medium" color="warning" size="small" sx={{ mr: 1 }} />
                        Medium Priority
                      </Box>
                    </MenuItem>
                    <MenuItem value="High">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="High" color="error" size="small" sx={{ mr: 1 }} />
                        High Priority
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Issue Summary"
                  value={newTicket.issue}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, issue: e.target.value }))}
                  placeholder="Brief description of the issue"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Detailed Description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about the issue, symptoms, and any troubleshooting already performed"
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Cost (USD)"
                  value={newTicket.estimatedCost}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, estimatedCost: e.target.value }))}
                  placeholder="0.00"
                  type="number"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
            </Grid>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setCreateTicketOpen(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTicket}
            variant="contained"
            disabled={!newTicket.siteId || !newTicket.issue.trim()}
            startIcon={<AddIcon />}
          >
            Create Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MaintenanceLanding;
