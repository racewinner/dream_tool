import React from 'react';
import { ChartData, ChartOptions, Point, BubbleDataPoint } from 'chart.js';
import BaseChart, { BaseChartProps } from './BaseChart';
import { useTheme } from '@mui/material/styles';

export interface LineChartProps extends Omit<BaseChartProps, 'type' | 'data' | 'options'> {
  /**
   * The data for the line chart
   */
  data: ChartData<'line', (number | Point | BubbleDataPoint | null)[], unknown>;
  /**
   * The options for the line chart
   */
  options?: ChartOptions<'line'>;
  /**
   * Whether to show data points on the line
   * @default true
   */
  showPoints?: boolean;
  /**
   * Whether to fill the area under the line
   * @default false
   */
  fillArea?: boolean;
  /**
   * Whether to show a gradient under the line
   * @default false
   */
  gradientFill?: boolean;
  /**
   * Custom gradient colors [startColor, endColor]
   * @default ['rgba(26, 115, 232, 0.2)', 'rgba(26, 115, 232, 0)']
   */
  gradientColors?: [string, string];
  /**
   * The tension of the line (0-1)
   * @default 0.4
   */
  tension?: number;
  /**
   * The width of the line in pixels
   * @default 2
   */
  lineWidth?: number;
  /**
   * The radius of the points in pixels
   * @default 4
   */
  pointRadius?: number;
  /**
   * Whether to show grid lines
   * @default true
   */
  showGrid?: boolean;
}

/**
 * A line chart component that extends the BaseChart with specific configurations
 * for line charts, including gradient fills, point styling, and more.
 */
const LineChart: React.FC<LineChartProps> = ({
  data,
  options = {},
  showPoints = true,
  fillArea = false,
  gradientFill = false,
  gradientColors = ['rgba(26, 115, 232, 0.2)', 'rgba(26, 115, 232, 0)'],
  tension = 0.4,
  lineWidth = 2,
  pointRadius = 4,
  showGrid = true,
  ...rest
}) => {
  const theme = useTheme();

  // Process the data to apply line chart specific configurations
  const processedData = React.useMemo(() => {
    if (!data?.datasets) return data;

    return {
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        type: 'line' as const,
        borderWidth: lineWidth,
        borderColor: dataset.borderColor || theme.palette.primary.main,
        backgroundColor: fillArea 
          ? gradientFill
            ? (context: any) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                
                if (!chartArea) return;
                
                const gradient = ctx.createLinearGradient(
                  0,
                  chartArea.bottom,
                  0,
                  chartArea.top
                );
                
                gradient.addColorStop(0, gradientColors[0]);
                gradient.addColorStop(1, gradientColors[1]);
                
                return gradient;
              }
            : dataset.backgroundColor || `${theme.palette.primary.main}20`
          : 'transparent',
        pointBackgroundColor: dataset.pointBackgroundColor || theme.palette.primary.main,
        pointBorderColor: dataset.pointBorderColor || '#fff',
        pointHoverBackgroundColor: dataset.pointHoverBackgroundColor || theme.palette.primary.dark,
        pointHoverBorderColor: dataset.pointHoverBorderColor || '#fff',
        pointRadius: showPoints ? pointRadius : 0,
        pointHoverRadius: showPoints ? pointRadius + 2 : 0,
        pointHitRadius: showPoints ? 10 : 0,
        pointBorderWidth: showPoints ? 1 : 0,
        tension,
        fill: fillArea,
      })),
    };
  }, [data, fillArea, gradientFill, gradientColors, lineWidth, pointRadius, showPoints, tension, theme.palette.primary.main, theme.palette.primary.dark]);

  // Merge default options with user-provided options
  const chartOptions = React.useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        boxShadow: theme.shadows[3],
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y ?? context.parsed;
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: showGrid,
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        grid: {
          display: showGrid,
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => {
            if (typeof value === 'number') {
              return value >= 1000 ? `${value / 1000}k` : value;
            }
            return value;
          },
        },
      },
    },
    ...options,
  }), [options, showGrid, theme]);

  return (
    <BaseChart
      type="line"
      data={processedData}
      options={chartOptions}
      {...rest}
    />
  );
};

export default LineChart;
