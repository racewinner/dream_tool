import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

interface ImportPreviewProps {
  sampleData: Record<string, any>[];
  validationErrors: Array<{ field: string; message: string }>;
  isValid: boolean;
  isLoading: boolean;
}

/**
 * Component to display preview of data to be imported with validation results
 */
const ImportPreview: React.FC<ImportPreviewProps> = ({
  sampleData,
  validationErrors,
  isValid,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sampleData || sampleData.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No sample data available for preview. Please check your data source configuration.
      </Alert>
    );
  }

  // Get all unique keys from the sample data
  const allKeys = Array.from(
    new Set(
      sampleData.flatMap(item => Object.keys(item))
    )
  ).sort();

  // Filter out some keys that might be too verbose or not useful in preview
  const filteredKeys = allKeys.filter(key => 
    !key.includes('_uuid') && 
    !key.includes('_submission_time') && 
    !key.startsWith('_') && 
    !key.endsWith('_id')
  );

  // Limit to most important fields if there are too many
  const displayKeys = filteredKeys.length > 8 ? filteredKeys.slice(0, 8) : filteredKeys;

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" gutterBottom>
          Data Preview
        </Typography>
        <Box>
          {isValid ? (
            <Chip 
              icon={<CheckCircleIcon />} 
              label="Data Valid" 
              color="success" 
              variant="outlined" 
            />
          ) : (
            <Chip 
              icon={<ErrorIcon />} 
              label="Validation Issues" 
              color="error" 
              variant="outlined" 
            />
          )}
        </Box>
      </Box>

      {validationErrors.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          icon={<WarningIcon fontSize="inherit" />}
        >
          <Typography variant="subtitle2" gutterBottom>
            {validationErrors.length} validation {validationErrors.length === 1 ? 'issue' : 'issues'} found:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {validationErrors.slice(0, 5).map((error, index) => (
              <li key={index}>
                <Typography variant="body2">
                  <strong>{error.field}:</strong> {error.message}
                </Typography>
              </li>
            ))}
            {validationErrors.length > 5 && (
              <li>
                <Typography variant="body2">
                  And {validationErrors.length - 5} more issues...
                </Typography>
              </li>
            )}
          </ul>
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                {displayKeys.map(key => (
                  <TableCell key={key}>
                    {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleData.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  <TableCell>{rowIndex + 1}</TableCell>
                  {displayKeys.map(key => (
                    <TableCell key={`${rowIndex}-${key}`}>
                      {renderCellValue(row[key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {displayKeys.length < allKeys.length && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Showing {displayKeys.length} of {allKeys.length} available fields. All fields will be imported.
        </Typography>
      )}
    </Box>
  );
};

/**
 * Helper function to render cell values based on their type
 */
const renderCellValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return <Typography variant="body2" color="text.disabled">—</Typography>;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length > 0 ? `[${value.length} items]` : '[]';
    }
    return JSON.stringify(value).length > 50 
      ? JSON.stringify(value).substring(0, 50) + '...'
      : JSON.stringify(value);
  }

  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }

  return value.toString();
};

export default ImportPreview;
