import { Model, DataTypes, ModelStatic, Optional, Sequelize } from 'sequelize';

interface FacilityAttributes {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

type FacilityCreationAttributes = Optional<FacilityAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface FacilityInstance extends Model<FacilityAttributes, FacilityCreationAttributes>, FacilityAttributes {}

export const initFacilityModel = (sequelize: Sequelize): ModelStatic<FacilityInstance> => {
  return sequelize.define<FacilityInstance>('Facility', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('healthcare', 'education', 'community'),
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('survey', 'design', 'installed', 'active'),
    defaultValue: 'survey',
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
    modelName: 'Facility',
    tableName: 'facilities',
    timestamps: true,
  });
};
