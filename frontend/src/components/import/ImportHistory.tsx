import React, { useState } from 'react';
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
  IconButton,
  Chip,
  TablePagination,
  Collapse,
  Grid,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  RestartAlt as RestartAltIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { 
  ImportJob, 
  ImportStatus, 
  ImportSourceType 
} from '../../services/importService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

interface ImportHistoryProps {
  imports: ImportJob[];
  total: number;
  page: number;
  rowsPerPage: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
  onViewLogs: (importId: string) => void;
  onRerunImport: (importId: string) => void;
  onFilterChange: (filters: {
    source?: ImportSourceType | '';
    status?: ImportStatus | '';
    startDate?: string;
    endDate?: string;
  }) => void;
  source?: ImportSourceType | '';
  status?: ImportStatus | '';
  startDate?: string;
  endDate?: string;
}

/**
 * Component to display import history with filtering and detailed view
 */
const ImportHistory: React.FC<ImportHistoryProps> = ({
  imports,
  total,
  page,
  rowsPerPage,
  isLoading,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  onViewLogs,
  onRerunImport,
  onFilterChange
}) => {
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    source: ImportSourceType | '';
    status: ImportStatus | '';
    startDate: string;
    endDate: string;
  }>({
    source: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedJobLogs, setSelectedJobLogs] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Toggle row expansion
  const toggleRow = (jobId: string) => {
    setOpenRow(openRow === jobId ? null : jobId);
  };

  // Handle filter changes
  const handleFilterChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newFilters = { ...filters, [field]: event.target.value };
    setFilters(newFilters);
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
  };

  // Reset filters
  const resetFilters = () => {
    const resetValues: {
      source: ImportSourceType | '';
      status: ImportStatus | '';
      startDate: string;
      endDate: string;
    } = {
      source: '',
      status: '',
      startDate: '',
      endDate: ''
    };
    setFilters(resetValues);
    onFilterChange({
      source: resetValues.source || undefined,
      status: resetValues.status || undefined,
      startDate: resetValues.startDate || undefined,
      endDate: resetValues.endDate || undefined
    });
  };

  // View logs
  const handleViewLogs = (importId: string) => {
    setSelectedJobId(importId);
    onViewLogs(importId);
    setLogsDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = dayjs(dateString);
    return (
      <Tooltip title={date.format('YYYY-MM-DD HH:mm:ss')}>
        <span>{date.fromNow()}</span>
      </Tooltip>
    );
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Import History
            </Typography>
            <Box>
              <Tooltip title="Refresh">
                <IconButton onClick={onRefresh} size="small">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter">
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                  color={showFilters ? 'primary' : 'default'}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filters */}
          <Collapse in={showFilters}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Source"
                    value={filters.source}
                    onChange={handleFilterChange('source')}
                  >
                    <MenuItem value="">All Sources</MenuItem>
                    <MenuItem value={ImportSourceType.KOBO_TOOLBOX}>KoboToolbox</MenuItem>
                    <MenuItem value={ImportSourceType.CSV}>CSV Upload</MenuItem>
                    <MenuItem value={ImportSourceType.API}>External API</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Status"
                    value={filters.status}
                    onChange={handleFilterChange('status')}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value={ImportStatus.COMPLETED}>Completed</MenuItem>
                    <MenuItem value={ImportStatus.FAILED}>Failed</MenuItem>
                    <MenuItem value={ImportStatus.PARTIAL}>Partial</MenuItem>
                    <MenuItem value={ImportStatus.RUNNING}>Running</MenuItem>
                    <MenuItem value={ImportStatus.PENDING}>Pending</MenuItem>
                    <MenuItem value={ImportStatus.CANCELLED}>Cancelled</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="From Date"
                    type="date"
                    value={filters.startDate}
                    onChange={handleFilterChange('startDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="To Date"
                    type="date"
                    value={filters.endDate}
                    onChange={handleFilterChange('endDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={resetFilters} sx={{ mr: 1 }} size="small">
                  Reset
                </Button>
                <Button 
                  variant="contained" 
                  onClick={applyFilters}
                  size="small"
                >
                  Apply Filters
                </Button>
              </Box>
            </Paper>
          </Collapse>

          {/* Import table */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {imports.map((importJob) => (
                  <React.Fragment key={importJob.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={() => toggleRow(importJob.id)}
                        >
                          {openRow === importJob.id ? (
                            <KeyboardArrowUpIcon />
                          ) : (
                            <KeyboardArrowDownIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {importJob.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{formatDate(importJob.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getSourceLabel(importJob.source)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {importJob.progress.total}
                        {importJob.progress.succeeded > 0 && (
                          <Tooltip title={`${importJob.progress.succeeded} succeeded`}>
                            <Chip
                              label={importJob.progress.succeeded}
                              size="small"
                              color="success"
                              sx={{ ml: 1, height: 18, minWidth: 18, fontSize: '0.7rem' }}
                            />
                          </Tooltip>
                        )}
                        {importJob.progress.failed > 0 && (
                          <Tooltip title={`${importJob.progress.failed} failed`}>
                            <Chip
                              label={importJob.progress.failed}
                              size="small"
                              color="error"
                              sx={{ ml: 0.5, height: 18, minWidth: 18, fontSize: '0.7rem' }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={importJob.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Logs">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewLogs(importJob.id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(importJob.status === ImportStatus.FAILED || 
                          importJob.status === ImportStatus.PARTIAL) && (
                          <Tooltip title="Re-run Import">
                            <IconButton 
                              size="small"
                              onClick={() => onRerunImport(importJob.id)}
                            >
                              <RestartAltIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        sx={{ p: 0, borderBottom: openRow === importJob.id ? 1 : 'none' }}
                      >
                        <Collapse in={openRow === importJob.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Import Details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Started:</strong>{' '}
                                  {importJob.startedAt
                                    ? dayjs(importJob.startedAt).format('YYYY-MM-DD HH:mm:ss')
                                    : 'Not started'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Completed:</strong>{' '}
                                  {importJob.completedAt
                                    ? dayjs(importJob.completedAt).format('YYYY-MM-DD HH:mm:ss')
                                    : 'Not completed'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Duration:</strong>{' '}
                                  {importJob.startedAt && importJob.completedAt
                                    ? formatDuration(
                                        new Date(importJob.completedAt).getTime() -
                                          new Date(importJob.startedAt).getTime()
                                      )
                                    : 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                {importJob.error && (
                                  <Typography 
                                    variant="body2" 
                                    color="error"
                                    sx={{ mb: 1 }}
                                  >
                                    <strong>Error:</strong> {importJob.error}
                                  </Typography>
                                )}
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Configuration:</strong>
                                </Typography>
                                <Typography variant="body2" color="text.secondary" component="div">
                                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                    <li>
                                      Validation: {importJob.config.validationLevel || 'Standard'}
                                    </li>
                                    <li>
                                      Duplicates: {getDuplicateStrategyLabel(importJob.config.duplicateStrategy)}
                                    </li>
                                    <li>
                                      Post Import: {getPostImportLabel(importJob.config.postImportAction)}
                                    </li>
                                  </ul>
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
                {imports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {isLoading ? 'Loading...' : 'No import history found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>
      
      {/* Logs Dialog */}
      <Dialog 
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Import Logs
          <Typography variant="subtitle2" color="text.secondary">
            Job ID: {selectedJobId}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedJobLogs.length > 0 ? (
            <List dense>
              {selectedJobLogs.map((log, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText 
                      primary={log} 
                      primaryTypographyProps={{ 
                        style: { 
                          fontFamily: 'monospace',
                          fontSize: '0.85rem'
                        } 
                      }} 
                    />
                  </ListItem>
                  {index < selectedJobLogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              No logs available for this import job
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * Status chip component to display import status
 */
const StatusChip = ({ status }: { status: ImportStatus }) => {
  let color:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  let label: string;

  switch (status) {
    case ImportStatus.COMPLETED:
      color = 'success';
      label = 'Completed';
      break;
    case ImportStatus.RUNNING:
      color = 'primary';
      label = 'Running';
      break;
    case ImportStatus.PENDING:
      color = 'info';
      label = 'Pending';
      break;
    case ImportStatus.FAILED:
      color = 'error';
      label = 'Failed';
      break;
    case ImportStatus.CANCELLED:
      color = 'default';
      label = 'Cancelled';
      break;
    case ImportStatus.PARTIAL:
      color = 'warning';
      label = 'Partial';
      break;
    default:
      color = 'default';
      label = status;
  }

  return <Chip size="small" label={label} color={color} />;
};

/**
 * Helper to get readable source label
 */
const getSourceLabel = (source: ImportSourceType): string => {
  switch (source) {
    case ImportSourceType.KOBO_TOOLBOX:
      return 'KoboToolbox';
    case ImportSourceType.CSV:
      return 'CSV Upload';
    case ImportSourceType.API:
      return 'External API';
    case ImportSourceType.MANUAL:
      return 'Manual Entry';
    default:
      return source;
  }
};

/**
 * Helper to format duration in ms to readable string
 */
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Helper to get readable duplicate strategy label
 */
const getDuplicateStrategyLabel = (strategy: string | undefined): string => {
  switch (strategy) {
    case 'update':
      return 'Update Existing';
    case 'skip':
      return 'Skip';
    case 'create':
      return 'Create Duplicate';
    default:
      return strategy || 'Update Existing';
  }
};

/**
 * Helper to get readable post-import action label
 */
const getPostImportLabel = (action: string | undefined): string => {
  switch (action) {
    case 'analyze':
      return 'Run Analysis';
    case 'none':
      return 'Do Nothing';
    default:
      return action || 'Run Analysis';
  }
};

export default ImportHistory;
