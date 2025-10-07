import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const TestKoboPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h3" color="primary">
            🎉 TEST PAGE WORKING!
          </Typography>
          <Typography variant="h5" sx={{ mt: 2 }}>
            KoboToolbox Integration Test
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            If you can see this page, the routing is working correctly.
            This confirms the frontend container has been updated.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, p: 2, bgcolor: 'success.light' }}>
            ✅ Frontend container: Updated<br />
            ✅ Routing: Working<br />
            ✅ Components: Loading<br />
            ✅ Ready for KoboToolbox integration
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestKoboPage;
