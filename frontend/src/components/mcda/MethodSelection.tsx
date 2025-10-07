/**
 * Method Selection Component for MCDA
 * Allows users to choose between TOPSIS with Weights or TOPSIS with AHP
 */

import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import { 
  BalanceRounded, 
  CompareArrowsRounded, 
  TrendingUpRounded,
  InfoRounded
} from '@mui/icons-material';

interface MethodSelectionProps {
  method: 'TOPSIS_W' | 'TOPSIS_AHP';
  onMethodChange: (method: 'TOPSIS_W' | 'TOPSIS_AHP') => void;
}

const MethodSelection: React.FC<MethodSelectionProps> = ({
  method,
  onMethodChange
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <BalanceRounded sx={{ mr: 1 }} />
        Select Analysis Method
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Choose how you want to determine the importance weights for your criteria. Both methods use TOPSIS for final ranking.
      </Typography>

      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          value={method}
          onChange={(e) => onMethodChange(e.target.value as 'TOPSIS_W' | 'TOPSIS_AHP')}
        >
          <Grid container spacing={3}>
            {/* Method 1: Direct Weighting */}
            <Grid item xs={12} md={6}>
              <Card 
                variant="outlined"
                sx={{ 
                  cursor: 'pointer',
                  border: method === 'TOPSIS_W' ? 2 : 1,
                  borderColor: method === 'TOPSIS_W' ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => onMethodChange('TOPSIS_W')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FormControlLabel
                      value="TOPSIS_W"
                      control={<Radio />}
                      label=""
                      sx={{ mr: 1, '& .MuiFormControlLabel-label': { display: 'none' } }}
                    />
                    <TrendingUpRounded sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h3">
                      Method 1: Direct Weighting
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    You directly assign numerical weights (0-1) to each criterion. 
                    Simple and intuitive when you know the relative importance of criteria.
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label="TOPSIS + Weighted Sum" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label="Quick Setup" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" fontWeight="medium" color="primary.main">
                    Best for: When you have clear preferences about criteria importance
                  </Typography>

                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      <strong>Process:</strong> Assign weights → TOPSIS analysis → Ranked results
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Method 2: AHP */}
            <Grid item xs={12} md={6}>
              <Card 
                variant="outlined"
                sx={{ 
                  cursor: 'pointer',
                  border: method === 'TOPSIS_AHP' ? 2 : 1,
                  borderColor: method === 'TOPSIS_AHP' ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => onMethodChange('TOPSIS_AHP')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FormControlLabel
                      value="TOPSIS_AHP"
                      control={<Radio />}
                      label=""
                      sx={{ mr: 1, '& .MuiFormControlLabel-label': { display: 'none' } }}
                    />
                    <CompareArrowsRounded sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="h6" component="h3">
                      Method 2: AHP + TOPSIS
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Uses Analytic Hierarchy Process (AHP) for pairwise comparisons to derive weights.
                    More structured approach with consistency checking.
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label="AHP + TOPSIS" 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label="Rigorous Method" 
                      size="small" 
                      color="info" 
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" fontWeight="medium" color="secondary.main">
                    Best for: When you want systematic pairwise comparison and consistency validation
                  </Typography>

                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      <strong>Process:</strong> Pairwise comparisons → AHP weights → TOPSIS analysis → Ranked results
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </RadioGroup>
      </FormControl>

      <Alert 
        severity="info" 
        icon={<InfoRounded />} 
        sx={{ mt: 3 }}
      >
        <Typography variant="body2">
          <strong>TOPSIS</strong> (Technique for Order of Preference by Similarity to Ideal Solution) 
          ranks alternatives by measuring their distance from both ideal and worst-case scenarios. 
          Both methods use TOPSIS for the final ranking - they differ only in how criteria weights are determined.
        </Typography>
      </Alert>

      {/* Method-specific information */}
      {method === 'TOPSIS_W' && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Next step:</strong> You will assign weights to each selected criterion. 
            All weights must sum to 1.0 (e.g., 0.4 + 0.3 + 0.3 = 1.0).
          </Typography>
        </Alert>
      )}

      {method === 'TOPSIS_AHP' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Next step:</strong> You will make pairwise comparisons between criteria using a 1-9 scale 
            (1 = equal importance, 9 = extreme importance). AHP will calculate consistent weights and check for logical consistency.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default MethodSelection;
