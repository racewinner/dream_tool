import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import BaseChart, { BaseChartProps } from './BaseChart';
import { useTheme } from '@mui/material/styles';

export interface PieChartProps extends Omit<BaseChartProps, 'type' | 'data' | 'options'> {
  /**
   * The data for the pie/donut chart
   */
  data: ChartData<'pie' | 'doughnut', (number | null)[], unknown>;
  /**
   * The options for the pie/donut chart
   */
  options?: ChartOptions<'pie' | 'doughnut'>;
  /**
   * Whether to display the chart as a donut
   * @default false
   */
  donut?: boolean;
  /**
   * The thickness of the donut (as a percentage of the chart radius)
   * @default 0.5
   */
  donutThickness?: number;
  /**
   * Whether to show the values as labels on the chart
   * @default true
   */
  showLabels?: boolean;
  /**
   * The position of the legend
   * @default 'right'
   */
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The format for the tooltip values
   * @default (value, total) => `${((value / total) * 100).toFixed(1)}%`
   */
  tooltipValueFormat?: (value: number, total: number) => string;
  /**
   * The format for the label values
   * @default (value, total) => `${((value / total) * 100).toFixed(0)}%`
   */
  labelValueFormat?: (value: number, total: number) => string;
}

/**
 * A pie/donut chart component that extends the BaseChart with specific configurations
 * for pie and donut charts, including labels, tooltips, and custom styling.
 */
const PieChart: React.FC<PieChartProps> = ({
  data,
  options = {},
  donut = false,
  donutThickness = 0.5,
  showLabels = true,
  legendPosition = 'right',
  tooltipValueFormat = (value, total) => `${((value / total) * 100).toFixed(1)}%`,
  labelValueFormat = (value, total) => `${((value / total) * 100).toFixed(0)}%`,
  ...rest
}) => {
  const theme = useTheme();
  const chartType = donut ? 'doughnut' : 'pie';

  // Calculate total for percentage calculations
  const total = React.useMemo(() => {
    if (!data?.datasets?.[0]?.data) return 0;
    return (data.datasets[0].data as number[]).reduce((a, b) => (a || 0) + (b || 0), 0) || 1;
  }, [data]);

  // Process the data to apply pie/donut chart specific configurations
  const processedData = React.useMemo(() => {
    if (!data?.datasets) return data;

    return {
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        type: chartType as any,
        backgroundColor: dataset.backgroundColor || [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.error.main,
          theme.palette.warning.main,
          theme.palette.info.main,
        ],
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
        hoverOffset: 8,
        // @ts-ignore - This is a valid property for pie/donut charts
        cutout: donut ? `${donutThickness * 100}%` : 0,
        // @ts-ignore - This is a valid property for pie/donut charts
        offset: Array.isArray(dataset.data) ? dataset.data.map(() => 0) : 0,
      })),
    };
  }, [chartType, data, donut, donutThickness, theme]);

  // Merge default options with user-provided options
  const chartOptions = React.useMemo<ChartOptions<typeof chartType>>(() => {
    const baseOptions: ChartOptions<typeof chartType> = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 16,
      },
      plugins: {
        legend: {
          position: legendPosition,
          labels: {
            color: theme.palette.text.primary,
            padding: 20,
            boxWidth: 12,
            usePointStyle: true,
            pointStyle: 'circle',
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
              const label = context.label || '';
              const value = context.raw as number;
              const formattedValue = tooltipValueFormat(value, total);
              return `${label}: ${formattedValue}`;
            },
          },
        },
      },
      // @ts-ignore - This is a valid property for pie/donut charts
      cutout: donut ? `${donutThickness * 100}%` : 0,
      radius: '80%',
    };

    // Add data labels if showLabels is true
    if (showLabels) {
      baseOptions.plugins = {
        ...baseOptions.plugins,
        // @ts-ignore - This is a valid plugin
        datalabels: {
          color: theme.palette.getContrastText(theme.palette.background.paper),
          font: {
            weight: 'bold' as const,
            size: theme.typography.fontSize,
          },
          formatter: (value: number) => {
            return labelValueFormat(value, total);
          },
          textAlign: 'center' as const,
        },
      };
    }

    return {
      ...baseOptions,
      ...options,
    };
  }, [
    chartType,
    donut,
    donutThickness,
    labelValueFormat,
    legendPosition,
    options,
    showLabels,
    theme,
    theme.palette,
    tooltipValueFormat,
    total,
  ]);

  return (
    <BaseChart
      type={chartType}
      data={processedData}
      options={chartOptions}
      {...rest}
    />
  );
};

export default PieChart;
