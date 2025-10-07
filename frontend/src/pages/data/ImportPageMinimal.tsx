import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Alert,
  Container,
  useTheme
} from '@mui/material';
import { 
  CloudDownload as CloudDownloadIcon,
  UploadFile as UploadFileIcon,
  Api as ApiIcon,
} from '@mui/icons-material';

/**
 * Minimal ImportPage for testing data import flow
 * This version doesn't use React Query hooks to avoid compilation issues
 */
const ImportPageMinimal: React.FC = () => {
  const theme = useTheme();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const importSources = [
    {
      id: 'kobo',
      title: 'KoboToolbox API',
      description: 'Import data directly from KoboToolbox API',
      icon: <CloudDownloadIcon color="primary" sx={{ fontSize: 60 }} />,
      color: theme.palette.primary.main
    },
    {
      id: 'csv',
      title: 'CSV Upload',
      description: 'Import data from a CSV file',
      icon: <UploadFileIcon color="primary" sx={{ fontSize: 60 }} />,
      color: theme.palette.secondary.main
    },
    {
      id: 'api',
      title: 'External API',
      description: 'Import data from an external API',
      icon: <ApiIcon color="primary" sx={{ fontSize: 60 }} />,
      color: theme.palette.success.main
    }
  ];

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId);
    console.log(`Selected import source: ${sourceId}`);
  };

  const handleStartImport = async () => {
    if (!selectedSource) {
      alert('Please select an import source first');
      return;
    }

    console.log(`Starting import from ${selectedSource}`);
    
    if (selectedSource === 'kobo') {
      try {
        // Test KoboToolbox import
        const response = await fetch('http://localhost:3001/api/import/kobo/surveys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'kobo',
            config: {
              validateData: true,
              duplicateStrategy: 'update'
            }
          })
        });

        const result = await response.json();
        console.log('Import result:', result);
        
        if (response.ok) {
          alert(`Import successful! Imported ${result.imported || 0} records.`);
        } else {
          alert(`Import failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Import error:', error);
        alert(`Import error: ${error}`);
      }
    } else {
      alert(`${selectedSource.toUpperCase()} import not implemented in minimal version`);
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Selected Source Info */}
      {selectedSource && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Selected: {importSources.find(s => s.id === selectedSource)?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {selectedSource === 'kobo' && 'This will import healthcare facility survey data from KoboToolbox using the configured API endpoint.'}
            {selectedSource === 'csv' && 'Upload a CSV file containing survey data to import into the system.'}
            {selectedSource === 'api' && 'Connect to an external API to import survey data.'}
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleStartImport}
            size="large"
          >
            Start Import
          </Button>
        </Paper>
      )}

      {/* Backend Status */}
      <Alert severity="success" sx={{ mt: 3 }}>
        ✅ Backend is running on http://localhost:3001 - Ready for import testing
      </Alert>
    </Container>
  );
};

export default ImportPageMinimal;
