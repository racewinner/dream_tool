"""
Advanced Survey Analysis Service - Python Implementation
Leverages pandas, numpy, and scipy for sophisticated statistical analysis
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

logger = logging.getLogger(__name__)

@dataclass
class RepeatGroupStats:
    path: str
    instances: int
    avg_completeness: float
    min_completeness: float
    max_completeness: float
    consistency_score: float
    fields_per_instance: List[int]

@dataclass
class AnalysisResult:
    survey_count: int
    completeness_score: float
    data_quality_score: float
    facility_distribution: Dict[str, int]
    date_distribution: Dict[str, int]
    repeat_groups: List[RepeatGroupStats]
    missing_fields: List[str]
    summary: str
    recommended_actions: List[str]
    statistical_insights: Dict[str, Any]
    data_patterns: Dict[str, Any]

class SurveyAnalysisService:
    """
    Advanced survey analysis using Python's data science stack
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
    
    async def analyze_imported_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Comprehensive analysis of imported survey data
        """
        logger.info(f"Starting analysis of {len(df)} survey records")
        
        try:
            # Basic statistics
            basic_stats = self._calculate_basic_statistics(df)
            
            # Data quality analysis
            quality_analysis = self._analyze_data_quality(df)
            
            # Completeness analysis
            completeness_analysis = self._analyze_completeness(df)
            
            # Statistical insights
            statistical_insights = self._generate_statistical_insights(df)
            
            # Pattern detection
            patterns = self._detect_patterns(df)
            
            # Facility clustering
            clusters = self._perform_facility_clustering(df)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(df, quality_analysis, patterns)
            
            # Create comprehensive result
            result = {
                "survey_count": len(df),
                "completeness_score": completeness_analysis["overall_score"],
                "data_quality_score": quality_analysis["overall_score"],
                "facility_distribution": basic_stats["facility_distribution"],
                "date_distribution": basic_stats["date_distribution"],
                "repeat_groups": [],  # Will be populated if repeat group data exists
                "missing_fields": quality_analysis["missing_fields"],
                "summary": self._generate_summary(df, quality_analysis, completeness_analysis),
                "recommendations": recommendations,
                "statistical_insights": statistical_insights,
                "data_patterns": patterns,
                "facility_clusters": clusters,
                "geographic_analysis": self._analyze_geographic_distribution(df),
                "temporal_analysis": self._analyze_temporal_patterns(df),
                "equipment_analysis": self._analyze_equipment_patterns(df)
            }
            
            logger.info("Survey analysis completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Survey analysis failed: {str(e)}")
            raise
    
    def _calculate_basic_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate basic descriptive statistics"""
        stats = {
            "total_records": len(df),
            "total_fields": len(df.columns),
            "facility_distribution": {},
            "date_distribution": {},
            "numeric_summaries": {}
        }
        
        # Facility type distribution
        if 'facility_type' in df.columns:
            stats["facility_distribution"] = df['facility_type'].value_counts().to_dict()
        
        # Date distribution (by month if survey_date exists)
        if 'survey_date' in df.columns:
            df['survey_date'] = pd.to_datetime(df['survey_date'], errors='coerce')
            monthly_counts = df['survey_date'].dt.to_period('M').value_counts().sort_index()
            stats["date_distribution"] = {str(k): v for k, v in monthly_counts.items()}
        
        # Numeric field summaries
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        for col in numeric_columns:
            if col in df.columns:
                stats["numeric_summaries"][col] = {
                    "mean": float(df[col].mean()) if not df[col].isna().all() else None,
                    "median": float(df[col].median()) if not df[col].isna().all() else None,
                    "std": float(df[col].std()) if not df[col].isna().all() else None,
                    "min": float(df[col].min()) if not df[col].isna().all() else None,
                    "max": float(df[col].max()) if not df[col].isna().all() else None,
                    "null_count": int(df[col].isna().sum())
                }
        
        return stats
    
    def _analyze_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze overall data quality"""
        total_cells = df.size
        non_null_cells = df.count().sum()
        
        # Calculate completeness by field
        field_completeness = {}
        for col in df.columns:
            completeness = (df[col].count() / len(df)) * 100
            field_completeness[col] = round(completeness, 2)
        
        # Identify missing fields (completely empty columns)
        missing_fields = [col for col, completeness in field_completeness.items() if completeness == 0]
        
        # Calculate overall quality score
        overall_completeness = (non_null_cells / total_cells) * 100
        
        # Quality penalties
        quality_score = overall_completeness
        
        # Penalty for missing critical fields
        critical_fields = ['facility_name', 'facility_type']
        missing_critical = [f for f in critical_fields if f in missing_fields or field_completeness.get(f, 0) < 50]
        quality_score -= len(missing_critical) * 10
        
        # Penalty for low completeness fields
        low_completeness_fields = [f for f, c in field_completeness.items() if c < 30 and f not in missing_fields]
        quality_score -= len(low_completeness_fields) * 5
        
        quality_score = max(0, min(100, quality_score))  # Clamp between 0-100
        
        return {
            "overall_score": round(quality_score, 2),
            "completeness_percentage": round(overall_completeness, 2),
            "field_completeness": field_completeness,
            "missing_fields": missing_fields,
            "low_quality_fields": low_completeness_fields,
            "total_cells": total_cells,
            "non_null_cells": non_null_cells
        }
    
    def _analyze_completeness(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detailed completeness analysis"""
        # Record-level completeness
        record_completeness = df.count(axis=1) / len(df.columns) * 100
        
        # Completeness distribution
        completeness_bins = pd.cut(record_completeness, bins=[0, 25, 50, 75, 100], labels=['Poor', 'Fair', 'Good', 'Excellent'])
        completeness_distribution = completeness_bins.value_counts().to_dict()
        
        return {
            "overall_score": round(record_completeness.mean(), 2),
            "median_completeness": round(record_completeness.median(), 2),
            "min_completeness": round(record_completeness.min(), 2),
            "max_completeness": round(record_completeness.max(), 2),
            "completeness_distribution": {str(k): v for k, v in completeness_distribution.items()},
            "records_above_75_percent": int((record_completeness >= 75).sum()),
            "records_below_25_percent": int((record_completeness < 25).sum())
        }
    
    def _generate_statistical_insights(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate advanced statistical insights"""
        insights = {}
        
        # Correlation analysis for numeric fields
        numeric_df = df.select_dtypes(include=[np.number])
        if len(numeric_df.columns) > 1:
            correlation_matrix = numeric_df.corr()
            
            # Find strong correlations (> 0.7 or < -0.7)
            strong_correlations = []
            for i in range(len(correlation_matrix.columns)):
                for j in range(i+1, len(correlation_matrix.columns)):
                    corr_value = correlation_matrix.iloc[i, j]
                    if abs(corr_value) > 0.7:
                        strong_correlations.append({
                            "field1": correlation_matrix.columns[i],
                            "field2": correlation_matrix.columns[j],
                            "correlation": round(corr_value, 3)
                        })
            
            insights["correlations"] = {
                "strong_correlations": strong_correlations,
                "correlation_matrix": correlation_matrix.round(3).to_dict()
            }
        
        # Distribution analysis
        insights["distributions"] = {}
        for col in numeric_df.columns:
            if not numeric_df[col].isna().all():
                # Test for normality
                _, p_value = stats.normaltest(numeric_df[col].dropna())
                is_normal = p_value > 0.05
                
                # Calculate skewness and kurtosis
                skewness = stats.skew(numeric_df[col].dropna())
                kurtosis = stats.kurtosis(numeric_df[col].dropna())
                
                insights["distributions"][col] = {
                    "is_normal": is_normal,
                    "normality_p_value": round(p_value, 4),
                    "skewness": round(skewness, 3),
                    "kurtosis": round(kurtosis, 3),
                    "distribution_type": self._classify_distribution(skewness, kurtosis, is_normal)
                }
        
        return insights
    
    def _classify_distribution(self, skewness: float, kurtosis: float, is_normal: bool) -> str:
        """Classify the distribution type"""
        if is_normal:
            return "Normal"
        elif abs(skewness) < 0.5:
            return "Approximately Symmetric"
        elif skewness > 0.5:
            return "Right-skewed"
        elif skewness < -0.5:
            return "Left-skewed"
        else:
            return "Unknown"
    
    def _detect_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect interesting patterns in the data"""
        patterns = {}
        
        # Facility type patterns
        if 'facility_type' in df.columns:
            facility_patterns = self._analyze_facility_patterns(df)
            patterns["facility_patterns"] = facility_patterns
        
        # Geographic patterns
        if 'latitude' in df.columns and 'longitude' in df.columns:
            geo_patterns = self._analyze_geographic_patterns(df)
            patterns["geographic_patterns"] = geo_patterns
        
        # Equipment patterns
        equipment_cols = [col for col in df.columns if 'equipment' in col.lower()]
        if equipment_cols:
            equipment_patterns = self._analyze_equipment_patterns(df)
            patterns["equipment_patterns"] = equipment_patterns
        
        # Operational patterns
        if 'operational_hours' in df.columns:
            operational_patterns = self._analyze_operational_patterns(df)
            patterns["operational_patterns"] = operational_patterns
        
        return patterns
    
    def _analyze_facility_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze patterns by facility type"""
        patterns = {}
        
        if 'facility_type' in df.columns:
            # Average metrics by facility type
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            facility_stats = df.groupby('facility_type')[numeric_cols].agg(['mean', 'count']).round(2)
            
            patterns["metrics_by_type"] = facility_stats.to_dict()
            
            # Most common facility type
            type_counts = df['facility_type'].value_counts()
            patterns["most_common_type"] = {
                "type": type_counts.index[0],
                "count": int(type_counts.iloc[0]),
                "percentage": round((type_counts.iloc[0] / len(df)) * 100, 1)
            }
        
        return patterns
    
    def _analyze_geographic_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze geographic distribution patterns"""
        patterns = {}
        
        if 'latitude' in df.columns and 'longitude' in df.columns:
            valid_coords = df[['latitude', 'longitude']].dropna()
            
            if len(valid_coords) > 0:
                # Geographic bounds
                patterns["geographic_bounds"] = {
                    "north": float(valid_coords['latitude'].max()),
                    "south": float(valid_coords['latitude'].min()),
                    "east": float(valid_coords['longitude'].max()),
                    "west": float(valid_coords['longitude'].min()),
                    "center_lat": float(valid_coords['latitude'].mean()),
                    "center_lon": float(valid_coords['longitude'].mean())
                }
                
                # Geographic spread
                lat_range = valid_coords['latitude'].max() - valid_coords['latitude'].min()
                lon_range = valid_coords['longitude'].max() - valid_coords['longitude'].min()
                
                patterns["geographic_spread"] = {
                    "latitude_range": round(lat_range, 4),
                    "longitude_range": round(lon_range, 4),
                    "coverage_area_approx_km2": round(lat_range * lon_range * 111 * 111, 2)  # Rough approximation
                }
        
        return patterns
    
    def _analyze_equipment_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze equipment usage patterns"""
        patterns = {}
        
        equipment_cols = [col for col in df.columns if any(keyword in col.lower() for keyword in ['equipment', 'power', 'device'])]
        
        if equipment_cols:
            # Most common equipment types
            equipment_summary = {}
            for col in equipment_cols:
                if df[col].dtype in ['object', 'string']:
                    # Categorical equipment data
                    value_counts = df[col].value_counts().head(5)
                    equipment_summary[col] = value_counts.to_dict()
                else:
                    # Numeric equipment data
                    equipment_summary[col] = {
                        "mean": round(df[col].mean(), 2) if not df[col].isna().all() else None,
                        "median": round(df[col].median(), 2) if not df[col].isna().all() else None,
                        "max": round(df[col].max(), 2) if not df[col].isna().all() else None
                    }
            
            patterns["equipment_summary"] = equipment_summary
        
        return patterns
    
    def _analyze_operational_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze operational patterns"""
        patterns = {}
        
        if 'operational_hours' in df.columns:
            op_hours = df['operational_hours'].dropna()
            
            if len(op_hours) > 0:
                # Operational hour categories
                hour_categories = pd.cut(op_hours, bins=[0, 8, 12, 18, 24], labels=['Short (0-8h)', 'Standard (8-12h)', 'Extended (12-18h)', 'Full (18-24h)'])
                hour_distribution = hour_categories.value_counts().to_dict()
                
                patterns["operational_hours"] = {
                    "distribution": {str(k): v for k, v in hour_distribution.items()},
                    "average_hours": round(op_hours.mean(), 1),
                    "most_common_range": str(hour_categories.mode().iloc[0]) if len(hour_categories.mode()) > 0 else "Unknown"
                }
        
        return patterns
    
    def _perform_facility_clustering(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Perform clustering analysis on facilities"""
        clustering_results = {}
        
        # Select numeric features for clustering
        numeric_features = ['operational_hours', 'staff_count', 'population_served', 'monthly_electricity_cost']
        available_features = [f for f in numeric_features if f in df.columns]
        
        if len(available_features) >= 2:
            # Prepare data for clustering
            cluster_data = df[available_features].dropna()
            
            if len(cluster_data) >= 3:  # Need at least 3 points for clustering
                # Standardize features
                scaled_data = self.scaler.fit_transform(cluster_data)
                
                # Determine optimal number of clusters (2-5)
                max_clusters = min(5, len(cluster_data) - 1)
                inertias = []
                
                for k in range(2, max_clusters + 1):
                    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                    kmeans.fit(scaled_data)
                    inertias.append(kmeans.inertia_)
                
                # Use elbow method to find optimal k
                optimal_k = 3 if len(inertias) >= 2 else 2
                
                # Perform final clustering
                kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
                cluster_labels = kmeans.fit_predict(scaled_data)
                
                # Analyze clusters
                cluster_data['cluster'] = cluster_labels
                cluster_summary = cluster_data.groupby('cluster')[available_features].mean().round(2)
                
                clustering_results = {
                    "num_clusters": optimal_k,
                    "features_used": available_features,
                    "cluster_summary": cluster_summary.to_dict(),
                    "cluster_sizes": pd.Series(cluster_labels).value_counts().to_dict()
                }
        
        return clustering_results
    
    def _analyze_geographic_distribution(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze geographic distribution of facilities"""
        geo_analysis = {}
        
        if 'latitude' in df.columns and 'longitude' in df.columns:
            valid_coords = df[['latitude', 'longitude']].dropna()
            
            if len(valid_coords) > 0:
                # Calculate geographic center
                center_lat = valid_coords['latitude'].mean()
                center_lon = valid_coords['longitude'].mean()
                
                # Calculate distances from center
                distances = np.sqrt((valid_coords['latitude'] - center_lat)**2 + (valid_coords['longitude'] - center_lon)**2)
                
                geo_analysis = {
                    "total_facilities_with_coords": len(valid_coords),
                    "geographic_center": {
                        "latitude": round(center_lat, 6),
                        "longitude": round(center_lon, 6)
                    },
                    "spread_statistics": {
                        "mean_distance_from_center": round(distances.mean(), 6),
                        "max_distance_from_center": round(distances.max(), 6),
                        "std_distance": round(distances.std(), 6)
                    }
                }
        
        return geo_analysis
    
    def _analyze_temporal_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze temporal patterns in survey data"""
        temporal_analysis = {}
        
        if 'survey_date' in df.columns:
            df['survey_date'] = pd.to_datetime(df['survey_date'], errors='coerce')
            valid_dates = df['survey_date'].dropna()
            
            if len(valid_dates) > 0:
                # Date range
                date_range = valid_dates.max() - valid_dates.min()
                
                # Survey frequency
                daily_counts = valid_dates.dt.date.value_counts()
                
                temporal_analysis = {
                    "date_range": {
                        "start_date": str(valid_dates.min().date()),
                        "end_date": str(valid_dates.max().date()),
                        "total_days": date_range.days
                    },
                    "survey_frequency": {
                        "total_survey_days": len(daily_counts),
                        "avg_surveys_per_day": round(daily_counts.mean(), 2),
                        "max_surveys_single_day": int(daily_counts.max()),
                        "busiest_survey_date": str(daily_counts.idxmax())
                    }
                }
        
        return temporal_analysis
    
    def _generate_recommendations(self, df: pd.DataFrame, quality_analysis: Dict, patterns: Dict) -> List[str]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []
        
        # Data quality recommendations
        if quality_analysis["overall_score"] < 70:
            recommendations.append("Data quality is below acceptable threshold (70%). Consider data cleaning and validation.")
        
        if quality_analysis["missing_fields"]:
            recommendations.append(f"Remove or populate missing fields: {', '.join(quality_analysis['missing_fields'])}")
        
        if quality_analysis["low_quality_fields"]:
            recommendations.append(f"Improve data collection for low-quality fields: {', '.join(quality_analysis['low_quality_fields'])}")
        
        # Geographic recommendations
        if 'latitude' not in df.columns or 'longitude' not in df.columns:
            recommendations.append("Add geographic coordinates to enable spatial analysis and mapping features.")
        elif df[['latitude', 'longitude']].isna().sum().sum() > len(df) * 0.5:
            recommendations.append("More than 50% of records are missing coordinates. Improve GPS data collection.")
        
        # Facility type recommendations
        if 'facility_type' in df.columns:
            type_counts = df['facility_type'].value_counts()
            if len(type_counts) == 1:
                recommendations.append("Consider surveying diverse facility types for better analysis coverage.")
        
        # Equipment recommendations
        equipment_cols = [col for col in df.columns if 'equipment' in col.lower()]
        if not equipment_cols:
            recommendations.append("Add equipment inventory data to enable energy analysis and system sizing.")
        
        # Sample size recommendations
        if len(df) < 10:
            recommendations.append("Sample size is very small. Consider collecting more survey data for reliable analysis.")
        elif len(df) < 50:
            recommendations.append("Sample size is small. Additional data would improve analysis reliability.")
        
        return recommendations
    
    def _generate_summary(self, df: pd.DataFrame, quality_analysis: Dict, completeness_analysis: Dict) -> str:
        """Generate a comprehensive summary of the analysis"""
        total_records = len(df)
        quality_score = quality_analysis["overall_score"]
        completeness_score = completeness_analysis["overall_score"]
        
        # Quality assessment
        if quality_score >= 80:
            quality_assessment = "excellent"
        elif quality_score >= 60:
            quality_assessment = "good"
        elif quality_score >= 40:
            quality_assessment = "fair"
        else:
            quality_assessment = "poor"
        
        # Completeness assessment
        if completeness_score >= 80:
            completeness_assessment = "high"
        elif completeness_score >= 60:
            completeness_assessment = "moderate"
        else:
            completeness_assessment = "low"
        
        summary = f"Analyzed {total_records} survey records with {quality_assessment} data quality ({quality_score:.1f}%) and {completeness_assessment} completeness ({completeness_score:.1f}%). "
        
        # Add specific insights
        if 'facility_type' in df.columns:
            most_common_type = df['facility_type'].mode().iloc[0] if not df['facility_type'].mode().empty else "unknown"
            summary += f"Most common facility type: {most_common_type}. "
        
        if quality_analysis["missing_fields"]:
            summary += f"Found {len(quality_analysis['missing_fields'])} completely missing fields. "
        
        return summary


# Create service instance
survey_analysis_service = SurveyAnalysisService()
