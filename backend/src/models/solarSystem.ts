import { Model, DataTypes, ModelStatic, Optional, Sequelize } from 'sequelize';
import { FacilityInstance } from './facility';
import { UserInstance } from './user';

export interface SolarSystemAttributes {
  id: number;
  facilityId: number;
  systemType: 'PV' | 'HYBRID' | 'STANDALONE';
  capacityKw: number;
  installationDate: Date;
  commissioningDate: Date;
  manufacturer: string;
  model: string;
  serialNumber: string;
  warrantyPeriod: number;
  maintenanceSchedule: string;
  maintenanceFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  performanceMetrics: {
    dailyGeneration: number;
    monthlyGeneration: number;
    yearlyGeneration: number;
    efficiency: number;
    maintenanceCosts: {
      total: number;
      averagePerKw: number;
      trend: 'INCREASE' | 'DECREASE' | 'STABLE';
    };
    operationalHours: number;
    downtime: {
      totalHours: number;
      percentage: number;
      frequency: number;
    };
    energyLoss: {
      totalKwh: number;
      percentage: number;
      causes: string[];
    };
    systemAvailability: number;
    performanceRatio: number;
    capacityFactor: number;
  };
  fundingSource: string | null;
  grantAmount: number | null;
  grantExpiryDate: Date | null;
  installationCost: number | null;
  maintenanceCost: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SolarSystemCreationAttributes = Optional<
  SolarSystemAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'performanceMetrics' | 
  'lastMaintenanceDate' | 'nextMaintenanceDate' | 'fundingSource' | 
  'grantAmount' | 'grantExpiryDate' | 'installationCost' | 'maintenanceCost'
>;

export interface SolarSystemInstance extends Model<SolarSystemAttributes, SolarSystemCreationAttributes>, SolarSystemAttributes {
  // Instance methods
  calculatePerformanceMetrics(systemId: number): Promise<{
    dailyGeneration: number;
    monthlyGeneration: number;
    yearlyGeneration: number;
    efficiency: number;
    maintenanceCosts: {
      total: number;
      averagePerKw: number;
      trend: 'INCREASE' | 'DECREASE' | 'STABLE';
    };
    operationalHours: number;
    downtime: {
      totalHours: number;
      percentage: number;
      frequency: number;
    };
    energyLoss: {
      totalKwh: number;
      percentage: number;
      causes: string[];
    };
    systemAvailability: number;
    performanceRatio: number;
    capacityFactor: number;
  }>;
}

export const initSolarSystemModel = (sequelize: Sequelize): ModelStatic<SolarSystemInstance> => {
  const SolarSystem = sequelize.define<SolarSystemInstance>('SolarSystem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    facilityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'facilities',
        key: 'id'
      }
    },
    systemType: {
      type: DataTypes.ENUM('PV', 'HYBRID', 'STANDALONE'),
      allowNull: false
    },
    capacityKw: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    installationDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    commissioningDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    warrantyPeriod: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    maintenanceSchedule: {
      type: DataTypes.STRING,
      allowNull: false
    },
    maintenanceFrequency: {
      type: DataTypes.ENUM('MONTHLY', 'QUARTERLY', 'YEARLY'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    },
    lastMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    performanceMetrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        dailyGeneration: 0,
        monthlyGeneration: 0,
        yearlyGeneration: 0,
        efficiency: 0,
        maintenanceCosts: {
          total: 0,
          averagePerKw: 0,
          trend: 'STABLE'
        },
        operationalHours: 0,
        downtime: {
          totalHours: 0,
          percentage: 0,
          frequency: 0
        },
        energyLoss: {
          totalKwh: 0,
          percentage: 0,
          causes: []
        },
        systemAvailability: 0,
        performanceRatio: 0,
        capacityFactor: 0
      }
    },
    fundingSource: {
      type: DataTypes.STRING,
      allowNull: true
    },
    grantAmount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    grantExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    installationCost: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    maintenanceCost: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    modelName: 'SolarSystem',
    tableName: 'solar_systems',
    timestamps: true,
    // underscored: true // Removed - aligns with camelCase database schema
  });

  // Add instance methods
  (SolarSystem as any).prototype.calculatePerformanceMetrics = async function(systemId: number) {
    // Implementation for calculating performance metrics
    return {
      dailyGeneration: 0,
      monthlyGeneration: 0,
      yearlyGeneration: 0,
      efficiency: 0,
      maintenanceCosts: {
        total: 0,
        averagePerKw: 0,
        trend: 'STABLE' as const,
      },
      operationalHours: 0,
      downtime: {
        totalHours: 0,
        percentage: 0,
        frequency: 0,
      },
      energyLoss: {
        totalKwh: 0,
        percentage: 0,
        causes: [],
      },
      systemAvailability: 0,
      performanceRatio: 0,
      capacityFactor: 0
    };
  };

  // Add class methods (associations)
  (SolarSystem as any).associate = function(models: any) {
    SolarSystem.belongsTo(models.Facility, { 
      foreignKey: 'facility_id',
      as: 'facility'
    });
    
    SolarSystem.hasMany(models.MaintenanceRecord, { 
      foreignKey: 'solar_system_id',
      as: 'maintenanceRecords'
    });
  };

  return SolarSystem;
};
