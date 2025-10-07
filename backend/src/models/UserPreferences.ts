import { DataTypes, Model, ModelStatic, Optional, Sequelize } from 'sequelize';

export interface UserPreferencesAttributes {
  id: number;
  userId: number;
  language: string;
  timezone: string;
  dateFormat: string;
  unitSystem: string;
  theme: 'light' | 'dark' | 'system';
  notificationSettings: {
    email: {
      systemAlerts: boolean;
      maintenanceUpdates: boolean;
      weeklyReports: boolean;
      dataImportResults: boolean;
    };
    inApp: {
      systemAlerts: boolean;
      maintenanceUpdates: boolean;
      userMentions: boolean;
      dataUpdates: boolean;
    };
  };
  dashboardSettings: {
    defaultWidgets: string[];
    refreshInterval: number;
    compactMode: boolean;
  };
  reportSettings: {
    defaultFormat: string;
    autoSchedule: boolean;
    includeCharts: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type UserPreferencesCreationAttributes = Optional<
  UserPreferencesAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface UserPreferencesInstance 
  extends Model<UserPreferencesAttributes, UserPreferencesCreationAttributes>, 
          UserPreferencesAttributes {}

export const initUserPreferencesModel = (sequelize: Sequelize): ModelStatic<UserPreferencesInstance> => {
  const UserPreferences = sequelize.define<UserPreferencesInstance>('UserPreferences', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'en',
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'Africa/Nairobi',
      allowNull: false,
    },
    dateFormat: {
      type: DataTypes.STRING,
      defaultValue: 'YYYY-MM-DD',
      allowNull: false,
    },
    unitSystem: {
      type: DataTypes.STRING,
      defaultValue: 'metric',
      allowNull: false,
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark', 'system'),
      defaultValue: 'system',
      allowNull: false,
    },
    notificationSettings: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: {
          systemAlerts: true,
          maintenanceUpdates: true,
          weeklyReports: false,
          dataImportResults: true,
        },
        inApp: {
          systemAlerts: true,
          maintenanceUpdates: true,
          userMentions: true,
          dataUpdates: true,
        },
      },
      allowNull: false,
    },
    dashboardSettings: {
      type: DataTypes.JSONB,
      defaultValue: {
        defaultWidgets: ['overview', 'recent_activities', 'system_health'],
        refreshInterval: 30000,
        compactMode: false,
      },
      allowNull: false,
    },
    reportSettings: {
      type: DataTypes.JSONB,
      defaultValue: {
        defaultFormat: 'pdf',
        autoSchedule: false,
        includeCharts: true,
      },
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'user_preferences',
    timestamps: true,
  });

  return UserPreferences;
};
