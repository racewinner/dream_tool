import { Model, DataTypes, ModelStatic, Optional, Sequelize } from 'sequelize';
import { FacilityInstance } from './facility';

export interface WhatsAppAttributes {
  id: number;
  facilityId: number;
  phoneNumber: string;
  message: string;
  direction: 'in' | 'out';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export type WhatsAppCreationAttributes = Optional<
  WhatsAppAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface WhatsAppInstance extends Model<WhatsAppAttributes, WhatsAppCreationAttributes>, WhatsAppAttributes {
  // Instance methods can be added here if needed
}

export const initWhatsAppModel = (sequelize: Sequelize): ModelStatic<WhatsAppInstance> => {
  return sequelize.define('WhatsApp', {
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
      onDelete: 'CASCADE',
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    direction: {
      type: DataTypes.ENUM('in', 'out'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
      allowNull: false,
      defaultValue: 'sent',
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
    modelName: 'WhatsApp',
    tableName: 'whatsapp_messages',
    timestamps: true,
  });
};

export default initWhatsAppModel;
