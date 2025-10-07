import React from 'react';
import { Paper, Typography, CircularProgress, Box } from '@mui/material';
import { TimeSeriesDataPoint } from '../../services/visualizationService';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';

interface DataQualityTimelineChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  loading?: boolean;
  error?: string;
  height?: number;
}

/**
 * Component for visualizing data quality timeline
 */
const DataQualityTimelineChart: React.FC<DataQualityTimelineChartProps> = ({
  data,
  title = 'Data Quality Timeline',
  loading = false,
  error,
  height = 350
}) => {
  const theme = useTheme();

  // Prepare data for ApexCharts
  const chartData = data.map(item => ({
    x: item.date,
    y: item.value
  }));

  // Sort data by date
  chartData.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());

  const chartOptions = {
    chart: {
      type: 'line' as const,
      height: height,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
        },
      },
      animations: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        formatter: function(value: string) {
          return format(new Date(value), 'MMM dd');
        }
      },
      tooltip: {
        enabled: false
      }
    },
    yaxis: {
      title: {
        text: 'Survey Count'
      }
    },
    tooltip: {
      x: {
        formatter: function(value: number) {
          return format(new Date(value), 'MMM dd, yyyy');
        }
      },
      y: {
        formatter: (val: number) => `${val} surveys`
      }
    },
    colors: [theme.palette.primary.main],
    grid: {
      borderColor: theme.palette.divider,
      row: {
        colors: [theme.palette.background.default, 'transparent'],
        opacity: 0.5
      }
    },
    markers: {
      size: 4,
      colors: [theme.palette.primary.main],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6
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
        <Typography color="textSecondary">No timeline data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ height: height, position: 'relative' }}>
        <ReactApexChart
          options={chartOptions}
          series={[{ name: 'Surveys', data: chartData }]}
          type="line"
          height={height}
        />
      </Box>
    </Paper>
  );
};

export default DataQualityTimelineChart;
