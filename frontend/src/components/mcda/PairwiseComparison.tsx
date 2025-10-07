/**
 * Pairwise Comparison Component for MCDA Method 2 (AHP)
 * Allows users to make pairwise comparisons between criteria
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Slider,
  Chip,
  LinearProgress,
  Button,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  CompareArrowsRounded, 
  InfoRounded,
  ExpandMoreRounded,
  CheckCircleRounded,
  WarningRounded
} from '@mui/icons-material';
import { CriterionInfo, PairwiseComparison } from '../../pages/mcda/MCDAPage';
import { mcdaService } from '../../services/mcdaService';

interface PairwiseComparisonProps {
  criteria: string[];
  availableCriteria: Record<string, CriterionInfo>;
  comparisons: PairwiseComparison[];
  onComparisonsChange: (comparisons: PairwiseComparison[]) => void;
}

interface ComparisonPair {
  criteria1: string;
  criteria2: string;
}

const PairwiseComparisonComponent: React.FC<PairwiseComparisonProps> = ({
  criteria,
  availableCriteria,
  comparisons,
  onComparisonsChange
}) => {
  const [requiredPairs, setRequiredPairs] = useState<ComparisonPair[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate required comparison pairs
  useEffect(() => {
    if (criteria.length >= 2) {
      const pairs: ComparisonPair[] = [];
      for (let i = 0; i < criteria.length; i++) {
        for (let j = i + 1; j < criteria.length; j++) {
          pairs.push({
            criteria1: criteria[i],
            criteria2: criteria[j]
          });
        }
      }
      setRequiredPairs(pairs);

      // Initialize comparisons with equal importance if none exist
      if (comparisons.length === 0) {
        const initialComparisons = pairs.map(pair => ({
          criteria1: pair.criteria1,
          criteria2: pair.criteria2,
          value: 1 // Equal importance
        }));
        onComparisonsChange(initialComparisons);
      }
    }
  }, [criteria, comparisons.length, onComparisonsChange]);

  // Validate comparisons
  useEffect(() => {
    const errors = mcdaService.validatePairwiseComparisons(comparisons, criteria);
    setValidationErrors(errors);
  }, [comparisons, criteria]);

  const handleComparisonChange = (criteria1: string, criteria2: string, value: number) => {
    const newComparisons = [...comparisons];
    const existingIndex = newComparisons.findIndex(
      c => (c.criteria1 === criteria1 && c.criteria2 === criteria2) ||
           (c.criteria1 === criteria2 && c.criteria2 === criteria1)
    );

    if (existingIndex >= 0) {
      newComparisons[existingIndex] = { criteria1, criteria2, value };
    } else {
      newComparisons.push({ criteria1, criteria2, value });
    }

    onComparisonsChange(newComparisons);
  };

  const getComparisonValue = (criteria1: string, criteria2: string): number => {
    const comparison = comparisons.find(
      c => (c.criteria1 === criteria1 && c.criteria2 === criteria2) ||
           (c.criteria1 === criteria2 && c.criteria2 === criteria1)
    );
    
    if (!comparison) return 1;
    
    // If the order is reversed, return reciprocal
    if (comparison.criteria1 === criteria2 && comparison.criteria2 === criteria1) {
      return 1 / comparison.value;
    }
    
    return comparison.value;
  };

  const resetToEqual = () => {
    const equalComparisons = requiredPairs.map(pair => ({
      criteria1: pair.criteria1,
      criteria2: pair.criteria2,
      value: 1
    }));
    onComparisonsChange(equalComparisons);
  };

  const getCompletionPercentage = () => {
    const expectedComparisons = requiredPairs.length;
    const actualComparisons = comparisons.filter(c => 
      requiredPairs.some(p => 
        (p.criteria1 === c.criteria1 && p.criteria2 === c.criteria2) ||
        (p.criteria1 === c.criteria2 && p.criteria2 === c.criteria1)
      )
    ).length;
    
    return expectedComparisons > 0 ? (actualComparisons / expectedComparisons) * 100 : 0;
  };

  const sliderMarks = [
    { value: 1/9, label: '1/9' },
    { value: 1/7, label: '1/7' },
    { value: 1/5, label: '1/5' },
    { value: 1/3, label: '1/3' },
    { value: 1, label: '1' },
    { value: 3, label: '3' },
    { value: 5, label: '5' },
    { value: 7, label: '7' },
    { value: 9, label: '9' }
  ];

  const getSliderValue = (value: number): number => {
    // Convert logarithmic scale for better UX
    if (value >= 1) return Math.log10(value * 9 + 1);
    else return -Math.log10((1/value) * 9 + 1);
  };

  const getValueFromSlider = (sliderValue: number): number => {
    if (sliderValue >= 0) {
      const linear = (Math.pow(10, sliderValue) - 1) / 9;
      return Math.max(1, linear);
    } else {
      const linear = (Math.pow(10, -sliderValue) - 1) / 9;
      return Math.max(1/9, 1 / Math.max(1, linear));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <CompareArrowsRounded sx={{ mr: 1 }} />
        Pairwise Comparisons (AHP Method)
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Compare each pair of criteria to determine their relative importance. Use the scale where 1 = equal importance, 
        3 = moderate importance, 5 = strong importance, 7 = very strong importance, 9 = extreme importance.
      </Typography>

      {/* Progress Indicator */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2">
            Comparison Progress: {comparisons.length} / {requiredPairs.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {validationErrors.length === 0 ? (
              <CheckCircleRounded sx={{ color: 'success.main', fontSize: 20 }} />
            ) : (
              <WarningRounded sx={{ color: 'warning.main', fontSize: 20 }} />
            )}
            <Button size="small" onClick={resetToEqual}>
              Reset to Equal
            </Button>
          </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={getCompletionPercentage()}
          color={validationErrors.length === 0 ? 'success' : 'warning'}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* AHP Scale Reference */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreRounded />}>
          <Typography variant="subtitle2">AHP Comparison Scale Reference</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            {[
              { value: 1, desc: 'Equal importance' },
              { value: 3, desc: 'Moderate importance' },
              { value: 5, desc: 'Strong importance' },
              { value: 7, desc: 'Very strong importance' },
              { value: 9, desc: 'Extreme importance' },
              { value: '1/3', desc: 'Moderately less important' },
              { value: '1/5', desc: 'Strongly less important' },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Chip label={`${item.value}: ${item.desc}`} size="small" variant="outlined" />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Comparison Input Form */}
      <Grid container spacing={3}>
        {requiredPairs.map((pair, index) => {
          const currentValue = getComparisonValue(pair.criteria1, pair.criteria2);
          const criterion1Name = mcdaService.formatCriterionName(pair.criteria1, availableCriteria);
          const criterion2Name = mcdaService.formatCriterionName(pair.criteria2, availableCriteria);

          return (
            <Grid item xs={12} key={index}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Comparison {index + 1} of {requiredPairs.length}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" textAlign="center" sx={{ mb: 1 }}>
                    How important is <strong>{criterion1Name}</strong> compared to <strong>{criterion2Name}</strong>?
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ minWidth: '120px', textAlign: 'right' }}>
                      {criterion1Name}
                    </Typography>
                    <Typography variant="h6" color="primary.main" sx={{ minWidth: '100px', textAlign: 'center' }}>
                      {currentValue === 1 ? '1 : 1' : 
                       currentValue > 1 ? `${currentValue.toFixed(1)} : 1` : 
                       `1 : ${(1/currentValue).toFixed(1)}`}
                    </Typography>
                    <Typography variant="body2" sx={{ minWidth: '120px' }}>
                      {criterion2Name}
                    </Typography>
                  </Box>

                  <Box sx={{ px: 2, mb: 2 }}>
                    <Slider
                      value={getSliderValue(currentValue)}
                      onChange={(_, value) => {
                        const newValue = getValueFromSlider(Array.isArray(value) ? value[0] : value);
                        handleComparisonChange(pair.criteria1, pair.criteria2, newValue);
                      }}
                      min={getSliderValue(1/9)}
                      max={getSliderValue(9)}
                      step={0.01}
                      marks={false}
                      sx={{ '& .MuiSlider-thumb': { width: 20, height: 20 } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption">Much less important</Typography>
                      <Typography variant="caption">Equal</Typography>
                      <Typography variant="caption">Much more important</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {[1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9].map((value) => (
                      <Button
                        key={value}
                        size="small"
                        variant={Math.abs(currentValue - value) < 0.1 ? 'contained' : 'outlined'}
                        onClick={() => handleComparisonChange(pair.criteria1, pair.criteria2, value)}
                        sx={{ minWidth: '40px' }}
                      >
                        {value < 1 ? `1/${1/value}` : value.toString()}
                      </Button>
                    ))}
                  </Box>

                  <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ mt: 1 }}>
                    {mcdaService.getComparisonDescription(currentValue)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Validation Messages */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Comparison Issues:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>
                <Typography variant="body2">{error}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {validationErrors.length === 0 && comparisons.length === requiredPairs.length && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            ✓ All pairwise comparisons completed. AHP will calculate consistent weights and check for logical consistency.
          </Typography>
        </Alert>
      )}

      {/* Comparison Matrix Preview */}
      {showAdvanced && comparisons.length > 0 && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Typography variant="subtitle2">Comparison Matrix Preview</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    {criteria.map(criterion => (
                      <TableCell key={criterion} align="center">
                        <Typography variant="caption">
                          {mcdaService.formatCriterionName(criterion, availableCriteria)}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {criteria.map(criterion1 => (
                    <TableRow key={criterion1}>
                      <TableCell component="th">
                        <Typography variant="caption">
                          {mcdaService.formatCriterionName(criterion1, availableCriteria)}
                        </Typography>
                      </TableCell>
                      {criteria.map(criterion2 => (
                        <TableCell key={criterion2} align="center">
                          <Typography variant="caption">
                            {criterion1 === criterion2 
                              ? '1.0'
                              : getComparisonValue(criterion1, criterion2).toFixed(1)
                            }
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          size="small"
          onClick={() => setShowAdvanced(!showAdvanced)}
          startIcon={<InfoRounded />}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </Button>
      </Box>
    </Box>
  );
};

export default PairwiseComparisonComponent;
