import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// Mock data fetch function
const fetchSolarSystems = async () => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: Array(15).fill(0).map((_, i) => ({
          id: `sys-${i + 1}`,
          name: `Solar System ${i + 1}`,
          location: `Location ${i + 1}`,
          capacity: (Math.random() * 10 + 1).toFixed(2) + ' kW',
          status: ['active', 'inactive', 'maintenance'][Math.floor(Math.random() * 3)],
          lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        })),
        total: 15,
      });
    }, 500);
  });
};

const SolarSystemsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery(['solarSystems'], fetchSolarSystems);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <Typography>Loading solar systems...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error loading solar systems</Typography>;
  }

  // Filter systems based on search term
  const filteredSystems = data?.data.filter((system: any) =>
    system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    system.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination
  const paginatedSystems = filteredSystems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Solar Systems
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/solar-systems/new')}
        >
          Add System
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search systems..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSystems.map((system: any) => (
              <TableRow key={system.id} hover>
                <TableCell>
                  <Link
                    component={RouterLink}
                    to={`/solar-systems/${system.id}`}
                    color="primary"
                    underline="hover"
                  >
                    {system.name}
                  </Link>
                </TableCell>
                <TableCell>{system.location}</TableCell>
                <TableCell>{system.capacity}</TableCell>
                <TableCell>
                  <Chip
                    label={system.status}
                    color={getStatusColor(system.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(system.lastUpdated), 'PPpp')}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/solar-systems/${system.id}`)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/solar-systems/${system.id}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSystems.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default SolarSystemsPage;
