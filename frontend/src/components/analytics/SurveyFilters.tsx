import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Chip,
  Button
} from '@mui/material';
import { Clear as ClearIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { GeographicalSite, RegionalBreakdown } from '../../services/surveyAnalyticsService';

interface SurveyFiltersProps {
  sites: GeographicalSite[];
  regionalData: RegionalBreakdown[];
  selectedRegion: string;
  selectedDistrict: string;
  selectedFacilityType: string;
  selectedPowerSource: string;
  onRegionChange: (region: string) => void;
  onDistrictChange: (district: string) => void;
  onFacilityTypeChange: (type: string) => void;
  onPowerSourceChange: (source: string) => void;
  onClearFilters: () => void;
}

const SurveyFilters: React.FC<SurveyFiltersProps> = ({
  sites,
  regionalData,
  selectedRegion,
  selectedDistrict,
  selectedFacilityType,
  selectedPowerSource,
  onRegionChange,
  onDistrictChange,
  onFacilityTypeChange,
  onPowerSourceChange,
  onClearFilters
}) => {
  // Get unique values for filter dropdowns
  const regions = [...new Set(sites.map(site => site.region))].sort();
  const districts = selectedRegion 
    ? [...new Set(sites.filter(site => site.region === selectedRegion).map(site => site.district))].sort()
    : [...new Set(sites.map(site => site.district))].sort();
  const facilityTypes = [...new Set(sites.map(site => site.facilityType))].sort();
  const powerSources = [...new Set(sites.map(site => site.powerSource))].sort();

  // Handle filter changes
  const handleRegionChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    onRegionChange(value);
    // Clear district when region changes
    if (selectedDistrict) {
      onDistrictChange('');
    }
  };

  const handleDistrictChange = (event: SelectChangeEvent) => {
    onDistrictChange(event.target.value);
  };

  const handleFacilityTypeChange = (event: SelectChangeEvent) => {
    onFacilityTypeChange(event.target.value);
  };

  const handlePowerSourceChange = (event: SelectChangeEvent) => {
    onPowerSourceChange(event.target.value);
  };

  // Count active filters
  const activeFilters = [selectedRegion, selectedDistrict, selectedFacilityType, selectedPowerSource].filter(Boolean).length;

  // Apply filters to get filtered count
  let filteredSites = sites;
  if (selectedRegion) filteredSites = filteredSites.filter(site => site.region === selectedRegion);
  if (selectedDistrict) filteredSites = filteredSites.filter(site => site.district === selectedDistrict);
  if (selectedFacilityType) filteredSites = filteredSites.filter(site => site.facilityType === selectedFacilityType);
  if (selectedPowerSource) filteredSites = filteredSites.filter(site => site.powerSource === selectedPowerSource);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6">
            Filter Survey Data
          </Typography>
          {activeFilters > 0 && (
            <Chip 
              label={`${activeFilters} active`} 
              color="primary" 
              size="small" 
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Showing {filteredSites.length} of {sites.length} sites
          </Typography>
          {activeFilters > 0 && (
            <Button
              startIcon={<ClearIcon />}
              onClick={onClearFilters}
              size="small"
              variant="outlined"
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Region</InputLabel>
            <Select
              value={selectedRegion}
              label="Region"
              onChange={handleRegionChange}
            >
              <MenuItem value="">
                <em>All Regions</em>
              </MenuItem>
              {regions.map((region) => (
                <MenuItem key={region} value={region}>
                  {region} ({sites.filter(site => site.region === region).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>District</InputLabel>
            <Select
              value={selectedDistrict}
              label="District"
              onChange={handleDistrictChange}
            >
              <MenuItem value="">
                <em>All Districts</em>
              </MenuItem>
              {districts.map((district) => (
                <MenuItem key={district} value={district}>
                  {district} ({sites.filter(site => 
                    site.district === district && 
                    (selectedRegion ? site.region === selectedRegion : true)
                  ).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Facility Type</InputLabel>
            <Select
              value={selectedFacilityType}
              label="Facility Type"
              onChange={handleFacilityTypeChange}
            >
              <MenuItem value="">
                <em>All Types</em>
              </MenuItem>
              {facilityTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type} ({sites.filter(site => site.facilityType === type).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Power Source</InputLabel>
            <Select
              value={selectedPowerSource}
              label="Power Source"
              onChange={handlePowerSourceChange}
            >
              <MenuItem value="">
                <em>All Sources</em>
              </MenuItem>
              {powerSources.map((source) => (
                <MenuItem key={source} value={source}>
                  {source} ({sites.filter(site => site.powerSource === source).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {activeFilters > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Active Filters:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {selectedRegion && (
              <Chip
                label={`Region: ${selectedRegion}`}
                onDelete={() => onRegionChange('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedDistrict && (
              <Chip
                label={`District: ${selectedDistrict}`}
                onDelete={() => onDistrictChange('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedFacilityType && (
              <Chip
                label={`Type: ${selectedFacilityType}`}
                onDelete={() => onFacilityTypeChange('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedPowerSource && (
              <Chip
                label={`Power: ${selectedPowerSource}`}
                onDelete={() => onPowerSourceChange('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default SurveyFilters;
