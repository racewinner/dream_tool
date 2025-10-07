/**
 * Criteria Selection Component for MCDA
 * Allows users to select evaluation criteria for analysis
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Grid,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tooltip
} from '@mui/material';
import { 
  ExpandMoreRounded, 
  CategoryRounded, 
  TrendingUpRounded, 
  TrendingDownRounded,
  InfoRounded
} from '@mui/icons-material';
import { CriterionInfo } from '../../pages/mcda/MCDAPage';

interface CriteriaSelectionProps {
  availableCriteria: Record<string, CriterionInfo>;
  selectedCriteria: string[];
  onSelectionChange: (selectedCriteria: string[]) => void;
}

const CriteriaSelection: React.FC<CriteriaSelectionProps> = ({
  availableCriteria,
  selectedCriteria,
  onSelectionChange
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['survey']);

  // Group criteria by source
  const criteriaBySource = Object.entries(availableCriteria).reduce((acc, [key, criterion]) => {
    if (!acc[criterion.source]) {
      acc[criterion.source] = [];
    }
    acc[criterion.source].push({ key, ...criterion });
    return acc;
  }, {} as Record<string, Array<{ key: string } & CriterionInfo>>);

  const handleToggleCriterion = (criterionKey: string) => {
    const newSelected = selectedCriteria.includes(criterionKey)
      ? selectedCriteria.filter(key => key !== criterionKey)
      : [...selectedCriteria, criterionKey];
    
    onSelectionChange(newSelected);
  };

  const handleToggleCategory = (source: string) => {
    const criteriaInSource = criteriaBySource[source]?.map(c => c.key) || [];
    const allSelected = criteriaInSource.every(key => selectedCriteria.includes(key));
    
    if (allSelected) {
      // Deselect all in this category
      onSelectionChange(selectedCriteria.filter(key => !criteriaInSource.includes(key)));
    } else {
      // Select all in this category
      const newSelected = [...selectedCriteria];
      criteriaInSource.forEach(key => {
        if (!newSelected.includes(key)) {
          newSelected.push(key);
        }
      });
      onSelectionChange(newSelected);
    }
  };

  const handleAccordionChange = (source: string) => {
    setExpandedCategories(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const getSourceTitle = (source: string) => {
    switch (source) {
      case 'survey': return 'Survey-Based Criteria';
      case 'techno_economic': return 'Techno-Economic Criteria';
      case 'facility': return 'Location & Facility Criteria';
      default: return source;
    }
  };

  const getSourceDescription = (source: string) => {
    switch (source) {
      case 'survey': 
        return 'Criteria derived from facility surveys including operational, infrastructure, and service data';
      case 'techno_economic': 
        return 'Financial and technical criteria from solar PV system analysis including costs, returns, and energy requirements';
      case 'facility': 
        return 'Basic facility information including location and geographic factors affecting solar potential';
      default: return '';
    }
  };

  const getCriterionTypeIcon = (type: 'benefit' | 'cost') => {
    return type === 'benefit' ? (
      <TrendingUpRounded sx={{ fontSize: 16, color: 'success.main' }} />
    ) : (
      <TrendingDownRounded sx={{ fontSize: 16, color: 'warning.main' }} />
    );
  };

  const getCriterionTypeText = (type: 'benefit' | 'cost') => {
    return type === 'benefit' ? 'Higher is Better' : 'Lower is Better';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <CategoryRounded sx={{ mr: 1 }} />
        Select Evaluation Criteria
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Choose the criteria you want to use for comparing sites. Each criterion will be weighted according to your preferences in the next step.
      </Typography>

      {selectedCriteria.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {selectedCriteria.length} criteria selected for analysis
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Button 
          size="small" 
          onClick={() => onSelectionChange([])}
          disabled={selectedCriteria.length === 0}
        >
          Clear All
        </Button>
      </Box>

      {Object.entries(criteriaBySource).map(([source, criteria]) => (
        <Accordion 
          key={source}
          expanded={expandedCategories.includes(source)}
          onChange={() => handleAccordionChange(source)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {getSourceTitle(source)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {criteria.length} criteria available
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${criteria.filter(c => selectedCriteria.includes(c.key)).length} selected`}
                  size="small"
                  color={criteria.some(c => selectedCriteria.includes(c.key)) ? 'primary' : 'default'}
                  variant="outlined"
                />
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCategory(source);
                  }}
                  sx={{ minWidth: 'auto' }}
                >
                  {criteria.every(c => selectedCriteria.includes(c.key)) ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {getSourceDescription(source)}
            </Typography>
            
            <Grid container spacing={2}>
              {criteria.map((criterion) => (
                <Grid item xs={12} md={6} key={criterion.key}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      border: selectedCriteria.includes(criterion.key) ? 2 : 1,
                      borderColor: selectedCriteria.includes(criterion.key) ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => handleToggleCriterion(criterion.key)}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedCriteria.includes(criterion.key)}
                          onChange={() => handleToggleCriterion(criterion.key)}
                        />
                      }
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {criterion.name}
                            </Typography>
                            <Tooltip title={getCriterionTypeText(criterion.type)}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getCriterionTypeIcon(criterion.type)}
                              </Box>
                            </Tooltip>
                            {criterion.unit && (
                              <Chip label={criterion.unit} size="small" variant="outlined" />
                            )}
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {criterion.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', m: 0 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {Object.keys(criteriaBySource).length === 0 && (
        <Alert severity="warning" icon={<InfoRounded />}>
          No criteria available for selection. Please ensure the system has been configured with evaluation criteria.
        </Alert>
      )}

      {selectedCriteria.length === 0 && Object.keys(criteriaBySource).length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please select at least one criterion to proceed with the analysis.
        </Alert>
      )}
    </Box>
  );
};

export default CriteriaSelection;
