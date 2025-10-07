import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ManagementContext } from '../ManagementLanding';
import { useAuth } from '../../../contexts/AuthContext';
import { API_CONFIG } from '../../../config/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  source: string;
  message: string;
  user: string;
  ip: string;
  details: string;
}

// Mock log data
const mockLogs: LogEntry[] = [
  { 
    id: '01', 
    timestamp: '2025-09-23 19:45:12', 
    level: 'error' as const, 
    source: 'auth-service',
    message: 'Failed to authenticate user: Invalid credentials',
    user: 'john.doe@example.com',
    ip: '192.168.1.45',
    details: 'JWT validation failed with error code 401'
  },
  { 
    id: '02', 
    timestamp: '2025-09-23 19:42:35', 
    level: 'info' as const, 
    source: 'api-gateway',
    message: 'Request processed successfully',
    user: 'jane.smith@example.com',
    ip: '192.168.1.46',
    details: 'GET /api/v1/users - 200 OK - 156ms'
  },
  { 
    id: '03', 
    timestamp: '2025-09-23 19:40:23', 
    level: 'warning' as const, 
    source: 'database',
    message: 'Slow query detected',
    user: 'system',
    ip: 'localhost',
    details: 'Query took 2.5s to execute: SELECT * FROM large_table WHERE...'
  },
  { 
    id: '04', 
    timestamp: '2025-09-23 19:38:11', 
    level: 'info' as const, 
    source: 'file-service',
    message: 'File uploaded successfully',
    user: 'mary.johnson@example.com',
    ip: '192.168.1.47',
    details: 'File: report.pdf, Size: 2.4MB, Type: application/pdf'
  },
  { 
    id: '05', 
    timestamp: '2025-09-23 19:35:45', 
    level: 'error' as const, 
    source: 'payment-service',
    message: 'Payment processing failed',
    user: 'robert.brown@example.com',
    ip: '192.168.1.48',
    details: 'Transaction ID: 1234567890, Error: Gateway timeout'
  },
];

const LogsTab = () => {
  const { refreshData, isRefreshing } = useContext(ManagementContext);
  const { token } = useAuth();
  
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState<string>('all');
  const [logSource, setLogSource] = useState<string>('all');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch logs data
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, uncomment this code to fetch from API
      /*
      if (token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/management/logs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setLogs(data.logs);
      } else {
        throw new Error('Authentication token is missing');
      }
      */
      
      // For development, generate some dynamic logs with current timestamp
      const now = new Date();
      const newLogs = [...mockLogs];
      
      // Update timestamps to current time minus random minutes
      newLogs.forEach((log, index) => {
        const minutesAgo = index * 2 + Math.floor(Math.random() * 5);
        const logTime = new Date(now.getTime() - minutesAgo * 60000);
        log.timestamp = logTime.toISOString().replace('T', ' ').substring(0, 19);
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      // Type assertion to ensure TypeScript knows we're handling LogEntry[] correctly
      setLogs(newLogs as LogEntry[]);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle log export
  const handleExportLogs = () => {
    try {
      // Create CSV content from logs
      const headers = ['Timestamp', 'Level', 'Source', 'Message', 'User', 'IP', 'Details'];
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          log.timestamp,
          log.level,
          log.source,
          `"${log.message.replace(/"/g, '""')}"`,
          log.user,
          log.ip,
          `"${log.details.replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage('Logs exported successfully');
    } catch (err: any) {
      setError('Failed to export logs: ' + err.message);
    }
  };
  
  // Open confirmation dialog for clearing logs
  const handleOpenClearDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  // Clear all logs
  const handleClearLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, uncomment this code
      /*
      if (token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/management/logs/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        throw new Error('Authentication token is missing');
      }
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For development, just clear the logs
      setLogs([]);
      setSuccessMessage('All logs cleared successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to clear logs');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleLogLevelChange = (event: SelectChangeEvent<string>) => {
    setLogLevel(event.target.value);
  };

  const handleLogSourceChange = (event: SelectChangeEvent<string>) => {
    setLogSource(event.target.value);
  };

  // Connect to ManagementContext refresh
  useEffect(() => {
    if (isRefreshing) {
      fetchLogs();
    }
  }, [isRefreshing]);
  
  // Initial data fetch
  useEffect(() => {
    fetchLogs();
  }, [token]);
  
  // Handle close success message
  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };
  
  // Get unique sources for filter dropdown
  const uniqueSources = Array.from(new Set(logs.map(log => log.source)));

  // Filter logs based on search, level and source
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    const matchesSource = logSource === 'all' || log.source === logSource;
    
    return matchesSearch && matchesLevel && matchesSource;
  });

  const getLevelIcon = (level: string) => {
    switch(level) {
      case 'error':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'warning':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'info':
        return <InfoIcon fontSize="small" color="info" />;
      case 'debug':
        return <InfoIcon fontSize="small" color="action" />;
      default:
        return <InfoIcon fontSize="small" color="disabled" />; // Provide a default icon instead of null
    }
  };

  const getLevelChip = (level: string) => {
    let color: 'error' | 'warning' | 'info' | 'default' = 'default';
    
    switch(level) {
      case 'error':
        color = 'error';
        break;
      case 'warning':
        color = 'warning';
        break;
      case 'info':
        color = 'info';
        break;
    }
    
    return (
      <Chip 
        size="small"
        label={level.toUpperCase()} 
        color={color}
        icon={getLevelIcon(level)}
      />
    );
  };

  // Show loading state for initial load
  if (loading && !isRefreshing && logs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Success message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        message={successMessage}
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSuccess}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">System Logs</Typography>
        <Box>
          <Button 
            startIcon={<DownloadIcon />} 
            variant="outlined"
            sx={{ mr: 1 }}
            onClick={handleExportLogs}
            disabled={loading || filteredLogs.length === 0}
          >
            Export
          </Button>
          <Button 
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            variant="contained"
            onClick={fetchLogs}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <TextField
            label="Search logs"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: '40%' } }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="log-level-label">Level</InputLabel>
            <Select
              labelId="log-level-label"
              id="log-level"
              value={logLevel}
              label="Level"
              onChange={handleLogLevelChange}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="debug">Debug</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="log-source-label">Source</InputLabel>
            <Select
              labelId="log-source-label"
              id="log-source"
              value={logSource}
              label="Source"
              onChange={handleLogSourceChange}
            >
              <MenuItem value="all">All Sources</MenuItem>
              {uniqueSources.map((source) => (
                <MenuItem key={source} value={source}>{source}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table stickyHeader aria-label="logs table">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((log) => (
                  <TableRow hover key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>{getLevelChip(log.level)}</TableCell>
                    <TableCell>{log.source}</TableCell>
                    <TableCell>
                      <Tooltip title={log.details} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {log.message}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
              ))}
              
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No logs matching the current filters
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleOpenClearDialog}
          disabled={loading || logs.length === 0}
        >
          Clear Logs
        </Button>
      </Box>
      
      {/* Confirmation dialog for clearing logs */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="clear-logs-dialog-title"
      >
        <DialogTitle id="clear-logs-dialog-title">
          Clear All System Logs
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all system logs? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleClearLogs} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Clear Logs'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogsTab;
