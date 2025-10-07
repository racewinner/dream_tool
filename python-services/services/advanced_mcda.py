"""
Advanced MCDA Service
Enhanced Multi-Criteria Decision Analysis using Python scientific libraries
Integrates with existing TypeScript MCDA implementation
"""

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from typing import List, Dict, Tuple, Optional, Any
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class AdvancedMCDAAnalyzer:
    """
    Advanced MCDA analyzer with enhanced features:
    - Sensitivity analysis
    - Monte Carlo simulation
    - Fuzzy TOPSIS
    - Statistical validation
    - Uncertainty quantification
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.min_max_scaler = MinMaxScaler()
    
    def enhanced_topsis_analysis(
        self,
        alternatives_data: List[Dict[str, Any]],
        criteria_weights: Dict[str, float],
        criteria_types: Dict[str, str],  # 'benefit' or 'cost'
        uncertainty_analysis: bool = True,
        sensitivity_analysis: bool = True
    ) -> Dict[str, Any]:
        """
        Enhanced TOPSIS analysis with uncertainty and sensitivity analysis
        """
        logger.info(f"Performing enhanced TOPSIS analysis for {len(alternatives_data)} alternatives")
        
        try:
            # Convert to DataFrame for analysis
            df = pd.DataFrame(alternatives_data)
            
            # Extract criteria values
            criteria_columns = list(criteria_weights.keys())
            decision_matrix = df[criteria_columns].values
            
            # Normalize decision matrix
            normalized_matrix = self._normalize_matrix(decision_matrix)
            
            # Apply weights
            weighted_matrix = self._apply_weights(normalized_matrix, criteria_weights, criteria_columns)
            
            # Determine ideal and anti-ideal solutions
            ideal_solution, anti_ideal_solution = self._calculate_ideal_solutions(
                weighted_matrix, criteria_types, criteria_columns
            )
            
            # Calculate distances and TOPSIS scores
            distances_positive = self._calculate_distances(weighted_matrix, ideal_solution)
            distances_negative = self._calculate_distances(weighted_matrix, anti_ideal_solution)
            
            topsis_scores = distances_negative / (distances_positive + distances_negative)
            
            # Create base results
            results = {
                'alternatives': df['name'].tolist() if 'name' in df.columns else [f"Alternative_{i+1}" for i in range(len(df))],
                'topsis_scores': topsis_scores.tolist(),
                'ranking': np.argsort(-topsis_scores).tolist(),
                'normalized_matrix': normalized_matrix.tolist(),
                'weighted_matrix': weighted_matrix.tolist(),
                'ideal_solution': ideal_solution.tolist(),
                'anti_ideal_solution': anti_ideal_solution.tolist()
            }
            
            # Add uncertainty analysis
            if uncertainty_analysis:
                uncertainty_results = self._perform_uncertainty_analysis(
                    decision_matrix, criteria_weights, criteria_types, criteria_columns
                )
                results['uncertainty_analysis'] = uncertainty_results
            
            # Add sensitivity analysis
            if sensitivity_analysis:
                sensitivity_results = self._perform_sensitivity_analysis(
                    decision_matrix, criteria_weights, criteria_types, criteria_columns
                )
                results['sensitivity_analysis'] = sensitivity_results
            
            # Add statistical validation
            results['statistical_validation'] = self._validate_results(topsis_scores, decision_matrix)
            
            logger.info("Enhanced TOPSIS analysis completed successfully")
            return results
            
        except Exception as e:
            logger.error(f"Enhanced TOPSIS analysis failed: {e}")
            raise
    
    def monte_carlo_mcda(
        self,
        alternatives_data: List[Dict[str, Any]],
        criteria_weights: Dict[str, float],
        criteria_types: Dict[str, str],
        weight_uncertainty: float = 0.1,
        data_uncertainty: float = 0.05,
        n_simulations: int = 1000
    ) -> Dict[str, Any]:
        """
        Monte Carlo simulation for MCDA with uncertainty in weights and data
        """
        logger.info(f"Performing Monte Carlo MCDA with {n_simulations} simulations")
        
        try:
            df = pd.DataFrame(alternatives_data)
            criteria_columns = list(criteria_weights.keys())
            base_matrix = df[criteria_columns].values
            base_weights = np.array(list(criteria_weights.values()))
            
            # Storage for simulation results
            all_scores = []
            all_rankings = []
            
            for simulation in range(n_simulations):
                # Add uncertainty to weights
                perturbed_weights = self._perturb_weights(base_weights, weight_uncertainty)
                
                # Add uncertainty to data
                perturbed_matrix = self._perturb_data(base_matrix, data_uncertainty)
                
                # Perform TOPSIS with perturbed data
                normalized_matrix = self._normalize_matrix(perturbed_matrix)
                weighted_matrix = self._apply_weights(
                    normalized_matrix, 
                    dict(zip(criteria_columns, perturbed_weights)), 
                    criteria_columns
                )
                
                ideal_solution, anti_ideal_solution = self._calculate_ideal_solutions(
                    weighted_matrix, criteria_types, criteria_columns
                )
                
                distances_positive = self._calculate_distances(weighted_matrix, ideal_solution)
                distances_negative = self._calculate_distances(weighted_matrix, anti_ideal_solution)
                
                scores = distances_negative / (distances_positive + distances_negative)
                ranking = np.argsort(-scores)
                
                all_scores.append(scores)
                all_rankings.append(ranking)
            
            # Analyze simulation results
            all_scores = np.array(all_scores)
            all_rankings = np.array(all_rankings)
            
            # Calculate statistics
            mean_scores = np.mean(all_scores, axis=0)
            std_scores = np.std(all_scores, axis=0)
            confidence_intervals = np.percentile(all_scores, [2.5, 97.5], axis=0)
            
            # Ranking stability analysis
            ranking_frequencies = self._analyze_ranking_stability(all_rankings)
            
            results = {
                'mean_scores': mean_scores.tolist(),
                'std_scores': std_scores.tolist(),
                'confidence_intervals': {
                    'lower': confidence_intervals[0].tolist(),
                    'upper': confidence_intervals[1].tolist()
                },
                'ranking_stability': ranking_frequencies,
                'simulation_parameters': {
                    'n_simulations': n_simulations,
                    'weight_uncertainty': weight_uncertainty,
                    'data_uncertainty': data_uncertainty
                },
                'robust_ranking': np.argsort(-mean_scores).tolist()
            }
            
            logger.info("Monte Carlo MCDA analysis completed")
            return results
            
        except Exception as e:
            logger.error(f"Monte Carlo MCDA failed: {e}")
            raise
    
    def fuzzy_topsis_analysis(
        self,
        alternatives_data: List[Dict[str, Any]],
        fuzzy_weights: Dict[str, Tuple[float, float, float]],  # (low, medium, high)
        criteria_types: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Fuzzy TOPSIS analysis for handling uncertainty in criteria weights
        """
        logger.info("Performing Fuzzy TOPSIS analysis")
        
        try:
            df = pd.DataFrame(alternatives_data)
            criteria_columns = list(fuzzy_weights.keys())
            decision_matrix = df[criteria_columns].values
            
            # Convert fuzzy weights to crisp values using centroid method
            crisp_weights = {}
            for criterion, (low, med, high) in fuzzy_weights.items():
                crisp_weights[criterion] = (low + med + high) / 3
            
            # Perform TOPSIS with crisp weights
            normalized_matrix = self._normalize_matrix(decision_matrix)
            weighted_matrix = self._apply_weights(normalized_matrix, crisp_weights, criteria_columns)
            
            ideal_solution, anti_ideal_solution = self._calculate_ideal_solutions(
                weighted_matrix, criteria_types, criteria_columns
            )
            
            distances_positive = self._calculate_distances(weighted_matrix, ideal_solution)
            distances_negative = self._calculate_distances(weighted_matrix, anti_ideal_solution)
            
            fuzzy_scores = distances_negative / (distances_positive + distances_negative)
            
            # Calculate fuzzy score ranges using weight variations
            score_ranges = self._calculate_fuzzy_score_ranges(
                decision_matrix, fuzzy_weights, criteria_types, criteria_columns
            )
            
            results = {
                'fuzzy_scores': fuzzy_scores.tolist(),
                'crisp_ranking': np.argsort(-fuzzy_scores).tolist(),
                'score_ranges': score_ranges,
                'fuzzy_weights': fuzzy_weights,
                'crisp_weights': crisp_weights
            }
            
            logger.info("Fuzzy TOPSIS analysis completed")
            return results
            
        except Exception as e:
            logger.error(f"Fuzzy TOPSIS analysis failed: {e}")
            raise
    
    def _normalize_matrix(self, matrix: np.ndarray) -> np.ndarray:
        """Normalize decision matrix using vector normalization"""
        return matrix / np.sqrt(np.sum(matrix**2, axis=0))
    
    def _apply_weights(
        self, 
        normalized_matrix: np.ndarray, 
        weights: Dict[str, float], 
        criteria_columns: List[str]
    ) -> np.ndarray:
        """Apply weights to normalized matrix"""
        weight_vector = np.array([weights[col] for col in criteria_columns])
        return normalized_matrix * weight_vector
    
    def _calculate_ideal_solutions(
        self,
        weighted_matrix: np.ndarray,
        criteria_types: Dict[str, str],
        criteria_columns: List[str]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Calculate ideal and anti-ideal solutions"""
        ideal_solution = np.zeros(weighted_matrix.shape[1])
        anti_ideal_solution = np.zeros(weighted_matrix.shape[1])
        
        for i, criterion in enumerate(criteria_columns):
            if criteria_types.get(criterion, 'benefit') == 'benefit':
                ideal_solution[i] = np.max(weighted_matrix[:, i])
                anti_ideal_solution[i] = np.min(weighted_matrix[:, i])
            else:  # cost criterion
                ideal_solution[i] = np.min(weighted_matrix[:, i])
                anti_ideal_solution[i] = np.max(weighted_matrix[:, i])
        
        return ideal_solution, anti_ideal_solution
    
    def _calculate_distances(self, matrix: np.ndarray, reference_point: np.ndarray) -> np.ndarray:
        """Calculate Euclidean distances from reference point"""
        return np.sqrt(np.sum((matrix - reference_point)**2, axis=1))
    
    def _perform_uncertainty_analysis(
        self,
        decision_matrix: np.ndarray,
        criteria_weights: Dict[str, float],
        criteria_types: Dict[str, str],
        criteria_columns: List[str]
    ) -> Dict[str, Any]:
        """Perform uncertainty analysis on MCDA results"""
        
        # Calculate coefficient of variation for each criterion
        cv_values = {}
        for i, criterion in enumerate(criteria_columns):
            values = decision_matrix[:, i]
            cv_values[criterion] = np.std(values) / np.mean(values) if np.mean(values) != 0 else 0
        
        # Identify most uncertain criteria
        most_uncertain = max(cv_values.items(), key=lambda x: x[1])
        least_uncertain = min(cv_values.items(), key=lambda x: x[1])
        
        return {
            'coefficient_of_variation': cv_values,
            'most_uncertain_criterion': {
                'name': most_uncertain[0],
                'cv': most_uncertain[1]
            },
            'least_uncertain_criterion': {
                'name': least_uncertain[0],
                'cv': least_uncertain[1]
            },
            'overall_uncertainty': np.mean(list(cv_values.values()))
        }
    
    def _perform_sensitivity_analysis(
        self,
        decision_matrix: np.ndarray,
        base_weights: Dict[str, float],
        criteria_types: Dict[str, str],
        criteria_columns: List[str]
    ) -> Dict[str, Any]:
        """Perform sensitivity analysis by varying weights"""
        
        sensitivity_results = {}
        base_scores = self._calculate_topsis_scores(
            decision_matrix, base_weights, criteria_types, criteria_columns
        )
        base_ranking = np.argsort(-base_scores)
        
        # Test weight variations
        weight_variations = [0.8, 0.9, 1.1, 1.2]  # ±20% variation
        
        for criterion in criteria_columns:
            criterion_sensitivity = {
                'weight_variations': weight_variations,
                'score_changes': [],
                'ranking_changes': []
            }
            
            for variation in weight_variations:
                modified_weights = base_weights.copy()
                modified_weights[criterion] *= variation
                
                # Renormalize weights
                total_weight = sum(modified_weights.values())
                modified_weights = {k: v/total_weight for k, v in modified_weights.items()}
                
                # Calculate new scores
                new_scores = self._calculate_topsis_scores(
                    decision_matrix, modified_weights, criteria_types, criteria_columns
                )
                new_ranking = np.argsort(-new_scores)
                
                # Calculate changes
                score_change = np.mean(np.abs(new_scores - base_scores))
                ranking_change = self._calculate_ranking_similarity(base_ranking, new_ranking)
                
                criterion_sensitivity['score_changes'].append(score_change)
                criterion_sensitivity['ranking_changes'].append(ranking_change)
            
            sensitivity_results[criterion] = criterion_sensitivity
        
        return sensitivity_results
    
    def _calculate_topsis_scores(
        self,
        decision_matrix: np.ndarray,
        weights: Dict[str, float],
        criteria_types: Dict[str, str],
        criteria_columns: List[str]
    ) -> np.ndarray:
        """Calculate TOPSIS scores for given parameters"""
        
        normalized_matrix = self._normalize_matrix(decision_matrix)
        weighted_matrix = self._apply_weights(normalized_matrix, weights, criteria_columns)
        
        ideal_solution, anti_ideal_solution = self._calculate_ideal_solutions(
            weighted_matrix, criteria_types, criteria_columns
        )
        
        distances_positive = self._calculate_distances(weighted_matrix, ideal_solution)
        distances_negative = self._calculate_distances(weighted_matrix, anti_ideal_solution)
        
        return distances_negative / (distances_positive + distances_negative)
    
    def _validate_results(self, topsis_scores: np.ndarray, decision_matrix: np.ndarray) -> Dict[str, Any]:
        """Statistical validation of MCDA results"""
        
        # Calculate correlation with individual criteria
        correlations = {}
        for i in range(decision_matrix.shape[1]):
            correlation = np.corrcoef(topsis_scores, decision_matrix[:, i])[0, 1]
            correlations[f'criterion_{i+1}'] = correlation if not np.isnan(correlation) else 0
        
        # Calculate score distribution statistics
        score_stats = {
            'mean': float(np.mean(topsis_scores)),
            'std': float(np.std(topsis_scores)),
            'min': float(np.min(topsis_scores)),
            'max': float(np.max(topsis_scores)),
            'range': float(np.max(topsis_scores) - np.min(topsis_scores))
        }
        
        return {
            'correlations_with_criteria': correlations,
            'score_statistics': score_stats,
            'discrimination_power': score_stats['range']  # Higher range = better discrimination
        }
    
    def _perturb_weights(self, weights: np.ndarray, uncertainty: float) -> np.ndarray:
        """Add random perturbation to weights"""
        perturbation = np.random.normal(1.0, uncertainty, len(weights))
        perturbed = weights * perturbation
        return perturbed / np.sum(perturbed)  # Renormalize
    
    def _perturb_data(self, matrix: np.ndarray, uncertainty: float) -> np.ndarray:
        """Add random perturbation to decision matrix"""
        perturbation = np.random.normal(1.0, uncertainty, matrix.shape)
        return matrix * perturbation
    
    def _analyze_ranking_stability(self, all_rankings: np.ndarray) -> Dict[str, Any]:
        """Analyze stability of rankings across simulations"""
        n_alternatives = all_rankings.shape[1]
        n_simulations = all_rankings.shape[0]
        
        # Calculate frequency of each alternative at each rank
        rank_frequencies = np.zeros((n_alternatives, n_alternatives))
        
        for sim in range(n_simulations):
            for rank, alt in enumerate(all_rankings[sim]):
                rank_frequencies[alt, rank] += 1
        
        # Normalize to probabilities
        rank_frequencies = rank_frequencies / n_simulations
        
        # Calculate stability metrics
        stability_scores = []
        for alt in range(n_alternatives):
            # Stability = probability of being in top 3 positions
            top_3_prob = np.sum(rank_frequencies[alt, :3])
            stability_scores.append(top_3_prob)
        
        return {
            'rank_probabilities': rank_frequencies.tolist(),
            'stability_scores': stability_scores,
            'most_stable_alternative': int(np.argmax(stability_scores)),
            'least_stable_alternative': int(np.argmin(stability_scores))
        }
    
    def _calculate_fuzzy_score_ranges(
        self,
        decision_matrix: np.ndarray,
        fuzzy_weights: Dict[str, Tuple[float, float, float]],
        criteria_types: Dict[str, str],
        criteria_columns: List[str]
    ) -> Dict[str, Tuple[float, float]]:
        """Calculate score ranges for fuzzy weights"""
        
        score_ranges = {}
        
        # Calculate scores for low, medium, and high weight scenarios
        for scenario in ['low', 'medium', 'high']:
            scenario_weights = {}
            for criterion, (low, med, high) in fuzzy_weights.items():
                if scenario == 'low':
                    scenario_weights[criterion] = low
                elif scenario == 'medium':
                    scenario_weights[criterion] = med
                else:
                    scenario_weights[criterion] = high
            
            # Normalize weights
            total_weight = sum(scenario_weights.values())
            scenario_weights = {k: v/total_weight for k, v in scenario_weights.items()}
            
            scores = self._calculate_topsis_scores(
                decision_matrix, scenario_weights, criteria_types, criteria_columns
            )
            
            if scenario == 'low':
                min_scores = scores
                max_scores = scores
            else:
                min_scores = np.minimum(min_scores, scores)
                max_scores = np.maximum(max_scores, scores)
        
        # Create ranges for each alternative
        for i in range(len(min_scores)):
            score_ranges[f'alternative_{i+1}'] = (float(min_scores[i]), float(max_scores[i]))
        
        return score_ranges
    
    def _calculate_ranking_similarity(self, ranking1: np.ndarray, ranking2: np.ndarray) -> float:
        """Calculate similarity between two rankings using Spearman correlation"""
        correlation, _ = stats.spearmanr(ranking1, ranking2)
        return correlation if not np.isnan(correlation) else 0

# Global analyzer instance
advanced_mcda_analyzer = AdvancedMCDAAnalyzer()
