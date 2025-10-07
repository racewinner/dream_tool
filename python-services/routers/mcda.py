"""
Advanced MCDA Analysis Router
Enhanced Multi-Criteria Decision Analysis using Python scientific libraries
Integrates with existing TypeScript MCDA implementation
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Tuple
from core.auth import verify_token
from services.advanced_mcda import advanced_mcda_analyzer
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Request/Response models
class MCDAAlternative(BaseModel):
    id: str
    name: str
    criteria_values: Dict[str, float]
    metadata: Optional[Dict[str, Any]] = None

class EnhancedTOPSISRequest(BaseModel):
    alternatives: List[MCDAAlternative]
    criteria_weights: Dict[str, float]
    criteria_types: Dict[str, str] = Field(..., description="'benefit' or 'cost' for each criterion")
    uncertainty_analysis: bool = Field(default=True)
    sensitivity_analysis: bool = Field(default=True)

class MonteCarloMCDARequest(BaseModel):
    alternatives: List[MCDAAlternative]
    criteria_weights: Dict[str, float]
    criteria_types: Dict[str, str]
    weight_uncertainty: float = Field(default=0.1, ge=0, le=1)
    data_uncertainty: float = Field(default=0.05, ge=0, le=1)
    n_simulations: int = Field(default=1000, ge=100, le=10000)

class FuzzyTOPSISRequest(BaseModel):
    alternatives: List[MCDAAlternative]
    fuzzy_weights: Dict[str, Tuple[float, float, float]]  # (low, medium, high)
    criteria_types: Dict[str, str]

@router.get("/health")
async def mcda_health():
    """Health check for advanced MCDA service"""
    return {
        "service": "advanced_mcda_analysis",
        "status": "healthy",
        "features": [
            "enhanced_topsis_with_uncertainty",
            "monte_carlo_simulation",
            "fuzzy_topsis",
            "sensitivity_analysis",
            "statistical_validation",
            "ranking_stability_analysis"
        ],
        "libraries": {
            "numpy": "available",
            "pandas": "available",
            "scipy": "available",
            "scikit-learn": "available"
        }
    }

@router.post("/enhanced-topsis")
async def perform_enhanced_topsis(
    request: EnhancedTOPSISRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Enhanced TOPSIS analysis with uncertainty and sensitivity analysis
    
    Provides advanced features beyond the basic TypeScript TOPSIS:
    - Statistical validation of results
    - Uncertainty quantification
    - Sensitivity analysis for weight variations
    - Correlation analysis with individual criteria
    """
    try:
        user = await verify_token(credentials.credentials)
        logger.info(f"Enhanced TOPSIS analysis requested by {user.get('email')}")
        
        # Convert alternatives to format expected by analyzer
        alternatives_data = []
        for alt in request.alternatives:
            alt_data = {
                'id': alt.id,
                'name': alt.name,
                **alt.criteria_values
            }
            alternatives_data.append(alt_data)
        
        # Perform enhanced TOPSIS analysis
        results = advanced_mcda_analyzer.enhanced_topsis_analysis(
            alternatives_data=alternatives_data,
            criteria_weights=request.criteria_weights,
            criteria_types=request.criteria_types,
            uncertainty_analysis=request.uncertainty_analysis,
            sensitivity_analysis=request.sensitivity_analysis
        )
        
        # Add metadata
        results['analysis_metadata'] = {
            'user_email': user.get('email'),
            'analysis_type': 'enhanced_topsis',
            'n_alternatives': len(request.alternatives),
            'n_criteria': len(request.criteria_weights),
            'features_enabled': {
                'uncertainty_analysis': request.uncertainty_analysis,
                'sensitivity_analysis': request.sensitivity_analysis
            }
        }
        
        logger.info(f"Enhanced TOPSIS analysis completed for {len(request.alternatives)} alternatives")
        return results
        
    except Exception as e:
        logger.error(f"Enhanced TOPSIS analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/monte-carlo-analysis")
async def perform_monte_carlo_mcda(
    request: MonteCarloMCDARequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Monte Carlo MCDA analysis for robust decision making
    
    Performs thousands of MCDA simulations with uncertainty in:
    - Criteria weights (±weight_uncertainty)
    - Alternative performance data (±data_uncertainty)
    
    Returns:
    - Confidence intervals for scores
    - Ranking stability analysis
    - Robust ranking recommendations
    """
    try:
        user = await verify_token(credentials.credentials)
        logger.info(f"Monte Carlo MCDA analysis requested by {user.get('email')}")
        
        # Convert alternatives data
        alternatives_data = []
        for alt in request.alternatives:
            alt_data = {
                'id': alt.id,
                'name': alt.name,
                **alt.criteria_values
            }
            alternatives_data.append(alt_data)
        
        # Perform Monte Carlo analysis
        results = advanced_mcda_analyzer.monte_carlo_mcda(
            alternatives_data=alternatives_data,
            criteria_weights=request.criteria_weights,
            criteria_types=request.criteria_types,
            weight_uncertainty=request.weight_uncertainty,
            data_uncertainty=request.data_uncertainty,
            n_simulations=request.n_simulations
        )
        
        # Add metadata
        results['analysis_metadata'] = {
            'user_email': user.get('email'),
            'analysis_type': 'monte_carlo_mcda',
            'n_alternatives': len(request.alternatives),
            'n_criteria': len(request.criteria_weights),
            'simulation_parameters': {
                'n_simulations': request.n_simulations,
                'weight_uncertainty': request.weight_uncertainty,
                'data_uncertainty': request.data_uncertainty
            }
        }
        
        logger.info(f"Monte Carlo MCDA completed with {request.n_simulations} simulations")
        return results
        
    except Exception as e:
        logger.error(f"Monte Carlo MCDA analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/fuzzy-topsis")
async def perform_fuzzy_topsis(
    request: FuzzyTOPSISRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Fuzzy TOPSIS analysis for handling uncertain criteria weights
    
    Uses triangular fuzzy numbers (low, medium, high) for criteria weights
    to handle uncertainty in decision maker preferences.
    """
    try:
        user = await verify_token(credentials.credentials)
        logger.info(f"Fuzzy TOPSIS analysis requested by {user.get('email')}")
        
        # Convert alternatives data
        alternatives_data = []
        for alt in request.alternatives:
            alt_data = {
                'id': alt.id,
                'name': alt.name,
                **alt.criteria_values
            }
            alternatives_data.append(alt_data)
        
        # Perform Fuzzy TOPSIS analysis
        results = advanced_mcda_analyzer.fuzzy_topsis_analysis(
            alternatives_data=alternatives_data,
            fuzzy_weights=request.fuzzy_weights,
            criteria_types=request.criteria_types
        )
        
        # Add metadata
        results['analysis_metadata'] = {
            'user_email': user.get('email'),
            'analysis_type': 'fuzzy_topsis',
            'n_alternatives': len(request.alternatives),
            'n_criteria': len(request.fuzzy_weights)
        }
        
        logger.info(f"Fuzzy TOPSIS analysis completed for {len(request.alternatives)} alternatives")
        return results
        
    except Exception as e:
        logger.error(f"Fuzzy TOPSIS analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/compare-methods")
async def compare_mcda_methods(
    alternatives: List[MCDAAlternative],
    criteria_weights: Dict[str, float],
    criteria_types: Dict[str, str],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Compare results from different MCDA methods
    
    Runs multiple MCDA methods and compares their results:
    - Enhanced TOPSIS
    - Monte Carlo MCDA
    - Fuzzy TOPSIS (with default fuzzy weights)
    """
    try:
        user = await verify_token(credentials.credentials)
        logger.info(f"MCDA methods comparison requested by {user.get('email')}")
        
        # Convert alternatives data
        alternatives_data = []
        for alt in alternatives:
            alt_data = {
                'id': alt.id,
                'name': alt.name,
                **alt.criteria_values
            }
            alternatives_data.append(alt_data)
        
        # Run Enhanced TOPSIS
        topsis_results = advanced_mcda_analyzer.enhanced_topsis_analysis(
            alternatives_data=alternatives_data,
            criteria_weights=criteria_weights,
            criteria_types=criteria_types,
            uncertainty_analysis=False,  # Skip for comparison
            sensitivity_analysis=False
        )
        
        # Run Monte Carlo (smaller simulation for speed)
        mc_results = advanced_mcda_analyzer.monte_carlo_mcda(
            alternatives_data=alternatives_data,
            criteria_weights=criteria_weights,
            criteria_types=criteria_types,
            n_simulations=500  # Reduced for faster comparison
        )
        
        # Create fuzzy weights (±20% uncertainty)
        fuzzy_weights = {}
        for criterion, weight in criteria_weights.items():
            low = weight * 0.8
            high = weight * 1.2
            fuzzy_weights[criterion] = (low, weight, high)
        
        # Run Fuzzy TOPSIS
        fuzzy_results = advanced_mcda_analyzer.fuzzy_topsis_analysis(
            alternatives_data=alternatives_data,
            fuzzy_weights=fuzzy_weights,
            criteria_types=criteria_types
        )
        
        # Compare rankings
        topsis_ranking = topsis_results['ranking']
        mc_ranking = mc_results['robust_ranking']
        fuzzy_ranking = fuzzy_results['crisp_ranking']
        
        # Calculate ranking correlations
        from scipy.stats import spearmanr
        
        topsis_mc_corr = spearmanr(topsis_ranking, mc_ranking)[0]
        topsis_fuzzy_corr = spearmanr(topsis_ranking, fuzzy_ranking)[0]
        mc_fuzzy_corr = spearmanr(mc_ranking, fuzzy_ranking)[0]
        
        comparison_results = {
            'method_results': {
                'enhanced_topsis': {
                    'scores': topsis_results['topsis_scores'],
                    'ranking': topsis_ranking
                },
                'monte_carlo': {
                    'mean_scores': mc_results['mean_scores'],
                    'ranking': mc_ranking,
                    'confidence_intervals': mc_results['confidence_intervals']
                },
                'fuzzy_topsis': {
                    'scores': fuzzy_results['fuzzy_scores'],
                    'ranking': fuzzy_ranking,
                    'score_ranges': fuzzy_results['score_ranges']
                }
            },
            'ranking_correlations': {
                'topsis_vs_monte_carlo': float(topsis_mc_corr) if not np.isnan(topsis_mc_corr) else 0,
                'topsis_vs_fuzzy': float(topsis_fuzzy_corr) if not np.isnan(topsis_fuzzy_corr) else 0,
                'monte_carlo_vs_fuzzy': float(mc_fuzzy_corr) if not np.isnan(mc_fuzzy_corr) else 0
            },
            'consensus_ranking': _calculate_consensus_ranking([topsis_ranking, mc_ranking, fuzzy_ranking]),
            'analysis_metadata': {
                'user_email': user.get('email'),
                'analysis_type': 'method_comparison',
                'methods_compared': ['enhanced_topsis', 'monte_carlo', 'fuzzy_topsis'],
                'n_alternatives': len(alternatives)
            }
        }
        
        logger.info(f"MCDA methods comparison completed for {len(alternatives)} alternatives")
        return comparison_results
        
    except Exception as e:
        logger.error(f"MCDA methods comparison failed: {e}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

def _calculate_consensus_ranking(rankings: List[List[int]]) -> List[int]:
    """Calculate consensus ranking using Borda count method"""
    import numpy as np
    
    n_alternatives = len(rankings[0])
    n_methods = len(rankings)
    
    # Calculate Borda scores
    borda_scores = np.zeros(n_alternatives)
    
    for ranking in rankings:
        for position, alternative in enumerate(ranking):
            # Higher score for better rank (reverse position)
            borda_scores[alternative] += (n_alternatives - position - 1)
    
    # Return consensus ranking (sorted by Borda scores)
    return np.argsort(-borda_scores).tolist()
