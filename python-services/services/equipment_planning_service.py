"""
Equipment Planning Service
Manages future equipment scenarios and planning for demand projections
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json

from models.energy import Equipment

logger = logging.getLogger(__name__)

@dataclass
class FutureEquipment:
    """Future equipment definition"""
    id: str
    name: str
    category: str
    power_rating_w: float
    quantity: int
    hours_per_day: float
    priority: str = "normal"  # critical, high, normal, low
    efficiency: float = 1.0
    installation_year: int = 2024
    replacement_for: Optional[str] = None  # ID of equipment being replaced
    is_new_addition: bool = True
    estimated_cost: float = 0.0
    maintenance_factor: float = 1.0

@dataclass
class EquipmentScenario:
    """Complete equipment planning scenario"""
    id: str
    name: str
    description: str
    facility_id: int
    timeline_years: int
    growth_factor: float
    selected_current_equipment: List[str]  # IDs of current equipment to keep
    new_equipment: List[FutureEquipment]
    equipment_replacements: Dict[str, str]  # current_id -> future_id mapping
    total_projected_demand: float
    estimated_total_cost: float
    created_at: datetime
    updated_at: datetime

@dataclass
class EquipmentRecommendation:
    """Equipment recommendation based on analysis"""
    equipment_type: str
    category: str
    recommended_power_w: float
    recommended_quantity: int
    justification: str
    priority: str
    estimated_cost: float
    energy_impact_kwh: float
    payback_period_years: float

class EquipmentPlanningService:
    """Service for managing equipment planning scenarios"""
    
    def __init__(self):
        self.scenarios_cache = {}  # In-memory cache for scenarios
        
    async def create_equipment_scenario(
        self,
        facility_id: int,
        name: str,
        description: str,
        timeline_years: int,
        growth_factor: float,
        current_equipment: List[Equipment]
    ) -> EquipmentScenario:
        """Create a new equipment planning scenario"""
        
        scenario_id = f"scenario_{facility_id}_{int(datetime.now().timestamp())}"
        
        scenario = EquipmentScenario(
            id=scenario_id,
            name=name,
            description=description,
            facility_id=facility_id,
            timeline_years=timeline_years,
            growth_factor=growth_factor,
            selected_current_equipment=[eq.name for eq in current_equipment],  # Default: select all
            new_equipment=[],
            equipment_replacements={},
            total_projected_demand=0.0,
            estimated_total_cost=0.0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Calculate initial projections
        scenario.total_projected_demand = self._calculate_projected_demand(scenario, current_equipment)
        
        # Cache the scenario
        self.scenarios_cache[scenario_id] = scenario
        
        logger.info(f"Created equipment scenario {scenario_id} for facility {facility_id}")
        return scenario
    
    async def update_equipment_scenario(
        self,
        scenario_id: str,
        updates: Dict[str, Any],
        current_equipment: List[Equipment]
    ) -> EquipmentScenario:
        """Update an existing equipment scenario"""
        
        if scenario_id not in self.scenarios_cache:
            raise ValueError(f"Scenario {scenario_id} not found")
        
        scenario = self.scenarios_cache[scenario_id]
        
        # Update fields
        for key, value in updates.items():
            if hasattr(scenario, key):
                setattr(scenario, key, value)
        
        # Update timestamp
        scenario.updated_at = datetime.now()
        
        # Recalculate projections
        scenario.total_projected_demand = self._calculate_projected_demand(scenario, current_equipment)
        scenario.estimated_total_cost = self._calculate_total_cost(scenario)
        
        logger.info(f"Updated equipment scenario {scenario_id}")
        return scenario
    
    async def add_future_equipment(
        self,
        scenario_id: str,
        equipment: FutureEquipment,
        current_equipment: List[Equipment]
    ) -> EquipmentScenario:
        """Add new equipment to a scenario"""
        
        if scenario_id not in self.scenarios_cache:
            raise ValueError(f"Scenario {scenario_id} not found")
        
        scenario = self.scenarios_cache[scenario_id]
        scenario.new_equipment.append(equipment)
        scenario.updated_at = datetime.now()
        
        # Recalculate projections
        scenario.total_projected_demand = self._calculate_projected_demand(scenario, current_equipment)
        scenario.estimated_total_cost = self._calculate_total_cost(scenario)
        
        logger.info(f"Added equipment {equipment.name} to scenario {scenario_id}")
        return scenario
    
    async def remove_future_equipment(
        self,
        scenario_id: str,
        equipment_id: str,
        current_equipment: List[Equipment]
    ) -> EquipmentScenario:
        """Remove equipment from a scenario"""
        
        if scenario_id not in self.scenarios_cache:
            raise ValueError(f"Scenario {scenario_id} not found")
        
        scenario = self.scenarios_cache[scenario_id]
        scenario.new_equipment = [eq for eq in scenario.new_equipment if eq.id != equipment_id]
        scenario.updated_at = datetime.now()
        
        # Recalculate projections
        scenario.total_projected_demand = self._calculate_projected_demand(scenario, current_equipment)
        scenario.estimated_total_cost = self._calculate_total_cost(scenario)
        
        logger.info(f"Removed equipment {equipment_id} from scenario {scenario_id}")
        return scenario
    
    async def get_equipment_recommendations(
        self,
        facility_id: int,
        current_equipment: List[Equipment],
        facility_type: str = "healthcare",
        budget_constraint: Optional[float] = None
    ) -> List[EquipmentRecommendation]:
        """Generate equipment recommendations based on facility analysis"""
        
        recommendations = []
        
        # Analyze current equipment gaps
        equipment_analysis = self._analyze_equipment_gaps(current_equipment, facility_type)
        
        # Generate recommendations based on gaps
        for gap in equipment_analysis['gaps']:
            recommendation = EquipmentRecommendation(
                equipment_type=gap['equipment_type'],
                category=gap['category'],
                recommended_power_w=gap['recommended_power'],
                recommended_quantity=gap['recommended_quantity'],
                justification=gap['justification'],
                priority=gap['priority'],
                estimated_cost=gap['estimated_cost'],
                energy_impact_kwh=gap['energy_impact'],
                payback_period_years=gap.get('payback_period', 0)
            )
            recommendations.append(recommendation)
        
        # Filter by budget if specified
        if budget_constraint:
            recommendations = [r for r in recommendations if r.estimated_cost <= budget_constraint]
        
        # Sort by priority and energy impact
        recommendations.sort(key=lambda x: (
            {'critical': 0, 'high': 1, 'normal': 2, 'low': 3}[x.priority],
            -x.energy_impact_kwh
        ))
        
        logger.info(f"Generated {len(recommendations)} equipment recommendations for facility {facility_id}")
        return recommendations
    
    async def validate_equipment_scenario(
        self,
        scenario: EquipmentScenario,
        current_equipment: List[Equipment]
    ) -> Dict[str, Any]:
        """Validate an equipment scenario for feasibility"""
        
        validation_results = {
            'is_valid': True,
            'warnings': [],
            'errors': [],
            'recommendations': []
        }
        
        # Check for equipment conflicts
        conflicts = self._check_equipment_conflicts(scenario)
        if conflicts:
            validation_results['warnings'].extend(conflicts)
        
        # Check power requirements
        power_analysis = self._analyze_power_requirements(scenario, current_equipment)
        if power_analysis['total_power_kw'] > power_analysis.get('facility_capacity_kw', float('inf')):
            validation_results['errors'].append(
                f"Total power requirement ({power_analysis['total_power_kw']:.1f} kW) exceeds facility capacity"
            )
            validation_results['is_valid'] = False
        
        # Check timeline feasibility
        timeline_issues = self._check_timeline_feasibility(scenario)
        if timeline_issues:
            validation_results['warnings'].extend(timeline_issues)
        
        # Check cost feasibility
        if scenario.estimated_total_cost > 1000000:  # $1M threshold
            validation_results['warnings'].append(
                f"High total cost (${scenario.estimated_total_cost:,.0f}) may require additional budget approval"
            )
        
        # Generate optimization recommendations
        optimization_recs = self._generate_optimization_recommendations(scenario, current_equipment)
        validation_results['recommendations'].extend(optimization_recs)
        
        return validation_results
    
    async def export_scenario_for_demand_analysis(
        self,
        scenario_id: str,
        current_equipment: List[Equipment]
    ) -> Dict[str, Any]:
        """Export scenario in format suitable for demand scenario engine"""
        
        if scenario_id not in self.scenarios_cache:
            raise ValueError(f"Scenario {scenario_id} not found")
        
        scenario = self.scenarios_cache[scenario_id]
        
        # Convert current equipment selection
        selected_current = [
            eq for eq in current_equipment 
            if eq.name in scenario.selected_current_equipment
        ]
        
        # Convert future equipment to Equipment objects
        future_equipment_list = []
        for future_eq in scenario.new_equipment:
            equipment = Equipment(
                name=future_eq.name,
                category=future_eq.category,
                power_rating_w=future_eq.power_rating_w,
                quantity=future_eq.quantity,
                hours_per_day=future_eq.hours_per_day,
                priority=future_eq.priority,
                efficiency=future_eq.efficiency
            )
            future_equipment_list.append(equipment)
        
        # Prepare export data
        export_data = {
            'scenario_info': {
                'id': scenario.id,
                'name': scenario.name,
                'description': scenario.description,
                'timeline_years': scenario.timeline_years,
                'growth_factor': scenario.growth_factor
            },
            'current_equipment': [asdict(eq) for eq in selected_current],
            'future_equipment': [asdict(eq) for eq in future_equipment_list],
            'future_growth_parameters': {
                'selected_equipment_ids': [eq.name for eq in selected_current],
                'growth_factor': scenario.growth_factor,
                'timeline_years': scenario.timeline_years,
                'new_equipment': [asdict(eq) for eq in future_equipment_list]
            },
            'projections': {
                'total_projected_demand_kwh': scenario.total_projected_demand,
                'estimated_cost': scenario.estimated_total_cost,
                'equipment_count': len(selected_current) + len(future_equipment_list)
            }
        }
        
        return export_data
    
    def _calculate_projected_demand(
        self,
        scenario: EquipmentScenario,
        current_equipment: List[Equipment]
    ) -> float:
        """Calculate total projected energy demand for scenario"""
        
        total_demand = 0.0
        
        # Current equipment with growth factor
        selected_current = [
            eq for eq in current_equipment 
            if eq.name in scenario.selected_current_equipment
        ]
        
        for equipment in selected_current:
            annual_kwh = (
                equipment.power_rating_w / 1000 *  # Convert to kW
                equipment.hours_per_day *
                365 *  # Days per year
                equipment.quantity *
                equipment.efficiency
            )
            total_demand += annual_kwh * scenario.growth_factor
        
        # New equipment
        for equipment in scenario.new_equipment:
            annual_kwh = (
                equipment.power_rating_w / 1000 *  # Convert to kW
                equipment.hours_per_day *
                365 *  # Days per year
                equipment.quantity *
                equipment.efficiency
            )
            total_demand += annual_kwh
        
        return total_demand
    
    def _calculate_total_cost(self, scenario: EquipmentScenario) -> float:
        """Calculate total estimated cost for scenario"""
        
        total_cost = 0.0
        
        # Cost of new equipment
        for equipment in scenario.new_equipment:
            # Estimate cost based on power rating and category
            cost_per_watt = self._get_cost_per_watt(equipment.category)
            equipment_cost = equipment.power_rating_w * cost_per_watt * equipment.quantity
            total_cost += equipment_cost
        
        # Installation and infrastructure costs (20% of equipment cost)
        total_cost *= 1.2
        
        return total_cost
    
    def _get_cost_per_watt(self, category: str) -> float:
        """Get estimated cost per watt for equipment category"""
        
        cost_mapping = {
            'Medical Equipment': 15.0,  # $15/W
            'Laboratory Equipment': 12.0,
            'IT Equipment': 8.0,
            'HVAC': 5.0,
            'Lighting': 3.0,
            'Kitchen Equipment': 6.0,
            'Security Systems': 10.0,
            'Communication Equipment': 8.0,
            'Other': 7.0
        }
        
        return cost_mapping.get(category, 7.0)
    
    def _analyze_equipment_gaps(
        self,
        current_equipment: List[Equipment],
        facility_type: str
    ) -> Dict[str, Any]:
        """Analyze gaps in current equipment for facility type"""
        
        # Define standard equipment requirements by facility type
        standard_requirements = {
            'healthcare': {
                'Medical Equipment': {'min_power': 5000, 'priority': 'critical'},
                'HVAC': {'min_power': 10000, 'priority': 'high'},
                'Lighting': {'min_power': 2000, 'priority': 'normal'},
                'IT Equipment': {'min_power': 3000, 'priority': 'high'},
                'Security Systems': {'min_power': 500, 'priority': 'high'}
            },
            'clinic': {
                'Medical Equipment': {'min_power': 2000, 'priority': 'critical'},
                'HVAC': {'min_power': 5000, 'priority': 'high'},
                'Lighting': {'min_power': 1000, 'priority': 'normal'},
                'IT Equipment': {'min_power': 1500, 'priority': 'normal'}
            }
        }
        
        requirements = standard_requirements.get(facility_type, standard_requirements['healthcare'])
        
        # Analyze current equipment by category
        current_by_category = {}
        for equipment in current_equipment:
            category = equipment.category
            if category not in current_by_category:
                current_by_category[category] = 0
            current_by_category[category] += equipment.power_rating_w * equipment.quantity
        
        # Identify gaps
        gaps = []
        for category, req in requirements.items():
            current_power = current_by_category.get(category, 0)
            if current_power < req['min_power']:
                gap_power = req['min_power'] - current_power
                gaps.append({
                    'equipment_type': f"Additional {category}",
                    'category': category,
                    'recommended_power': gap_power,
                    'recommended_quantity': max(1, int(gap_power / 1000)),  # Assume 1kW per unit
                    'justification': f"Current {category} capacity ({current_power}W) below recommended minimum ({req['min_power']}W)",
                    'priority': req['priority'],
                    'estimated_cost': gap_power * self._get_cost_per_watt(category),
                    'energy_impact': gap_power * 8 * 365 / 1000,  # Assume 8 hours/day
                    'payback_period': 5.0  # Default 5 years
                })
        
        return {
            'gaps': gaps,
            'current_by_category': current_by_category,
            'requirements': requirements
        }
    
    def _check_equipment_conflicts(self, scenario: EquipmentScenario) -> List[str]:
        """Check for potential equipment conflicts"""
        
        conflicts = []
        
        # Check for duplicate equipment names
        all_names = [eq.name for eq in scenario.new_equipment]
        duplicates = [name for name in set(all_names) if all_names.count(name) > 1]
        if duplicates:
            conflicts.append(f"Duplicate equipment names found: {', '.join(duplicates)}")
        
        # Check for replacement conflicts
        for current_id, future_id in scenario.equipment_replacements.items():
            if current_id in scenario.selected_current_equipment:
                conflicts.append(f"Equipment {current_id} is both selected for continuation and replacement")
        
        return conflicts
    
    def _analyze_power_requirements(
        self,
        scenario: EquipmentScenario,
        current_equipment: List[Equipment]
    ) -> Dict[str, float]:
        """Analyze total power requirements for scenario"""
        
        total_power_w = 0.0
        
        # Current equipment
        selected_current = [
            eq for eq in current_equipment 
            if eq.name in scenario.selected_current_equipment
        ]
        
        for equipment in selected_current:
            total_power_w += equipment.power_rating_w * equipment.quantity * scenario.growth_factor
        
        # New equipment
        for equipment in scenario.new_equipment:
            total_power_w += equipment.power_rating_w * equipment.quantity
        
        return {
            'total_power_kw': total_power_w / 1000,
            'current_equipment_kw': sum(eq.power_rating_w * eq.quantity for eq in selected_current) / 1000,
            'new_equipment_kw': sum(eq.power_rating_w * eq.quantity for eq in scenario.new_equipment) / 1000,
            'growth_factor_applied': scenario.growth_factor
        }
    
    def _check_timeline_feasibility(self, scenario: EquipmentScenario) -> List[str]:
        """Check timeline feasibility"""
        
        issues = []
        
        # Check installation years
        current_year = datetime.now().year
        for equipment in scenario.new_equipment:
            if equipment.installation_year < current_year:
                issues.append(f"Equipment {equipment.name} has installation year in the past")
            elif equipment.installation_year > current_year + scenario.timeline_years:
                issues.append(f"Equipment {equipment.name} installation year exceeds scenario timeline")
        
        return issues
    
    def _generate_optimization_recommendations(
        self,
        scenario: EquipmentScenario,
        current_equipment: List[Equipment]
    ) -> List[str]:
        """Generate optimization recommendations"""
        
        recommendations = []
        
        # Check for efficiency opportunities
        low_efficiency_equipment = [
            eq for eq in scenario.new_equipment 
            if eq.efficiency < 0.8
        ]
        if low_efficiency_equipment:
            recommendations.append(
                f"Consider higher efficiency alternatives for: {', '.join(eq.name for eq in low_efficiency_equipment)}"
            )
        
        # Check for oversized equipment
        power_analysis = self._analyze_power_requirements(scenario, current_equipment)
        if power_analysis['total_power_kw'] > 100:  # Arbitrary threshold
            recommendations.append(
                "Consider phased implementation to reduce initial power requirements"
            )
        
        # Check for cost optimization
        if scenario.estimated_total_cost > 500000:  # $500K threshold
            recommendations.append(
                "Consider bulk purchasing or leasing options to reduce upfront costs"
            )
        
        return recommendations

# Global service instance
equipment_planning_service = EquipmentPlanningService()
