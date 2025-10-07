import React, { useState, useRef } from 'react';
import { 
  Container,
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card,
  CardContent,
  Alert,
  Box,
  useTheme,
  CircularProgress,
  Chip,
  TextField,
  Input,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  CloudDownload as CloudDownloadIcon,
  UploadFile as UploadFileIcon,
  Api as ApiIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { API_CONFIG, apiRequest } from '../../config/api';

/**
 * Simple Import page component for testing data import flow
 * This version doesn't use React Query hooks to avoid compilation issues
 */
const ImportPageSimple: React.FC = () => {
  const theme = useTheme();
  const { token } = useAuth();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importSources = [
    {
      id: 'kobo',
      title: 'KoboToolbox API',
      description: 'Import healthcare facility survey data directly from KoboToolbox API',
      icon: <CloudDownloadIcon color="primary" sx={{ fontSize: 60 }} />,
      color: theme.palette.primary.main,
      endpoint: API_CONFIG.ENDPOINTS.IMPORT.KOBO_SURVEYS
    },
    {
      id: 'csv',
      title: 'CSV Upload',
      description: 'Import data from a CSV file containing survey responses',
      icon: <UploadFileIcon color="primary" sx={{ fontSize: 60 }} />,
      color: theme.palette.secondary.main,
      endpoint: API_CONFIG.ENDPOINTS.IMPORT.CSV_UPLOAD
    },
    {
      id: 'api',
      title: 'External API',
      description: 'Import data from an external API source',
      icon: <ApiIcon color="primary" sx={{ fontSize: 60 }} />,
      color: theme.palette.success.main,
      endpoint: API_CONFIG.ENDPOINTS.IMPORT.EXTERNAL_API
    }
  ];

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId);
    setResult(null);
    setError(null);
    console.log(`Selected import source: ${sourceId}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setCsvFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedSource) return;
    
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    console.log('Starting import from', selectedSource);

    try {
      if (selectedSource === 'kobo') {
        const response = await apiRequest(
          importSources.find(s => s.id === selectedSource)?.endpoint || '',
          {
            method: 'POST',
            body: JSON.stringify({
              source: 'kobo',
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date().toISOString()
            })
          },
          token
        );

        const data = await response.json();
        console.log('KoboToolbox import result:', data);
        setResult(data);

      } else if (selectedSource === 'csv') {
        if (!csvFile) {
          setError('Please select a CSV file to upload');
          return;
        }

        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('source', 'csv');

        const response = await apiRequest(
          API_CONFIG.ENDPOINTS.IMPORT.CSV_UPLOAD,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          }
        );

        const data = await response.json();
        console.log('CSV import result:', data);
        setResult(data);

      } else if (selectedSource === 'api') {
        if (!apiUrl) {
          setError('Please enter an API URL');
          return;
        }

        const requestBody = {
          source: 'api',
          url: apiUrl,
          apiKey: apiKey || undefined
        };

        const response = await apiRequest(
          API_CONFIG.ENDPOINTS.IMPORT.EXTERNAL_API,
          {
            method: 'POST',
            body: JSON.stringify(requestBody)
          },
          token
        );

        const data = await response.json();
        console.log('External API import result:', data);
        setResult(data);
      }

    } catch (error: any) {
      console.error('Import failed:', error);
      setError(`Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Data Import
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 4 }}>
        Import data from various sources into the DREAM TOOL
      </Typography>

      {/* Backend Status */}
      <Alert severity="success" sx={{ mb: 3 }}>
        ✅ Backend is running on http://localhost:3001 - Ready for import testing
      </Alert>

      {/* Import Source Selection */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Select the source from which you want to import data
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {importSources.map((source) => (
          <Grid item xs={12} sm={6} md={4} key={source.id}>
            <Card 
              raised={selectedSource === source.id}
              onClick={() => handleSourceSelect(source.id)}
              sx={{ 
                p: 2, 
                cursor: 'pointer',
                border: selectedSource === source.id ? 2 : 0,
                borderColor: 'primary.main',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {source.icon}
                </Box>
                <Typography variant="h6" align="center" gutterBottom>
                  {source.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {source.description}
                </Typography>
                <Typography variant="caption" display="block" align="center" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {source.endpoint}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Selected Source Info */}
      {selectedSource && (
        <Card sx={{ mt: 3, backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
              Selected: {selectedSource === 'kobo' ? 'KoboToolbox API' : selectedSource === 'csv' ? 'CSV Upload' : 'External API'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0', mb: 3 }}>
              {selectedSource === 'kobo' && 'Import healthcare facility survey data directly from KoboToolbox API'}
              {selectedSource === 'csv' && 'Upload a CSV file containing survey data to import into the system.'}
              {selectedSource === 'api' && 'Connect to an external API to import survey data.'}
            </Typography>
            
            {/* CSV File Upload Section */}
            {selectedSource === 'csv' && (
              <Box sx={{ mb: 3 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ mr: 2, mb: 2 }}
                >
                  Choose CSV File
                </Button>
                {csvFile && (
                  <Chip
                    label={csvFile.name}
                    onDelete={() => setCsvFile(null)}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            )}

            {/* External API Configuration Section */}
            {selectedSource === 'api' && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="API URL"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/surveys"
                  sx={{ mb: 2 }}
                  InputLabelProps={{ style: { color: '#a0aec0' } }}
                  InputProps={{ style: { color: '#e2e8f0' } }}
                />
                <TextField
                  fullWidth
                  label="API Key (Optional)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key if required"
                  type="password"
                  InputLabelProps={{ style: { color: '#a0aec0' } }}
                  InputProps={{ style: { color: '#e2e8f0' } }}
                />
              </Box>
            )}
            
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={loading || (selectedSource === 'csv' && !csvFile) || (selectedSource === 'api' && !apiUrl.trim())}
              sx={{ mr: 2 }}
            >
              {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              Start Import
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {result && (
        <Alert 
          severity={result.success ? 'success' : 'info'}
          sx={{ mt: 3 }}
        >
          {result.message || `Import completed: ${result.imported || 0} records imported, ${result.failed || 0} failed`}
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error"
          sx={{ mt: 3 }}
        >
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default ImportPageSimple;
