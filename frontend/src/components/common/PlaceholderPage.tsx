import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Divider, 
  Breadcrumbs, 
  Link as MuiLink,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Construction as ConstructionIcon } from '@mui/icons-material';

interface PlaceholderPageProps {
  title: string;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
  }>;
  description?: string;
}

/**
 * A reusable placeholder page component with high contrast styling
 * for pages that are not yet implemented
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title, 
  breadcrumbs = [],
  description = "This feature is coming soon. Check back later for updates."
}) => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs with high contrast */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, color: 'primary.light' }}>
          <MuiLink 
            component={RouterLink} 
            to="/"
            color="primary.light"
            sx={{ 
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Home
          </MuiLink>
          
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography key={index} color="primary.light" fontWeight="medium">
                {crumb.label}
              </Typography>
            ) : (
              <MuiLink
                key={index}
                component={RouterLink}
                to={crumb.path || '#'}
                color="primary.light"
                sx={{ 
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {crumb.label}
              </MuiLink>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3
          }}
        >
          <ConstructionIcon 
            color="primary" 
            sx={{ 
              fontSize: 60, 
              mb: 2,
              opacity: 0.8
            }} 
          />
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            align="center"
            color="primary.main"
            sx={{ fontWeight: 'medium' }}
          >
            {title}
          </Typography>
          <Divider sx={{ width: '100%', my: 2 }} />
          <Typography 
            variant="body1" 
            align="center"
            paragraph
            color="primary.light"
            sx={{ maxWidth: 600 }}
          >
            {description}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PlaceholderPage;
