import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  PictureAsPdf,
  Download,
  Refresh,
  History,
  DataUsage,
  Check,
  Error,
  Pending,
  Delete,
  Preview
} from '@mui/icons-material';

import { solarReportService, ReportMetadata, ReportGenerationTask } from '../../services/solarReportService';
import { format, formatDistance } from 'date-fns';

interface ReportGeneratorProps {
  facilityId: number;
  assessmentId: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ facilityId, assessmentId }) => {
  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [includeMonitoring, setIncludeMonitoring] = useState<boolean>(false);
  const [includeHistory, setIncludeHistory] = useState<boolean>(false);
  const [outputFormat, setOutputFormat] = useState<string>('pdf');
  const [generationTask, setGenerationTask] = useState<ReportGenerationTask | null>(null);
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<ReportMetadata | null>(null);
  
  // Load reports on mount
  useEffect(() => {
    loadReports();
    
    // Cleanup polling interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);
  
  // Poll for task status when a task is running
  useEffect(() => {
    if (generationTask && generationTask.status === 'processing') {
      const interval = setInterval(() => {
        checkTaskStatus(generationTask.task_id);
      }, 2000);
      
      setPollingInterval(interval);
      
      return () => {
        clearInterval(interval);
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [generationTask]);
  
  // Load reports
  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await solarReportService.getReportList({
        facilityId: facilityId
      });
      
      setReports(result.reports);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate report
  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const task = await solarReportService.generateReport({
        assessmentId: assessmentId,
        includeMonitoring: includeMonitoring,
        includeHistory: includeHistory,
        outputFormat: outputFormat
      });
      
      setGenerationTask(task);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Check task status
  const checkTaskStatus = async (taskId: string) => {
    try {
      const task = await solarReportService.checkReportStatus(taskId);
      
      setGenerationTask(task);
      
      // If task is completed or failed, reload reports
      if (task.status !== 'processing') {
        loadReports();
      }
    } catch (err) {
      console.error('Failed to check task status:', err);
    }
  };
  
  // Download report
  const handleDownloadReport = async (report: ReportMetadata) => {
    try {
      const blob = await solarReportService.downloadReport(report.filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download report:', err);
      setError('Failed to download report. Please try again.');
    }
  };
  
  // Preview report
  const handlePreviewReport = (report: ReportMetadata) => {
    setSelectedReport(report);
    setPreviewDialogOpen(true);
  };
  
  // Format file size
  const formatFileSize = (sizeKb: number): string => {
    if (sizeKb < 1024) {
      return `${sizeKb.toFixed(1)} KB`;
    } else {
      return `${(sizeKb / 1024).toFixed(1)} MB`;
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check color="success" />;
      case 'processing':
        return <CircularProgress size={20} />;
      case 'failed':
        return <Error color="error" />;
      default:
        return <Pending />;
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Report Generator
      </Typography>
      
      <Grid container spacing={3}>
        {/* Report Generation Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Generate New Report
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeMonitoring}
                    onChange={(e) => setIncludeMonitoring(e.target.checked)}
                  />
                }
                label="Include Monitoring Data"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                  />
                }
                label="Include System History"
              />
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="output-format-label">Output Format</InputLabel>
                <Select
                  labelId="output-format-label"
                  id="output-format"
                  value={outputFormat}
                  label="Output Format"
                  onChange={(e) => setOutputFormat(e.target.value)}
                >
                  <MenuItem value="pdf">PDF Document</MenuItem>
                  {/* Add more formats when supported */}
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                startIcon={<PictureAsPdf />}
                onClick={handleGenerateReport}
                disabled={loading || (generationTask?.status === 'processing')}
                sx={{ mt: 2 }}
                fullWidth
              >
                Generate Report
              </Button>
            </Box>
            
            {/* Task Status */}
            {generationTask && (
              <Box sx={{ mt: 2 }}>
                <Alert severity={
                  generationTask.status === 'completed' ? 'success' :
                  generationTask.status === 'failed' ? 'error' :
                  'info'
                }>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getStatusIcon(generationTask.status)}
                    <Box sx={{ ml: 1 }}>
                      {generationTask.message}
                      {generationTask.status === 'processing' && (
                        <Typography variant="body2" color="text.secondary">
                          This may take a few moments...
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Alert>
              </Box>
            )}
            
            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Reports */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Reports
              </Typography>
              
              <Button
                startIcon={<Refresh />}
                onClick={loadReports}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading && !reports.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : reports.length > 0 ? (
              <List>
                {reports.map((report) => (
                  <ListItem key={report.filename} divider>
                    <ListItemIcon>
                      <PictureAsPdf />
                    </ListItemIcon>
                    <ListItemText
                      primary={report.filename}
                      secondary={
                        <>
                          {formatDistance(new Date(report.created_at), new Date(), { addSuffix: true })} • {formatFileSize(report.file_size_kb)}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Preview">
                        <IconButton edge="end" onClick={() => handlePreviewReport(report)}>
                          <Preview />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton edge="end" onClick={() => handleDownloadReport(report)}>
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No reports generated yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generate a new report to see it here
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Report Preview
          <IconButton
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Delete />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <iframe
              src={`${solarReportService.getReportDownloadUrl(selectedReport.filename)}#toolbar=0`}
              width="100%"
              height="600px"
              title="Report Preview"
              style={{ border: 'none' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          {selectedReport && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                handleDownloadReport(selectedReport);
                setPreviewDialogOpen(false);
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportGenerator;
