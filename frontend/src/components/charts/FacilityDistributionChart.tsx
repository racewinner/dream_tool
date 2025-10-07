import React from 'react';
import { Paper, Typography, CircularProgress, Box } from '@mui/material';
import { ChartDataPoint } from '../../services/visualizationService';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

interface FacilityDistributionChartProps {
  data: ChartDataPoint[];
  title?: string;
  loading?: boolean;
  error?: string;
  height?: number;
}

/**
 * Component for visualizing facility distribution data
 */
const FacilityDistributionChart: React.FC<FacilityDistributionChartProps> = ({
  data,
  title = 'Facility Distribution',
  loading = false,
  error,
  height = 350
}) => {
  const theme = useTheme();
  
  // Limit to top 10 facilities if there are too many
  const chartData = data.length > 10 
    ? [...data.slice(0, 9), {
        label: 'Others',
        value: data.slice(9).reduce((sum, item) => sum + item.value, 0)
      }]
    : data;

  // Prepare data for ApexCharts
  const series = chartData.map(item => item.value);
  const labels = chartData.map(item => item.label);

  const chartOptions = {
    chart: {
      type: 'bar' as const,
      height: height,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 4,
        horizontal: true,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: labels,
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      '#8884d8',
      '#82ca9d',
      '#ffc658',
      '#8dd1e1'
    ],
    legend: {
      show: false
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} surveys`
      }
    }
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

  if (!data.length) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: height + 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="textSecondary">No facility data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ height: height, position: 'relative' }}>
        <ReactApexChart
          options={chartOptions}
          series={[{ data: series }]}
          type="bar"
          height={height}
        />
      </Box>
    </Paper>
  );
};

export default FacilityDistributionChart;
