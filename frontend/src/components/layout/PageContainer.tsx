import React, { ReactNode } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

type PageContainerProps = {
  /**
   * The content of the page
   */
  children: ReactNode;
  /**
   * Custom styles for the container
   */
  sx?: object;
  /**
   * If true, the container will take full viewport height
   * @default false
   */
  fullHeight?: boolean;
  /**
   * If true, the container will have a max-width and be centered
   * @default true
   */
  maxWidth?: boolean | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * If true, the container will have padding
   * @default true
   */
  disableGutters?: boolean;
  /**
   * The component used for the root node
   * @default 'div'
   */
  component?: React.ElementType;
};

/**
 * A container component that provides consistent layout and spacing for pages.
 * It handles responsive behavior and provides a clean, consistent look across the application.
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  sx = {},
  fullHeight = false,
  maxWidth = false,
  disableGutters = false,
  component = 'div',
  ...rest
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Calculate max width based on prop
  const getMaxWidth = () => {
    if (maxWidth === false) return 'none';
    if (maxWidth === true) return 'lg';
    return maxWidth;
  };

  // Calculate padding based on screen size
  const getPadding = () => {
    if (disableGutters) return 0;
    return isMobile ? 2 : isTablet ? 3 : 4;
  };

  return (
    <Box
      component={component}
      sx={{
        width: '100%',
        height: fullHeight ? '100%' : 'auto',
        minHeight: fullHeight ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 0 auto',
        ...(maxWidth && {
          maxWidth: (theme: any) => {
            const width = getMaxWidth();
            return width !== 'none' ? theme.breakpoints.width(width) : 'none';
          },
          margin: '0 auto',
        }),
        p: getPadding(),
        [theme.breakpoints.down('sm')]: {
          p: disableGutters ? 0 : 2,
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default PageContainer;
