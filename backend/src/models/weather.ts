import { DataTypes, Model, ModelStatic, Optional, Sequelize } from 'sequelize';

export interface WeatherAttributes {
  id: number;
  facilityId: number;
  date: Date;
  temperature: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  precipitation: number;
  createdAt: Date;
  updatedAt: Date;
}

type WeatherCreationAttributes = Optional<WeatherAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface WeatherInstance extends Model<WeatherAttributes, WeatherCreationAttributes>, WeatherAttributes {}

export const initWeatherModel = (sequelize: Sequelize): ModelStatic<WeatherInstance> => {
  return sequelize.define<WeatherInstance>('Weather', {
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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    windSpeed: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    solarRadiation: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    precipitation: {
      type: DataTypes.FLOAT,
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
    }
  }, {
    sequelize,
    modelName: 'Weather',
    tableName: 'weather_data',
    timestamps: true,
    underscored: false
  });
};
