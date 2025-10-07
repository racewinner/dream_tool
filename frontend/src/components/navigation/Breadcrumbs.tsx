import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Link, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { menuItems } from '../layout/menuConfig';

/**
 * Custom breadcrumbs component for navigation
 * Dynamically generates breadcrumbs based on current URL path
 */
const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Helper function to get a pretty display name for a path segment
  const getDisplayName = (path: string, currentPath: string): string => {
    // Search in the main menu items
    for (const item of menuItems) {
      // For main section routes (e.g., /data, /maintenance)
      if (item.path === `/${path}`) {
        return item.text;
      }

      // For subsection routes (e.g., /data/import, /maintenance/analytics)
      if (item.subItems && currentPath.startsWith(item.path)) {
        const subItem = item.subItems.find(subItem => subItem.path === currentPath);
        if (subItem) {
          return subItem.text;
        }
      }
    }

    // If not found in menu items, capitalize the path segment
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  // Return empty div if we're at the root
  if (pathnames.length === 0) {
    return <Box sx={{ height: 24, mb: 2 }} />;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
      >
        <Link 
          component={RouterLink} 
          to="/" 
          color="inherit" 
          underline="hover"
        >
          Dashboard
        </Link>

        {pathnames.map((path, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = getDisplayName(path, routeTo);

          return isLast ? (
            <Typography color="text.primary" key={routeTo}>
              {displayName}
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              to={routeTo}
              color="inherit"
              underline="hover"
              key={routeTo}
            >
              {displayName}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
