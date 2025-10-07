/**
 * Weight Input Component for MCDA Method 1
 * Allows users to assign numerical weights to criteria
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  InputAdornment,
  Button,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  ScaleRounded, 
  WarningRounded, 
  CheckCircleRounded,
  RefreshRounded,
  TrendingUpRounded,
  TrendingDownRounded
} from '@mui/icons-material';
import { CriterionInfo } from '../../pages/mcda/MCDAPage';
import { mcdaService } from '../../services/mcdaService';

interface WeightInputProps {
  criteria: string[];
  availableCriteria: Record<string, CriterionInfo>;
  weights: Record<string, number>;
  onWeightsChange: (weights: Record<string, number>) => void;
}

const WeightInput: React.FC<WeightInputProps> = ({
  criteria,
  availableCriteria,
  weights,
  onWeightsChange
}) => {
  const [useSliders, setUseSliders] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize equal weights if none provided
  useEffect(() => {
    if (criteria.length > 0 && Object.keys(weights).length === 0) {
      const equalWeights = mcdaService.generateEqualWeights(criteria);
      onWeightsChange(equalWeights);
    }
  }, [criteria, weights, onWeightsChange]);

  // Validate weights whenever they change
  useEffect(() => {
    const errors = mcdaService.validateWeights(weights, criteria);
    setValidationErrors(errors);
  }, [weights, criteria]);

  const handleWeightChange = (criterion: string, value: number) => {
    const newWeights = { ...weights, [criterion]: value };
    onWeightsChange(newWeights);
  };

  const handleTextFieldChange = (criterion: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    handleWeightChange(criterion, Math.max(0, Math.min(1, numValue)));
  };

  const handleSliderChange = (criterion: string, value: number | number[]) => {
    handleWeightChange(criterion, Array.isArray(value) ? value[0] : value);
  };

  const normalizeWeights = () => {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) return;

    const normalizedWeights = Object.fromEntries(
      Object.entries(weights).map(([criterion, weight]) => [
        criterion,
        weight / totalWeight
      ])
    );
    onWeightsChange(normalizedWeights);
  };

  const resetToEqual = () => {
    const equalWeights = mcdaService.generateEqualWeights(criteria);
    onWeightsChange(equalWeights);
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const isNormalized = Math.abs(totalWeight - 1) < 0.001;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ScaleRounded sx={{ mr: 1 }} />
        Assign Criteria Weights
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Assign importance weights to each criterion (0.0 to 1.0). All weights must sum to exactly 1.0.
        Higher weights indicate more important criteria in the decision process.
      </Typography>

      {/* Weight Status */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2">
            Total Weight: {totalWeight.toFixed(3)} / 1.000
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isNormalized ? (
              <CheckCircleRounded sx={{ color: 'success.main', fontSize: 20 }} />
            ) : (
              <WarningRounded sx={{ color: 'warning.main', fontSize: 20 }} />
            )}
            <Typography variant="body2" color={isNormalized ? 'success.main' : 'warning.main'}>
              {isNormalized ? 'Weights Valid' : 'Weights Must Sum to 1.0'}
            </Typography>
          </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={Math.min(totalWeight * 100, 100)}
          color={isNormalized ? 'success' : totalWeight > 1 ? 'error' : 'warning'}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={useSliders}
              onChange={(e) => setUseSliders(e.target.checked)}
            />
          }
          label="Use sliders instead of text fields"
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<RefreshRounded />}
            onClick={resetToEqual}
          >
            Equal Weights
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={normalizeWeights}
            disabled={totalWeight === 0}
          >
            Normalize
          </Button>
        </Box>
      </Box>

      {/* Weight Input Fields */}
      <Grid container spacing={2}>
        {criteria.map((criterion) => {
          const criterionInfo = availableCriteria[criterion];
          const weight = weights[criterion] || 0;
          const percentage = (weight * 100).toFixed(1);

          return (
            <Grid item xs={12} md={6} key={criterion}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    {criterionInfo?.type === 'benefit' ? (
                      <TrendingUpRounded sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <TrendingDownRounded sx={{ fontSize: 16, color: 'warning.main' }} />
                    )}
                    <Typography variant="subtitle2">
                      {mcdaService.formatCriterionName(criterion, availableCriteria)}
                    </Typography>
                    <Chip 
                      label={criterionInfo?.source || 'unknown'} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {criterionInfo?.description || criterion}
                  </Typography>
                </Box>

                {useSliders ? (
                  <Box sx={{ px: 1 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Weight: {weight.toFixed(3)} ({percentage}%)
                    </Typography>
                    <Slider
                      value={weight}
                      onChange={(_, value) => handleSliderChange(criterion, value)}
                      min={0}
                      max={1}
                      step={0.001}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                    />
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    type="number"
                    label="Weight"
                    value={weight.toFixed(3)}
                    onChange={(e) => handleTextFieldChange(criterion, e.target.value)}
                    inputProps={{
                      min: 0,
                      max: 1,
                      step: 0.001
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Chip 
                            label={`${percentage}%`} 
                            size="small" 
                            color={weight > 0 ? 'primary' : 'default'}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Validation Messages */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Weight Assignment Issues:
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

      {isNormalized && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            ✓ Weights are properly configured. You can proceed with the analysis.
          </Typography>
        </Alert>
      )}

      {/* Weight Distribution Visualization */}
      {criteria.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Weight Distribution
          </Typography>
          <Grid container spacing={1}>
            {criteria.map((criterion) => {
              const weight = weights[criterion] || 0;
              const percentage = (weight * 100).toFixed(1);
              
              return (
                <Grid item xs={12} key={criterion}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: '150px', fontSize: '0.8rem' }}>
                      {mcdaService.formatCriterionName(criterion, availableCriteria)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={weight * 100}
                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: '50px', textAlign: 'right', fontSize: '0.8rem' }}>
                      {percentage}%
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default WeightInput;
