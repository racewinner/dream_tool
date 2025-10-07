import React from 'react';
import { Paper, Typography, CircularProgress, Box, Grid, Chip, Alert, LinearProgress } from '@mui/material';
import { RepeatGroupChartData } from '../../services/visualizationService';
import { useTheme } from '@mui/material/styles';

interface RepeatGroupAnalysisChartProps {
  data: RepeatGroupChartData[];
  title?: string;
  loading?: boolean;
  error?: string;
  height?: number;
}

const RepeatGroupAnalysisChart: React.FC<RepeatGroupAnalysisChartProps> = ({
  data = [],
  title = 'Repeat Group Analysis',
  loading = false,
  error,
  height = 350
}) => {
  const theme = useTheme();

  // Show at most 3 repeat groups in a single view
  const displayData = data.slice(0, 3);

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: height + 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: height + 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (!data.length) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: height + 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="textSecondary">No repeat group data available</Typography>
      </Paper>
    );
  }

  // Get consistency score color based on score value
  const getConsistencyColor = (score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get last segment of path for display
  const getPathDisplay = (path: string) => {
    const parts = path.split('.');
    return parts[parts.length - 1];
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        Displaying KoboToolbox repeat group analysis with simplified visualization
      </Alert>
      
      {displayData.map((group, index) => (
        <Box key={group.groupPath} sx={{ mb: index < displayData.length - 1 ? 3 : 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {getPathDisplay(group.groupPath)}
            </Typography>
            <Chip 
              label={`${group.instanceCount} instances`} 
              size="small" 
              variant="outlined" 
              color="primary" 
            />
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {group.groupPath}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>Completeness</Typography>
              {group.completenessData.map((item, idx) => (
                <Box key={idx} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">{item.label}</Typography>
                    <Typography variant="caption">{item.value}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={item.value} 
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>Consistency Score</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={group.consistencyScore} 
                  sx={{ 
                    flexGrow: 1, 
                    height: 8, 
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getConsistencyColor(group.consistencyScore)
                    }
                  }}
                />
                <Typography variant="caption" sx={{ color: getConsistencyColor(group.consistencyScore) }}>
                  {Math.round(group.consistencyScore)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ))}
      
      {data.length > 3 && (
        <Typography 
          variant="body2" 
          color="primary" 
          align="center" 
          sx={{ mt: 2, fontStyle: 'italic' }}
        >
          {data.length - 3} more repeat groups available
        </Typography>
      )}
    </Paper>
  );
};

export default RepeatGroupAnalysisChart;
