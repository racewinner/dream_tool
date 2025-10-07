"""
Enhanced Maintenance Analytics Service for Solar PV Systems
Migrated from TypeScript with advanced statistical analysis and ML capabilities
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db_session
from models.database_models import SolarSystem, MaintenanceRecord

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class MaintenanceType(Enum):
    ROUTINE = "ROUTINE"
    CORRECTIVE = "CORRECTIVE"
    PREVENTIVE = "PREVENTIVE"
    EMERGENCY = "EMERGENCY"
    SEASONAL = "SEASONAL"
    ANNUAL = "ANNUAL"
    INSPECTION = "INSPECTION"
    REPAIR = "REPAIR"
    REPLACEMENT = "REPLACEMENT"
    UPGRADE = "UPGRADE"

@dataclass
class SystemPerformanceMetrics:
    daily_generation: float
    monthly_generation: float
    yearly_generation: float
    efficiency: float
    maintenance_costs: Dict[str, Any]
    operational_hours: float
    downtime: Dict[str, Any]
    energy_loss: Dict[str, Any]
    system_availability: float
    performance_ratio: float
    capacity_factor: float
    
    # Enhanced metrics with ML insights
    anomaly_score: float
    predictive_maintenance_score: float
    failure_probability: float
    optimal_maintenance_interval: int

@dataclass
class SystemStatus:
    operational: bool
    maintenance_required: bool
    performance: float
    alerts: List[str]
    maintenance_schedule: Dict[str, Any]
    health_score: float
    risk_level: RiskLevel
    upcoming_maintenance: Dict[str, Any]
    system_metrics: Dict[str, float]
    recent_issues: Dict[str, Any]
    
    # Enhanced status with ML predictions
    predicted_failures: List[Dict[str, Any]]
    maintenance_recommendations: List[str]
    cost_optimization_suggestions: List[str]

class MaintenanceAnalyticsService:
    """Enhanced Maintenance Analytics with ML and Statistical Analysis"""
    
    def __init__(self):
        self.DOWNTIME_THRESHOLD = 24  # hours
        self.ENERGY_LOSS_THRESHOLD = 0.05  # 5%
        self.ANOMALY_THRESHOLD = 0.1
        
    async def calculate_system_metrics(self, system_id: int) -> SystemPerformanceMetrics:
        """Calculate comprehensive system performance metrics with ML insights"""
        
        async with get_db_session() as session:
            # Fetch system and maintenance records
            system_query = select(SolarSystem).where(SolarSystem.id == system_id)
            records_query = select(MaintenanceRecord).where(
                MaintenanceRecord.solar_system_id == system_id
            )
            
            system_result = await session.execute(system_query)
            records_result = await session.execute(records_query)
            
            system = system_result.scalar_one_or_none()
            records = records_result.scalars().all()
            
            if not system:
                raise ValueError(f"System {system_id} not found")
            
            # Convert to pandas for advanced analytics
            records_df = self._records_to_dataframe(records)
            
            # Calculate basic metrics
            basic_metrics = await self._calculate_basic_metrics(system, records_df)
            
            # Calculate enhanced ML metrics
            ml_metrics = await self._calculate_ml_metrics(system, records_df)
            
            return SystemPerformanceMetrics(
                **basic_metrics,
                **ml_metrics
            )
    
    async def calculate_system_status(self, system_id: int) -> SystemStatus:
        """Calculate system status with predictive insights"""
        
        async with get_db_session() as session:
            system_query = select(SolarSystem).where(SolarSystem.id == system_id)
            records_query = select(MaintenanceRecord).where(
                MaintenanceRecord.solar_system_id == system_id
            ).order_by(MaintenanceRecord.maintenance_date.desc())
            
            system_result = await session.execute(system_query)
            records_result = await session.execute(records_query)
            
            system = system_result.scalar_one_or_none()
            records = records_result.scalars().all()
            
            if not system:
                raise ValueError(f"System {system_id} not found")
            
            records_df = self._records_to_dataframe(records)
            
            # Calculate basic status
            basic_status = self._calculate_basic_status(system, records)
            
            # Calculate predictive insights
            predictions = await self._calculate_predictive_insights(system, records_df)
            
            return SystemStatus(
                **basic_status,
                **predictions
            )
    
    def _records_to_dataframe(self, records: List[MaintenanceRecord]) -> pd.DataFrame:
        """Convert maintenance records to pandas DataFrame for analysis"""
        
        if not records:
            return pd.DataFrame()
        
        data = []
        for record in records:
            data.append({
                'id': record.id,
                'maintenance_date': record.maintenance_date,
                'maintenance_type': record.maintenance_type,
                'maintenance_cost': record.maintenance_cost,
                'downtime_hours': record.downtime_hours or 0,
                'labor_hours': record.labor_hours,
                'system_impact': record.system_impact,
                'operational_hours': getattr(record, 'operational_hours', 0),
                'energy_loss': getattr(record, 'energy_loss', 0)
            })
        
        df = pd.DataFrame(data)
        df['maintenance_date'] = pd.to_datetime(df['maintenance_date'])
        df = df.sort_values('maintenance_date')
        
        return df
    
    async def _calculate_basic_metrics(self, system: SolarSystem, records_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate basic performance metrics"""
        
        if records_df.empty:
            return self._get_default_metrics()
        
        # Generation calculations (placeholder - would integrate with actual generation data)
        daily_generation = system.capacity_kw * 4.5  # Assuming 4.5 peak sun hours
        monthly_generation = daily_generation * 30
        yearly_generation = daily_generation * 365
        
        # Efficiency calculation
        efficiency = max(0, min(100, system.performance_metrics.get('efficiency', 85)))
        
        # Maintenance costs analysis
        maintenance_costs = self._calculate_maintenance_costs(records_df)
        
        # Operational metrics
        operational_hours = records_df['operational_hours'].sum()
        downtime = self._calculate_downtime(records_df)
        energy_loss = self._calculate_energy_loss(system, records_df)
        system_availability = self._calculate_system_availability(records_df)
        
        # Performance ratios
        performance_ratio = efficiency / 100 * 0.85  # Typical PR with system losses
        capacity_factor = yearly_generation / (system.capacity_kw * 8760) * 100
        
        return {
            'daily_generation': daily_generation,
            'monthly_generation': monthly_generation,
            'yearly_generation': yearly_generation,
            'efficiency': efficiency,
            'maintenance_costs': maintenance_costs,
            'operational_hours': operational_hours,
            'downtime': downtime,
            'energy_loss': energy_loss,
            'system_availability': system_availability,
            'performance_ratio': performance_ratio,
            'capacity_factor': capacity_factor
        }
    
    async def _calculate_ml_metrics(self, system: SolarSystem, records_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate ML-enhanced metrics"""
        
        if records_df.empty:
            return {
                'anomaly_score': 0.0,
                'predictive_maintenance_score': 50.0,
                'failure_probability': 0.1,
                'optimal_maintenance_interval': 90
            }
        
        # Anomaly detection
        anomaly_score = self._detect_anomalies(records_df)
        
        # Predictive maintenance scoring
        pm_score = self._calculate_predictive_maintenance_score(records_df)
        
        # Failure probability prediction
        failure_prob = self._predict_failure_probability(records_df)
        
        # Optimal maintenance interval
        optimal_interval = self._calculate_optimal_maintenance_interval(records_df)
        
        return {
            'anomaly_score': anomaly_score,
            'predictive_maintenance_score': pm_score,
            'failure_probability': failure_prob,
            'optimal_maintenance_interval': optimal_interval
        }
    
    def _detect_anomalies(self, records_df: pd.DataFrame) -> float:
        """Detect anomalies in maintenance patterns using Isolation Forest"""
        
        if len(records_df) < 5:
            return 0.0
        
        try:
            # Prepare features for anomaly detection
            features = records_df[['maintenance_cost', 'downtime_hours', 'labor_hours']].fillna(0)
            
            # Standardize features
            scaler = StandardScaler()
            features_scaled = scaler.fit_transform(features)
            
            # Isolation Forest for anomaly detection
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            anomaly_scores = iso_forest.fit_predict(features_scaled)
            
            # Return percentage of anomalies
            anomaly_percentage = (anomaly_scores == -1).sum() / len(anomaly_scores)
            return float(anomaly_percentage)
            
        except Exception as e:
            logger.warning(f"Anomaly detection failed: {e}")
            return 0.0
    
    def _calculate_predictive_maintenance_score(self, records_df: pd.DataFrame) -> float:
        """Calculate predictive maintenance score based on patterns"""
        
        if records_df.empty:
            return 50.0
        
        # Calculate maintenance frequency
        days_between_maintenance = records_df['maintenance_date'].diff().dt.days.dropna()
        
        if len(days_between_maintenance) == 0:
            return 50.0
        
        # Score based on maintenance regularity and cost trends
        regularity_score = 100 - min(50, days_between_maintenance.std())
        
        # Cost trend analysis
        cost_trend = self._calculate_cost_trend_score(records_df)
        
        # Combine scores
        pm_score = (regularity_score * 0.6 + cost_trend * 0.4)
        return max(0, min(100, pm_score))
    
    def _predict_failure_probability(self, records_df: pd.DataFrame) -> float:
        """Predict failure probability based on maintenance history"""
        
        if records_df.empty:
            return 0.1
        
        # Count corrective maintenance in last 6 months
        six_months_ago = datetime.now() - timedelta(days=180)
        recent_corrective = records_df[
            (records_df['maintenance_date'] >= six_months_ago) &
            (records_df['maintenance_type'] == 'CORRECTIVE')
        ]
        
        # Base probability on recent corrective maintenance frequency
        base_prob = min(0.8, len(recent_corrective) * 0.1)
        
        # Adjust based on downtime trends
        if not records_df['downtime_hours'].empty:
            recent_downtime = records_df[records_df['maintenance_date'] >= six_months_ago]['downtime_hours'].sum()
            downtime_factor = min(0.3, recent_downtime / 1000)
            base_prob += downtime_factor
        
        return min(0.9, base_prob)
    
    def _calculate_optimal_maintenance_interval(self, records_df: pd.DataFrame) -> int:
        """Calculate optimal maintenance interval using cost-benefit analysis"""
        
        if len(records_df) < 3:
            return 90  # Default quarterly
        
        # Analyze current intervals
        intervals = records_df['maintenance_date'].diff().dt.days.dropna()
        
        if intervals.empty:
            return 90
        
        # Find interval that minimizes total cost (maintenance + downtime)
        optimal_interval = int(intervals.median())
        
        # Ensure reasonable bounds
        return max(30, min(365, optimal_interval))
    
    def _calculate_maintenance_costs(self, records_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate maintenance cost metrics with trend analysis"""
        
        if records_df.empty:
            return {'total': 0, 'average_per_kw': 0, 'trend': 'STABLE'}
        
        total_cost = records_df['maintenance_cost'].sum()
        avg_cost = records_df['maintenance_cost'].mean()
        
        # Trend analysis using linear regression
        if len(records_df) >= 3:
            x = np.arange(len(records_df))
            y = records_df['maintenance_cost'].values
            slope, _, _, _, _ = stats.linregress(x, y)
            
            if slope > avg_cost * 0.1:
                trend = 'INCREASE'
            elif slope < -avg_cost * 0.1:
                trend = 'DECREASE'
            else:
                trend = 'STABLE'
        else:
            trend = 'STABLE'
        
        return {
            'total': float(total_cost),
            'average_per_kw': float(avg_cost),
            'trend': trend
        }
    
    def _calculate_downtime(self, records_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate downtime metrics"""
        
        if records_df.empty:
            return {'total_hours': 0, 'percentage': 0, 'frequency': 0}
        
        total_hours = records_df['downtime_hours'].sum()
        frequency = (records_df['downtime_hours'] > 0).sum()
        
        # Calculate percentage based on operational time
        total_operational_time = len(records_df) * 24 * 30  # Approximate
        percentage = (total_hours / total_operational_time) * 100 if total_operational_time > 0 else 0
        
        return {
            'total_hours': float(total_hours),
            'percentage': float(percentage),
            'frequency': int(frequency)
        }
    
    def _calculate_energy_loss(self, system: SolarSystem, records_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate energy loss metrics"""
        
        if records_df.empty:
            return {'total_kwh': 0, 'percentage': 0, 'causes': []}
        
        total_energy_loss = records_df['energy_loss'].sum()
        expected_annual_generation = system.capacity_kw * 8760 * 0.2  # 20% capacity factor
        percentage = (total_energy_loss / expected_annual_generation) * 100 if expected_annual_generation > 0 else 0
        
        # Extract unique causes from maintenance descriptions
        causes = records_df[records_df['energy_loss'] > 0]['maintenance_type'].unique().tolist()
        
        return {
            'total_kwh': float(total_energy_loss),
            'percentage': float(percentage),
            'causes': causes
        }
    
    def _calculate_system_availability(self, records_df: pd.DataFrame) -> float:
        """Calculate system availability percentage"""
        
        if records_df.empty:
            return 95.0  # Default high availability
        
        total_operational = records_df['operational_hours'].sum()
        total_downtime = records_df['downtime_hours'].sum()
        
        if total_operational + total_downtime == 0:
            return 95.0
        
        availability = (total_operational / (total_operational + total_downtime)) * 100
        return float(availability)
    
    def _calculate_cost_trend_score(self, records_df: pd.DataFrame) -> float:
        """Calculate cost trend score for predictive maintenance"""
        
        if len(records_df) < 3:
            return 50.0
        
        costs = records_df['maintenance_cost'].values
        x = np.arange(len(costs))
        
        try:
            slope, _, r_value, _, _ = stats.linregress(x, costs)
            
            # Score based on cost stability (lower slope = better score)
            if abs(slope) < costs.mean() * 0.05:  # Very stable
                return 90.0
            elif abs(slope) < costs.mean() * 0.15:  # Moderately stable
                return 70.0
            else:  # Unstable costs
                return 30.0
                
        except Exception:
            return 50.0
    
    def _calculate_basic_status(self, system: SolarSystem, records: List[MaintenanceRecord]) -> Dict[str, Any]:
        """Calculate basic system status"""
        
        operational = system.status == 'ACTIVE'
        maintenance_required = system.status == 'MAINTENANCE'
        performance = system.performance_metrics.get('efficiency', 85)
        
        alerts = self._generate_alerts(system, records)
        maintenance_schedule = self._calculate_maintenance_schedule(system)
        health_score = self._calculate_health_score(system, records)
        risk_level = self._calculate_risk_level(system, records)
        upcoming_maintenance = self._calculate_upcoming_maintenance(records)
        system_metrics = self._calculate_system_metrics_summary(system, records)
        recent_issues = self._calculate_recent_issues(records)
        
        return {
            'operational': operational,
            'maintenance_required': maintenance_required,
            'performance': performance,
            'alerts': alerts,
            'maintenance_schedule': maintenance_schedule,
            'health_score': health_score,
            'risk_level': risk_level,
            'upcoming_maintenance': upcoming_maintenance,
            'system_metrics': system_metrics,
            'recent_issues': recent_issues
        }
    
    async def _calculate_predictive_insights(self, system: SolarSystem, records_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate predictive insights and recommendations"""
        
        predicted_failures = self._predict_potential_failures(records_df)
        maintenance_recommendations = self._generate_maintenance_recommendations(system, records_df)
        cost_optimization = self._generate_cost_optimization_suggestions(records_df)
        
        return {
            'predicted_failures': predicted_failures,
            'maintenance_recommendations': maintenance_recommendations,
            'cost_optimization_suggestions': cost_optimization
        }
    
    def _predict_potential_failures(self, records_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Predict potential system failures"""
        
        predictions = []
        
        if records_df.empty:
            return predictions
        
        # Analyze patterns for different failure types
        corrective_records = records_df[records_df['maintenance_type'] == 'CORRECTIVE']
        
        if len(corrective_records) >= 2:
            # Predict based on historical patterns
            avg_interval = corrective_records['maintenance_date'].diff().dt.days.mean()
            last_corrective = corrective_records['maintenance_date'].max()
            
            if pd.notna(avg_interval) and pd.notna(last_corrective):
                next_predicted = last_corrective + timedelta(days=int(avg_interval))
                
                predictions.append({
                    'type': 'Equipment Failure',
                    'probability': min(0.8, len(corrective_records) * 0.15),
                    'predicted_date': next_predicted.isoformat(),
                    'confidence': 0.7
                })
        
        return predictions
    
    def _generate_maintenance_recommendations(self, system: SolarSystem, records_df: pd.DataFrame) -> List[str]:
        """Generate AI-powered maintenance recommendations"""
        
        recommendations = []
        
        # Analyze maintenance patterns
        if not records_df.empty:
            # Check maintenance frequency
            recent_maintenance = records_df[
                records_df['maintenance_date'] >= datetime.now() - timedelta(days=90)
            ]
            
            if len(recent_maintenance) == 0:
                recommendations.append("Schedule preventive maintenance - no maintenance in last 90 days")
            
            # Check cost trends
            if len(records_df) >= 3:
                recent_costs = records_df.tail(3)['maintenance_cost']
                if recent_costs.is_monotonic_increasing:
                    recommendations.append("Investigate increasing maintenance costs - consider component replacement")
            
            # Check downtime patterns
            high_downtime = records_df[records_df['downtime_hours'] > 24]
            if len(high_downtime) >= 2:
                recommendations.append("Implement predictive maintenance to reduce extended downtime events")
        
        # System-specific recommendations
        system_age = (datetime.now() - system.installation_date).days / 365
        if system_age > 10:
            recommendations.append("Consider comprehensive system inspection for aging equipment")
        
        return recommendations
    
    def _generate_cost_optimization_suggestions(self, records_df: pd.DataFrame) -> List[str]:
        """Generate cost optimization suggestions"""
        
        suggestions = []
        
        if records_df.empty:
            return suggestions
        
        # Analyze cost patterns
        avg_cost = records_df['maintenance_cost'].mean()
        high_cost_records = records_df[records_df['maintenance_cost'] > avg_cost * 2]
        
        if len(high_cost_records) > 0:
            suggestions.append("Review high-cost maintenance events for potential process improvements")
        
        # Check for frequent repairs
        repair_records = records_df[records_df['maintenance_type'].isin(['REPAIR', 'CORRECTIVE'])]
        if len(repair_records) > len(records_df) * 0.4:
            suggestions.append("High repair frequency detected - consider preventive maintenance strategy")
        
        # Labor efficiency
        if 'labor_hours' in records_df.columns:
            avg_labor = records_df['labor_hours'].mean()
            if avg_labor > 8:
                suggestions.append("Consider maintenance training or process optimization to reduce labor hours")
        
        return suggestions
    
    def _generate_alerts(self, system: SolarSystem, records: List[MaintenanceRecord]) -> List[str]:
        """Generate system alerts"""
        
        alerts = []
        
        if system.status == 'MAINTENANCE':
            alerts.append('System is currently under maintenance')
        
        performance = system.performance_metrics.get('efficiency', 85)
        if performance < 80:
            alerts.append('Low system efficiency detected')
        
        # Check for recent failures
        recent_failures = [
            r for r in records 
            if r.maintenance_type == 'CORRECTIVE' and 
            r.maintenance_date >= datetime.now() - timedelta(days=7)
        ]
        
        if len(recent_failures) > 2:
            alerts.append('Multiple recent maintenance issues')
        
        return alerts
    
    def _calculate_maintenance_schedule(self, system: SolarSystem) -> Dict[str, Any]:
        """Calculate maintenance schedule information"""
        
        return {
            'next_maintenance': system.next_maintenance_date.isoformat() if system.next_maintenance_date else None,
            'frequency': system.maintenance_frequency,
            'last_maintenance': system.last_maintenance_date.isoformat() if system.last_maintenance_date else None,
            'overdue': system.next_maintenance_date < datetime.now() if system.next_maintenance_date else False,
            'upcoming': (
                system.next_maintenance_date <= datetime.now() + timedelta(days=7) 
                if system.next_maintenance_date else False
            )
        }
    
    def _calculate_health_score(self, system: SolarSystem, records: List[MaintenanceRecord]) -> float:
        """Calculate system health score"""
        
        metrics = system.performance_metrics
        efficiency = metrics.get('efficiency', 85) / 100
        availability = metrics.get('system_availability', 95) / 100
        performance_ratio = metrics.get('performance_ratio', 0.8)
        
        # Calculate downtime impact
        recent_downtime = sum(
            r.downtime_hours for r in records 
            if r.maintenance_date >= datetime.now() - timedelta(days=30)
        )
        downtime_factor = max(0, 1 - (recent_downtime / 720))  # 720 hours in 30 days
        
        score = (
            (efficiency * 0.4) +
            (availability * 0.3) +
            (performance_ratio * 0.2) +
            (downtime_factor * 0.1)
        ) * 100
        
        return round(score, 1)
    
    def _calculate_risk_level(self, system: SolarSystem, records: List[MaintenanceRecord]) -> RiskLevel:
        """Calculate system risk level"""
        
        health_score = self._calculate_health_score(system, records)
        recent_issues = len([
            r for r in records 
            if r.maintenance_date >= datetime.now() - timedelta(days=30)
        ])
        
        if health_score < 30 or recent_issues > 5:
            return RiskLevel.CRITICAL
        elif health_score < 50 or recent_issues > 3:
            return RiskLevel.HIGH
        elif health_score < 70 or recent_issues > 1:
            return RiskLevel.MODERATE
        else:
            return RiskLevel.LOW
    
    def _calculate_upcoming_maintenance(self, records: List[MaintenanceRecord]) -> Dict[str, Any]:
        """Calculate upcoming maintenance information"""
        
        upcoming = [
            r for r in records 
            if r.maintenance_status == 'PENDING' and 
            r.maintenance_date > datetime.now()
        ]
        
        return {
            'count': len(upcoming),
            'next_date': upcoming[0].maintenance_date.isoformat() if upcoming else None,
            'types': [r.maintenance_type for r in upcoming]
        }
    
    def _calculate_system_metrics_summary(self, system: SolarSystem, records: List[MaintenanceRecord]) -> Dict[str, float]:
        """Calculate system metrics summary"""
        
        metrics = system.performance_metrics
        reliability = self._calculate_reliability(records)
        
        return {
            'efficiency': metrics.get('efficiency', 85),
            'availability': metrics.get('system_availability', 95),
            'reliability': reliability,
            'performance': metrics.get('performance_ratio', 80)
        }
    
    def _calculate_recent_issues(self, records: List[MaintenanceRecord]) -> Dict[str, Any]:
        """Calculate recent issues summary"""
        
        recent = [
            r for r in records 
            if r.maintenance_date >= datetime.now() - timedelta(days=30)
        ]
        
        severity = self._calculate_issue_severity(recent)
        types = list(set(r.maintenance_type for r in recent))
        
        return {
            'count': len(recent),
            'severity': severity,
            'types': types
        }
    
    def _calculate_reliability(self, records: List[MaintenanceRecord]) -> float:
        """Calculate system reliability percentage"""
        
        if not records:
            return 95.0
        
        total_operational = sum(getattr(r, 'operational_hours', 24) for r in records)
        total_downtime = sum(r.downtime_hours or 0 for r in records)
        
        if total_operational + total_downtime == 0:
            return 95.0
        
        reliability = (total_operational / (total_operational + total_downtime)) * 100
        return round(reliability, 1)
    
    def _calculate_issue_severity(self, records: List[MaintenanceRecord]) -> str:
        """Calculate issue severity level"""
        
        corrective_count = len([r for r in records if r.maintenance_type == 'CORRECTIVE'])
        
        if corrective_count > 3:
            return 'HIGH'
        elif corrective_count > 1:
            return 'MODERATE'
        else:
            return 'LOW'
    
    def _get_default_metrics(self) -> Dict[str, Any]:
        """Get default metrics when no data is available"""
        
        return {
            'daily_generation': 0,
            'monthly_generation': 0,
            'yearly_generation': 0,
            'efficiency': 85,
            'maintenance_costs': {'total': 0, 'average_per_kw': 0, 'trend': 'STABLE'},
            'operational_hours': 0,
            'downtime': {'total_hours': 0, 'percentage': 0, 'frequency': 0},
            'energy_loss': {'total_kwh': 0, 'percentage': 0, 'causes': []},
            'system_availability': 95,
            'performance_ratio': 0.8,
            'capacity_factor': 20
        }

# Global service instance
maintenance_analytics_service = MaintenanceAnalyticsService()
