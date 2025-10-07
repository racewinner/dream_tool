import { DataValidationRules, FieldValidation, ValidationState, DataStore, OfflineData, BackupConfig, BackupMetadata } from '../types/dataManagement';
import { useAuth } from '../contexts/AuthContext';

export class DataManagementService {
  private auth: ReturnType<typeof useAuth>;
  private localStorageKey = 'solar_pv_data';
  private offlineQueueKey = 'solar_pv_offline_queue';
  private backupConfig: BackupConfig;
  private backupMetadata: BackupMetadata[] = [];

  constructor(auth: ReturnType<typeof useAuth>) {
    this.auth = auth;
    this.backupConfig = {
      frequency: 'DAILY',
      retentionPeriod: 30,
      storageLocation: '/backups',
      encryptionEnabled: true,
      encryptionKey: import.meta.env.VITE_ENCRYPTION_KEY || 'default-key'
    };
  }

  private validateData(data: any, validationRules: FieldValidation): ValidationState {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = data[field];
      
      if (rules.required && (!value || value === '')) {
        errors[field] = rules.errorMessage || `${field} is required`;
        isValid = false;
        return;
      }

      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = rules.errorMessage || `${field} must be at least ${rules.minLength} characters`;
        isValid = false;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = rules.errorMessage || `${field} must be at most ${rules.maxLength} characters`;
        isValid = false;
      }

      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors[field] = rules.errorMessage || `${field} does not match required pattern`;
        isValid = false;
      }

      if (rules.customValidator && !rules.customValidator(value)) {
        errors[field] = rules.errorMessage || `${field} is invalid`;
        isValid = false;
      }
    });

    return { isValid, errors };
  }

  async saveData(data: any, key: string, validationRules?: FieldValidation): Promise<void> {
    if (validationRules) {
      const validation = this.validateData(data, validationRules);
      if (!validation.isValid) {
        throw new Error(JSON.stringify(validation.errors));
      }
    }

    try {
      const storedData = await this.getData(key);
      const newData = { ...storedData, ...data };
      localStorage.setItem(this.localStorageKey, JSON.stringify({
        [key]: newData,
        userId: this.auth.user?.id,
        timestamp: Date.now()
      }));
      await this.syncToServer(key, newData);
    } catch (error) {
      await this.addToOfflineQueue(key, data);
      throw error;
    }
  }

  async getData(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) return null;
      return JSON.parse(data)[key];
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  async removeData(key: string): Promise<void> {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) return;
      const parsedData = JSON.parse(data);
      delete parsedData[key];
      localStorage.setItem(this.localStorageKey, JSON.stringify(parsedData));
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  }

  async clearStore(): Promise<void> {
    try {
      localStorage.removeItem(this.localStorageKey);
      localStorage.removeItem(this.offlineQueueKey);
    } catch (error) {
      console.error('Error clearing store:', error);
      throw error;
    }
  }

  private async syncToServer(key: string, data: any): Promise<void> {
    try {
      // TODO: Implement actual server sync logic
      // This is a placeholder for server sync
      console.log('Syncing data to server:', { key, data });
    } catch (error) {
      await this.addToOfflineQueue(key, data);
      throw error;
    }
  }

  private async addToOfflineQueue(key: string, data: any): Promise<void> {
    try {
      const queue = JSON.parse(localStorage.getItem(this.offlineQueueKey) || '[]');
      const offlineData: OfflineData = {
        id: `${key}-${Date.now()}`,
        data,
        timestamp: Date.now(),
        syncStatus: 'PENDING',
        retryCount: 0
      };
      queue.push(offlineData);
      localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
      throw error;
    }
  }

  async processOfflineQueue(): Promise<void> {
    try {
      const queue = JSON.parse(localStorage.getItem(this.offlineQueueKey) || '[]');
      for (const item of queue) {
        if (item.retryCount >= 3) {
          item.syncStatus = 'FAILED';
          continue;
        }

        try {
          await this.syncToServer(item.id, item.data);
          item.syncStatus = 'SYNCED';
        } catch (error) {
          item.retryCount++;
          if (item.retryCount >= 3) {
            item.syncStatus = 'FAILED';
          }
        }
      }

      localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Error processing offline queue:', error);
      throw error;
    }
  }

  async createBackup(): Promise<BackupMetadata> {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) throw new Error('No data to backup');

      const backupId = `backup-${Date.now()}`;
      const backupData = {
        id: backupId,
        data: JSON.parse(data),
        timestamp: Date.now(),
        userId: this.auth.user?.id
      };

      // TODO: Implement actual backup storage logic
      // This is a placeholder for backup storage
      console.log('Creating backup:', backupData);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: Date.now(),
        size: JSON.stringify(backupData).length,
        status: 'SUCCESS'
      };

      this.backupMetadata.push(metadata);
      return metadata;
    } catch (error) {
      const metadata: BackupMetadata = {
        id: `backup-${Date.now()}`,
        timestamp: Date.now(),
        size: 0,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      this.backupMetadata.push(metadata);
      throw error;
    }
  }

  getBackupHistory(): BackupMetadata[] {
    return this.backupMetadata;
  }

  async restoreBackup(backupId: string): Promise<void> {
    // TODO: Implement actual backup restoration logic
    throw new Error('Backup restoration not implemented');
  }

  async deleteBackup(backupId: string): Promise<void> {
    // TODO: Implement actual backup deletion logic
    throw new Error('Backup deletion not implemented');
  }
}
