import { Theme } from '@mui/material/styles';

/**
 * Generates a color palette based on the theme
 * @param theme - The MUI theme object
 * @returns An array of color strings
 */
export function generateColorPalette(theme: Theme): string[] {
  return [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.success.light,
    theme.palette.error.light,
    theme.palette.warning.light,
    theme.palette.info.light,
  ];
}

/**
 * Helper function to format numbers with commas
 * @param value - The number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Helper function to format currency values
 * @param value - The number to format as currency
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
