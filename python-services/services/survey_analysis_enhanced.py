"""
Enhanced Survey Analysis Service with Database Integration
Uses real survey data from SQLAlchemy models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

from services.database_service import db_service
from models.database_models import Survey, Facility, Equipment

logger = logging.getLogger(__name__)

@dataclass
class SurveyAnalysisResult:
    survey_id: int
    facility_name: str
    facility_type: str
    equipment_count: int
    total_power_rating: float
    daily_energy_demand: float
    data_quality_score: float
    completeness_score: float
    critical_equipment_count: int
    recommendations: List[str]
    statistical_insights: Dict[str, Any]

@dataclass
class BatchAnalysisResult:
    total_surveys: int
    total_facilities: int
    avg_data_quality: float
    facility_type_distribution: Dict[str, int]
    regional_distribution: Dict[str, int]
    equipment_patterns: Dict[str, Any]
    energy_demand_stats: Dict[str, float]
    recommendations: List[str]

class EnhancedSurveyAnalysisService:
    """Enhanced survey analysis using real database data"""
    
    def __init__(self):
        self.scaler = StandardScaler()
    
    async def analyze_survey(self, survey_id: int) -> SurveyAnalysisResult:
        """Analyze a single survey using real database data"""
        try:
            # Get survey from database
            survey = db_service.get_survey_by_id(survey_id)
            if not survey:
                raise ValueError(f"Survey {survey_id} not found")
            
            # Get facility data
            facility = db_service.get_facility_by_id(survey.facility_id)
            if not facility:
                raise ValueError(f"Facility {survey.facility_id} not found")
            
            # Get equipment data
            equipment_list = db_service.get_equipment_by_survey(survey_id)
            
            # Analyze facility data
            facility_data = survey.facility_data or {}
            raw_data = survey.raw_data or {}
            
            # Calculate metrics
            equipment_count = len(equipment_list)
            total_power_rating = sum(eq.power_rating * eq.quantity for eq in equipment_list)
            daily_energy_demand = sum(
                eq.power_rating * eq.quantity * eq.hours_per_day / 1000  # Convert to kWh
                for eq in equipment_list
            )
            critical_equipment_count = sum(1 for eq in equipment_list if eq.critical)
            
            # Calculate data quality score
            data_quality_score = self._calculate_data_quality(facility_data, raw_data)
            completeness_score = self._calculate_completeness(facility_data, raw_data)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                facility_data, equipment_list, daily_energy_demand
            )
            
            # Statistical insights
            statistical_insights = self._generate_statistical_insights(
                facility_data, equipment_list
            )
            
            return SurveyAnalysisResult(
                survey_id=survey_id,
                facility_name=facility.name,
                facility_type=facility.type.value if facility.type else 'unknown',
                equipment_count=equipment_count,
                total_power_rating=total_power_rating,
                daily_energy_demand=daily_energy_demand,
                data_quality_score=data_quality_score,
                completeness_score=completeness_score,
                critical_equipment_count=critical_equipment_count,
                recommendations=recommendations,
                statistical_insights=statistical_insights
            )
            
        except Exception as e:
            logger.error(f"Failed to analyze survey {survey_id}: {str(e)}")
            raise
    
    async def analyze_batch_surveys(self, facility_ids: Optional[List[int]] = None) -> BatchAnalysisResult:
        """Analyze multiple surveys/facilities"""
        try:
            # Get surveys from database
            if facility_ids:
                surveys = []
                for facility_id in facility_ids:
                    facility_surveys = db_service.get_surveys_by_facility(facility_id)
                    surveys.extend(facility_surveys)
            else:
                # Get all surveys
                with db_service.get_session() as db:
                    surveys = db.query(Survey).all()
            
            if not surveys:
                raise ValueError("No surveys found for analysis")
            
            # Get facilities
            facility_ids_set = set(survey.facility_id for survey in surveys)
            facilities = []
            for fid in facility_ids_set:
                facility = db_service.get_facility_by_id(fid)
                if facility:
                    facilities.append(facility)
            
            # Analyze each survey
            analysis_results = []
            for survey in surveys:
                try:
                    result = await self.analyze_survey(survey.id)
                    analysis_results.append(result)
                except Exception as e:
                    logger.warning(f"Failed to analyze survey {survey.id}: {e}")
                    continue
            
            # Calculate batch statistics
            total_surveys = len(analysis_results)
            total_facilities = len(facilities)
            
            # Data quality statistics
            quality_scores = [r.data_quality_score for r in analysis_results]
            avg_data_quality = np.mean(quality_scores) if quality_scores else 0.0
            
            # Facility type distribution
            facility_type_dist = {}
            for facility in facilities:
                ftype = facility.type.value if facility.type else 'unknown'
                facility_type_dist[ftype] = facility_type_dist.get(ftype, 0) + 1
            
            # Regional distribution
            regional_dist = {}
            for facility in facilities:
                region = facility.region or 'unknown'
                regional_dist[region] = regional_dist.get(region, 0) + 1
            
            # Equipment patterns
            equipment_patterns = self._analyze_equipment_patterns(analysis_results)
            
            # Energy demand statistics
            energy_demands = [r.daily_energy_demand for r in analysis_results]
            energy_demand_stats = {
                'mean': np.mean(energy_demands) if energy_demands else 0.0,
                'median': np.median(energy_demands) if energy_demands else 0.0,
                'std': np.std(energy_demands) if energy_demands else 0.0,
                'min': np.min(energy_demands) if energy_demands else 0.0,
                'max': np.max(energy_demands) if energy_demands else 0.0
            }
            
            # Generate batch recommendations
            recommendations = self._generate_batch_recommendations(
                analysis_results, facilities
            )
            
            return BatchAnalysisResult(
                total_surveys=total_surveys,
                total_facilities=total_facilities,
                avg_data_quality=avg_data_quality,
                facility_type_distribution=facility_type_dist,
                regional_distribution=regional_dist,
                equipment_patterns=equipment_patterns,
                energy_demand_stats=energy_demand_stats,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Failed to analyze batch surveys: {str(e)}")
            raise
    
    async def get_facility_distribution(self) -> Dict[str, Any]:
        """Get real facility distribution from database"""
        try:
            stats = db_service.get_survey_statistics()
            
            # Get additional distribution data
            with db_service.get_session() as db:
                facilities = db.query(Facility).all()
                
                # Geographic distribution
                geographic_dist = {}
                for facility in facilities:
                    region = facility.region or 'unknown'
                    geographic_dist[region] = geographic_dist.get(region, 0) + 1
                
                # Type distribution
                type_dist = {}
                for facility in facilities:
                    ftype = facility.type.value if facility.type else 'unknown'
                    type_dist[ftype] = type_dist.get(ftype, 0) + 1
            
            return {
                'total_facilities': stats['total_facilities'],
                'total_surveys': stats['total_surveys'],
                'facility_types': type_dist,
                'geographic_distribution': geographic_dist,
                'surveys_by_month': stats.get('surveys_by_month', []),
                'facilities_by_type': stats.get('facilities_by_type', [])
            }
            
        except Exception as e:
            logger.error(f"Failed to get facility distribution: {str(e)}")
            raise
    
    def _calculate_data_quality(self, facility_data: Dict, raw_data: Dict) -> float:
        """Calculate data quality score"""
        score = 0.0
        max_score = 100.0
        
        # Check essential fields
        essential_fields = ['facility_name', 'facility_type', 'region']
        for field in essential_fields:
            if facility_data.get(field):
                score += 20.0
        
        # Check GPS coordinates
        if facility_data.get('latitude') and facility_data.get('longitude'):
            score += 20.0
        
        # Check equipment data
        if facility_data.get('equipment') and len(facility_data['equipment']) > 0:
            score += 20.0
        
        return min(score, max_score)
    
    def _calculate_completeness(self, facility_data: Dict, raw_data: Dict) -> float:
        """Calculate data completeness score"""
        total_fields = len(facility_data) + len(raw_data)
        filled_fields = sum(1 for v in facility_data.values() if v is not None and v != '')
        filled_fields += sum(1 for v in raw_data.values() if v is not None and v != '')
        
        return (filled_fields / total_fields * 100) if total_fields > 0 else 0.0
    
    def _generate_recommendations(self, facility_data: Dict, equipment_list: List, daily_demand: float) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        # Energy demand recommendations
        if daily_demand > 50:  # kWh
            recommendations.append("High energy demand detected. Consider energy efficiency measures.")
        elif daily_demand < 5:
            recommendations.append("Low energy demand. Verify equipment data completeness.")
        
        # Equipment recommendations
        if len(equipment_list) == 0:
            recommendations.append("No equipment data found. Complete equipment inventory needed.")
        elif len(equipment_list) < 5:
            recommendations.append("Limited equipment data. Consider comprehensive equipment audit.")
        
        # Critical equipment check
        critical_count = sum(1 for eq in equipment_list if eq.critical)
        if critical_count == 0:
            recommendations.append("No critical equipment identified. Review equipment prioritization.")
        
        # Data quality recommendations
        if not facility_data.get('latitude') or not facility_data.get('longitude'):
            recommendations.append("GPS coordinates missing. Add location data for solar analysis.")
        
        return recommendations
    
    def _generate_statistical_insights(self, facility_data: Dict, equipment_list: List) -> Dict[str, Any]:
        """Generate statistical insights"""
        insights = {}
        
        if equipment_list:
            power_ratings = [eq.power_rating for eq in equipment_list]
            hours_per_day = [eq.hours_per_day for eq in equipment_list]
            
            insights['equipment_stats'] = {
                'avg_power_rating': np.mean(power_ratings),
                'total_equipment': len(equipment_list),
                'avg_daily_hours': np.mean(hours_per_day),
                'power_rating_std': np.std(power_ratings)
            }
        
        return insights
    
    def _analyze_equipment_patterns(self, results: List[SurveyAnalysisResult]) -> Dict[str, Any]:
        """Analyze equipment patterns across surveys"""
        patterns = {
            'avg_equipment_per_facility': np.mean([r.equipment_count for r in results]),
            'avg_power_rating': np.mean([r.total_power_rating for r in results]),
            'avg_daily_demand': np.mean([r.daily_energy_demand for r in results]),
            'critical_equipment_ratio': np.mean([
                r.critical_equipment_count / max(r.equipment_count, 1) for r in results
            ])
        }
        
        return patterns
    
    def _generate_batch_recommendations(self, results: List[SurveyAnalysisResult], facilities: List) -> List[str]:
        """Generate recommendations for batch analysis"""
        recommendations = []
        
        # Data quality recommendations
        avg_quality = np.mean([r.data_quality_score for r in results])
        if avg_quality < 70:
            recommendations.append("Overall data quality is low. Implement data validation procedures.")
        
        # Energy demand patterns
        demands = [r.daily_energy_demand for r in results]
        if np.std(demands) > np.mean(demands):
            recommendations.append("High variation in energy demand. Investigate facility differences.")
        
        # Equipment coverage
        no_equipment = sum(1 for r in results if r.equipment_count == 0)
        if no_equipment > len(results) * 0.2:
            recommendations.append("20%+ facilities missing equipment data. Prioritize equipment audits.")
        
        return recommendations

# Global instance
enhanced_analysis_service = EnhancedSurveyAnalysisService()

# Convenience functions
async def analyze_survey(survey_id: int) -> SurveyAnalysisResult:
    """Analyze a single survey"""
    return await enhanced_analysis_service.analyze_survey(survey_id)

async def analyze_batch_surveys(facility_ids: Optional[List[int]] = None) -> BatchAnalysisResult:
    """Analyze multiple surveys"""
    return await enhanced_analysis_service.analyze_batch_surveys(facility_ids)

async def get_facility_distribution() -> Dict[str, Any]:
    """Get facility distribution"""
    return await enhanced_analysis_service.get_facility_distribution()
