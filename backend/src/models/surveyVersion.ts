import { DataTypes, Model, ModelStatic, Optional, Sequelize } from 'sequelize';

export interface SurveyVersionAttributes {
  id: number;
  surveyId: number;
  version: number;
  status: 'draft' | 'completed' | 'archived';
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type SurveyVersionCreationAttributes = Optional<SurveyVersionAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface SurveyVersionInstance extends Model<SurveyVersionAttributes, SurveyVersionCreationAttributes>, SurveyVersionAttributes {}

export const initSurveyVersionModel = (sequelize: Sequelize): ModelStatic<SurveyVersionInstance> => {
  const SurveyVersion = sequelize.define<SurveyVersionInstance>('SurveyVersion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    surveyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'surveys',
        key: 'id',
      },
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'completed', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdBy: {
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
  modelName: 'SurveyVersion',
  tableName: 'survey_versions',
  timestamps: true,
});

  return SurveyVersion;
};
