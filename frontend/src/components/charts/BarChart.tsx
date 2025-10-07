import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import BaseChart, { BaseChartProps } from './BaseChart';
import { useTheme } from '@mui/material/styles';

export interface BarChartProps extends Omit<BaseChartProps, 'type' | 'data' | 'options'> {
  /**
   * The data for the bar chart
   */
  data: ChartData<'bar', (number | [number, number] | null)[], unknown>;
  /**
   * The options for the bar chart
   */
  options?: ChartOptions<'bar'>;
  /**
   * Whether the bars should be horizontal
   * @default false
   */
  horizontal?: boolean;
  /**
   * Whether to stack the bars
   * @default false
   */
  stacked?: boolean;
  /**
   * The width of the bars as a percentage of the available width
   * @default 0.6
   */
  barPercentage?: number;
  /**
   * The width of the category as a percentage of the available width
   * @default 0.8
   */
  categoryPercentage?: number;
  /**
   * The border radius of the bars in pixels
   * @default 4
   */
  borderRadius?: number;
  /**
   * Whether to show grid lines
   * @default true
   */
  showGrid?: boolean;
  /**
   * Whether to show the values on top of the bars
   * @default false
   */
  showValues?: boolean;
  /**
   * Format function for the values displayed on top of bars
   */
  valueFormatter?: (value: number) => string;
}

/**
 * A bar chart component that extends the BaseChart with specific configurations
 * for bar charts, including horizontal/vertical orientation, stacking, and more.
 */
const BarChart: React.FC<BarChartProps> = ({
  data,
  options = {},
  horizontal = false,
  stacked = false,
  barPercentage = 0.6,
  categoryPercentage = 0.8,
  borderRadius = 4,
  showGrid = true,
  showValues = false,
  valueFormatter = (value) => value.toLocaleString(),
  ...rest
}) => {
  const theme = useTheme();

  // Process the data to apply bar chart specific configurations
  const processedData = React.useMemo(() => {
    if (!data?.datasets) return data;

    return {
      ...data,
      datasets: data.datasets.map((dataset, index) => ({
        ...dataset,
        type: 'bar' as const,
        backgroundColor: Array.isArray(dataset.backgroundColor)
          ? dataset.backgroundColor
          : dataset.backgroundColor || theme.palette.primary.main,
        borderColor: dataset.borderColor || theme.palette.primary.main,
        borderWidth: 1,
        borderSkipped: false,
        borderRadius,
        barPercentage,
        categoryPercentage,
        // @ts-ignore - This is a valid property for bar charts
        barThickness: 'flex' as const,
        maxBarThickness: 100,
        minBarLength: 0,
      })),
    };
  }, [barPercentage, borderRadius, categoryPercentage, data, theme.palette.primary.main]);

  // Merge default options with user-provided options
  const chartOptions = React.useMemo<ChartOptions<'bar'>>(() => {
    const baseOptions: ChartOptions<'bar'> = {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: theme.palette.text.primary,
          },
        },
        tooltip: {
          backgroundColor: theme.palette.background.paper,
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.primary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y ?? context.parsed.x;
              return `${label}: ${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: showGrid && !horizontal,
            color: theme.palette.divider,
          },
          stacked,
          ticks: {
            color: theme.palette.text.secondary,
          },
          ...(horizontal && {
            title: {
              display: true,
              color: theme.palette.text.secondary,
            },
          }),
        },
        y: {
          grid: {
            display: showGrid && horizontal,
            color: theme.palette.divider,
          },
          stacked,
          ticks: {
            color: theme.palette.text.secondary,
            callback: (value) => {
              if (typeof value === 'number') {
                return value >= 1000 ? `${value / 1000}k` : value;
              }
              return value;
            },
          },
          ...(!horizontal && {
            title: {
              display: true,
              color: theme.palette.text.secondary,
            },
          }),
        },
      },
    };

    // Add data labels if showValues is true
    if (showValues) {
      baseOptions.plugins = {
        ...baseOptions.plugins,
        tooltip: {
          ...baseOptions.plugins?.tooltip,
          callbacks: {
            ...baseOptions.plugins?.tooltip?.callbacks,
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y ?? context.parsed.x;
              return `${label}: ${valueFormatter(Number(value))}`;
            },
          },
        },
      };

      // Add custom plugin to display values on top of bars
      baseOptions.plugins = {
        ...baseOptions.plugins,
        // @ts-ignore - This is a valid plugin
        customCanvasBackgroundColor: {
          color: theme.palette.background.default,
        },
      };

      // @ts-ignore - This is a valid plugin
      baseOptions.plugins.barValue = {
        // @ts-ignore
        draw: (chart: any) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;
          
          chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            
            meta.data.forEach((bar: any, index: number) => {
              const model = bar;
              const value = dataset.data[index];
              
              if (value === null || value === undefined) return;
              
              const x = model.x;
              const y = model.y;
              const width = model.width;
              const height = model.height;
              
              ctx.font = `${theme.typography.fontSize}px ${theme.typography.fontFamily}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = theme.palette.text.primary;
              
              const formattedValue = valueFormatter(Number(value));
              
              if (horizontal) {
                // For horizontal bars, place text inside the bar
                const textX = x + (width > 0 ? 5 : -5);
                const textY = y;
                ctx.textAlign = width > 0 ? 'left' : 'right';
                ctx.fillStyle = theme.palette.getContrastText(
                  Array.isArray(dataset.backgroundColor) 
                    ? dataset.backgroundColor[index % dataset.backgroundColor.length] 
                    : dataset.backgroundColor || theme.palette.primary.main
                );
                ctx.fillText(formattedValue, textX, textY);
              } else {
                // For vertical bars, place text on top of the bar
                const textX = x;
                const textY = y - 10;
                ctx.fillStyle = theme.palette.text.primary;
                ctx.fillText(formattedValue, textX, textY);
              }
            });
          });
        },
      };
    }

    return {
      ...baseOptions,
      ...options,
    };
  }, [horizontal, options, showGrid, showValues, stacked, theme, valueFormatter]);

  return (
    <BaseChart
      type="bar"
      data={processedData}
      options={chartOptions}
      {...rest}
    />
  );
};

export default BarChart;
