import { Model, DataTypes, ModelStatic, Optional, Op, Sequelize } from 'sequelize';

// Define the interface for the model attributes
export interface MaintenanceRecordAttributes {
  id: number;
  userId: number;
  maintenanceId: number;
  maintenanceDate: Date;
  maintenanceType: 'ROUTINE' | 'CORRECTIVE' | 'PREVENTIVE';
  maintenanceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  maintenanceDescription?: string | null;
  maintenanceCost?: number | null;
  partsReplaced?: string[];
  laborHours?: number | null;
  nextMaintenanceDate?: Date | null;
  maintenanceReport?: string | null;
  attachments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the creation attributes (optional fields for creation)
type MaintenanceRecordCreationAttributes = Optional<
  MaintenanceRecordAttributes, 
  'id' | 'createdAt' | 'updatedAt' | 'maintenanceStatus' | 'partsReplaced' | 'attachments'
>;

// Define the instance interface
export interface MaintenanceRecordInstance 
  extends Model<MaintenanceRecordAttributes, MaintenanceRecordCreationAttributes>,
    MaintenanceRecordAttributes {
      // Instance methods can be defined here
      getUpcomingMaintenance?: (daysAhead?: number) => Promise<MaintenanceRecordInstance[]>;
      completeMaintenance?: (recordId: number, completionData: Partial<MaintenanceRecordAttributes>) => Promise<MaintenanceRecordInstance>;
    }

// Define the static methods interface
interface MaintenanceRecordModel extends ModelStatic<MaintenanceRecordInstance> {

  
  getUpcomingMaintenance: (
    daysAhead?: number
  ) => Promise<MaintenanceRecordInstance[]>;
  
  completeMaintenance: (
    recordId: number,
    completionData: Partial<MaintenanceRecordAttributes>
  ) => Promise<MaintenanceRecordInstance>;
}

// Initialize the model
export const initMaintenanceRecordModel = (sequelize: Sequelize): MaintenanceRecordModel => {
  const MaintenanceRecord = sequelize.define<MaintenanceRecordInstance>(
    'MaintenanceRecord',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      maintenanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'maintenance',
          key: 'id',
        },
      },

      maintenanceDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      maintenanceType: {
        type: DataTypes.ENUM('ROUTINE', 'CORRECTIVE', 'PREVENTIVE'),
        allowNull: false,
      },
      maintenanceStatus: {
        type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      maintenanceDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      maintenanceCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      partsReplaced: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      laborHours: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      nextMaintenanceDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      maintenanceReport: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
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
    },
    {
      modelName: 'MaintenanceRecord',
      tableName: 'maintenance_records',
      timestamps: true,
    }
  ) as MaintenanceRecordModel;

  // Add static methods




  // Get upcoming maintenance records
  MaintenanceRecord.getUpcomingMaintenance = async function(
    daysAhead: number = 7
  ): Promise<MaintenanceRecordInstance[]> {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysAhead);

    return this.findAll({
      where: {
        maintenanceDate: {
          [Op.between]: [today, targetDate]
        },
        maintenanceStatus: 'PENDING'
      },
      order: [['maintenanceDate', 'ASC']]
    });
  };

  // Complete a maintenance record
  MaintenanceRecord.completeMaintenance = async function(
    recordId: number,
    completionData: Partial<MaintenanceRecordAttributes>
  ): Promise<MaintenanceRecordInstance> {
    const record = await this.findByPk(recordId);
    if (!record) {
      throw new Error('Maintenance record not found');
    }

    return record.update({
      ...completionData,
      maintenanceStatus: 'COMPLETED',
      maintenanceDate: new Date()
    });
  };





  return MaintenanceRecord as unknown as MaintenanceRecordModel;
}
