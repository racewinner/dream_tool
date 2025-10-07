import React, { ReactNode, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  SxProps, 
  Theme, 
  IconButton, 
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { Refresh, Download, Fullscreen, Error as ErrorIcon } from '@mui/icons-material';

interface ChartContainerProps {
  /**
   * The title of the chart
   */
  title?: string;
  /**
   * The subtitle of the chart
   */
  subtitle?: string;
  /**
   * Whether the chart is in a loading state
   * @default false
   */
  loading?: boolean;
  /**
   * The loading text to display
   * @default 'Loading...'
   */
  loadingText?: string;
  /**
   * Whether the chart is in an error state
   * @default false
   */
  error?: boolean;
  /**
   * The error message to display
   */
  errorText?: string;
  /**
   * Callback when the refresh button is clicked
   */
  onRefresh?: () => void;
  /**
   * Callback when the download button is clicked
   */
  onDownload?: () => void;
  /**
   * Callback when the fullscreen button is clicked
   */
  onFullscreen?: () => void;
  /**
   * Custom actions to display in the header
   */
  actions?: ReactNode;
  /**
   * The height of the chart container
   * @default '400px'
   */
  height?: number | string;
  /**
   * Custom styles for the container
   */
  sx?: SxProps<Theme>;
  /**
   * Whether to show the container with a paper background
   * @default true
   */
  paper?: boolean;
  /**
   * The content of the chart
   */
  children: ReactNode;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * A container component for charts that provides a consistent layout,
 * loading/error states, and common actions like refresh and download.
 */
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  loading = false,
  loadingText = 'Loading...',
  error = false,
  errorText = 'Failed to load chart data',
  onRefresh,
  onDownload,
  onFullscreen,
  actions,
  height = '400px',
  sx = {},
  paper = true,
  children,
  className = '',
}) => {
  const theme = useTheme();
  
  // Memoize the content to prevent unnecessary re-renders
  const content = useMemo(() => {
    if (error) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 3,
            textAlign: 'center',
            color: theme.palette.error.main,
            backgroundColor: alpha(theme.palette.error.light, 0.1),
            borderRadius: 1,
          }}
        >
          <ErrorIcon fontSize="large" color="error" sx={{ mb: 1 }} />
          <Typography variant="body1" color="error">
            {errorText}
          </Typography>
          {onRefresh && (
            <Box sx={{ mt: 2 }}>
              <Tooltip title="Retry">
                <IconButton 
                  color="error" 
                  onClick={onRefresh}
                  size="small"
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      );
    }
    
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <CircularProgress size={40} thickness={4} />
          {loadingText && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              {loadingText}
            </Typography>
          )}
        </Box>
      );
    }
    
    return children;
  }, [children, error, errorText, loading, loadingText, onRefresh, theme]);
  
  // Build the chart header with title and actions
  const header = useMemo(() => {
    if (!title && !onRefresh && !onDownload && !onFullscreen && !actions) {
      return null;
    }
    
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 0,
        }}
      >
        <Box>
          {title && (
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {actions}
          
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton 
                size="small" 
                onClick={onRefresh}
                disabled={loading}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {onDownload && (
            <Tooltip title="Download">
              <IconButton 
                size="small" 
                onClick={onDownload}
                disabled={loading || error}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {onFullscreen && (
            <Tooltip title="Fullscreen">
              <IconButton size="small">
                <Fullscreen fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  }, [title, subtitle, actions, onRefresh, onDownload, onFullscreen, loading, error]);
  
  // The main container with optional Paper wrapper
  const containerContent = (
    <Box
      className={`chart-container ${className}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {header}
      
      <Box
        sx={{
          flex: 1,
          p: 2,
          pt: header ? 2 : 0,
          position: 'relative',
          minHeight: 0, // Fix for flex container
        }}
      >
        {content}
      </Box>
    </Box>
  );
  
  // Wrap in Paper if specified
  if (paper) {
    return (
      <Paper
        elevation={2}
        sx={{
          height,
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {containerContent}
      </Paper>
    );
  }
  
  return (
    <Box
      sx={{
        height,
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {containerContent}
    </Box>
  );
};

export default ChartContainer;
