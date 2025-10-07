/**
 * Results Display Component for MCDA Analysis
 * Shows ranked sites with scores, visualizations, and detailed breakdown
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider
} from '@mui/material';
import {
  EmojiEventsRounded,
  ExpandMoreRounded,
  InfoRounded,
  BarChartRounded,
  DownloadRounded,
  VisibilityRounded,
  StarRounded,
  LocationOnRounded,
  TrendingUpRounded
} from '@mui/icons-material';
import { CriterionInfo, MCDAResult, MCDAAnalysisResponse } from '../../pages/mcda/MCDAPage';
import { mcdaService } from '../../services/mcdaService';

interface ResultsDisplayProps {
  results: MCDAAnalysisResponse;
  selectedSites: string[];
  selectedCriteria: string[];
  availableCriteria: Record<string, CriterionInfo>;
  method: 'weighted' | 'ahp';
  weights?: Record<string, number>;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  selectedSites,
  selectedCriteria,
  availableCriteria,
  method,
  weights
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSite, setSelectedSite] = useState<MCDAResult | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);

  const handleSiteDetails = (site: MCDAResult) => {
    setSelectedSite(site);
    setDetailDialog(true);
  };

  const exportResults = () => {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcda_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVContent = (): string => {
    const headers = ['Rank', 'Site ID', 'Site Name', 'MCDA Score', ...selectedCriteria];
    const rows = results.results.map((result, index) => [
      index + 1,
      result.siteId,
      result.siteName || result.siteId,
      result.score.toFixed(4),
      ...selectedCriteria.map(criterion => result.criteriaScores?.[criterion]?.toFixed(4) || 'N/A')
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const getRankColor = (rank: number): 'error' | 'warning' | 'info' | 'success' => {
    if (rank === 1) return 'success';
    if (rank <= 3) return 'info';
    if (rank <= Math.ceil(results.results.length / 2)) return 'warning';
    return 'error';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <EmojiEventsRounded sx={{ color: 'gold' }} />;
    if (rank === 2) return <EmojiEventsRounded sx={{ color: 'silver' }} />;
    if (rank === 3) return <EmojiEventsRounded sx={{ color: '#CD7F32' }} />;
    return <StarRounded />;
  };

  const maxScore = Math.max(...results.results.map(r => r.score));
  const minScore = Math.min(...results.results.map(r => r.score));

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <EmojiEventsRounded sx={{ mr: 1 }} />
        MCDA Analysis Results
      </Typography>

      {/* Analysis Summary */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Analysis Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Method:</strong> {method === 'weighted' ? 'TOPSIS with Direct Weights' : 'TOPSIS with AHP Weights'}
              </Typography>
              <Typography variant="body2">
                <strong>Sites Analyzed:</strong> {selectedSites.length}
              </Typography>
              <Typography variant="body2">
                <strong>Criteria Used:</strong> {selectedCriteria.length}
              </Typography>
              <Typography variant="body2">
                <strong>Analysis Date:</strong> {new Date().toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Score Distribution
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Highest Score:</strong> {maxScore.toFixed(4)}
              </Typography>
              <Typography variant="body2">
                <strong>Lowest Score:</strong> {minScore.toFixed(4)}
              </Typography>
              <Typography variant="body2">
                <strong>Score Range:</strong> {(maxScore - minScore).toFixed(4)}
              </Typography>
              <Typography variant="body2">
                <strong>Average Score:</strong> {(results.results.reduce((sum, r) => sum + r.score, 0) / results.results.length).toFixed(4)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadRounded />}
            onClick={exportResults}
            size="small"
          >
            Export Results
          </Button>
          <Button
            variant="outlined"
            startIcon={<BarChartRounded />}
            onClick={() => setShowDetails(!showDetails)}
            size="small"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </Box>
      </Paper>

      {/* Results Ranking */}
      <Grid container spacing={3}>
        {/* Top 3 Podium */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Top Ranked Sites
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {results.results.slice(0, 3).map((result, index) => {
              const rank = index + 1;
              return (
                <Grid item xs={12} sm={4} key={result.siteId}>
                  <Card 
                    elevation={rank === 1 ? 8 : 4}
                    sx={{ 
                      position: 'relative',
                      border: rank === 1 ? '2px solid gold' : rank === 2 ? '2px solid silver' : '2px solid #CD7F32',
                      cursor: 'pointer',
                      '&:hover': { transform: 'translateY(-2px)' },
                      transition: 'transform 0.2s'
                    }}
                    onClick={() => handleSiteDetails(result)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        {getRankIcon(rank)}
                        <Chip 
                          label={`#${rank}`} 
                          color={getRankColor(rank)}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                        {result.siteName || result.siteId}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Site ID: {result.siteId}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          MCDA Score: <strong>{result.score.toFixed(4)}</strong>
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(result.score / maxScore) * 100}
                          color={getRankColor(rank)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Button
                        size="small"
                        startIcon={<VisibilityRounded />}
                        fullWidth
                        variant="outlined"
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        {/* Complete Results Table */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Complete Ranking
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Site ID</TableCell>
                  <TableCell>Site Name</TableCell>
                  <TableCell align="right">MCDA Score</TableCell>
                  <TableCell align="center">Score Bar</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.results.map((result, index) => {
                  const rank = index + 1;
                  return (
                    <TableRow key={result.siteId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRankIcon(rank)}
                          <Chip 
                            label={rank} 
                            size="small" 
                            color={getRankColor(rank)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{result.siteId}</TableCell>
                      <TableCell>{result.siteName || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {result.score.toFixed(4)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ width: 100, mx: 'auto' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(result.score / maxScore) * 100}
                            color={getRankColor(rank)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View detailed breakdown">
                          <IconButton 
                            size="small" 
                            onClick={() => handleSiteDetails(result)}
                          >
                            <InfoRounded />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Analysis Details */}
      {showDetails && (
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreRounded />}>
              <Typography variant="subtitle1">Criteria Weights Used</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {results.weights && Object.entries(results.weights).map(([criterion, weight]) => (
                  <Grid item xs={12} sm={6} md={4} key={criterion}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {mcdaService.formatCriterionName(criterion, availableCriteria)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={weight * 100}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {(weight * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {method === 'ahp' && results.consistencyRatio !== undefined && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography variant="subtitle1">AHP Consistency Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Alert severity={results.consistencyRatio <= 0.1 ? 'success' : 'warning'}>
                  <Typography variant="body2">
                    <strong>Consistency Ratio:</strong> {(results.consistencyRatio * 100).toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {results.consistencyRatio <= 0.1 
                      ? '✓ Your pairwise comparisons are consistent and reliable.'
                      : '⚠ Consistency ratio above 10% suggests some inconsistencies in your comparisons. Consider reviewing your pairwise judgments.'
                    }
                  </Typography>
                </Alert>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}

      {/* Site Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnRounded />
            Site Details: {selectedSite?.siteName || selectedSite?.siteId}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSite && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Site ID:</strong> {selectedSite.siteId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>MCDA Score:</strong> {selectedSite.score.toFixed(4)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Rank:</strong> #{results.results.findIndex(r => r.siteId === selectedSite.siteId) + 1}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Percentile:</strong> {(((results.results.length - results.results.findIndex(r => r.siteId === selectedSite.siteId)) / results.results.length) * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Criteria Performance Breakdown
              </Typography>
              
              {selectedSite.criteriaScores && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Criterion</TableCell>
                        <TableCell align="right">Raw Value</TableCell>
                        <TableCell align="right">Normalized Score</TableCell>
                        <TableCell align="right">Weight</TableCell>
                        <TableCell align="right">Contribution</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCriteria.map(criterion => {
                        const score = selectedSite.criteriaScores?.[criterion] || 0;
                        const weight = results.weights?.[criterion] || 0;
                        const contribution = score * weight;
                        
                        return (
                          <TableRow key={criterion}>
                            <TableCell>
                              {mcdaService.formatCriterionName(criterion, availableCriteria)}
                            </TableCell>
                            <TableCell align="right">
                              {selectedSite.rawValues?.[criterion]?.toFixed(2) || 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              {score.toFixed(4)}
                            </TableCell>
                            <TableCell align="right">
                              {(weight * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body2" 
                                color={contribution > 0.1 ? 'success.main' : 'text.secondary'}
                                fontWeight="medium"
                              >
                                {contribution.toFixed(4)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultsDisplay;
