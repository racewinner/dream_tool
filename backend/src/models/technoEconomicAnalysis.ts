import { Model, DataTypes, ModelStatic, Optional } from 'sequelize';
import { FacilityInstance } from './facility';

export interface TechnoEconomicAnalysisAttributes {
  id: number;
  facilityId: number;
  dailyUsage: number;
  peakHours: number;
  batteryAutonomyFactor: number;
  batteryDepthOfDischarge: number;
  batteryType: 'lithium' | 'lead_acid';
  inverterEfficiency: number;
  costingMethod: 'perWatt' | 'fixedVariable' | 'componentBased';
  panelCostPerWatt: number;
  panelCostPerKw: number;
  batteryCostPerKwh: number;
  inverterCostPerKw: number;
  structureCostPerKw: number;
  fixedCosts: number;
  numPanels: number;
  panelRating: number;
  pvInitialCost: number;
  pvAnnualMaintenance: number;
  pvLifecycleCost: number;
  pvNpv: number;
  pvIrr: number;
  dieselInitialCost: number;
  dieselAnnualMaintenance: number;
  dieselLifecycleCost: number;
  dieselNpv: number;
  dieselIrr: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TechnoEconomicAnalysisCreationAttributes = Optional<
  TechnoEconomicAnalysisAttributes,
  'id' | 'createdAt' | 'updatedAt' | 
  'panelCostPerWatt' | 'panelCostPerKw' | 'batteryCostPerKwh' | 'inverterCostPerKw' |
  'structureCostPerKw' | 'fixedCosts' | 'numPanels' | 'panelRating' |
  'pvInitialCost' | 'pvAnnualMaintenance' | 'pvLifecycleCost' | 'pvNpv' | 'pvIrr' |
  'dieselInitialCost' | 'dieselAnnualMaintenance' | 'dieselLifecycleCost' | 'dieselNpv' | 'dieselIrr'
>;

export interface TechnoEconomicAnalysisInstance extends Model<TechnoEconomicAnalysisAttributes, TechnoEconomicAnalysisCreationAttributes>, TechnoEconomicAnalysisAttributes {
  // Instance methods can be added here if needed
}

export const initTechnoEconomicAnalysisModel = (sequelize: any): ModelStatic<TechnoEconomicAnalysisInstance> => {
  const TechnoEconomicAnalysis = sequelize.define('TechnoEconomicAnalysis', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    facilityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'facilities', // This should match the table name of the Facility model
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    dailyUsage: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    peakHours: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    batteryAutonomyFactor: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0
    },
    batteryDepthOfDischarge: {
      type: DataTypes.FLOAT,
      defaultValue: 0.8
    },
    batteryType: {
      type: DataTypes.ENUM('lithium', 'lead_acid'),
      defaultValue: 'lithium'
    },
    inverterEfficiency: {
      type: DataTypes.FLOAT,
      defaultValue: 0.94
    },
    costingMethod: {
      type: DataTypes.ENUM('perWatt', 'fixedVariable', 'componentBased'),
      allowNull: false
    },
    panelCostPerWatt: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    panelCostPerKw: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    batteryCostPerKwh: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    inverterCostPerKw: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    structureCostPerKw: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    fixedCosts: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    numPanels: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    panelRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    pvInitialCost: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    pvAnnualMaintenance: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    pvLifecycleCost: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    pvNpv: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    pvIrr: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    dieselInitialCost: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    dieselAnnualMaintenance: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    dieselLifecycleCost: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    dieselNpv: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    dieselIrr: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'techno_economic_analyses',
    timestamps: true
  });

  // Define associations
  TechnoEconomicAnalysis.associate = (models: any) => {
    TechnoEconomicAnalysis.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility'
    });
  };

  return TechnoEconomicAnalysis;
};

export default initTechnoEconomicAnalysisModel;
