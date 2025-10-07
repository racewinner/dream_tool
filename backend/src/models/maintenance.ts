import { DataTypes, Model, ModelStatic, Optional, Sequelize } from 'sequelize';

export interface MaintenanceAttributes {
  id: number;
  systemId: number;
  date: Date;
  issue: string;
  resolution: string;
  technician: string;
  createdAt: Date;
  updatedAt: Date;
}

type MaintenanceCreationAttributes = Optional<MaintenanceAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface MaintenanceInstance extends Model<MaintenanceAttributes, MaintenanceCreationAttributes>, MaintenanceAttributes {}

export const initMaintenanceModel = (sequelize: Sequelize): ModelStatic<MaintenanceInstance> => {
  const Maintenance = sequelize.define<MaintenanceInstance>('Maintenance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    systemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'solar_systems',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    issue: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    technician: {
      type: DataTypes.STRING,
      allowNull: false,
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
  modelName: 'Maintenance',
  tableName: 'maintenance',
  timestamps: true,
});

  return Maintenance;
};
