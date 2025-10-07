/**
 * Site Selection Component for MCDA
 * Allows users to select facilities for comparison
 */

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Paper,
  Alert,
  FormControlLabel,
  Button
} from '@mui/material';
import { LocationOnRounded, CheckBoxRounded, CheckBoxOutlineBlankRounded } from '@mui/icons-material';
import { Facility } from '../../pages/mcda/MCDAPage';

interface SiteSelectionProps {
  facilities: Facility[];
  selectedSites: number[];
  onSelectionChange: (selectedSites: number[]) => void;
}

const SiteSelection: React.FC<SiteSelectionProps> = ({
  facilities,
  selectedSites,
  onSelectionChange
}) => {
  const handleToggleAll = () => {
    if (selectedSites.length === facilities.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(facilities.map(f => f.id));
    }
  };

  const handleToggleSite = (siteId: number) => {
    const currentIndex = selectedSites.indexOf(siteId);
    const newSelectedSites = [...selectedSites];

    if (currentIndex === -1) {
      newSelectedSites.push(siteId);
    } else {
      newSelectedSites.splice(currentIndex, 1);
    }

    onSelectionChange(newSelectedSites);
  };

  const getSiteStatusColor = (facility: Facility) => {
    switch (facility.status) {
      case 'active': return 'success';
      case 'installed': return 'primary';
      case 'design': return 'warning';
      case 'survey': return 'default';
      default: return 'default';
    }
  };

  const getDataAvailabilityText = (facility: Facility) => {
    const items = [];
    if (facility.has_survey) items.push('Survey');
    if (facility.has_techno_economic) items.push('Techno-Economic');
    return items.length > 0 ? items.join(' + ') : 'No Data';
  };

  const getDataAvailabilityColor = (facility: Facility) => {
    if (facility.has_survey && facility.has_techno_economic) return 'success';
    if (facility.has_survey || facility.has_techno_economic) return 'warning';
    return 'default';
  };

  const facilitiesWithData = facilities.filter(f => f.has_survey || f.has_techno_economic);
  const facilitiesWithoutData = facilities.filter(f => !f.has_survey && !f.has_techno_economic);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <LocationOnRounded sx={{ mr: 1 }} />
        Select Sites for Comparison
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Choose at least 2 facilities to compare. Sites with both survey and techno-economic data will provide the most comprehensive analysis.
      </Typography>

      {selectedSites.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectedSites.length} site{selectedSites.length === 1 ? '' : 's'} selected for analysis
          {selectedSites.length < 2 && ' (minimum 2 required)'}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedSites.length === facilities.length && facilities.length > 0}
              indeterminate={selectedSites.length > 0 && selectedSites.length < facilities.length}
              onChange={handleToggleAll}
              icon={<CheckBoxOutlineBlankRounded />}
              checkedIcon={<CheckBoxRounded />}
            />
          }
          label="Select All"
        />
        
        {selectedSites.length > 0 && (
          <Button 
            size="small" 
            onClick={() => onSelectionChange([])}
          >
            Clear Selection
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">Select</TableCell>
              <TableCell>Facility Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data Available</TableCell>
              <TableCell>Survey Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {facilitiesWithData.map((facility) => (
              <TableRow 
                key={facility.id}
                hover
                selected={selectedSites.includes(facility.id)}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleToggleSite(facility.id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedSites.includes(facility.id)}
                    icon={<CheckBoxOutlineBlankRounded />}
                    checkedIcon={<CheckBoxRounded />}
                  />
                </TableCell>
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight="medium">
                    {facility.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={facility.type} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={facility.status} 
                    size="small" 
                    color={getSiteStatusColor(facility)}
                    variant="filled"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getDataAvailabilityText(facility)}
                    size="small"
                    color={getDataAvailabilityColor(facility)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {facility.survey_date 
                      ? new Date(facility.survey_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            
            {facilitiesWithoutData.length > 0 && (
              <>
                <TableRow>
                  <TableCell colSpan={7} sx={{ bgcolor: 'grey.50', py: 1 }}>
                    <Typography variant="body2" color="textSecondary" fontStyle="italic">
                      Facilities without sufficient data for analysis:
                    </Typography>
                  </TableCell>
                </TableRow>
                {facilitiesWithoutData.map((facility) => (
                  <TableRow key={facility.id} sx={{ opacity: 0.6 }}>
                    <TableCell padding="checkbox">
                      <Checkbox disabled />
                    </TableCell>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2">
                        {facility.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={facility.type} 
                        size="small" 
                        variant="outlined"
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={facility.status} 
                        size="small" 
                        variant="outlined"
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="No Data"
                        size="small"
                        color="default"
                        variant="outlined"
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        N/A
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {facilities.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No facilities available for analysis. Please ensure facilities with survey or techno-economic data exist in the system.
        </Alert>
      )}
    </Box>
  );
};

export default SiteSelection;
