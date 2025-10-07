/**
 * MCDA (Multi-Criteria Decision Analysis) Page
 * Main page for site comparison using TOPSIS and AHP methods
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { AnalyticsRounded, CompareArrowsRounded, AssessmentRounded } from '@mui/icons-material';
import SiteSelection from '../../components/mcda/SiteSelection';
import CriteriaSelection from '../../components/mcda/CriteriaSelection';
import MethodSelection from '../../components/mcda/MethodSelection';
import WeightInput from '../../components/mcda/WeightInput';
import PairwiseComparison from '../../components/mcda/PairwiseComparison';
import ResultsDisplay from '../../components/mcda/ResultsDisplay';
import { mcdaService } from '../../services/mcdaService';
import { useLocation, useNavigate } from 'react-router-dom';
import PowerIcon from '@mui/icons-material/Power';
import BuildIcon from '@mui/icons-material/Build';

export interface Facility {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  status: string;
  has_survey: boolean;
  has_techno_economic: boolean;
  survey_date?: string;
}

export interface CriterionInfo {
  name: string;
  description: string;
  type: 'benefit' | 'cost';
  source: 'survey' | 'techno_economic' | 'facility';
  unit?: string;
}

export interface PairwiseComparison {
  criteria1: string;
  criteria2: string;
  value: number;
}

export interface MCDAResult {
  siteId: string;
  siteName?: string;
  score: number;
  rank: number;
  criteriaScores?: Record<string, number>;
  rawValues?: Record<string, number>;
}

export interface MCDAAnalysisResponse {
  results: MCDAResult[];
  weights?: Record<string, number>;
  consistencyRatio?: number;
  method: string;
  validation_errors?: string[];
}

const steps = [
  'Select Sites',
  'Choose Criteria', 
  'Select Method',
  'Configure Analysis',
  'View Results'
];

const MCDAPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [method, setMethod] = useState<'TOPSIS_W' | 'TOPSIS_AHP'>('TOPSIS_W');
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [pairwiseComparisons, setPairwiseComparisons] = useState<PairwiseComparison[]>([]);
  const [results, setResults] = useState<MCDAAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [availableCriteria, setAvailableCriteria] = useState<Record<string, CriterionInfo>>({});
  
  // Handle navigation from design page
  useEffect(() => {
    const state = location.state as any;
    if (state?.fromDesign && state?.selectedFacility) {
      setSelectedSites([state.selectedFacility]);
      setActiveStep(1); // Skip to criteria selection
    }
  }, [location.state]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [facilitiesData, criteriaData] = await Promise.all([
          mcdaService.getFacilities(),
          mcdaService.getCriteria()
        ]);
        
        setFacilities(facilitiesData);
        setAvailableCriteria(criteriaData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedSites([]);
    setSelectedCriteria([]);
    setWeights({});
    setPairwiseComparisons([]);
    setResults(null);
    setError(null);
  };

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const request = {
        selected_sites: selectedSites,
        criteria: selectedCriteria,
        method,
        ...(method === 'TOPSIS_W' && { weights }),
        ...(method === 'TOPSIS_AHP' && { pairwise_comparisons: pairwiseComparisons })
      };

      const result = await mcdaService.performAnalysis(request);
      
      if (result.validation_errors && result.validation_errors.length > 0) {
        setError(`Analysis validation failed: ${result.validation_errors.join(', ')}`);
        return;
      }

      setResults(result);
      handleNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0: return selectedSites.length >= 2;
      case 1: return selectedCriteria.length >= 1;
      case 2: return true; // Method selection always complete
      case 3: 
        if (method === 'TOPSIS_W') {
          const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
          return Math.abs(weightSum - 1) < 0.001 && selectedCriteria.length > 0;
        }
        const expectedComparisons = selectedCriteria.length * (selectedCriteria.length - 1) / 2;
        return pairwiseComparisons.length >= expectedComparisons;
      default: return false;
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <SiteSelection
            facilities={facilities}
            selectedSites={selectedSites}
            onSelectionChange={setSelectedSites}
          />
        );
      case 1:
        return (
          <CriteriaSelection
            availableCriteria={availableCriteria}
            selectedCriteria={selectedCriteria}
            onSelectionChange={setSelectedCriteria}
          />
        );
      case 2:
        return (
          <MethodSelection
            method={method}
            onMethodChange={setMethod}
          />
        );
      case 3:
        return method === 'TOPSIS_W' ? (
          <WeightInput
            criteria={selectedCriteria}
            availableCriteria={availableCriteria}
            weights={weights}
            onWeightsChange={setWeights}
          />
        ) : (
          <PairwiseComparison
            criteria={selectedCriteria}
            availableCriteria={availableCriteria}
            comparisons={pairwiseComparisons}
            onComparisonsChange={setPairwiseComparisons}
          />
        );
      case 4:
        return results ? (
          <ResultsDisplay
            results={results}
            selectedSites={selectedSites.map(id => id.toString())}
            selectedCriteria={selectedCriteria}
            availableCriteria={availableCriteria}
            method={method === 'TOPSIS_W' ? 'weighted' : 'ahp'}
            weights={weights}
          />
        ) : null;
      default:
        return 'Unknown step';
    }
  };

  if (loading && facilities.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AnalyticsRounded sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Multi-Criteria Decision Analysis (MCDA)
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
          Compare and rank potential solar PV installation sites using multiple criteria and advanced decision analysis methods.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={activeStep > index || isStepComplete(index)}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          
          {activeStep === steps.length - 1 ? (
            <>
              <Button 
                variant="outlined"
                onClick={() => navigate('/pv-sites')}
                startIcon={<PowerIcon />}
                sx={{ mr: 2 }}
              >
                View PV Sites
              </Button>
              <Button 
                variant="outlined"
                onClick={() => navigate('/design')}
                startIcon={<BuildIcon />}
                sx={{ mr: 2 }}
              >
                Design Systems
              </Button>
              <Button onClick={handleReset}>
                Start New Analysis
              </Button>
            </>
          ) : activeStep === steps.length - 2 ? (
            <Button
              variant="contained"
              onClick={runAnalysis}
              disabled={!isStepComplete(activeStep) || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AssessmentRounded />}
            >
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepComplete(activeStep)}
              startIcon={<CompareArrowsRounded />}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default MCDAPage;
