import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const MinimalTestImport: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h3" color="primary">
            🎯 MINIMAL TEST COMPONENT
          </Typography>
          <Typography variant="h5" sx={{ mt: 2 }}>
            Enhanced Data Import - Minimal Test
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            If you can see this page, the routing is working correctly.
            This is the absolute minimal component with no dependencies.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, p: 2, bgcolor: 'success.light' }}>
            ✅ React: Working<br />
            ✅ Material-UI: Working<br />
            ✅ Routing: Working<br />
            ✅ Component: Rendering
          </Typography>
          <Typography variant="h6" sx={{ mt: 3, color: 'error.main' }}>
            No KoboToolbox components loaded - this is intentional for testing!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MinimalTestImport;
