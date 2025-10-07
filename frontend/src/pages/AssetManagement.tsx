import { Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Asset {
  id: number;
  facilityId: number;
  pvCapacity: number;
  batteryCapacity: number;
  inverterType: string;
  installationDate: string;
  status: 'active' | 'maintenance' | 'faulty';
  lastMaintenance: string;
  nextMaintenance: string;
}

interface MaintenanceLog {
  id: number;
  assetId: number;
  date: string;
  issue: string;
  resolution: string;
  technician: string;
}

export default function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  const [newLog, setNewLog] = useState<Partial<MaintenanceLog>>({
    issue: '',
    resolution: '',
    technician: '',
  });

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchMaintenanceLogs = async (assetId: number) => {
    try {
      const response = await fetch(`/api/maintenance/${assetId}`);
      const data = await response.json();
      setMaintenanceLogs(data);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    }
  };

  const handleOpenDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    fetchMaintenanceLogs(asset.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedAsset(null);
    setOpenDialog(false);
    setNewLog({ issue: '', resolution: '', technician: '' });
  };

  const addMaintenanceLog = async () => {
    if (!selectedAsset) return;

    try {
      await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLog,
          assetId: selectedAsset.id,
          date: new Date().toISOString(),
        }),
      });
      fetchMaintenanceLogs(selectedAsset.id);
      setNewLog({ issue: '', resolution: '', technician: '' });
    } catch (error) {
      console.error('Error adding maintenance log:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Asset Management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Installed Systems
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Facility</TableCell>
                      <TableCell>PV Capacity (kW)</TableCell>
                      <TableCell>Battery Capacity (kWh)</TableCell>
                      <TableCell>Inverter Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{`Facility ${asset.facilityId}`}</TableCell>
                        <TableCell>{asset.pvCapacity}</TableCell>
                        <TableCell>{asset.batteryCapacity}</TableCell>
                        <TableCell>{asset.inverterType}</TableCell>
                        <TableCell>
                          <Typography
                            color={
                              asset.status === 'active'
                                ? 'success.main'
                                : asset.status === 'maintenance'
                                ? 'warning.main'
                                : 'error.main'
                            }
                          >
                            {asset.status}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            onClick={() => handleOpenDialog(asset)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedAsset && (
          <>
            <DialogTitle>
              {`Facility ${selectedAsset.facilityId} - Asset Details`}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6">System Specifications</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="PV Capacity (kW)"
                        value={selectedAsset.pvCapacity}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Battery Capacity (kWh)"
                        value={selectedAsset.batteryCapacity}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Inverter Type"
                        value={selectedAsset.inverterType}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Maintenance Logs</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Issue</TableCell>
                          <TableCell>Resolution</TableCell>
                          <TableCell>Technician</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {maintenanceLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                            <TableCell>{log.issue}</TableCell>
                            <TableCell>{log.resolution}</TableCell>
                            <TableCell>{log.technician}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Add New Maintenance Log</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Issue Description"
                        value={newLog.issue}
                        onChange={(e) => setNewLog({ ...newLog, issue: e.target.value })}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Resolution"
                        value={newLog.resolution}
                        onChange={(e) => setNewLog({ ...newLog, resolution: e.target.value })}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Technician"
                        value={newLog.technician}
                        onChange={(e) => setNewLog({ ...newLog, technician: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={addMaintenanceLog} variant="contained">
                Add Log
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
