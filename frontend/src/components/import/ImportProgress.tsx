import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import { ImportJob, ImportStatus, RecordStatus } from '../../services/importService';

interface ImportProgressProps {
  importJob: ImportJob;
  onCancel: () => void;
}

/**
 * Component to display real-time import progress
 */
const ImportProgress: React.FC<ImportProgressProps> = ({ importJob, onCancel }) => {
  const { status, progress, records, logs } = importJob;
  
  // Calculate progress percentage
  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;
  
  // Determine if import is active
  const isActive = status === ImportStatus.RUNNING || status === ImportStatus.PENDING;
  
  // Get the latest logs (limited to most recent 5)
  const recentLogs = logs && logs.length > 0 ? logs.slice(-5) : [];
  
  // Get a sample of failed records (limited to 3)
  const failedRecords = records
    ? records.filter(r => r.status === RecordStatus.FAILED).slice(0, 3)
    : [];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h6">
              Import Progress
            </Typography>
          </Grid>
          <Grid item>
            <StatusChip status={status} />
          </Grid>
        </Grid>
      </Box>
      
      {/* Progress bar */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <LinearProgress 
              variant={isActive ? "determinate" : "determinate"} 
              value={progressPercent} 
              color={
                status === ImportStatus.COMPLETED ? "success" :
                status === ImportStatus.FAILED ? "error" :
                status === ImportStatus.PARTIAL ? "warning" : 
                "primary"
              }
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              {progressPercent}%
            </Typography>
          </Grid>
        </Grid>
      </Box>
      
      {/* Stats summary */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Total</Typography>
              <Typography variant="h6">{progress.total}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <Typography variant="body2" color="success.contrastText">Succeeded</Typography>
              <Typography variant="h6" color="success.contrastText">{progress.succeeded}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
              <Typography variant="body2" color="error.contrastText">Failed</Typography>
              <Typography variant="h6" color="error.contrastText">{progress.failed}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <Typography variant="body2" color="warning.contrastText">Skipped</Typography>
              <Typography variant="h6" color="warning.contrastText">{progress.skipped}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Recent logs */}
      <Typography variant="subtitle2" gutterBottom>
        Recent Activity
      </Typography>
      <Paper variant="outlined" sx={{ mb: 3, maxHeight: 150, overflow: 'auto' }}>
        {recentLogs.length > 0 ? (
          <List dense disablePadding>
            {recentLogs.map((log, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText 
                    primary={log} 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      style: { fontFamily: 'monospace' }
                    }}
                  />
                </ListItem>
                {index < recentLogs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No logs available
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Failed records */}
      {failedRecords.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom color="error.main">
            Failed Records
          </Typography>
          <Stack spacing={1} sx={{ mb: 3 }}>
            {failedRecords.map((record, index) => (
              <Alert severity="error" key={index} icon={<ErrorIcon />}>
                <Typography variant="body2">
                  <strong>{record.facilityName}</strong> - {record.errors && record.errors.length > 0 ? record.errors[0] : 'Unknown error'}
                </Typography>
              </Alert>
            ))}
            {progress.failed > failedRecords.length && (
              <Typography variant="body2" color="text.secondary">
                And {progress.failed - failedRecords.length} more failed records...
              </Typography>
            )}
          </Stack>
        </>
      )}
      
      {/* Actions */}
      {isActive && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={onCancel}
          >
            Cancel Import
          </Button>
        </Box>
      )}
    </Paper>
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
  let icon: React.ReactNode;
  let label: string;

  switch (status) {
    case ImportStatus.COMPLETED:
      color = 'success';
      icon = <CheckCircleIcon fontSize="small" />;
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
      icon = <ErrorIcon fontSize="small" />;
      label = 'Failed';
      break;
    case ImportStatus.CANCELLED:
      color = 'default';
      icon = <CancelIcon fontSize="small" />;
      label = 'Cancelled';
      break;
    case ImportStatus.PARTIAL:
      color = 'warning';
      icon = <WarningIcon fontSize="small" />;
      label = 'Partial';
      break;
    default:
      color = 'default';
      label = status;
  }

  return (
    <Chip
      size="small"
      label={label}
      color={color}
      icon={icon as React.ReactElement<any> | undefined}
    />
  );
};

export default ImportProgress;
