import { DataTypes, Model, ModelStatic, Optional, Sequelize } from 'sequelize';

export interface AssetAttributes {
  id: number;
  facilityId: number;
  pvCapacity: number;
  batteryCapacity: number;
  inverterType: string;
  installationDate: Date;
  status: 'active' | 'maintenance' | 'faulty';
  lastMaintenance: Date;
  nextMaintenance: Date;
  createdAt: Date;
  updatedAt: Date;
}

type AssetCreationAttributes = Optional<AssetAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface AssetInstance extends Model<AssetAttributes, AssetCreationAttributes>, AssetAttributes {}

export const initAssetModel = (sequelize: Sequelize): ModelStatic<AssetInstance> => {
  const Asset = sequelize.define<AssetInstance>('Asset', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    facilityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'facilities',
        key: 'id',
      },
    },
    pvCapacity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  batteryCapacity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  inverterType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  installationDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'faulty'),
    defaultValue: 'active',
  },
  lastMaintenance: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  nextMaintenance: {
    type: DataTypes.DATE,
    allowNull: true,
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
  modelName: 'Asset',
  tableName: 'assets',
  timestamps: true,
});

  return Asset;
};
