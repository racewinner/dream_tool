/**
 * Enhanced Data Import Component - Python Integration
 * Advanced data import, cleaning, and validation using Python services
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Assessment as AnalysisIcon,
  CleaningServices as CleanIcon,
  CheckCircle as ValidateIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Science as ScienceIcon,
  Speed as SpeedIcon,
  Psychology as InsightIcon
} from '@mui/icons-material';

import KoboConfigurationPanelFixed from './KoboConfigurationPanelFixed';

import { pythonDataService, DataImportResult, ValidationReport, SurveyAnalysisResult, CleaningResult } from '../../services/pythonDataService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`data-import-tabpanel-${index}`}
      aria-labelledby={`data-import-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedDataImport: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Import results
  const [importResult, setImportResult] = useState<DataImportResult | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SurveyAnalysisResult | null>(null);
  const [cleaningResult, setCleaningResult] = useState<CleaningResult | null>(null);
  
  // UI state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState({
    validate: true,
    clean: true,
    analyze: true
  });
  
  // JSON input
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearResults = () => {
    setImportResult(null);
    setValidationReport(null);
    setAnalysisResult(null);
    setCleaningResult(null);
    setError(null);
    setSuccess(null);
  };

  // File input handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      clearResults();
    }
  };

  const handleFileImport = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    clearResults();

    try {
      let result: DataImportResult;

      if (selectedFile.name.endsWith('.csv')) {
        result = await pythonDataService.importCsvFile(selectedFile, importOptions);
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        result = await pythonDataService.importExcelFile(selectedFile, importOptions);
      } else {
        throw new Error('Unsupported file format');
      }

      setImportResult(result);
      setSuccess(`Successfully imported ${result.records_imported} records in ${result.processing_time_seconds.toFixed(2)}s`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleJsonImport = async () => {
    if (!jsonInput.trim()) return;

    setLoading(true);
    setError(null);
    clearResults();

    try {
      const data = JSON.parse(jsonInput);
      const result = await pythonDataService.importJsonData(data, importOptions);
      
      setImportResult(result);
      setSuccess(`Successfully imported ${result.records_imported} records in ${result.processing_time_seconds.toFixed(2)}s`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateOnly = async () => {
    let data;
    
    if (activeTab === 0 && selectedFile) {
      // For file validation, we'd need to read the file first
      setError('File validation without import not yet implemented');
      return;
    } else if (activeTab === 1 && jsonInput.trim()) {
      try {
        data = JSON.parse(jsonInput);
      } catch {
        setError('Invalid JSON format');
        return;
      }
    } else {
      setError('No data to validate');
      return;
    }

    setLoading(true);
    setError(null);
    clearResults();

    try {
      const { validation_report, validation_details } = await pythonDataService.validateData(data);
      setValidationReport(validation_report);
      setSuccess('Data validation completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeOnly = async () => {
    let data;
    
    if (activeTab === 1 && jsonInput.trim()) {
      try {
        data = JSON.parse(jsonInput);
      } catch {
        setError('Invalid JSON format');
        return;
      }
    } else {
      setError('No data to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    clearResults();

    try {
      const result = await pythonDataService.analyzeData(data);
      setAnalysisResult(result);
      setSuccess('Data analysis completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanOnly = async () => {
    let data;
    
    if (activeTab === 1 && jsonInput.trim()) {
      try {
        data = JSON.parse(jsonInput);
      } catch {
        setError('Invalid JSON format');
        return;
      }
    } else {
      setError('No data to clean');
      return;
    }

    setLoading(true);
    setError(null);
    clearResults();

    try {
      const result = await pythonDataService.cleanData(data);
      setCleaningResult(result);
      setSuccess(`Data cleaning completed. ${result.cleaning_efficiency}% efficiency`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleaning failed');
    } finally {
      setLoading(false);
    }
  };

  const renderImportResults = () => {
    if (!importResult) return null;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Python-Powered Import Results
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {importResult.records_imported}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Records Imported
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {importResult.data_quality_score}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data Quality Score
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {importResult.completeness_score}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completeness Score
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main">
                  {importResult.processing_time_seconds.toFixed(2)}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Processing Time
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {importResult.recommendations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <InsightIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Recommendations:
              </Typography>
              <List dense>
                {importResult.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setDetailsDialogOpen(true)}
              startIcon={<AnalysisIcon />}
            >
              View Detailed Analysis
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderValidationResults = () => {
    if (!validationReport) return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PASSED': return 'success';
        case 'PASSED_WITH_WARNINGS': return 'warning';
        case 'FAILED': return 'error';
        default: return 'info';
      }
    };

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ValidateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Validation Results
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Overall Status
                </Typography>
                <Chip 
                  label={validationReport.overall_status}
                  color={getStatusColor(validationReport.overall_status) as any}
                  size="medium"
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Issues Found
                </Typography>
                <Typography variant="h6">
                  {validationReport.errors} errors, {validationReport.warnings} warnings
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Typography variant="body1" sx={{ mt: 2 }}>
            {validationReport.summary}
          </Typography>

          {validationReport.recommendations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recommendations:
              </Typography>
              <List dense>
                {validationReport.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AnalysisIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Advanced Statistical Analysis
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Survey Count
                </Typography>
                <Typography variant="h5">
                  {analysisResult.survey_count}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data Quality
                </Typography>
                <Typography variant="h5">
                  {analysisResult.data_quality_score}%
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Completeness
                </Typography>
                <Typography variant="h5">
                  {analysisResult.completeness_score}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Facility Distribution */}
          {Object.keys(analysisResult.facility_distribution).length > 0 && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Facility Distribution</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {Object.entries(analysisResult.facility_distribution).map(([type, count]) => (
                    <Grid item key={type}>
                      <Chip label={`${type}: ${count}`} variant="outlined" />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Geographic Analysis */}
          {analysisResult.geographic_analysis && (
            <Accordion sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Geographic Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Geographic Center
                    </Typography>
                    <Typography variant="body1">
                      {analysisResult.geographic_analysis.geographic_center.latitude.toFixed(4)}, {analysisResult.geographic_analysis.geographic_center.longitude.toFixed(4)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Facilities with Coordinates
                    </Typography>
                    <Typography variant="body1">
                      {analysisResult.geographic_analysis.total_facilities_with_coords}
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Facility Clusters */}
          {analysisResult.facility_clusters && (
            <Accordion sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Facility Clustering Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" gutterBottom>
                  Identified {analysisResult.facility_clusters.num_clusters} clusters using features: {analysisResult.facility_clusters.features_used.join(', ')}
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(analysisResult.facility_clusters.cluster_sizes).map(([cluster, size]) => (
                    <Grid item key={cluster}>
                      <Chip label={`Cluster ${cluster}: ${size} facilities`} variant="outlined" />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          <Typography variant="body1" sx={{ mt: 2 }}>
            {analysisResult.summary}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderCleaningResults = () => {
    if (!cleaningResult) return null;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <CleanIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Data Cleaning Results
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {cleaningResult.original_record_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Original Records
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {cleaningResult.cleaned_record_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cleaned Records
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {cleaningResult.records_removed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Records Removed
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {cleaningResult.cleaning_efficiency}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cleaning Efficiency
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const blob = new Blob([JSON.stringify(cleaningResult.cleaned_data, null, 2)], {
                  type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cleaned_data.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download Cleaned Data
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Enhanced Data Import - Python Powered
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Advanced data import with Python-powered cleaning, validation, and statistical analysis.
          </Typography>

          {/* KoboToolbox Configuration */}
          <KoboConfigurationPanelFixed />

          {/* Import Options */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Processing Options:
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.validate}
                      onChange={(e) => setImportOptions({ ...importOptions, validate: e.target.checked })}
                    />
                  }
                  label="Data Validation"
                />
              </Grid>
              <Grid item>
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.clean}
                      onChange={(e) => setImportOptions({ ...importOptions, clean: e.target.checked })}
                    />
                  }
                  label="Data Cleaning"
                />
              </Grid>
              <Grid item>
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.analyze}
                      onChange={(e) => setImportOptions({ ...importOptions, analyze: e.target.checked })}
                    />
                  }
                  label="Statistical Analysis"
                />
              </Grid>
            </Grid>
          </Box>

          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="File Upload" />
            <Tab label="JSON Input" />
            <Tab label="KoboToolbox Import" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            {/* File Upload */}
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center'
              }}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Select a file to upload
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Supported formats: CSV, Excel (.xlsx, .xls), JSON
              </Typography>
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<UploadIcon />}
              >
                Choose File
              </Button>
              {selectedFile && (
                <Chip
                  label={selectedFile.name}
                  onDelete={() => setSelectedFile(null)}
                  sx={{ mt: 2, display: 'block' }}
                />
              )}
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleFileImport}
                disabled={!selectedFile || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {loading ? 'Processing...' : 'Import & Process'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleValidateOnly}
                disabled={!selectedFile || loading}
                startIcon={<ValidateIcon />}
              >
                Validate Only
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* JSON Input */}
            <TextField
              multiline
              rows={8}
              fullWidth
              placeholder="Paste your JSON data here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleJsonImport}
                disabled={!jsonInput.trim() || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {loading ? 'Processing...' : 'Import & Process'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleValidateOnly}
                disabled={!jsonInput.trim() || loading}
                startIcon={<ValidateIcon />}
              >
                Validate Only
              </Button>
              <Button
                variant="outlined"
                onClick={handleAnalyzeOnly}
                disabled={!jsonInput.trim() || loading}
                startIcon={<AnalysisIcon />}
              >
                Analyze Only
              </Button>
              <Button
                variant="outlined"
                onClick={handleCleanOnly}
                disabled={!jsonInput.trim() || loading}
                startIcon={<CleanIcon />}
              >
                Clean Only
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {/* KoboToolbox Import */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                KoboToolbox Integration
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Import surveys directly from KoboToolbox using API integration.
                Configure your API token in the environment settings.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Form ID"
                    placeholder="Enter KoboToolbox form ID"
                    helperText="The unique identifier for your KoboToolbox form"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Survey ID (Optional)"
                    placeholder="Enter specific survey ID"
                    helperText="Leave empty to import by date range"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    InputLabelProps={{ shrink: true }}
                    helperText="Import surveys from this date"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    InputLabelProps={{ shrink: true }}
                    helperText="Import surveys until this date"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  disabled={loading}
                >
                  Import from KoboToolbox
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                >
                  Test Connection
                </Button>
              </Box>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Configuration Required:</strong> Ensure KOBO_API_TOKEN and KOBO_BASE_URL 
                are configured in your environment settings.
              </Alert>
            </Box>
          </TabPanel>

          {/* Progress */}
          {loading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Processing data with Python services...
              </Typography>
            </Box>
          )}

          {/* Messages */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {renderImportResults()}
      {renderValidationResults()}
      {renderAnalysisResults()}
      {renderCleaningResults()}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Detailed Analysis Results
        </DialogTitle>
        <DialogContent>
          {importResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Processing Summary
              </Typography>
              <Typography variant="body1" paragraph>
                {importResult.summary}
              </Typography>
              
              {importResult.validation_results.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Validation Issues
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Field</TableCell>
                          <TableCell>Issue Type</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>Count</TableCell>
                          <TableCell>Message</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResult.validation_results.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell>{issue.field}</TableCell>
                            <TableCell>{issue.issue_type}</TableCell>
                            <TableCell>
                              <Chip
                                label={issue.severity}
                                size="small"
                                color={
                                  issue.severity === 'error' ? 'error' :
                                  issue.severity === 'warning' ? 'warning' : 'info'
                                }
                              />
                            </TableCell>
                            <TableCell>{issue.count}</TableCell>
                            <TableCell>{issue.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedDataImport;
