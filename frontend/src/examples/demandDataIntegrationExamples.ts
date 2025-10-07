/**
 * Demand Data Service Integration Examples
 * Shows how existing DREAM Tool components can use the centralized demand data service
 */

import { demandDataService, DemandScenarioType, DemandDataFormat } from '../services/demandDataService';

// ============================================================================
// DASHBOARD COMPONENT INTEGRATION
// ============================================================================

/**
 * Example: Dashboard Energy Chart Component
 * Shows current energy demand in a daily profile chart
 */
export class DashboardEnergyChart {
  async loadEnergyData(facilityId: number) {
    try {
      // Get current demand data optimized for dashboard display
      const demandData = await demandDataService.getCurrentDemandForDashboard(facilityId);
      
      // Use daily profile for chart (24 hours instead of 8760)
      const chartData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Energy Demand (kW)',
          data: demandData.daily_profile || [],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true
        }]
      };
      
      // Additional metrics for dashboard cards
      const metrics = {
        annualEnergy: `${(demandData.annual_kwh / 1000).toFixed(1)} MWh`,
        peakDemand: `${demandData.peak_demand_kw.toFixed(1)} kW`,
        loadFactor: `${(demandData.load_factor * 100).toFixed(1)}%`,
        estimatedCost: `$${demandData.cost_implications.total_annual_cost.toLocaleString()}`
      };
      
      return { chartData, metrics };
      
    } catch (error) {
      console.error('Error loading dashboard energy data:', error);
      throw error;
    }
  }
}

// ============================================================================
// REOPT INTEGRATION EXAMPLE
// ============================================================================

/**
 * Example: REopt Optimization Service Integration
 * Shows how REopt service can get properly formatted demand data
 */
export class REoptIntegrationService {
  async optimizeFacility(
    facilityId: number, 
    scenarioType: string = DemandScenarioType.CURRENT_ALL,
    dayNightShare?: { day_share_percent: number; night_share_percent: number }
  ) {
    try {
      // Get demand data formatted specifically for REopt
      const reoptData = await demandDataService.getREoptData({
        facility_id: facilityId,
        scenario_type: scenarioType,
        day_night_share: dayNightShare
      });
      
      // REopt data is now ready for NREL API submission
      const reoptRequest = {
        Scenario: {
          Site: {
            latitude: 40.7128,  // Would come from facility data
            longitude: -74.0060,
            LoadProfile: {
              loads_kw: reoptData.loads_kw,
              annual_kwh: reoptData.annual_kwh,
              peak_kw: reoptData.peak_kw
            }
          },
          PV: {
            max_kw: reoptData.peak_kw * 1.5  // Size PV based on peak demand
          },
          Storage: {
            max_kw: reoptData.peak_kw * 0.5,
            max_kwh: reoptData.peak_kw * 2
          }
        }
      };
      
      // Submit to NREL REopt API
      return await this.submitToNRELREopt(reoptRequest);
      
    } catch (error) {
      console.error('Error in REopt optimization:', error);
      throw error;
    }
  }
  
  private async submitToNRELREopt(request: any) {
    // Implementation would submit to NREL REopt API
    console.log('Submitting to NREL REopt:', request);
    return { status: 'submitted', request_id: 'mock-123' };
  }
}

// ============================================================================
// MCDA INTEGRATION EXAMPLE
// ============================================================================

/**
 * Example: MCDA Analysis Integration
 * Shows how MCDA service can get demand data for multiple facilities
 */
export class MCDAIntegrationService {
  async analyzeFacilities(
    facilityIds: number[],
    scenarioType: string = DemandScenarioType.CURRENT_ALL
  ) {
    try {
      // Get demand data formatted for MCDA analysis
      const mcdaData = await demandDataService.getMCDAData({
        facility_ids: facilityIds,
        scenario_type: scenarioType
      });
      
      // Transform for MCDA criteria matrix
      const criteriaMatrix = facilityIds.map(facilityId => {
        const facilityData = mcdaData[facilityId];
        if (!facilityData) return null;
        
        return {
          facility_id: facilityId,
          criteria: {
            annual_energy_demand: facilityData.annual_energy_demand_kwh,
            peak_demand: facilityData.peak_demand_kw,
            load_factor: facilityData.load_factor,
            estimated_cost: facilityData.estimated_annual_cost,
            // Add other MCDA criteria...
          }
        };
      }).filter(Boolean);
      
      // Run MCDA analysis with demand data
      return await this.runMCDAAnalysis(criteriaMatrix);
      
    } catch (error) {
      console.error('Error in MCDA analysis:', error);
      throw error;
    }
  }
  
  private async runMCDAAnalysis(criteriaMatrix: any[]) {
    // Implementation would run TOPSIS or AHP analysis
    console.log('Running MCDA analysis with criteria:', criteriaMatrix);
    return { rankings: criteriaMatrix, method: 'TOPSIS' };
  }
}

// ============================================================================
// ENERGY ANALYSIS COMPONENT INTEGRATION
// ============================================================================

/**
 * Example: Comprehensive Energy Analysis Component
 * Shows scenario comparison and detailed analysis
 */
export class EnergyAnalysisComponent {
  async performComprehensiveAnalysis(
    facilityId: number,
    futureParameters: {
      selected_equipment_ids: string[];
      growth_factor: number;
      timeline_years: number;
    },
    dayNightShare?: { day_share_percent: number; night_share_percent: number }
  ) {
    try {
      // Get comprehensive energy analysis data
      const analysisData = await demandDataService.getEnergyAnalysisData({
        facility_id: facilityId,
        scenario_types: [
          DemandScenarioType.CURRENT_ALL,
          DemandScenarioType.CURRENT_CRITICAL,
          DemandScenarioType.FUTURE_ALL,
          DemandScenarioType.FUTURE_CRITICAL
        ],
        future_parameters: futureParameters,
        day_night_share: dayNightShare
      });
      
      // Process data for visualization
      const scenarioComparison = {
        scenarios: Object.entries(analysisData.scenarios).map(([key, data]) => ({
          name: key.replace(/_/g, ' ').toUpperCase(),
          annual_kwh: data.annual_energy_kwh,
          peak_kw: data.peak_demand_kw,
          load_factor: data.load_factor,
          monthly_profile: data.monthly_totals
        })),
        growth_analysis: analysisData.comparison_metrics,
        recommendations: this.generateRecommendations(analysisData)
      };
      
      return scenarioComparison;
      
    } catch (error) {
      console.error('Error in energy analysis:', error);
      throw error;
    }
  }
  
  private generateRecommendations(analysisData: any) {
    const recommendations = [];
    
    if (analysisData.comparison_metrics?.annual_energy_range?.ratio > 2) {
      recommendations.push({
        type: 'growth_concern',
        message: 'Significant energy demand growth projected. Consider phased system expansion.',
        priority: 'high'
      });
    }
    
    // Add more recommendation logic...
    return recommendations;
  }
}

// ============================================================================
// FINANCIAL ANALYSIS INTEGRATION
// ============================================================================

/**
 * Example: Financial Analysis Component
 * Shows cost analysis using demand scenarios
 */
export class FinancialAnalysisComponent {
  async calculateFinancialMetrics(
    facilityId: number,
    scenarios: string[] = [DemandScenarioType.CURRENT_ALL, DemandScenarioType.FUTURE_ALL]
  ) {
    try {
      // Get demand data with cost analysis format
      const demandData = await demandDataService.getDemandData({
        facility_id: facilityId,
        scenario_types: scenarios,
        data_format: DemandDataFormat.COST_ANALYSIS,
        include_metadata: true
      });
      
      // Calculate financial metrics
      const financialAnalysis = {
        current_costs: {},
        future_costs: {},
        savings_potential: {},
        roi_analysis: {}
      };
      
      scenarios.forEach(scenario => {
        const scenarioData = demandData.scenario_data[scenario];
        if (scenarioData) {
          const costs = scenarioData.cost_implications;
          
          if (scenario.includes('current')) {
            financialAnalysis.current_costs[scenario] = {
              annual_energy_cost: costs.energy_charges,
              demand_charges: costs.peak_demand_charges,
              total_cost: costs.total_annual_cost
            };
          } else {
            financialAnalysis.future_costs[scenario] = {
              annual_energy_cost: costs.energy_charges,
              demand_charges: costs.peak_demand_charges,
              total_cost: costs.total_annual_cost
            };
          }
        }
      });
      
      // Calculate potential savings from efficiency measures
      financialAnalysis.savings_potential = this.calculateSavingsPotential(
        financialAnalysis.current_costs,
        financialAnalysis.future_costs
      );
      
      return financialAnalysis;
      
    } catch (error) {
      console.error('Error in financial analysis:', error);
      throw error;
    }
  }
  
  private calculateSavingsPotential(currentCosts: any, futureCosts: any) {
    // Implementation for savings calculations
    return {
      efficiency_savings: 15000, // Example values
      demand_reduction_savings: 8000,
      total_potential_savings: 23000
    };
  }
}

// ============================================================================
// SYSTEM SIZING INTEGRATION
// ============================================================================

/**
 * Example: Solar PV System Sizing Component
 * Uses peak demand data for system sizing recommendations
 */
export class SystemSizingComponent {
  async recommendSystemSize(
    facilityId: number,
    scenarioType: string = DemandScenarioType.CURRENT_ALL,
    sizingFactor: number = 1.2
  ) {
    try {
      // Get peak demand data for system sizing
      const demandData = await demandDataService.getDemandData({
        facility_id: facilityId,
        scenario_types: [scenarioType],
        data_format: DemandDataFormat.PEAK_DEMAND
      });
      
      const scenarioData = demandData.scenario_data[scenarioType];
      const peakDemand = scenarioData.peak_demand_kw;
      
      // System sizing recommendations
      const recommendations = {
        pv_system: {
          recommended_size_kw: peakDemand * sizingFactor,
          annual_generation_estimate: peakDemand * sizingFactor * 1500, // kWh (example factor)
          coverage_percentage: Math.min(100, (peakDemand * sizingFactor * 1500) / scenarioData.annual_kwh * 100)
        },
        battery_storage: {
          recommended_capacity_kwh: peakDemand * 4, // 4-hour storage
          recommended_power_kw: peakDemand,
          backup_duration_hours: 4
        },
        cost_estimates: {
          pv_cost: peakDemand * sizingFactor * 1500, // $/kW (example)
          battery_cost: peakDemand * 4 * 800, // $/kWh (example)
          total_system_cost: (peakDemand * sizingFactor * 1500) + (peakDemand * 4 * 800)
        }
      };
      
      return recommendations;
      
    } catch (error) {
      console.error('Error in system sizing:', error);
      throw error;
    }
  }
}

// ============================================================================
// REACT COMPONENT INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example React Component using demand data service
 */
export const EnergyDashboardComponent = () => {
  // This would be a React component implementation
  const exampleReactIntegration = `
    import React, { useState, useEffect } from 'react';
    import { demandDataService, DemandScenarioType } from '../services/demandDataService';
    
    const EnergyDashboard = ({ facilityId }) => {
      const [demandData, setDemandData] = useState(null);
      const [loading, setLoading] = useState(true);
      
      useEffect(() => {
        const loadData = async () => {
          try {
            const data = await demandDataService.getCurrentDemandForDashboard(facilityId);
            setDemandData(data);
          } catch (error) {
            console.error('Error loading demand data:', error);
          } finally {
            setLoading(false);
          }
        };
        
        loadData();
      }, [facilityId]);
      
      if (loading) return <div>Loading energy data...</div>;
      
      return (
        <div>
          <h2>Energy Dashboard</h2>
          <div className="metrics-cards">
            <div className="metric-card">
              <h3>Annual Energy</h3>
              <p>{(demandData.annual_kwh / 1000).toFixed(1)} MWh</p>
            </div>
            <div className="metric-card">
              <h3>Peak Demand</h3>
              <p>{demandData.peak_demand_kw.toFixed(1)} kW</p>
            </div>
            <div className="metric-card">
              <h3>Load Factor</h3>
              <p>{(demandData.load_factor * 100).toFixed(1)}%</p>
            </div>
          </div>
          <EnergyChart data={demandData.daily_profile} />
        </div>
      );
    };
  `;
  
  return exampleReactIntegration;
};

// ============================================================================
// UTILITY FUNCTIONS FOR INTEGRATION
// ============================================================================

/**
 * Utility functions to help with demand data integration
 */
export class DemandDataIntegrationUtils {
  
  /**
   * Convert hourly profile to different time resolutions
   */
  static convertHourlyProfile(hourlyData: number[], targetResolution: 'daily' | 'weekly' | 'monthly') {
    switch (targetResolution) {
      case 'daily':
        return hourlyData.slice(0, 24); // First 24 hours
      case 'weekly':
        return Array.from({ length: 7 }, (_, day) => 
          hourlyData.slice(day * 24, (day + 1) * 24).reduce((sum, val) => sum + val, 0)
        );
      case 'monthly':
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let hourIndex = 0;
        return daysInMonth.map(days => {
          let monthTotal = 0;
          for (let day = 0; day < days; day++) {
            for (let hour = 0; hour < 24; hour++) {
              if (hourIndex < hourlyData.length) {
                monthTotal += hourlyData[hourIndex++];
              }
            }
          }
          return monthTotal;
        });
      default:
        return hourlyData;
    }
  }
  
  /**
   * Calculate energy metrics from demand data
   */
  static calculateEnergyMetrics(scenarioData: any) {
    return {
      capacity_factor: scenarioData.load_factor,
      peak_to_average_ratio: scenarioData.peak_demand_kw / (scenarioData.annual_kwh / 8760),
      energy_density: scenarioData.annual_kwh / 365, // kWh per day
      demand_variability: this.calculateVariability(scenarioData.hourly_profile || [])
    };
  }
  
  private static calculateVariability(hourlyData: number[]): number {
    if (hourlyData.length === 0) return 0;
    
    const mean = hourlyData.reduce((sum, val) => sum + val, 0) / hourlyData.length;
    const variance = hourlyData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / hourlyData.length;
    const standardDeviation = Math.sqrt(variance);
    
    return standardDeviation / mean; // Coefficient of variation
  }
  
  /**
   * Format demand data for different chart libraries
   */
  static formatForChartLibrary(scenarioData: any, library: 'chartjs' | 'recharts' | 'd3') {
    const hourlyData = scenarioData.hourly_profile || scenarioData.daily_profile || [];
    
    switch (library) {
      case 'chartjs':
        return {
          labels: hourlyData.map((_, i) => `Hour ${i + 1}`),
          datasets: [{
            label: 'Energy Demand (kW)',
            data: hourlyData,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }]
        };
      
      case 'recharts':
        return hourlyData.map((value, index) => ({
          hour: index + 1,
          demand: value,
          name: `Hour ${index + 1}`
        }));
      
      case 'd3':
        return hourlyData.map((value, index) => ({
          x: index,
          y: value,
          label: `Hour ${index + 1}`
        }));
      
      default:
        return hourlyData;
    }
  }
}

export default {
  DashboardEnergyChart,
  REoptIntegrationService,
  MCDAIntegrationService,
  EnergyAnalysisComponent,
  FinancialAnalysisComponent,
  SystemSizingComponent,
  DemandDataIntegrationUtils
};
