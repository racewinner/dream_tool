import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  GridOn as GridIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

// Mock data for reports
const reportTypes = [
  { id: 'performance', label: 'Performance Report', icon: <LineChartIcon /> },
  { id: 'maintenance', label: 'Maintenance Report', icon: <FilterListIcon /> },
  { id: 'financial', label: 'Financial Report', icon: <BarChartIcon /> },
  { id: 'inventory', label: 'Inventory Report', icon: <GridIcon /> },
  { id: 'energy', label: 'Energy Production', icon: <PieChartIcon /> },
  { id: 'custom', label: 'Custom Report', icon: <PdfIcon /> },
];

// Mock data for report history
const reportHistory = Array(15).fill(0).map((_, i) => ({
  id: `report-${i + 1}`,
  name: `Report ${i + 1}`,
  type: ['Performance', 'Maintenance', 'Financial', 'Inventory', 'Energy'][i % 5],
  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
  size: `${Math.floor(Math.random() * 5) + 1} MB`,
}));

const ReportsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [reportType, setReportType] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDateChange = (newValue: Date | null, index: number) => {
    const newDateRange = [...dateRange] as [Date | null, Date | null];
    newDateRange[index] = newValue;
    setDateRange(newDateRange);
    setPage(0);
  };

  const handleReportTypeChange = (event: SelectChangeEvent<string>) => {
    setReportType(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter reports based on search, date range, and type
  const filteredReports = reportHistory.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateRange[0] || !dateRange[1] || 
      (report.date >= dateRange[0] && report.date <= dateRange[1]);
    
    const matchesType = reportType === 'all' || 
      report.type.toLowerCase() === reportType.toLowerCase();
    
    return matchesSearch && matchesDate && matchesType;
  });

  // Pagination
  const paginatedReports = filteredReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Generate and manage reports for your solar PV systems
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {reportTypes.map((report) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={report.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 1 }}>
                  {React.cloneElement(report.icon, { fontSize: 'large' })}
                </Box>
                <Typography variant="subtitle1" gutterBottom>
                  {report.label}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Generate
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search reports..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250, flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              label="Report Type"
              onChange={handleReportTypeChange}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="performance">Performance</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="financial">Financial</MenuItem>
              <MenuItem value="inventory">Inventory</MenuItem>
              <MenuItem value="energy">Energy</MenuItem>
            </Select>
          </FormControl>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From"
              value={dateRange[0]}
              onChange={(newValue) => handleDateChange(newValue, 0)}
              renderInput={(params) => (
                <TextField {...params} size="small" sx={{ width: 150 }} />
              )}
            />
            <DatePicker
              label="To"
              value={dateRange[1]}
              onChange={(newValue) => handleDateChange(newValue, 1)}
              renderInput={(params) => (
                <TextField {...params} size="small" sx={{ width: 150 }} />
              )}
            />
          </LocalizationProvider>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>
                    {format(new Date(report.date), 'PPpp')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={report.status}
                      color={getStatusColor(report.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{report.size}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" size="small">
                      <PdfIcon />
                    </IconButton>
                    <IconButton color="primary" size="small">
                      <DownloadIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default ReportsPage;
