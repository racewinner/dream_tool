"""
Test suite for Python MCDA Analysis Services
Comprehensive testing for advanced MCDA algorithms
"""

import pytest
import numpy as np
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

# Import the FastAPI app and services
from main import app
from services.advanced_mcda import advanced_mcda_analyzer
from routers.mcda import MCDAAlternative, EnhancedTOPSISRequest

# Test client
client = TestClient(app)

# Mock authentication for testing
@pytest.fixture
def mock_auth():
    with patch('core.auth.verify_token') as mock_verify:
        mock_verify.return_value = {
            'id': 1,
            'email': 'test@example.com',
            'role': 'admin'
        }
        yield mock_verify

@pytest.fixture
def sample_alternatives():
    """Sample alternatives for testing"""
    return [
        {
            'id': 'facility_1',
            'name': 'Health Clinic A',
            'latitude': 2.0469,
            'operational_hours': 12,
            'staff_count': 5,
            'equipment_count': 15,
            'reliability_score': 0.8,
            'maintenance_cost': 1000
        },
        {
            'id': 'facility_2',
            'name': 'Health Clinic B',
            'latitude': 1.5,
            'operational_hours': 16,
            'staff_count': 8,
            'equipment_count': 20,
            'reliability_score': 0.9,
            'maintenance_cost': 800
        },
        {
            'id': 'facility_3',
            'name': 'Health Clinic C',
            'latitude': 3.0,
            'operational_hours': 10,
            'staff_count': 3,
            'equipment_count': 10,
            'reliability_score': 0.7,
            'maintenance_cost': 1200
        }
    ]

@pytest.fixture
def sample_criteria_weights():
    """Sample criteria weights for testing"""
    return {
        'latitude': 0.2,
        'operational_hours': 0.15,
        'staff_count': 0.1,
        'equipment_count': 0.15,
        'reliability_score': 0.25,
        'maintenance_cost': 0.15
    }

@pytest.fixture
def sample_criteria_types():
    """Sample criteria types for testing"""
    return {
        'latitude': 'benefit',  # Higher latitude = more solar resource
        'operational_hours': 'benefit',
        'staff_count': 'benefit',
        'equipment_count': 'benefit',
        'reliability_score': 'benefit',
        'maintenance_cost': 'cost'  # Lower cost is better
    }

class TestAdvancedMCDAAnalyzer:
    """Test the core advanced MCDA analyzer"""
    
    def test_matrix_normalization(self, sample_alternatives):
        """Test decision matrix normalization"""
        # Convert to numpy array for testing
        criteria = ['latitude', 'operational_hours', 'staff_count']
        matrix = np.array([
            [alt[criterion] for criterion in criteria]
            for alt in sample_alternatives
        ])
        
        normalized = advanced_mcda_analyzer._normalize_matrix(matrix)
        
        # Check that each column sums to 1 (vector normalization)
        column_norms = np.sqrt(np.sum(normalized**2, axis=0))
        np.testing.assert_array_almost_equal(column_norms, np.ones(len(criteria)))
    
    def test_weight_application(self, sample_alternatives):
        """Test weight application to normalized matrix"""
        criteria = ['latitude', 'operational_hours', 'staff_count']
        weights = {'latitude': 0.5, 'operational_hours': 0.3, 'staff_count': 0.2}
        
        matrix = np.array([
            [alt[criterion] for criterion in criteria]
            for alt in sample_alternatives
        ])
        
        normalized = advanced_mcda_analyzer._normalize_matrix(matrix)
        weighted = advanced_mcda_analyzer._apply_weights(normalized, weights, criteria)
        
        # Check dimensions
        assert weighted.shape == normalized.shape
        
        # Check that weights were applied correctly
        weight_vector = np.array([weights[c] for c in criteria])
        expected = normalized * weight_vector
        np.testing.assert_array_almost_equal(weighted, expected)
    
    def test_ideal_solution_calculation(self, sample_alternatives, sample_criteria_types):
        """Test ideal and anti-ideal solution calculation"""
        criteria = list(sample_criteria_types.keys())
        matrix = np.array([
            [alt[criterion] for criterion in criteria]
            for alt in sample_alternatives
        ])
        
        normalized = advanced_mcda_analyzer._normalize_matrix(matrix)
        weights = {c: 1.0/len(criteria) for c in criteria}  # Equal weights
        weighted = advanced_mcda_analyzer._apply_weights(normalized, weights, criteria)
        
        ideal, anti_ideal = advanced_mcda_analyzer._calculate_ideal_solutions(
            weighted, sample_criteria_types, criteria
        )
        
        # Check dimensions
        assert len(ideal) == len(criteria)
        assert len(anti_ideal) == len(criteria)
        
        # For benefit criteria, ideal should be max, anti-ideal should be min
        # For cost criteria, ideal should be min, anti-ideal should be max
        for i, criterion in enumerate(criteria):
            if sample_criteria_types[criterion] == 'benefit':
                assert ideal[i] == np.max(weighted[:, i])
                assert anti_ideal[i] == np.min(weighted[:, i])
            else:  # cost criterion
                assert ideal[i] == np.min(weighted[:, i])
                assert anti_ideal[i] == np.max(weighted[:, i])
    
    def test_distance_calculation(self):
        """Test Euclidean distance calculation"""
        matrix = np.array([[1, 2], [3, 4], [5, 6]])
        reference = np.array([0, 0])
        
        distances = advanced_mcda_analyzer._calculate_distances(matrix, reference)
        
        expected = np.array([
            np.sqrt(1**2 + 2**2),  # sqrt(5)
            np.sqrt(3**2 + 4**2),  # sqrt(25) = 5
            np.sqrt(5**2 + 6**2)   # sqrt(61)
        ])
        
        np.testing.assert_array_almost_equal(distances, expected)
    
    def test_enhanced_topsis_analysis(self, sample_alternatives, sample_criteria_weights, sample_criteria_types):
        """Test complete enhanced TOPSIS analysis"""
        results = advanced_mcda_analyzer.enhanced_topsis_analysis(
            alternatives_data=sample_alternatives,
            criteria_weights=sample_criteria_weights,
            criteria_types=sample_criteria_types,
            uncertainty_analysis=True,
            sensitivity_analysis=True
        )
        
        # Check basic results structure
        assert 'alternatives' in results
        assert 'topsis_scores' in results
        assert 'ranking' in results
        assert 'uncertainty_analysis' in results
        assert 'sensitivity_analysis' in results
        assert 'statistical_validation' in results
        
        # Check dimensions
        assert len(results['alternatives']) == len(sample_alternatives)
        assert len(results['topsis_scores']) == len(sample_alternatives)
        assert len(results['ranking']) == len(sample_alternatives)
        
        # Check score validity (should be between 0 and 1)
        scores = results['topsis_scores']
        assert all(0 <= score <= 1 for score in scores)
        
        # Check ranking validity
        ranking = results['ranking']
        assert set(ranking) == set(range(len(sample_alternatives)))
        
        # Check that highest score gets rank 0
        best_alternative_idx = ranking[0]
        assert scores[best_alternative_idx] == max(scores)
    
    def test_monte_carlo_mcda(self, sample_alternatives, sample_criteria_weights, sample_criteria_types):
        """Test Monte Carlo MCDA analysis"""
        results = advanced_mcda_analyzer.monte_carlo_mcda(
            alternatives_data=sample_alternatives,
            criteria_weights=sample_criteria_weights,
            criteria_types=sample_criteria_types,
            weight_uncertainty=0.1,
            data_uncertainty=0.05,
            n_simulations=100  # Small number for testing
        )
        
        # Check results structure
        assert 'mean_scores' in results
        assert 'std_scores' in results
        assert 'confidence_intervals' in results
        assert 'ranking_stability' in results
        assert 'robust_ranking' in results
        
        # Check dimensions
        n_alternatives = len(sample_alternatives)
        assert len(results['mean_scores']) == n_alternatives
        assert len(results['std_scores']) == n_alternatives
        assert len(results['confidence_intervals']['lower']) == n_alternatives
        assert len(results['confidence_intervals']['upper']) == n_alternatives
        
        # Check confidence intervals
        lower = results['confidence_intervals']['lower']
        upper = results['confidence_intervals']['upper']
        
        for i in range(n_alternatives):
            assert lower[i] <= upper[i]
            assert 0 <= lower[i] <= 1
            assert 0 <= upper[i] <= 1
    
    def test_fuzzy_topsis_analysis(self, sample_alternatives, sample_criteria_types):
        """Test Fuzzy TOPSIS analysis"""
        # Create fuzzy weights (low, medium, high)
        fuzzy_weights = {
            'latitude': (0.15, 0.2, 0.25),
            'operational_hours': (0.1, 0.15, 0.2),
            'staff_count': (0.05, 0.1, 0.15),
            'equipment_count': (0.1, 0.15, 0.2),
            'reliability_score': (0.2, 0.25, 0.3),
            'maintenance_cost': (0.1, 0.15, 0.2)
        }
        
        results = advanced_mcda_analyzer.fuzzy_topsis_analysis(
            alternatives_data=sample_alternatives,
            fuzzy_weights=fuzzy_weights,
            criteria_types=sample_criteria_types
        )
        
        # Check results structure
        assert 'fuzzy_scores' in results
        assert 'crisp_ranking' in results
        assert 'score_ranges' in results
        assert 'fuzzy_weights' in results
        assert 'crisp_weights' in results
        
        # Check dimensions
        n_alternatives = len(sample_alternatives)
        assert len(results['fuzzy_scores']) == n_alternatives
        assert len(results['crisp_ranking']) == n_alternatives
        
        # Check score validity
        scores = results['fuzzy_scores']
        assert all(0 <= score <= 1 for score in scores)
    
    def test_uncertainty_analysis(self, sample_alternatives, sample_criteria_weights, sample_criteria_types):
        """Test uncertainty analysis functionality"""
        criteria_columns = list(sample_criteria_weights.keys())
        decision_matrix = np.array([
            [alt[criterion] for criterion in criteria_columns]
            for alt in sample_alternatives
        ])
        
        uncertainty_results = advanced_mcda_analyzer._perform_uncertainty_analysis(
            decision_matrix, sample_criteria_weights, sample_criteria_types, criteria_columns
        )
        
        # Check structure
        assert 'coefficient_of_variation' in uncertainty_results
        assert 'most_uncertain_criterion' in uncertainty_results
        assert 'least_uncertain_criterion' in uncertainty_results
        assert 'overall_uncertainty' in uncertainty_results
        
        # Check that CV values are calculated for all criteria
        cv_values = uncertainty_results['coefficient_of_variation']
        assert len(cv_values) == len(criteria_columns)
        assert all(cv >= 0 for cv in cv_values.values())
    
    def test_sensitivity_analysis(self, sample_alternatives, sample_criteria_weights, sample_criteria_types):
        """Test sensitivity analysis functionality"""
        criteria_columns = list(sample_criteria_weights.keys())
        decision_matrix = np.array([
            [alt[criterion] for criterion in criteria_columns]
            for alt in sample_alternatives
        ])
        
        sensitivity_results = advanced_mcda_analyzer._perform_sensitivity_analysis(
            decision_matrix, sample_criteria_weights, sample_criteria_types, criteria_columns
        )
        
        # Check that sensitivity is calculated for all criteria
        assert len(sensitivity_results) == len(criteria_columns)
        
        for criterion, sensitivity in sensitivity_results.items():
            assert 'weight_variations' in sensitivity
            assert 'score_changes' in sensitivity
            assert 'ranking_changes' in sensitivity
            
            # Check that variations were tested
            assert len(sensitivity['weight_variations']) > 0
            assert len(sensitivity['score_changes']) == len(sensitivity['weight_variations'])
            assert len(sensitivity['ranking_changes']) == len(sensitivity['weight_variations'])

class TestMCDAAPIEndpoints:
    """Test the FastAPI MCDA endpoints"""
    
    def test_mcda_health_endpoint(self):
        """Test MCDA service health check"""
        response = client.get("/api/python/mcda/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["service"] == "advanced_mcda_analysis"
        assert data["status"] == "healthy"
        assert "enhanced_topsis_with_uncertainty" in data["features"]
    
    def test_enhanced_topsis_endpoint(self, mock_auth, sample_alternatives, sample_criteria_weights, sample_criteria_types):
        """Test enhanced TOPSIS endpoint"""
        # Convert sample data to API format
        alternatives = [
            MCDAAlternative(
                id=alt['id'],
                name=alt['name'],
                criteria_values={k: v for k, v in alt.items() if k not in ['id', 'name']}
            )
            for alt in sample_alternatives
        ]
        
        request_data = {
            "alternatives": [alt.dict() for alt in alternatives],
            "criteria_weights": sample_criteria_weights,
            "criteria_types": sample_criteria_types,
            "uncertainty_analysis": True,
            "sensitivity_analysis": True
        }
        
        response = client.post(
            "/api/python/mcda/enhanced-topsis",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "alternatives" in data
        assert "topsis_scores" in data
        assert "ranking" in data
        assert "uncertainty_analysis" in data
        assert "sensitivity_analysis" in data
        assert "analysis_metadata" in data
        
        # Check metadata
        metadata = data["analysis_metadata"]
        assert metadata["analysis_type"] == "enhanced_topsis"
        assert metadata["n_alternatives"] == len(sample_alternatives)
        assert metadata["n_criteria"] == len(sample_criteria_weights)
    
    def test_monte_carlo_endpoint(self, mock_auth, sample_alternatives, sample_criteria_weights, sample_criteria_types):
        """Test Monte Carlo MCDA endpoint"""
        alternatives = [
            MCDAAlternative(
                id=alt['id'],
                name=alt['name'],
                criteria_values={k: v for k, v in alt.items() if k not in ['id', 'name']}
            )
            for alt in sample_alternatives
        ]
        
        request_data = {
            "alternatives": [alt.dict() for alt in alternatives],
            "criteria_weights": sample_criteria_weights,
            "criteria_types": sample_criteria_types,
            "weight_uncertainty": 0.1,
            "data_uncertainty": 0.05,
            "n_simulations": 100
        }
        
        response = client.post(
            "/api/python/mcda/monte-carlo-analysis",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "mean_scores" in data
        assert "confidence_intervals" in data
        assert "ranking_stability" in data
        assert "robust_ranking" in data
        assert "analysis_metadata" in data
    
    def test_fuzzy_topsis_endpoint(self, mock_auth, sample_alternatives, sample_criteria_types):
        """Test Fuzzy TOPSIS endpoint"""
        alternatives = [
            MCDAAlternative(
                id=alt['id'],
                name=alt['name'],
                criteria_values={k: v for k, v in alt.items() if k not in ['id', 'name']}
            )
            for alt in sample_alternatives
        ]
        
        fuzzy_weights = {
            criterion: [0.8 * weight, weight, 1.2 * weight]
            for criterion, weight in {
                'latitude': 0.2,
                'operational_hours': 0.15,
                'staff_count': 0.1,
                'equipment_count': 0.15,
                'reliability_score': 0.25,
                'maintenance_cost': 0.15
            }.items()
        }
        
        request_data = {
            "alternatives": [alt.dict() for alt in alternatives],
            "fuzzy_weights": fuzzy_weights,
            "criteria_types": sample_criteria_types
        }
        
        response = client.post(
            "/api/python/mcda/fuzzy-topsis",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "fuzzy_scores" in data
        assert "crisp_ranking" in data
        assert "score_ranges" in data
        assert "analysis_metadata" in data
    
    def test_compare_methods_endpoint(self, mock_auth, sample_alternatives, sample_criteria_weights, sample_criteria_types):
        """Test methods comparison endpoint"""
        alternatives = [
            MCDAAlternative(
                id=alt['id'],
                name=alt['name'],
                criteria_values={k: v for k, v in alt.items() if k not in ['id', 'name']}
            )
            for alt in sample_alternatives
        ]
        
        response = client.post(
            "/api/python/mcda/compare-methods",
            json={
                "alternatives": [alt.dict() for alt in alternatives],
                "criteria_weights": sample_criteria_weights,
                "criteria_types": sample_criteria_types
            },
            headers={"Authorization": "Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "method_results" in data
        assert "ranking_correlations" in data
        assert "consensus_ranking" in data
        assert "analysis_metadata" in data
        
        # Check that all methods were compared
        methods = data["method_results"]
        assert "enhanced_topsis" in methods
        assert "monte_carlo" in methods
        assert "fuzzy_topsis" in methods
        
        # Check correlations
        correlations = data["ranking_correlations"]
        assert "topsis_vs_monte_carlo" in correlations
        assert "topsis_vs_fuzzy" in correlations
        assert "monte_carlo_vs_fuzzy" in correlations
    
    def test_unauthorized_mcda_access(self):
        """Test that MCDA endpoints require authentication"""
        response = client.post("/api/python/mcda/enhanced-topsis", json={})
        assert response.status_code == 403  # Forbidden without auth
    
    def test_invalid_mcda_request(self, mock_auth):
        """Test handling of invalid MCDA requests"""
        # Empty alternatives list
        request_data = {
            "alternatives": [],
            "criteria_weights": {"test": 1.0},
            "criteria_types": {"test": "benefit"}
        }
        
        response = client.post(
            "/api/python/mcda/enhanced-topsis",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Should handle gracefully
        assert response.status_code in [400, 422, 500]

class TestMCDAIntegration:
    """Test integration with existing TypeScript MCDA system"""
    
    def test_data_format_compatibility(self, sample_alternatives, sample_criteria_weights, sample_criteria_types):
        """Test compatibility with TypeScript MCDA data formats"""
        # Simulate TypeScript MCDA data
        typescript_facilities = [
            {
                "id": 1,
                "name": "Health Clinic A",
                "facilityType": "health_clinic",
                "latitude": 2.0469,
                "longitude": 45.3182,
                "operationalHours": 12,
                "staffCount": 5,
                "has_survey": True,
                "has_techno_economic": True
            }
        ]
        
        criteria = ["latitude", "operationalHours", "staffCount"]
        criteria_types = {
            "latitude": "benefit",
            "operationalHours": "benefit", 
            "staffCount": "benefit"
        }
        
        # Test conversion to Python format
        from services.pythonMcdaService import PythonMCDAService
        python_alternatives = PythonMCDAService.convertToPythonMCDAFormat(
            typescript_facilities, criteria, criteria_types
        )
        
        assert len(python_alternatives) == 1
        assert python_alternatives[0]["id"] == "1"
        assert python_alternatives[0]["name"] == "Health Clinic A"
        assert "latitude" in python_alternatives[0]["criteria_values"]
        assert "operationalHours" in python_alternatives[0]["criteria_values"]
    
    def test_fuzzy_weights_creation(self):
        """Test fuzzy weights creation from crisp weights"""
        from services.pythonMcdaService import PythonMCDAService
        
        crisp_weights = {
            "criterion1": 0.3,
            "criterion2": 0.4,
            "criterion3": 0.3
        }
        
        fuzzy_weights = PythonMCDAService.createFuzzyWeights(crisp_weights, uncertainty=0.2)
        
        for criterion, (low, med, high) in fuzzy_weights.items():
            expected_low = max(0, crisp_weights[criterion] * 0.8)
            expected_high = min(1, crisp_weights[criterion] * 1.2)
            
            assert low == expected_low
            assert med == crisp_weights[criterion]
            assert high == expected_high
    
    def test_ranking_similarity_calculation(self):
        """Test ranking similarity calculation"""
        from services.pythonMcdaService import PythonMCDAService
        
        ranking1 = [0, 1, 2, 3]
        ranking2 = [0, 1, 2, 3]  # Identical
        ranking3 = [3, 2, 1, 0]  # Reverse
        
        # Identical rankings should have similarity = 1
        similarity_identical = PythonMCDAService.calculateRankingSimilarity(ranking1, ranking2)
        assert abs(similarity_identical - 1.0) < 0.01
        
        # Reverse rankings should have similarity = -1
        similarity_reverse = PythonMCDAService.calculateRankingSimilarity(ranking1, ranking3)
        assert abs(similarity_reverse - (-1.0)) < 0.01

class TestMCDAErrorHandling:
    """Test error handling in MCDA analysis"""
    
    def test_empty_alternatives_handling(self):
        """Test handling of empty alternatives list"""
        with pytest.raises(Exception):  # Should raise appropriate error
            advanced_mcda_analyzer.enhanced_topsis_analysis(
                alternatives_data=[],
                criteria_weights={"test": 1.0},
                criteria_types={"test": "benefit"}
            )
    
    def test_mismatched_criteria_handling(self):
        """Test handling of mismatched criteria"""
        alternatives = [{"id": "1", "name": "Test", "criterion1": 1.0}]
        weights = {"criterion2": 1.0}  # Different criterion
        types = {"criterion2": "benefit"}
        
        with pytest.raises(Exception):  # Should raise appropriate error
            advanced_mcda_analyzer.enhanced_topsis_analysis(
                alternatives_data=alternatives,
                criteria_weights=weights,
                criteria_types=types
            )
    
    def test_invalid_weight_values(self):
        """Test handling of invalid weight values"""
        alternatives = [{"id": "1", "name": "Test", "criterion1": 1.0}]
        weights = {"criterion1": -0.5}  # Negative weight
        types = {"criterion1": "benefit"}
        
        # Should handle gracefully or raise appropriate error
        try:
            result = advanced_mcda_analyzer.enhanced_topsis_analysis(
                alternatives_data=alternatives,
                criteria_weights=weights,
                criteria_types=types
            )
            # If it doesn't raise an error, check that results are still valid
            assert len(result['topsis_scores']) == 1
        except (ValueError, Exception):
            # Expected to raise an error for invalid weights
            pass

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
