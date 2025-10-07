/**
 * Offline Queue Service
 * Handles offline storage and synchronization of solar assessment data
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { solarAnalysisService } from './solarAnalysisService';

// Define the database schema
interface SolarOfflineDB extends DBSchema {
  pendingPhotos: {
    key: string;
    value: {
      id: string;
      assessmentId: string;
      componentType: string;
      photoBlob: Blob;
      fileName: string;
      timestamp: number;
      retryCount: number;
    };
    indexes: { 'by-assessment': string };
  };
  pendingAssessments: {
    key: string;
    value: {
      id: string;
      facilityId: number;
      submissionId: string;
      surveyorName?: string;
      timestamp: number;
      retryCount: number;
    };
  };
  syncStatus: {
    key: string;
    value: {
      lastSync: number;
      pendingItems: number;
      syncInProgress: boolean;
    };
  };
}

// Database name and version
const DB_NAME = 'solar-offline-db';
const DB_VERSION = 1;

// Service class
class OfflineQueueService {
  private db: Promise<IDBPDatabase<SolarOfflineDB>>;
  private syncInProgress = false;
  
  constructor() {
    this.db = this.initDatabase();
    this.setupEventListeners();
  }
  
  /**
   * Initialize the IndexedDB database
   */
  private async initDatabase(): Promise<IDBPDatabase<SolarOfflineDB>> {
    return openDB<SolarOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('pendingPhotos')) {
          const photoStore = db.createObjectStore('pendingPhotos', { keyPath: 'id' });
          photoStore.createIndex('by-assessment', 'assessmentId');
        }
        
        if (!db.objectStoreNames.contains('pendingAssessments')) {
          db.createObjectStore('pendingAssessments', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('syncStatus')) {
          db.createObjectStore('syncStatus', { keyPath: 'id' });
          
          // Initialize sync status
          const syncStore = db.transaction('syncStatus', 'readwrite').objectStore('syncStatus');
          syncStore.put({
            id: 'status',
            lastSync: Date.now(),
            pendingItems: 0,
            syncInProgress: false
          });
        }
      }
    });
  }
  
  /**
   * Set up event listeners for online/offline status
   */
  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('Device is online. Attempting to sync pending data...');
      this.processPendingQueue();
    });
    
    window.addEventListener('offline', () => {
      console.log('Device is offline. Data will be queued for later sync.');
    });
  }
  
  /**
   * Queue a new assessment for later creation when online
   */
  async queueAssessment(facilityId: number, submissionId: string, surveyorName?: string): Promise<string> {
    const db = await this.db;
    
    // Generate a temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Store in IndexedDB
    await db.add('pendingAssessments', {
      id: tempId,
      facilityId,
      submissionId,
      surveyorName,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // Update sync status
    await this.updateSyncStatus();
    
    // Try to process queue if online
    this.processPendingQueue();
    
    return tempId;
  }
  
  /**
   * Queue a component photo for later upload when online
   */
  async queueComponentPhoto(assessmentId: string, componentType: string, photoFile: File): Promise<string> {
    const db = await this.db;
    
    // Generate a temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Store in IndexedDB
    await db.add('pendingPhotos', {
      id: tempId,
      assessmentId,
      componentType,
      photoBlob: photoFile,
      fileName: photoFile.name,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // Update sync status
    await this.updateSyncStatus();
    
    // Try to process queue if online
    this.processPendingQueue();
    
    return tempId;
  }
  
  /**
   * Update the sync status
   */
  private async updateSyncStatus() {
    const db = await this.db;
    
    // Count pending items
    const pendingPhotos = await db.count('pendingPhotos');
    const pendingAssessments = await db.count('pendingAssessments');
    const totalPending = pendingPhotos + pendingAssessments;
    
    // Update status
    const tx = db.transaction('syncStatus', 'readwrite');
    const store = tx.objectStore('syncStatus');
    await store.put({
      id: 'status',
      lastSync: Date.now(),
      pendingItems: totalPending,
      syncInProgress: this.syncInProgress
    });
    
    await tx.done;
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('offline-sync-updated', {
      detail: { pendingItems: totalPending, syncInProgress: this.syncInProgress }
    }));
  }
  
  /**
   * Process all pending items in the queue
   */
  async processPendingQueue() {
    // Skip if offline or sync already in progress
    if (!navigator.onLine || this.syncInProgress) {
      return;
    }
    
    this.syncInProgress = true;
    await this.updateSyncStatus();
    
    try {
      // Process assessments first
      await this.processPendingAssessments();
      
      // Then process photos
      await this.processPendingPhotos();
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      this.syncInProgress = false;
      await this.updateSyncStatus();
    }
  }
  
  /**
   * Process pending assessments
   */
  private async processPendingAssessments() {
    const db = await this.db;
    const pendingAssessments = await db.getAll('pendingAssessments');
    
    for (const item of pendingAssessments) {
      try {
        // Try to create the assessment
        const result = await solarAnalysisService.createAssessment(
          item.facilityId,
          item.submissionId,
          item.surveyorName
        );
        
        // If successful, remove from queue
        await db.delete('pendingAssessments', item.id);
        
        // Map temporary ID to real ID for any pending photos
        await this.updatePendingPhotosAssessmentId(item.id, result.assessment_id);
        
        console.log(`Successfully created assessment ${result.assessment_id} from offline queue`);
      } catch (error) {
        console.error(`Failed to process pending assessment ${item.id}:`, error);
        
        // Increment retry count
        item.retryCount++;
        
        // If too many retries, remove from queue
        if (item.retryCount > 5) {
          await db.delete('pendingAssessments', item.id);
          console.warn(`Removed assessment ${item.id} from queue after too many retries`);
        } else {
          // Otherwise update retry count
          await db.put('pendingAssessments', item);
        }
      }
    }
  }
  
  /**
   * Process pending photos
   */
  private async processPendingPhotos() {
    const db = await this.db;
    const pendingPhotos = await db.getAll('pendingPhotos');
    
    for (const item of pendingPhotos) {
      // Skip photos with temporary assessment IDs
      if (item.assessmentId.startsWith('temp_')) {
        continue;
      }
      
      try {
        // Try to upload the photo
        const result = await solarAnalysisService.uploadComponentPhoto(
          item.assessmentId,
          item.componentType,
          new File([item.photoBlob], item.fileName, { type: item.photoBlob.type })
        );
        
        // If successful, remove from queue
        await db.delete('pendingPhotos', item.id);
        
        console.log(`Successfully uploaded photo ${result.component_id} from offline queue`);
      } catch (error) {
        console.error(`Failed to process pending photo ${item.id}:`, error);
        
        // Increment retry count
        item.retryCount++;
        
        // If too many retries, remove from queue
        if (item.retryCount > 5) {
          await db.delete('pendingPhotos', item.id);
          console.warn(`Removed photo ${item.id} from queue after too many retries`);
        } else {
          // Otherwise update retry count
          await db.put('pendingPhotos', item);
        }
      }
    }
  }
  
  /**
   * Update assessment IDs for pending photos when an assessment is created
   */
  private async updatePendingPhotosAssessmentId(tempId: string, realId: string) {
    const db = await this.db;
    const tx = db.transaction('pendingPhotos', 'readwrite');
    const index = tx.store.index('by-assessment');
    
    // Get all photos with this temporary assessment ID
    const pendingPhotos = await index.getAll(tempId);
    
    // Update each one with the real ID
    for (const photo of pendingPhotos) {
      photo.assessmentId = realId;
      await tx.store.put(photo);
    }
    
    await tx.done;
  }
  
  /**
   * Get the current sync status
   */
  async getSyncStatus(): Promise<{ pendingItems: number; syncInProgress: boolean; lastSync: number }> {
    const db = await this.db;
    const status = await db.get('syncStatus', 'status');
    
    return status || { pendingItems: 0, syncInProgress: false, lastSync: Date.now() };
  }
  
  /**
   * Get pending photos for a specific assessment
   */
  async getPendingPhotos(assessmentId: string): Promise<Array<{ id: string; componentType: string; photoBlob: Blob; fileName: string }>> {
    const db = await this.db;
    const index = db.transaction('pendingPhotos').store.index('by-assessment');
    const photos = await index.getAll(assessmentId);
    
    return photos.map(photo => ({
      id: photo.id,
      componentType: photo.componentType,
      photoBlob: photo.photoBlob,
      fileName: photo.fileName
    }));
  }
  
  /**
   * Force a sync attempt
   */
  async forceSync(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }
    
    await this.processPendingQueue();
    return true;
  }
  
  /**
   * Clear all pending items (for testing or reset)
   */
  async clearPendingItems(): Promise<void> {
    const db = await this.db;
    
    const tx = db.transaction(['pendingPhotos', 'pendingAssessments'], 'readwrite');
    await tx.objectStore('pendingPhotos').clear();
    await tx.objectStore('pendingAssessments').clear();
    await tx.done;
    
    await this.updateSyncStatus();
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();

// Export hook for React components
export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = React.useState<{
    pendingItems: number;
    syncInProgress: boolean;
    lastSync: number;
  }>({ pendingItems: 0, syncInProgress: false, lastSync: Date.now() });

  React.useEffect(() => {
    // Initial status
    offlineQueueService.getSyncStatus().then(setSyncStatus);
    
    // Listen for updates
    const handleSyncUpdate = (event: CustomEvent) => {
      setSyncStatus(event.detail);
    };
    
    window.addEventListener('offline-sync-updated', handleSyncUpdate as EventListener);
    
    return () => {
      window.removeEventListener('offline-sync-updated', handleSyncUpdate as EventListener);
    };
  }, []);

  return {
    syncStatus,
    forceSync: offlineQueueService.forceSync.bind(offlineQueueService),
    isOnline: navigator.onLine
  };
}

export default offlineQueueService;
