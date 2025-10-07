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
  TextField
} from '@mui/material';
import { 
  CloudDownload as CloudDownloadIcon,
  UploadFile as UploadFileIcon,
  Api as ApiIcon,
} from '@mui/icons-material';

const ImportPage: React.FC = () => {
  const theme = useTheme();
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
      endpoint: '/api/import/kobo/surveys'
    },
    {
      id: 'csv',
      title: 'CSV Upload',
      description: 'Import data from a CSV file containing survey responses',
      icon: <UploadFileIcon color="primary" sx={{ fontSize: 60 }} />,
      endpoint: '/api/v2/imports'
    },
    {
      id: 'api',
      title: 'External API',
      description: 'Import data from an external API source',
      icon: <ApiIcon color="primary" sx={{ fontSize: 60 }} />,
      endpoint: '/api/import/external'
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

    setLoading(true);
    setError(null);
    setResult(null);

    console.log('Starting import from', selectedSource);

    try {
      if (selectedSource === 'kobo') {
        const response = await fetch(`http://localhost:3001/api/import/kobo/surveys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: '2024-01-01T00:00:00.000Z'
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Import result:', data);
        setResult(data);

      } else if (selectedSource === 'csv' && csvFile) {
        const formData = new FormData();
        formData.append('file', csvFile);

        const response = await fetch('http://localhost:3001/api/v2/imports', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResult(data);

      } else if (selectedSource === 'api' && apiUrl) {
        const response = await fetch('http://localhost:3001/api/import/external', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiUrl,
            apiKey: apiKey || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResult(data);
      }

    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#e2e8f0', mb: 2 }}>
        Data Import
      </Typography>
      <Typography variant="body1" sx={{ color: '#a0aec0', mb: 4 }}>
        Import survey data from various sources including KoboToolbox, CSV files, or external APIs.
      </Typography>

      <Grid container spacing={3}>
        {importSources.map((source) => (
          <Grid item xs={12} md={4} key={source.id}>
            <Card
              onClick={() => handleSourceSelect(source.id)}
              sx={{
                cursor: 'pointer',
                backgroundColor: selectedSource === source.id ? '#4a5568' : '#2d3748',
                border: selectedSource === source.id ? '2px solid' : '1px solid #4a5568',
                borderColor: selectedSource === source.id ? 'primary.main' : '#4a5568',
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
                <Typography variant="h6" align="center" gutterBottom sx={{ color: '#e2e8f0' }}>
                  {source.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ color: '#a0aec0' }}>
                  {source.description}
                </Typography>
                {selectedSource === source.id && (
                  <Chip 
                    label="Selected" 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 1, display: 'block', mx: 'auto', width: 'fit-content' }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedSource && (
        <Card sx={{ mt: 3, backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
              Selected: {selectedSource === 'kobo' ? 'KoboToolbox API' : selectedSource === 'csv' ? 'CSV Upload' : 'External API'}
            </Typography>
            
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
                  startIcon={<UploadFileIcon />}
                  sx={{ mb: 2 }}
                >
                  {csvFile ? `Selected: ${csvFile.name}` : 'Choose CSV File'}
                </Button>
              </Box>
            )}

            {selectedSource === 'api' && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="API URL"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/surveys"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="API Key (Optional)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Your API key if required"
                  type="password"
                />
              </Box>
            )}

            <Button
              variant="contained"
              onClick={handleImport}
              disabled={loading || (selectedSource === 'csv' && !csvFile) || (selectedSource === 'api' && !apiUrl)}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
              sx={{ mt: 2 }}
            >
              {loading ? 'Importing...' : 'Start Import'}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Card sx={{ mt: 3, backgroundColor: '#2d3748', border: '1px solid #4a5568' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
              Import Results
            </Typography>
            {result.success ? (
              <Alert severity="success">
                Successfully imported {result.imported} surveys
                {result.failed > 0 && ` (${result.failed} failed)`}
              </Alert>
            ) : (
              <Alert severity="error">
                Import failed: {result.message}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ImportPage;
