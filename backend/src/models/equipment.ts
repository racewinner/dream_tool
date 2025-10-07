import { DataTypes, Model, ModelStatic, Optional, Sequelize } from 'sequelize';

export interface EquipmentAttributes {
  id: number;
  surveyId: number;
  name: string;
  powerRating: number;
  quantity: number;
  hoursPerDay: number;
  hoursPerNight: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weeklyUsage: number;
  category: string;
  critical: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type EquipmentCreationAttributes = Optional<EquipmentAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface EquipmentInstance extends Model<EquipmentAttributes, EquipmentCreationAttributes>, EquipmentAttributes {}

export const initEquipmentModel = (sequelize: Sequelize): ModelStatic<EquipmentInstance> => {
  const Equipment = sequelize.define<EquipmentInstance>('Equipment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    surveyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    powerRating: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    hoursPerDay: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    hoursPerNight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    timeOfDay: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night'),
      allowNull: false,
      defaultValue: 'morning',
    },
    weeklyUsage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    critical: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  modelName: 'Equipment',
  tableName: 'equipment',
  timestamps: true,
});

  return Equipment;
};
