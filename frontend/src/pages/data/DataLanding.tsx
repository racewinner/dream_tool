import React from 'react';
import { Container, Typography, Grid, Paper, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

/**
 * Data Landing Page - Hub for all data-related activities
 */
const DataLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Hub
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" paragraph>
        Explore and manage all survey data and related analysis
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {/* Survey Analysis Card */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
                cursor: 'pointer'
              },
            }}
            onClick={() => navigate('/data/survey-analysis')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BarChartIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Typography variant="h6">Survey Analysis</Typography>
            </Box>
            <Typography variant="body2" paragraph>
              Comprehensive visualizations and metrics from survey data. Analyze completeness,
              quality, facility distribution, and geographical distribution.
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/data/survey-analysis');
                }}
              >
                View Dashboard
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Detail View Card */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
                cursor: 'pointer'
              },
            }}
            onClick={() => navigate('/data/detail-view')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TableChartIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
              <Typography variant="h6">Detail View</Typography>
            </Box>
            <Typography variant="body2" paragraph>
              Drill down into specific survey data points and responses. Search, filter, and
              export individual survey records for detailed analysis.
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/data/detail-view');
                }}
              >
                Explore Data
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Import Card */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
                cursor: 'pointer'
              },
            }}
            onClick={() => navigate('/data/import')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CloudUploadIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Typography variant="h6">Data Import</Typography>
            </Box>
            <Typography variant="body2" paragraph>
              Import survey data from KoboToolbox and other sources. Schedule automatic imports,
              validate data quality, and track import history.
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Button 
                variant="contained" 
                color="info"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/data/import');
                }}
              >
                Import Data
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DataLanding;
