import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PortfolioAnalytics from '../components/PortfolioAnalytics';
import { PortfolioData } from '../types/site';
import { Box, Grid, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add } from '@mui/icons-material';

interface PortfolioDashboardProps {
  data: PortfolioData;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ data }) => {
  const { user } = useAuth();
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const handleAddSite = () => {
    // TODO: Implement site addition logic
    setOpenAddDialog(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              Portfolio Dashboard
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => setOpenAddDialog(true)}
            >
              Add Site
            </Button>
          </Paper>
        </Grid>

        {/* Portfolio Analytics */}
        <Grid item xs={12}>
          <PortfolioAnalytics data={data} />
        </Grid>

        {/* Add Site Dialog */}
        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
          <DialogTitle>Add New Site</DialogTitle>
          <DialogContent>
            {/* TODO: Add site form */}
            <Typography>
              Site addition form will be implemented here
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSite} color="primary">
              Add Site
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default PortfolioDashboard;
