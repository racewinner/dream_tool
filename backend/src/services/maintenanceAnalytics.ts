import { SolarSystem, MaintenanceRecord } from '../models';
import { SystemPerformanceMetrics, SystemStatus } from '../types/solarSystem';
import { errorHandler } from '../middleware/errorHandler';

export class MaintenanceAnalytics {
  private static instance: MaintenanceAnalytics;
  private readonly DOWNTIME_THRESHOLD = 24; // hours
  private readonly ENERGY_LOSS_THRESHOLD = 0.05; // 5%

  private constructor() {}

  public static getInstance(): MaintenanceAnalytics {
    if (!MaintenanceAnalytics.instance) {
      MaintenanceAnalytics.instance = new MaintenanceAnalytics();
    }
    return MaintenanceAnalytics.instance;
  }

  public async calculateSystemMetrics(systemId: number): Promise<SystemPerformanceMetrics> {
    const [system, records] = await Promise.all([
      SolarSystem.findByPk(systemId),
      MaintenanceRecord.findAll({ where: { solarSystemId: systemId } })
    ]);

    if (!system) {
      throw new Error('System not found');
    }

    const metrics = {
      dailyGeneration: await this.calculateDailyGeneration(system),
      monthlyGeneration: await this.calculateMonthlyGeneration(system),
      yearlyGeneration: await this.calculateYearlyGeneration(system),
      efficiency: await this.calculateSystemEfficiency(system),
      maintenanceCosts: await this.calculateMaintenanceCosts(records),
      operationalHours: await this.calculateOperationalHours(records),
      downtime: await this.calculateDowntime(records),
      energyLoss: await this.calculateEnergyLoss(system, records),
      systemAvailability: await this.calculateSystemAvailability(records),
      performanceRatio: await this.calculatePerformanceRatio(system),
      capacityFactor: await this.calculateCapacityFactor(system)
    };

    return metrics;
  }

  public async calculateSystemStatus(systemId: number): Promise<SystemStatus> {
    const [system, records] = await Promise.all([
      SolarSystem.findByPk(systemId),
      MaintenanceRecord.findAll({
        where: { solarSystemId: systemId },
        order: [['maintenanceDate', 'DESC']]
      })
    ]);

    if (!system) {
      throw new Error('System not found');
    }

    const status = {
      operational: system.status === 'ACTIVE',
      maintenanceRequired: system.status === 'MAINTENANCE',
      performance: system.performanceMetrics.efficiency,
      alerts: this.generateAlerts(system, records),
      maintenanceSchedule: this.calculateMaintenanceSchedule(system),
      healthScore: this.calculateHealthScore(system, records),
      riskLevel: this.calculateRiskLevel(system, records),
      upcomingMaintenance: this.calculateUpcomingMaintenance(records),
      systemMetrics: {
        efficiency: system.performanceMetrics?.efficiency || 0,
        availability: system.performanceMetrics?.systemAvailability || 0,
        reliability: this.calculateReliability(records),
        performance: system.performanceMetrics?.performanceRatio || 0
      },
      recentIssues: this.calculateRecentIssues(records)
    };

    return status;
  }

  private calculateHealthScore(system: any, records: any[]): number {
    const efficiency = system.performanceMetrics?.efficiency || 0;
    const availability = system.performanceMetrics?.systemAvailability || 0;
    const performanceRatio = system.performanceMetrics?.performanceRatio || 0;
    const downtimePercentage = system.performanceMetrics?.downtime?.percentage || 0;
    
    const score = (
      (efficiency * 0.4) +
      (availability * 0.3) +
      (performanceRatio * 0.2) +
      (1 - downtimePercentage) * 0.1
    ) * 100;

    return Math.round(score);
  }

  private calculateRiskLevel(system: any, records: any[]): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    const healthScore = this.calculateHealthScore(system, records);
    const recentIssues = records.filter(r => 
      new Date(r.maintenanceDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    if (healthScore < 30 || recentIssues.length > 5) return 'CRITICAL';
    if (healthScore < 50 || recentIssues.length > 3) return 'HIGH';
    if (healthScore < 70 || recentIssues.length > 1) return 'MODERATE';
    return 'LOW';
  }

  private calculateReliability(records: any[]): number {
    const totalHours = records.reduce((sum, r) => sum + r.downtimeHours, 0);
    const operationalHours = records.reduce((sum, r) => sum + r.operationalHours, 0);
    return (operationalHours / (operationalHours + totalHours)) * 100;
  }

  private calculateAlerts(system: any, records: any[]): string[] {
    const alerts: string[] = [];

    if (system.status === 'MAINTENANCE') {
      alerts.push('System requires maintenance');
    }

    if (system.performanceMetrics.efficiency < 80) {
      alerts.push('Low system efficiency');
    }

    if (system.performanceMetrics.systemAvailability < 95) {
      alerts.push('Low system availability');
    }

    const upcoming = records.filter(
      r => new Date(r.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    if (upcoming.length > 0) {
      alerts.push(`Upcoming maintenance: ${upcoming.length} tasks`);
    }

    return alerts;
  }

  private calculateUpcomingMaintenance(records: any[]): any {
    const upcoming = records.filter(r => 
      r.maintenanceStatus === 'PENDING' && 
      new Date(r.maintenanceDate) > new Date()
    );
    
    return {
      count: upcoming.length,
      nextDate: upcoming[0]?.maintenanceDate || null,
      types: upcoming.map(r => r.maintenanceType)
    };
  }

  private generateAlerts(system: any, records: any[]): string[] {
    const alerts: string[] = [];
    
    if (system.status === 'MAINTENANCE') {
      alerts.push('System is currently under maintenance');
    }
    
    if (system.performanceMetrics?.efficiency < 0.8) {
      alerts.push('Low system efficiency detected');
    }
    
    const recentFailures = records.filter(r => 
      r.maintenanceType === 'CORRECTIVE' && 
      new Date(r.maintenanceDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentFailures.length > 2) {
      alerts.push('Multiple recent maintenance issues');
    }
    
    return alerts;
  }

  private calculateRecentIssues(records: any[]): any {
    const recent = records.filter(
      r => new Date(r.maintenanceDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    return {
      count: recent.length,
      severity: this.calculateIssueSeverity(recent),
      types: [...new Set(recent.map(r => r.maintenanceType))]
    };
  }

  private calculateIssueSeverity(records: any[]): 'LOW' | 'MODERATE' | 'HIGH' {
    const severityCount = records.filter(r => r.maintenanceType === 'CORRECTIVE').length;
    if (severityCount > 3) return 'HIGH';
    if (severityCount > 1) return 'MODERATE';
    return 'LOW';
  }

  private calculateMaintenanceSchedule(system: any): any {
    return {
      nextMaintenance: system.nextMaintenanceDate,
      frequency: system.maintenanceFrequency,
      lastMaintenance: system.lastMaintenanceDate,
      overdue: new Date(system.nextMaintenanceDate) < new Date(),
      upcoming: new Date(system.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }

  private async calculateDailyGeneration(system: any): Promise<number> {
    // Implementation for daily generation calculation
    return 0;
  }

  private async calculateMonthlyGeneration(system: any): Promise<number> {
    // Implementation for monthly generation calculation
    return 0;
  }

  private async calculateYearlyGeneration(system: any): Promise<number> {
    // Implementation for yearly generation calculation
    return 0;
  }

  private async calculateSystemEfficiency(system: any): Promise<number> {
    // Implementation for efficiency calculation
    return 0;
  }

  private async calculateMaintenanceCosts(records: any[]): Promise<any> {
    const total = records.reduce((sum, r) => sum + r.maintenanceCost, 0);
    const averagePerKw = total / records.length;
    const trend = this.calculateCostTrend(records);

    return {
      total,
      averagePerKw,
      trend
    };
  }

  private async calculateOperationalHours(records: any[]): Promise<number> {
    return records.reduce((sum, r) => sum + r.operationalHours, 0);
  }

  private async calculateDowntime(records: any[]): Promise<any> {
    const totalHours = records.reduce((sum, r) => sum + r.downtimeHours, 0);
    const percentage = (totalHours / (8760 * records.length)) * 100;
    const frequency = records.filter(r => r.downtimeHours > 0).length;

    return {
      totalHours,
      percentage,
      frequency
    };
  }

  private async calculateEnergyLoss(system: any, records: any[]): Promise<any> {
    const totalKwh = records.reduce((sum, r) => sum + r.energyLoss, 0);
    const percentage = (totalKwh / (system.capacityKw * 8760)) * 100;
    const causes = Array.from(
      new Set(records.map(r => r.maintenanceDescription))
    );

    return {
      totalKwh,
      percentage,
      causes
    };
  }

  private async calculateSystemAvailability(records: any[]): Promise<number> {
    const totalHours = records.reduce((sum, r) => sum + r.operationalHours, 0);
    const downtime = records.reduce((sum, r) => sum + r.downtimeHours, 0);
    return (totalHours / (totalHours + downtime)) * 100;
  }

  private async calculatePerformanceRatio(system: any): Promise<number> {
    // Implementation for performance ratio calculation
    return 0;
  }

  private async calculateCapacityFactor(system: any): Promise<number> {
    // Implementation for capacity factor calculation
    return 0;
  }

  private calculateCostTrend(records: any[]): 'INCREASE' | 'DECREASE' | 'STABLE' {
    if (records.length < 2) return 'STABLE';

    const sorted = [...records].sort((a, b) => 
      new Date(a.maintenanceDate).getTime() - new Date(b.maintenanceDate).getTime()
    );

    const first = sorted[0].maintenanceCost;
    const last = sorted[sorted.length - 1].maintenanceCost;

    if (last > first * 1.2) return 'INCREASE';
    if (last < first * 0.8) return 'DECREASE';
    return 'STABLE';
  }
}

export const maintenanceAnalytics = MaintenanceAnalytics.getInstance();
