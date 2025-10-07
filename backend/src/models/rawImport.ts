import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface RawImportAttributes {
  id: string;
  source: string;
  data: any;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  error?: string | null;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

type RawImportCreationAttributes = Optional<RawImportAttributes, 'id' | 'status' | 'error' | 'metadata' | 'createdAt' | 'updatedAt'>;

export interface RawImportInstance extends Model<RawImportAttributes, RawImportCreationAttributes>, RawImportAttributes {}

export const initRawImportModel = (sequelize: Sequelize) => {
  return sequelize.define<RawImportInstance>('RawImport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'processed', 'failed'),
      defaultValue: 'pending',
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'raw_imports',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['source'] },
      { 
        fields: ['createdAt'],
        where: { status: 'pending' }
      }
    ]
  });
};
