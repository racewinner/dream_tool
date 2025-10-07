import React, { useState, useEffect } from 'react';
import { Backdrop, CircularProgress, LinearProgress, Box, Typography } from '@mui/material';

type LoadingIndicatorProps = {
  /**
   * If true, the loading indicator will be shown
   */
  loading: boolean;
  /**
   * The type of loading indicator to show
   * @default 'circular'
   */
  type?: 'circular' | 'linear' | 'backdrop';
  /**
   * The message to display with the loading indicator
   */
  message?: string;
  /**
   * The position of the linear progress indicator
   * @default 'top'
   */
  position?: 'top' | 'bottom';
  /**
   * The size of the circular progress indicator
   * @default 40
   */
  size?: number;
  /**
   * The color of the loading indicator
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'inherit';
};

/**
 * A flexible loading indicator component that can be used throughout the application
 * to show loading states with different styles and positions.
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  loading,
  type = 'circular',
  message,
  position = 'top',
  size = 40,
  color = 'primary',
}) => {
  const [show, setShow] = useState(false);
  
  // Add a small delay before showing the loading indicator to prevent flickering
  // for very fast operations
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (loading) {
      timer = setTimeout(() => {
        setShow(true);
      }, 200);
    } else {
      setShow(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);
  
  if (!loading || !show) {
    return null;
  }
  
  const renderIndicator = () => {
    switch (type) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', position: 'fixed', [position]: 0, left: 0, zIndex: 1400 }}>
            <LinearProgress color={color} />
            {message && (
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {message}
                </Typography>
              </Box>
            )}
          </Box>
        );
        
      case 'backdrop':
        return (
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={true}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress color={color} size={size} />
              {message && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {message}
                </Typography>
              )}
            </Box>
          </Backdrop>
        );
        
      case 'circular':
      default:
        return (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              p: 4,
              width: '100%',
              height: '100%',
              minHeight: 200
            }}
          >
            <CircularProgress color={color} size={size} />
            {message && (
              <Typography variant="body1" sx={{ mt: 2 }}>
                {message}
              </Typography>
            )}
          </Box>
        );
    }
  };
  
  return renderIndicator();
};

export default LoadingIndicator;
