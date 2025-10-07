"""
Enhanced Chart Data Service for DREAM Tool
Migrated from TypeScript with advanced data visualization capabilities using Python scientific libraries
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass, asdict
import logging
import asyncio
import json
from collections import defaultdict, Counter
from scipy import stats
import asyncpg
import os

from .survey_analysis import survey_analysis_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ChartDataPoint:
    label: str
    value: Union[float, int]
    color: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class TimeSeriesDataPoint:
    date: str
    value: Union[float, int]
    series: Optional[str] = None

@dataclass
class MultiSeriesData:
    series: str
    label: str
    value: Union[float, int]
    color: Optional[str] = None

@dataclass
class GeoDataPoint:
    latitude: float
    longitude: float
    label: str
    value: Union[float, int]
    color: Optional[str] = None
    popup_data: Optional[Dict[str, Any]] = None

@dataclass
class RepeatGroupChartData:
    group_path: str
    instance_count: int
    completeness_data: List[ChartDataPoint]
    consistency_score: float
    field_distribution: Optional[List[ChartDataPoint]] = None

@dataclass
class SurveyVisualizationData:
    completeness_chart: List[ChartDataPoint]
    quality_chart: List[ChartDataPoint]
    facility_distribution_chart: List[ChartDataPoint]
    date_distribution_chart: List[TimeSeriesDataPoint]
    repeat_groups_chart: List[RepeatGroupChartData]
    missing_fields_chart: List[ChartDataPoint]
    geo_distribution_chart: List[GeoDataPoint]
    statistical_summary: Dict[str, Any]
    data_quality_metrics: Dict[str, float]

@dataclass
class EnergyVisualizationData:
    load_profile_chart: List[TimeSeriesDataPoint]
    equipment_breakdown_chart: List[ChartDataPoint]
    monthly_consumption_chart: List[TimeSeriesDataPoint]
    efficiency_metrics_chart: List[ChartDataPoint]
    cost_comparison_chart: List[ChartDataPoint]

@dataclass
class SolarVisualizationData:
    monthly_production_chart: List[TimeSeriesDataPoint]
    irradiation_heatmap: List[Dict[str, Any]]
    performance_metrics_chart: List[ChartDataPoint]
    system_efficiency_chart: List[TimeSeriesDataPoint]

class ChartDataService:
    def __init__(self):
        self.db_pool = None
        self.color_palettes = {
            'primary': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
            'quality': ['#4CAF50', '#FFC107', '#FF5722'],  # Good, Warning, Error
            'temperature': ['#2196F3', '#03DAC6', '#FF9800', '#F44336'],  # Cool to Hot
            'energy': ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107']
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._initialize_db()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.db_pool:
            await self.db_pool.close()
    
    async def _initialize_db(self):
        """Initialize database connection pool"""
        try:
            database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password123@localhost:5432/dream_tool')
            self.db_pool = await asyncpg.create_pool(database_url)
            logger.info("Chart data service database connection initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database connection: {e}")
            raise
    
    async def generate_survey_visualization_data(
        self,
        start_date: datetime,
        end_date: datetime,
        facility_ids: Optional[List[int]] = None
    ) -> SurveyVisualizationData:
        """Generate comprehensive visualization data for surveys"""
        logger.info(f"Generating survey visualization data from {start_date} to {end_date}")
        
        try:
            # Get survey analysis results
            analysis_result = await self._get_survey_analysis_data(start_date, end_date, facility_ids)
            
            # Generate different chart types
            completeness_chart = self._generate_completeness_chart(analysis_result)
            quality_chart = self._generate_quality_chart(analysis_result)
            facility_distribution_chart = self._generate_facility_distribution_chart(analysis_result)
            date_distribution_chart = self._generate_date_distribution_chart(analysis_result)
            repeat_groups_chart = self._generate_repeat_groups_chart(analysis_result)
            missing_fields_chart = self._generate_missing_fields_chart(analysis_result)
            geo_distribution_chart = await self._generate_geo_distribution_chart(facility_ids)
            
            # Generate statistical summary
            statistical_summary = self._generate_statistical_summary(analysis_result)
            data_quality_metrics = self._calculate_data_quality_metrics(analysis_result)
            
            return SurveyVisualizationData(
                completeness_chart=completeness_chart,
                quality_chart=quality_chart,
                facility_distribution_chart=facility_distribution_chart,
                date_distribution_chart=date_distribution_chart,
                repeat_groups_chart=repeat_groups_chart,
                missing_fields_chart=missing_fields_chart,
                geo_distribution_chart=geo_distribution_chart,
                statistical_summary=statistical_summary,
                data_quality_metrics=data_quality_metrics
            )
        
        except Exception as e:
            logger.error(f"Failed to generate survey visualization data: {e}")
            raise
    
    async def generate_energy_visualization_data(
        self,
        facility_id: int,
        analysis_period: str = "monthly"
    ) -> EnergyVisualizationData:
        """Generate energy analysis visualization data"""
        logger.info(f"Generating energy visualization data for facility {facility_id}")
        
        try:
            # Get energy data from database
            energy_data = await self._get_energy_analysis_data(facility_id, analysis_period)
            
            # Generate charts
            load_profile_chart = self._generate_load_profile_chart(energy_data)
            equipment_breakdown_chart = self._generate_equipment_breakdown_chart(energy_data)
            monthly_consumption_chart = self._generate_monthly_consumption_chart(energy_data)
            efficiency_metrics_chart = self._generate_efficiency_metrics_chart(energy_data)
            cost_comparison_chart = self._generate_cost_comparison_chart(energy_data)
            
            return EnergyVisualizationData(
                load_profile_chart=load_profile_chart,
                equipment_breakdown_chart=equipment_breakdown_chart,
                monthly_consumption_chart=monthly_consumption_chart,
                efficiency_metrics_chart=efficiency_metrics_chart,
                cost_comparison_chart=cost_comparison_chart
            )
        
        except Exception as e:
            logger.error(f"Failed to generate energy visualization data: {e}")
            raise
    
    async def generate_solar_visualization_data(
        self,
        facility_id: int,
        system_config: Dict[str, Any]
    ) -> SolarVisualizationData:
        """Generate solar analysis visualization data"""
        logger.info(f"Generating solar visualization data for facility {facility_id}")
        
        try:
            # Get solar analysis data
            solar_data = await self._get_solar_analysis_data(facility_id, system_config)
            
            # Generate charts
            monthly_production_chart = self._generate_monthly_production_chart(solar_data)
            irradiation_heatmap = self._generate_irradiation_heatmap(solar_data)
            performance_metrics_chart = self._generate_performance_metrics_chart(solar_data)
            system_efficiency_chart = self._generate_system_efficiency_chart(solar_data)
            
            return SolarVisualizationData(
                monthly_production_chart=monthly_production_chart,
                irradiation_heatmap=irradiation_heatmap,
                performance_metrics_chart=performance_metrics_chart,
                system_efficiency_chart=system_efficiency_chart
            )
        
        except Exception as e:
            logger.error(f"Failed to generate solar visualization data: {e}")
            raise
    
    def _generate_completeness_chart(self, analysis_result: Dict[str, Any]) -> List[ChartDataPoint]:
        """Generate completeness score visualization"""
        completeness_score = analysis_result.get('completeness_score', 0)
        
        return [
            ChartDataPoint(
                label='Complete',
                value=completeness_score,
                color=self.color_palettes['quality'][0]
            ),
            ChartDataPoint(
                label='Incomplete',
                value=100 - completeness_score,
                color=self.color_palettes['quality'][2]
            )
        ]
    
    def _generate_quality_chart(self, analysis_result: Dict[str, Any]) -> List[ChartDataPoint]:
        """Generate data quality visualization"""
        quality_score = analysis_result.get('data_quality_score', 0)
        
        return [
            ChartDataPoint(
                label='High Quality',
                value=quality_score,
                color=self.color_palettes['quality'][0]
            ),
            ChartDataPoint(
                label='Quality Issues',
                value=100 - quality_score,
                color=self.color_palettes['quality'][1]
            )
        ]
    
    def _generate_facility_distribution_chart(self, analysis_result: Dict[str, Any]) -> List[ChartDataPoint]:
        """Generate facility distribution chart"""
        distribution = analysis_result.get('facility_distribution', {})
        colors = self.color_palettes['primary']
        
        chart_data = []
        for i, (facility, count) in enumerate(sorted(distribution.items(), key=lambda x: x[1], reverse=True)):
            chart_data.append(ChartDataPoint(
                label=facility,
                value=count,
                color=colors[i % len(colors)]
            ))
        
        return chart_data
    
    def _generate_date_distribution_chart(self, analysis_result: Dict[str, Any]) -> List[TimeSeriesDataPoint]:
        """Generate time series chart for survey dates"""
        distribution = analysis_result.get('date_distribution', {})
        
        # Sort by date and create time series
        chart_data = []
        for date_str, count in sorted(distribution.items()):
            chart_data.append(TimeSeriesDataPoint(
                date=date_str,
                value=count
            ))
        
        return chart_data
    
    def _generate_repeat_groups_chart(self, analysis_result: Dict[str, Any]) -> List[RepeatGroupChartData]:
        """Generate repeat groups analysis charts"""
        repeat_groups = analysis_result.get('repeat_groups', [])
        
        chart_data = []
        for group in repeat_groups:
            completeness_data = [
                ChartDataPoint(label='Minimum', value=round(group.get('min_completeness', 0))),
                ChartDataPoint(label='Average', value=round(group.get('avg_completeness', 0))),
                ChartDataPoint(label='Maximum', value=round(group.get('max_completeness', 0)))
            ]
            
            # Generate field distribution if available
            field_distribution = None
            if 'field_distribution' in group:
                field_distribution = [
                    ChartDataPoint(label=field, value=count)
                    for field, count in group['field_distribution'].items()
                ]
            
            chart_data.append(RepeatGroupChartData(
                group_path=group.get('path', ''),
                instance_count=group.get('instances', 0),
                completeness_data=completeness_data,
                consistency_score=round(group.get('consistency_score', 0)),
                field_distribution=field_distribution
            ))
        
        return chart_data
    
    def _generate_missing_fields_chart(self, analysis_result: Dict[str, Any]) -> List[ChartDataPoint]:
        """Generate missing fields analysis chart"""
        missing_fields = analysis_result.get('missing_fields', [])
        
        # Count field occurrences
        field_counts = Counter()
        for field in missing_fields:
            # Simplify field path for better readability
            simplified_field = field.split('.')[-1] if '.' in field else field
            field_counts[simplified_field] += 1
        
        # Create chart data
        chart_data = []
        colors = self.color_palettes['primary']
        for i, (field, count) in enumerate(field_counts.most_common(10)):  # Top 10
            chart_data.append(ChartDataPoint(
                label=field,
                value=count,
                color=colors[i % len(colors)]
            ))
        
        return chart_data
    
    async def _generate_geo_distribution_chart(self, facility_ids: Optional[List[int]] = None) -> List[GeoDataPoint]:
        """Generate geographical distribution chart"""
        try:
            query = """
                SELECT f.name, f.latitude, f.longitude, COUNT(s.id) as survey_count,
                       f.region, f.district, f.facility_type
                FROM facilities f
                LEFT JOIN surveys s ON f.id = s.facility_id
                WHERE f.latitude IS NOT NULL AND f.longitude IS NOT NULL
            """
            
            params = []
            if facility_ids:
                query += " AND f.id = ANY($1)"
                params.append(facility_ids)
            
            query += " GROUP BY f.id, f.name, f.latitude, f.longitude, f.region, f.district, f.facility_type"
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
            
            geo_data = []
            for row in rows:
                # Generate color based on survey count
                survey_count = row['survey_count']
                if survey_count == 0:
                    color = '#9E9E9E'  # Gray for no surveys
                elif survey_count < 5:
                    color = '#FFC107'  # Yellow for low count
                elif survey_count < 10:
                    color = '#FF9800'  # Orange for medium count
                else:
                    color = '#4CAF50'  # Green for high count
                
                popup_data = {
                    'region': row['region'],
                    'district': row['district'],
                    'facility_type': row['facility_type'],
                    'survey_count': survey_count
                }
                
                geo_data.append(GeoDataPoint(
                    latitude=float(row['latitude']),
                    longitude=float(row['longitude']),
                    label=row['name'],
                    value=survey_count,
                    color=color,
                    popup_data=popup_data
                ))
            
            return geo_data
        
        except Exception as e:
            logger.error(f"Failed to generate geo distribution chart: {e}")
            return []
    
    def _generate_statistical_summary(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate statistical summary of the analysis"""
        return {
            'total_surveys': analysis_result.get('total_surveys', 0),
            'total_facilities': len(analysis_result.get('facility_distribution', {})),
            'average_completeness': analysis_result.get('completeness_score', 0),
            'average_quality': analysis_result.get('data_quality_score', 0),
            'date_range': {
                'start': min(analysis_result.get('date_distribution', {}).keys(), default=''),
                'end': max(analysis_result.get('date_distribution', {}).keys(), default='')
            },
            'most_common_facility': max(
                analysis_result.get('facility_distribution', {}).items(),
                key=lambda x: x[1],
                default=('None', 0)
            )[0]
        }
    
    def _calculate_data_quality_metrics(self, analysis_result: Dict[str, Any]) -> Dict[str, float]:
        """Calculate comprehensive data quality metrics"""
        return {
            'completeness_score': analysis_result.get('completeness_score', 0),
            'consistency_score': analysis_result.get('consistency_score', 0),
            'validity_score': analysis_result.get('validity_score', 0),
            'accuracy_score': analysis_result.get('accuracy_score', 0),
            'overall_quality': analysis_result.get('data_quality_score', 0)
        }
    
    async def _get_survey_analysis_data(
        self,
        start_date: datetime,
        end_date: datetime,
        facility_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Get survey analysis data for the specified period"""
        try:
            # This would typically call the survey analysis service
            # For now, return mock data structure
            return {
                'completeness_score': 85.5,
                'data_quality_score': 78.2,
                'facility_distribution': {
                    'Kaalmo MCH': 15,
                    'Hobyo Hospital': 12,
                    'Baidoa General': 8,
                    'Mogadishu Central': 6
                },
                'date_distribution': {
                    '2024-01-01': 5,
                    '2024-01-15': 8,
                    '2024-02-01': 7,
                    '2024-02-15': 10
                },
                'repeat_groups': [
                    {
                        'path': 'equipment_list',
                        'instances': 25,
                        'min_completeness': 60,
                        'avg_completeness': 85,
                        'max_completeness': 100,
                        'consistency_score': 92
                    }
                ],
                'missing_fields': ['equipment.power_rating', 'facility.gps_coordinates', 'staff.qualifications']
            }
        except Exception as e:
            logger.error(f"Failed to get survey analysis data: {e}")
            return {}
    
    async def _get_energy_analysis_data(self, facility_id: int, period: str) -> Dict[str, Any]:
        """Get energy analysis data for visualization"""
        # Mock data - would come from energy analysis service
        return {
            'hourly_load': list(range(24)),
            'load_values': [2.5, 2.1, 1.8, 1.5, 1.3, 1.5, 2.0, 3.5, 4.2, 4.8, 5.1, 5.3,
                          5.5, 5.2, 4.9, 4.5, 4.2, 4.8, 5.5, 4.2, 3.8, 3.2, 2.8, 2.6],
            'equipment_breakdown': {
                'Lighting': 35.2,
                'Medical Equipment': 28.5,
                'Cooling': 18.3,
                'Computing': 12.7,
                'Other': 5.3
            },
            'monthly_consumption': [120, 135, 128, 145, 158, 172, 168, 162, 155, 148, 142, 138]
        }
    
    async def _get_solar_analysis_data(self, facility_id: int, system_config: Dict[str, Any]) -> Dict[str, Any]:
        """Get solar analysis data for visualization"""
        # Mock data - would come from solar analysis service
        return {
            'monthly_production': [85, 95, 120, 135, 145, 140, 138, 142, 125, 110, 90, 80],
            'irradiation_data': np.random.rand(12, 30).tolist(),  # 12 months x 30 days
            'performance_metrics': {
                'System Efficiency': 18.5,
                'Performance Ratio': 82.3,
                'Capacity Factor': 24.1,
                'Temperature Impact': -3.2
            }
        }
    
    # Chart generation methods for energy and solar data...
    def _generate_load_profile_chart(self, energy_data: Dict[str, Any]) -> List[TimeSeriesDataPoint]:
        """Generate load profile time series chart"""
        hours = energy_data.get('hourly_load', [])
        values = energy_data.get('load_values', [])
        
        return [
            TimeSeriesDataPoint(date=f"{hour:02d}:00", value=value)
            for hour, value in zip(hours, values)
        ]
    
    def _generate_equipment_breakdown_chart(self, energy_data: Dict[str, Any]) -> List[ChartDataPoint]:
        """Generate equipment energy breakdown chart"""
        breakdown = energy_data.get('equipment_breakdown', {})
        colors = self.color_palettes['energy']
        
        return [
            ChartDataPoint(
                label=equipment,
                value=percentage,
                color=colors[i % len(colors)]
            )
            for i, (equipment, percentage) in enumerate(breakdown.items())
        ]
    
    def _generate_monthly_consumption_chart(self, energy_data: Dict[str, Any]) -> List[TimeSeriesDataPoint]:
        """Generate monthly consumption chart"""
        consumption = energy_data.get('monthly_consumption', [])
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        return [
            TimeSeriesDataPoint(date=month, value=value)
            for month, value in zip(months, consumption)
        ]
    
    def _generate_efficiency_metrics_chart(self, energy_data: Dict[str, Any]) -> List[ChartDataPoint]:
        """Generate efficiency metrics chart"""
        return [
            ChartDataPoint(label='Load Factor', value=65.2, color='#4CAF50'),
            ChartDataPoint(label='Demand Factor', value=78.5, color='#2196F3'),
            ChartDataPoint(label='Diversity Factor', value=85.1, color='#FF9800'),
            ChartDataPoint(label='Utilization Factor', value=72.3, color='#9C27B0')
        ]
    
    def _generate_cost_comparison_chart(self, energy_data: Dict[str, Any]) -> List[ChartDataPoint]:
        """Generate cost comparison chart"""
        return [
            ChartDataPoint(label='Grid Cost', value=0.25, color='#F44336'),
            ChartDataPoint(label='Solar PV', value=0.12, color='#4CAF50'),
            ChartDataPoint(label='Diesel Generator', value=0.45, color='#FF9800'),
            ChartDataPoint(label='Hybrid System', value=0.18, color='#2196F3')
        ]
    
    def _generate_monthly_production_chart(self, solar_data: Dict[str, Any]) -> List[TimeSeriesDataPoint]:
        """Generate monthly solar production chart"""
        production = solar_data.get('monthly_production', [])
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        return [
            TimeSeriesDataPoint(date=month, value=value)
            for month, value in zip(months, production)
        ]
    
    def _generate_irradiation_heatmap(self, solar_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate solar irradiation heatmap data"""
        irradiation_data = solar_data.get('irradiation_data', [])
        
        heatmap_data = []
        for month_idx, month_data in enumerate(irradiation_data):
            for day_idx, value in enumerate(month_data):
                heatmap_data.append({
                    'month': month_idx + 1,
                    'day': day_idx + 1,
                    'value': value,
                    'color': self._get_heat_color(value)
                })
        
        return heatmap_data
    
    def _generate_performance_metrics_chart(self, solar_data: Dict[str, Any]) -> List[ChartDataPoint]:
        """Generate solar performance metrics chart"""
        metrics = solar_data.get('performance_metrics', {})
        
        return [
            ChartDataPoint(label=metric, value=value, color=self.color_palettes['primary'][i % len(self.color_palettes['primary'])])
            for i, (metric, value) in enumerate(metrics.items())
        ]
    
    def _generate_system_efficiency_chart(self, solar_data: Dict[str, Any]) -> List[TimeSeriesDataPoint]:
        """Generate system efficiency over time chart"""
        # Mock efficiency data over time
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        efficiency_values = [18.2, 18.5, 18.8, 18.3, 17.9, 17.5, 17.8, 18.1, 18.4, 18.6, 18.3, 18.0]
        
        return [
            TimeSeriesDataPoint(date=month, value=value)
            for month, value in zip(months, efficiency_values)
        ]
    
    def _get_heat_color(self, value: float) -> str:
        """Get color for heatmap based on value"""
        if value < 0.25:
            return '#2196F3'  # Blue (low)
        elif value < 0.5:
            return '#4CAF50'  # Green (medium-low)
        elif value < 0.75:
            return '#FF9800'  # Orange (medium-high)
        else:
            return '#F44336'  # Red (high)

# Create singleton instance
chart_data_service = ChartDataService()
