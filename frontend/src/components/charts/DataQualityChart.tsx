import React from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { ChartDataPoint } from '../../services/visualizationService';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

interface DataQualityChartProps {
  data: ChartDataPoint[];
  title?: string;
  loading?: boolean;
  error?: string;
  height?: number;
}

/**
 * Component for visualizing data quality metrics using a multi-bar chart
 */
const DataQualityChart: React.FC<DataQualityChartProps> = ({
  data,
  title = 'Data Quality',
  loading = false,
  error,
  height = 350
}) => {
  const theme = useTheme();
  
  // Sort data by value in descending order for better visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
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
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: sortedData.map(item => item.label),
      labels: {
        style: {
          fontSize: '12px'
        },
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true
      }
    },
    yaxis: {
      title: {
        text: 'Quality Score (%)'
      },
      min: 0,
      max: 100,
      forceNiceScale: true
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.2,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.85,
        opacityTo: 1,
        stops: [0, 100]
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + "%"
        }
      }
    },
    colors: [theme.palette.secondary.main]
  };

  // Prepare chart series data
  const series = [{
    name: 'Quality Score',
    data: sortedData.map(item => item.value)
  }];

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
        <Typography color="textSecondary">No data quality metrics available</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ height: height, position: 'relative' }}>
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="bar"
          height={height}
        />
      </Box>
    </Paper>
  );
};

export default DataQualityChart;
