import React from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { ChartDataPoint } from '../../services/visualizationService';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

interface SurveyCompletenessChartProps {
  data: ChartDataPoint[];
  title?: string;
  loading?: boolean;
  error?: string;
  height?: number;
}

/**
 * Component for visualizing survey completeness data
 */
const SurveyCompletenessChart: React.FC<SurveyCompletenessChartProps> = ({
  data,
  title = 'Data Completeness',
  loading = false,
  error,
  height = 350
}) => {
  const theme = useTheme();

  // Find the "Complete" value in the data
  const completeValue = data.find(item => item.label === 'Complete')?.value ?? 0;
  const formattedValue = Math.round(completeValue);
  
  // Chart options for a radial/donut chart
  const chartOptions = {
    chart: {
      type: 'radialBar' as const,
      height: height,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: '70%',
          background: theme.palette.background.paper,
        },
        track: {
          background: theme.palette.grey[200],
          strokeWidth: '100%',
          dropShadow: {
            enabled: false
          }
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: theme.palette.text.secondary,
            fontSize: '13px'
          },
          value: {
            color: theme.palette.primary.main,
            fontSize: '30px',
            show: true,
            formatter: (val: number) => `${val}%`
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: [theme.palette.secondary.main],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    colors: [theme.palette.primary.main],
    stroke: {
      lineCap: 'round' as const
    },
    labels: ['Completeness']
  };

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

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ height: height, position: 'relative' }}>
        <ReactApexChart
          options={chartOptions}
          series={[formattedValue]}
          type="radialBar"
          height={height}
        />
      </Box>
    </Paper>
  );
};

export default SurveyCompletenessChart;
