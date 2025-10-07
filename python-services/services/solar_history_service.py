"""
Solar History Service
Service for tracking and analyzing solar system changes over time
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from models.solar_analysis_models import (
    SolarSystemAssessment, SolarComponentDetected, SystemCapacityAnalysis,
    DetectedIssue, UpgradeRecommendation, ComponentType, AnalysisStatus
)
from models.solar_history_models import (
    MaintenanceAction, MaintenanceActionType, AssessmentHistory, ComponentHistory
)

logger = logging.getLogger(__name__)

class SolarHistoryService:
    """Service for tracking and analyzing solar system changes over time"""
    
    async def record_maintenance_action(
        self, 
        db_session: Session,
        assessment_id: str,
        action_type: str,
        action_date: datetime,
        performed_by: str,
        action_description: str,
        component_id: Optional[str] = None,
        recommendation_id: Optional[str] = None,
        cost_usd: Optional[float] = None,
        before_photos: Optional[List[str]] = None,
        after_photos: Optional[List[str]] = None,
        notes: Optional[str] = None,
        results: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Record a maintenance action performed on a solar system
        
        Args:
            db_session: Database session
            assessment_id: ID of the assessment
            action_type: Type of maintenance action
            action_date: Date the action was performed
            performed_by: Person who performed the action
            action_description: Description of the action
            component_id: ID of the component (optional)
            recommendation_id: ID of the recommendation that prompted this action (optional)
            cost_usd: Cost of the action in USD (optional)
            before_photos: List of photo URLs before maintenance (optional)
            after_photos: List of photo URLs after maintenance (optional)
            notes: Additional notes (optional)
            results: Results of the maintenance action (optional)
            
        Returns:
            Dictionary with the created maintenance action
        """
        logger.info(f"Recording maintenance action for assessment {assessment_id}")
        
        # Validate assessment exists
        assessment = db_session.query(SolarSystemAssessment).filter_by(id=uuid.UUID(assessment_id)).first()
        if not assessment:
            raise ValueError(f"Assessment {assessment_id} not found")
        
        # Validate component if provided
        if component_id:
            component = db_session.query(SolarComponentDetected).filter_by(id=uuid.UUID(component_id)).first()
            if not component:
                raise ValueError(f"Component {component_id} not found")
        
        # Validate recommendation if provided
        if recommendation_id:
            recommendation = db_session.query(UpgradeRecommendation).filter_by(id=uuid.UUID(recommendation_id)).first()
            if not recommendation:
                raise ValueError(f"Recommendation {recommendation_id} not found")
        
        # Create maintenance action
        maintenance_action = MaintenanceAction(
            assessment_id=uuid.UUID(assessment_id),
            component_id=uuid.UUID(component_id) if component_id else None,
            recommendation_id=uuid.UUID(recommendation_id) if recommendation_id else None,
            action_type=action_type,
            action_date=action_date,
            performed_by=performed_by,
            action_description=action_description,
            cost_usd=cost_usd,
            before_photos=before_photos,
            after_photos=after_photos,
            notes=notes,
            results=results
        )
        
        db_session.add(maintenance_action)
        
        # Update assessment history
        await self._update_assessment_history(db_session, assessment.facility_id)
        
        # Update component history if applicable
        if component_id:
            component = db_session.query(SolarComponentDetected).filter_by(id=uuid.UUID(component_id)).first()
            if component:
                await self._update_component_history(db_session, assessment.facility_id, component.component_type)
        
        db_session.commit()
        
        return {
            "id": str(maintenance_action.id),
            "assessment_id": assessment_id,
            "action_type": maintenance_action.action_type,
            "action_date": maintenance_action.action_date.isoformat(),
            "performed_by": maintenance_action.performed_by,
            "component_id": str(maintenance_action.component_id) if maintenance_action.component_id else None,
            "recommendation_id": str(maintenance_action.recommendation_id) if maintenance_action.recommendation_id else None
        }
    
    async def get_maintenance_history(
        self, 
        db_session: Session,
        facility_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        component_type: Optional[str] = None,
        action_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get maintenance history for a facility
        
        Args:
            db_session: Database session
            facility_id: ID of the facility
            start_date: Start date for filtering (optional)
            end_date: End date for filtering (optional)
            component_type: Filter by component type (optional)
            action_type: Filter by action type (optional)
            
        Returns:
            List of maintenance actions
        """
        logger.info(f"Getting maintenance history for facility {facility_id}")
        
        # Query assessments for this facility
        assessment_query = db_session.query(SolarSystemAssessment).filter_by(facility_id=facility_id)
        assessment_ids = [str(assessment.id) for assessment in assessment_query.all()]
        
        if not assessment_ids:
            return []
        
        # Query maintenance actions
        query = db_session.query(MaintenanceAction).filter(
            MaintenanceAction.assessment_id.in_([uuid.UUID(id) for id in assessment_ids])
        )
        
        # Apply filters
        if start_date:
            query = query.filter(MaintenanceAction.action_date >= start_date)
        
        if end_date:
            query = query.filter(MaintenanceAction.action_date <= end_date)
        
        if action_type:
            query = query.filter(MaintenanceAction.action_type == action_type)
        
        if component_type:
            # Join with components to filter by component type
            query = query.join(
                SolarComponentDetected, 
                MaintenanceAction.component_id == SolarComponentDetected.id
            ).filter(SolarComponentDetected.component_type == component_type)
        
        # Order by date descending
        query = query.order_by(desc(MaintenanceAction.action_date))
        
        # Convert to dictionaries
        result = []
        for action in query.all():
            result.append({
                "id": str(action.id),
                "assessment_id": str(action.assessment_id),
                "action_type": action.action_type,
                "action_date": action.action_date.isoformat(),
                "performed_by": action.performed_by,
                "action_description": action.action_description,
                "cost_usd": action.cost_usd,
                "component_id": str(action.component_id) if action.component_id else None,
                "recommendation_id": str(action.recommendation_id) if action.recommendation_id else None,
                "before_photos": action.before_photos,
                "after_photos": action.after_photos,
                "notes": action.notes,
                "results": action.results,
                "created_at": action.created_at.isoformat()
            })
        
        return result
    
    async def analyze_system_changes(
        self, 
        db_session: Session,
        facility_id: int
    ) -> Dict[str, Any]:
        """
        Analyze changes in a solar system over time
        
        Args:
            db_session: Database session
            facility_id: ID of the facility
            
        Returns:
            Dictionary with analysis results
        """
        logger.info(f"Analyzing system changes for facility {facility_id}")
        
        # Get assessment history
        history = db_session.query(AssessmentHistory).filter_by(facility_id=facility_id).first()
        
        if not history:
            # If no history exists, create it
            await self._update_assessment_history(db_session, facility_id)
            history = db_session.query(AssessmentHistory).filter_by(facility_id=facility_id).first()
        
        if not history:
            return {
                "facility_id": facility_id,
                "assessment_count": 0,
                "message": "No assessments found for this facility"
            }
        
        # Get component histories
        component_histories = db_session.query(ComponentHistory).filter_by(facility_id=facility_id).all()
        
        # Format component histories
        formatted_components = []
        for ch in component_histories:
            formatted_components.append({
                "component_type": ch.component_type,
                "detection_count": ch.detection_count,
                "first_detection_date": ch.first_detection_date.isoformat(),
                "latest_detection_date": ch.latest_detection_date.isoformat(),
                "initial_condition": ch.initial_condition,
                "current_condition": ch.current_condition,
                "condition_trend": ch.condition_trend,
                "maintenance_count": ch.maintenance_count,
                "last_maintenance_date": ch.last_maintenance_date.isoformat() if ch.last_maintenance_date else None,
                "total_maintenance_cost": ch.total_maintenance_cost,
                "resolved_issues": ch.resolved_issues,
                "new_issues": ch.new_issues
            })
        
        # Calculate time period
        time_period_days = (history.latest_assessment_date - history.first_assessment_date).days
        
        # Format result
        result = {
            "facility_id": facility_id,
            "assessment_count": history.assessment_count,
            "first_assessment_date": history.first_assessment_date.isoformat(),
            "latest_assessment_date": history.latest_assessment_date.isoformat(),
            "time_period_days": time_period_days,
            "time_period_years": time_period_days / 365.0,
            
            "capacity_changes": {
                "initial_solar_capacity_kw": history.initial_solar_capacity_kw,
                "current_solar_capacity_kw": history.current_solar_capacity_kw,
                "capacity_change_percent": history.capacity_change_percent,
                "initial_battery_capacity_kwh": history.initial_battery_capacity_kwh,
                "current_battery_capacity_kwh": history.current_battery_capacity_kwh,
                "battery_capacity_change_percent": history.battery_capacity_change_percent
            },
            
            "condition_trend": history.condition_trend,
            "degradation_rate_percent": history.degradation_rate_percent,
            
            "maintenance_summary": {
                "action_count": history.maintenance_action_count,
                "total_cost": history.total_maintenance_cost,
                "average_annual_cost": history.total_maintenance_cost / (time_period_days / 365.0) if time_period_days > 0 else 0
            },
            
            "performance_metrics": {
                "trend": history.performance_trend,
                "estimated_annual_savings": history.estimated_annual_savings
            },
            
            "component_histories": formatted_components
        }
        
        return result
    
    async def _update_assessment_history(self, db_session: Session, facility_id: int) -> None:
        """
        Update assessment history for a facility
        
        Args:
            db_session: Database session
            facility_id: ID of the facility
        """
        logger.info(f"Updating assessment history for facility {facility_id}")
        
        # Get all completed assessments for this facility, ordered by date
        assessments = db_session.query(SolarSystemAssessment).filter(
            SolarSystemAssessment.facility_id == facility_id,
            SolarSystemAssessment.analysis_status == AnalysisStatus.COMPLETED
        ).order_by(SolarSystemAssessment.assessment_date).all()
        
        if not assessments:
            logger.info(f"No completed assessments found for facility {facility_id}")
            return
        
        # Get first and latest assessments
        first_assessment = assessments[0]
        latest_assessment = assessments[-1]
        
        # Get capacity data
        first_capacity = None
        latest_capacity = None
        
        if first_assessment.capacity:
            first_capacity = db_session.query(SystemCapacityAnalysis).filter_by(id=first_assessment.capacity.id).first()
        
        if latest_assessment.capacity:
            latest_capacity = db_session.query(SystemCapacityAnalysis).filter_by(id=latest_assessment.capacity.id).first()
        
        # Calculate capacity changes
        initial_solar_capacity = first_capacity.solar_capacity_kw if first_capacity else None
        current_solar_capacity = latest_capacity.solar_capacity_kw if latest_capacity else None
        
        capacity_change_percent = None
        if initial_solar_capacity and current_solar_capacity and initial_solar_capacity > 0:
            capacity_change_percent = ((current_solar_capacity - initial_solar_capacity) / initial_solar_capacity) * 100
        
        initial_battery_capacity = first_capacity.battery_capacity_kwh if first_capacity else None
        current_battery_capacity = latest_capacity.battery_capacity_kwh if latest_capacity else None
        
        battery_change_percent = None
        if initial_battery_capacity and current_battery_capacity and initial_battery_capacity > 0:
            battery_change_percent = ((current_battery_capacity - initial_battery_capacity) / initial_battery_capacity) * 100
        
        # Determine condition trend
        condition_trend = "stable"
        if len(assessments) > 1:
            # Compare issue counts between first and latest assessment
            first_issue_count = db_session.query(DetectedIssue).filter_by(assessment_id=first_assessment.id).count()
            latest_issue_count = db_session.query(DetectedIssue).filter_by(assessment_id=latest_assessment.id).count()
            
            if latest_issue_count > first_issue_count * 1.2:  # 20% more issues
                condition_trend = "degrading"
            elif latest_issue_count < first_issue_count * 0.8:  # 20% fewer issues
                condition_trend = "improving"
        
        # Calculate degradation rate if applicable
        degradation_rate = None
        if condition_trend == "degrading" and len(assessments) > 1:
            time_period_years = (latest_assessment.assessment_date - first_assessment.assessment_date).days / 365.0
            if time_period_years > 0 and capacity_change_percent:
                degradation_rate = abs(capacity_change_percent) / time_period_years
        
        # Get maintenance actions
        maintenance_actions = db_session.query(MaintenanceAction).filter(
            MaintenanceAction.assessment_id.in_([assessment.id for assessment in assessments])
        ).all()
        
        maintenance_count = len(maintenance_actions)
        total_maintenance_cost = sum(action.cost_usd or 0 for action in maintenance_actions)
        
        # Check if history exists
        history = db_session.query(AssessmentHistory).filter_by(facility_id=facility_id).first()
        
        if history:
            # Update existing history
            history.latest_assessment_id = latest_assessment.id
            history.latest_assessment_date = latest_assessment.assessment_date
            history.assessment_count = len(assessments)
            
            history.current_solar_capacity_kw = current_solar_capacity
            history.capacity_change_percent = capacity_change_percent
            
            history.current_battery_capacity_kwh = current_battery_capacity
            history.battery_capacity_change_percent = battery_change_percent
            
            history.condition_trend = condition_trend
            history.degradation_rate_percent = degradation_rate
            
            history.maintenance_action_count = maintenance_count
            history.total_maintenance_cost = total_maintenance_cost
        else:
            # Create new history
            history = AssessmentHistory(
                facility_id=facility_id,
                first_assessment_id=first_assessment.id,
                first_assessment_date=first_assessment.assessment_date,
                latest_assessment_id=latest_assessment.id,
                latest_assessment_date=latest_assessment.assessment_date,
                assessment_count=len(assessments),
                
                initial_solar_capacity_kw=initial_solar_capacity,
                current_solar_capacity_kw=current_solar_capacity,
                capacity_change_percent=capacity_change_percent,
                
                initial_battery_capacity_kwh=initial_battery_capacity,
                current_battery_capacity_kwh=current_battery_capacity,
                battery_capacity_change_percent=battery_change_percent,
                
                condition_trend=condition_trend,
                degradation_rate_percent=degradation_rate,
                
                maintenance_action_count=maintenance_count,
                total_maintenance_cost=total_maintenance_cost
            )
            db_session.add(history)
        
        db_session.flush()
    
    async def _update_component_history(self, db_session: Session, facility_id: int, component_type: str) -> None:
        """
        Update component history for a facility and component type
        
        Args:
            db_session: Database session
            facility_id: ID of the facility
            component_type: Type of component
        """
        logger.info(f"Updating {component_type} history for facility {facility_id}")
        
        # Get all assessments for this facility
        assessments = db_session.query(SolarSystemAssessment).filter_by(facility_id=facility_id).all()
        
        if not assessments:
            return
        
        # Get all components of this type across all assessments
        components = []
        for assessment in assessments:
            assessment_components = db_session.query(SolarComponentDetected).filter_by(
                assessment_id=assessment.id,
                component_type=component_type
            ).all()
            components.extend(assessment_components)
        
        if not components:
            return
        
        # Sort by detection date
        components.sort(key=lambda c: c.created_at)
        
        first_component = components[0]
        latest_component = components[-1]
        
        # Get issues for first and latest components
        first_issues = db_session.query(DetectedIssue).filter_by(
            assessment_id=first_component.assessment_id,
            component_type=component_type
        ).all()
        
        latest_issues = db_session.query(DetectedIssue).filter_by(
            assessment_id=latest_component.assessment_id,
            component_type=component_type
        ).all()
        
        # Count resolved and new issues
        first_issue_types = set(issue.issue_type for issue in first_issues)
        latest_issue_types = set(issue.issue_type for issue in latest_issues)
        
        resolved_issues = len(first_issue_types - latest_issue_types)
        new_issues = len(latest_issue_types - first_issue_types)
        
        # Determine condition trend
        condition_trend = "stable"
        if len(components) > 1:
            if len(latest_issues) > len(first_issues) * 1.2:  # 20% more issues
                condition_trend = "degrading"
            elif len(latest_issues) < len(first_issues) * 0.8:  # 20% fewer issues
                condition_trend = "improving"
        
        # Get maintenance actions for this component type
        maintenance_actions = db_session.query(MaintenanceAction).filter(
            MaintenanceAction.component_id.in_([component.id for component in components])
        ).all()
        
        maintenance_count = len(maintenance_actions)
        total_maintenance_cost = sum(action.cost_usd or 0 for action in maintenance_actions)
        
        last_maintenance_date = None
        if maintenance_actions:
            last_maintenance_date = max(action.action_date for action in maintenance_actions)
        
        # Check if history exists
        history = db_session.query(ComponentHistory).filter_by(
            facility_id=facility_id,
            component_type=component_type
        ).first()
        
        if history:
            # Update existing history
            history.latest_detection_id = latest_component.id
            history.latest_detection_date = latest_component.created_at
            history.detection_count = len(components)
            
            history.current_specifications = latest_component.analysis_results
            history.current_condition = latest_component.analysis_results.get("condition") if latest_component.analysis_results else None
            history.condition_trend = condition_trend
            
            history.current_issues = {issue.issue_type: issue.description for issue in latest_issues}
            history.resolved_issues = resolved_issues
            history.new_issues = new_issues
            
            history.maintenance_count = maintenance_count
            history.last_maintenance_date = last_maintenance_date
            history.total_maintenance_cost = total_maintenance_cost
        else:
            # Create new history
            history = ComponentHistory(
                facility_id=facility_id,
                component_type=component_type,
                first_detection_id=first_component.id,
                first_detection_date=first_component.created_at,
                latest_detection_id=latest_component.id,
                latest_detection_date=latest_component.created_at,
                detection_count=len(components),
                
                initial_specifications=first_component.analysis_results,
                current_specifications=latest_component.analysis_results,
                
                initial_condition=first_component.analysis_results.get("condition") if first_component.analysis_results else None,
                current_condition=latest_component.analysis_results.get("condition") if latest_component.analysis_results else None,
                condition_trend=condition_trend,
                
                initial_issues={issue.issue_type: issue.description for issue in first_issues},
                current_issues={issue.issue_type: issue.description for issue in latest_issues},
                resolved_issues=resolved_issues,
                new_issues=new_issues,
                
                maintenance_count=maintenance_count,
                last_maintenance_date=last_maintenance_date,
                total_maintenance_cost=total_maintenance_cost
            )
            db_session.add(history)
        
        db_session.flush()
