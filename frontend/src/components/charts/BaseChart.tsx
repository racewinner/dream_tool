import React, { useRef, useEffect } from 'react';
import { Box, SxProps, Theme, CircularProgress, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  ChartType,
  Plugin,
  registerables,
} from 'chart.js';
import { Chart as ReactChart } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';

// Register all ChartJS components
ChartJS.register(...registerables);

export interface BaseChartProps {
  /**
   * The type of chart to render
   * @default 'line'
   */
  type?: ChartType;
  /**
   * The data to be displayed in the chart
   */
  data: ChartData;
  /**
   * The options for the chart
   */
  options?: ChartOptions;
  /**
   * The width of the chart
   * @default '100%'
   */
  width?: number | string;
  /**
   * The height of the chart
   * @default 300
   */
  height?: number | string;
  /**
   * Whether to show the loading state
   * @default false
   */
  loading?: boolean;
  /**
   * The loading text to display
   * @default 'Loading...'
   */
  loadingText?: string;
  /**
   * Custom styles for the chart container
   */
  sx?: SxProps<Theme>;
  /**
   * Custom plugins for the chart
   */
  plugins?: Plugin[];
  /**
   * Callback when the chart is clicked
   */
  onClick?: (event: any, elements: any, chart: ChartJS) => void;
  /**
   * The test ID for testing
   */
  testId?: string;
}

/**
 * A base chart component that provides common functionality and styling
 * for all chart types. This component should be extended by specific chart types.
 */
const BaseChart: React.FC<BaseChartProps> = ({
  type = 'line',
  data,
  options = {},
  width = '100%',
  height = 300,
  loading = false,
  loadingText = 'Loading...',
  sx = {},
  plugins = [],
  onClick,
  testId = 'base-chart',
}) => {
  const theme = useTheme();
  const chartRef = useRef<ChartJSOrUndefined<ChartType, any, unknown>>(null);

  // Merge default options with user-provided options
  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary,
          font: {
            family: theme.typography.fontFamily,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        titleFont: {
          family: theme.typography.fontFamily,
          weight: 'bold',
        },
        bodyFont: {
          family: theme.typography.fontFamily,
        },
        padding: 12,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: true,
        intersect: false,
        mode: 'index' as const,
        position: 'average' as const,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
          },
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
          },
          padding: 8,
        },
      },
    },
    ...options,
  };

  // Handle chart click events
  const handleClick = (event: any) => {
    if (!chartRef.current || !onClick) return;
    
    const chart = chartRef.current;
    const elements = chart.getElementsAtEventForMode(
      event,
      'nearest',
      { intersect: true },
      false
    );
    
    onClick(event, elements, chart);
  };

  // Register plugins
  useEffect(() => {
    if (plugins && plugins.length > 0) {
      plugins.forEach(plugin => {
        ChartJS.register(plugin);
      });

      return () => {
        plugins.forEach(plugin => {
          ChartJS.unregister(plugin);
        });
      };
    }
  }, [plugins]);

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        ...sx,
      }}
      data-testid={testId}
    >
      {loading ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 1,
              backgroundColor: 'background.paper',
              boxShadow: 1,
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {loadingText}
            </Typography>
          </Box>
        </Box>
      ) : null}
      
      <ReactChart
        ref={chartRef}
        type={type}
        data={data}
        options={chartOptions}
        onClick={handleClick}
      />
    </Box>
  );
};

export default BaseChart;
