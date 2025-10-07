import { SolarSystem, MaintenanceRecord } from '../models';
import { maintenanceAnalytics } from './maintenanceAnalytics';
import { config } from '../config';

export class MaintenanceScheduler {
  private static instance: MaintenanceScheduler;
  private readonly MAINTENANCE_WINDOW = 7; // days
  private readonly MAX_MAINTENANCE_TASKS = 5;
  private readonly MIN_MAINTENANCE_INTERVAL = 30; // days

  private constructor() {}

  public static getInstance(): MaintenanceScheduler {
    if (!MaintenanceScheduler.instance) {
      MaintenanceScheduler.instance = new MaintenanceScheduler();
    }
    return MaintenanceScheduler.instance;
  }

  public async scheduleMaintenance(systemId: number): Promise<void> {
    try {
      const system = await SolarSystem.findByPk(systemId);
      if (!system) {
        throw new Error('System not found');
      }

      const records = await MaintenanceRecord.findAll({
        where: { solarSystemId: systemId },
        order: [['maintenanceDate', 'DESC']]
      });

      // Determine maintenance type based on system status
      const status = await maintenanceAnalytics.calculateSystemStatus(systemId);
      const maintenanceType = this.determineMaintenanceType(status);

      // Calculate next maintenance date
      const nextDate = this.calculateNextMaintenanceDate(
        system,
        records,
        maintenanceType
      );

      // Create maintenance record
      await MaintenanceRecord.create({
        solarSystemId: systemId,
        maintenanceType,
        maintenanceDate: nextDate,
        maintenanceStatus: 'PENDING',
        maintenanceDescription: this.generateMaintenanceDescription(
          status,
          maintenanceType
        )
      });

      // Update system status
      await system.update({
        nextMaintenanceDate: nextDate,
        status: maintenanceType === 'EMERGENCY' ? 'MAINTENANCE' : 'ACTIVE'
      });

    } catch (error) {
      console.error('MaintenanceScheduler error:', error);
    }
  }

  public async optimizeMaintenanceSchedule(): Promise<void> {
    try {
      const systems = await SolarSystem.findAll({
        where: {
          status: 'ACTIVE'
        }
      });

      for (const system of systems) {
        const records = await MaintenanceRecord.findAll({
          where: { solarSystemId: system.id },
          order: [['maintenanceDate', 'DESC']]
        });

        const status = await maintenanceAnalytics.calculateSystemStatus(system.id);
        const maintenanceType = this.determineMaintenanceType(status);

        if (this.shouldScheduleMaintenance(status, records)) {
          await this.scheduleMaintenance(system.id);
        }
      }

    } catch (error) {
      console.error('MaintenanceScheduler error:', error);
    }
  }

  private determineMaintenanceType(status: any): string {
    if (status.riskLevel === 'CRITICAL') return 'EMERGENCY';
    if (status.healthScore < 70) return 'CORRECTIVE';
    if (status.upcomingMaintenance.count >= this.MAX_MAINTENANCE_TASKS) return 'SEASONAL';
    return 'ROUTINE';
  }

  private calculateNextMaintenanceDate(
    system: any,
    records: any[],
    maintenanceType: string
  ): Date {
    const lastMaintenance = records[0]?.maintenanceDate || new Date();
    const frequency = this.getMaintenanceFrequency(maintenanceType);

    let nextDate = new Date(lastMaintenance);
    nextDate.setDate(nextDate.getDate() + frequency);

    // Ensure maintenance window
    if (new Date(nextDate) < new Date(Date.now() + this.MAINTENANCE_WINDOW * 24 * 60 * 60 * 1000)) {
      nextDate.setDate(nextDate.getDate() + this.MAINTENANCE_WINDOW);
    }

    return nextDate;
  }

  private getMaintenanceFrequency(maintenanceType: string): number {
    switch (maintenanceType) {
      case 'ROUTINE':
        return 30; // monthly
      case 'PREVENTIVE':
        return 90; // quarterly
      case 'SEASONAL':
        return 180; // semi-annual
      case 'ANNUAL':
        return 365; // yearly
      default:
        return 30; // default to monthly
    }
  }

  private shouldScheduleMaintenance(status: any, records: any[]): boolean {
    // Check if maintenance is overdue
    if (status.maintenanceSchedule.overdue) return true;

    // Check if system has high risk level
    if (status.riskLevel === 'CRITICAL') return true;

    // Check if system has low health score
    if (status.healthScore < 70) return true;

    // Check if maintenance frequency is met
    if (records.length === 0) return true;

    const lastMaintenance = new Date(records[0].maintenanceDate);
    const now = new Date();
    const daysSinceLast = (now.getTime() - lastMaintenance.getTime()) / 
      (1000 * 60 * 60 * 24);

    return daysSinceLast >= this.MIN_MAINTENANCE_INTERVAL;
  }

  private generateMaintenanceDescription(status: any, maintenanceType: string): string {
    const baseDescription = `Scheduled ${maintenanceType.toLowerCase()} maintenance`;

    if (status.riskLevel === 'CRITICAL') {
      return `${baseDescription} - Critical system issues identified`;
    }

    if (status.healthScore < 70) {
      return `${baseDescription} - System health score below threshold`;
    }

    if (status.upcomingMaintenance.count >= this.MAX_MAINTENANCE_TASKS) {
      return `${baseDescription} - Multiple maintenance tasks pending`;
    }

    return baseDescription;
  }

  public async getMaintenanceSchedule(): Promise<any[]> {
    try {
      const systems = await SolarSystem.findAll();
      const schedule = [];

      for (const system of systems) {
        const records = await MaintenanceRecord.findAll({
          where: { solarSystemId: system.id },
          order: [['maintenanceDate', 'DESC']]
        });

        const status = await maintenanceAnalytics.calculateSystemStatus(system.id);
        const nextDate = this.calculateNextMaintenanceDate(
          system,
          records,
          this.determineMaintenanceType(status)
        );

        schedule.push({
          systemId: system.id,
          facility: system.facility.name,
          maintenanceType: this.determineMaintenanceType(status),
          nextDate,
          priority: this.calculatePriority(status)
        });
      }

      return schedule.sort((a, b) => b.priority - a.priority);

    } catch (error) {
      console.error('MaintenanceScheduler error:', error);
      return [];
    }
  }

  private calculatePriority(status: any): number {
    let priority = 1;

    if (status.riskLevel === 'CRITICAL') priority += 3;
    if (status.healthScore < 70) priority += 2;
    if (status.maintenanceSchedule.overdue) priority += 1;
    if (status.upcomingMaintenance.count >= this.MAX_MAINTENANCE_TASKS) priority += 2;

    return priority;
  }
}

export const maintenanceScheduler = MaintenanceScheduler.getInstance();
