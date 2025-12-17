/**
 * Storage Utility
 * 
 * Handles offline storage, data persistence, and sync operations.
 * Uses AsyncStorage for local data persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  CHILD_PROFILE: '@mch_child_profile',
  VACCINES: '@mch_vaccines',
  APPOINTMENTS: '@mch_appointments',
  GROWTH_DATA: '@mch_growth_data',
  SETTINGS: '@mch_settings',
  LAST_SYNC: '@mch_last_sync',
  PENDING_SYNC: '@mch_pending_sync',
  USER_PREFERENCES: '@mch_user_preferences',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Generic storage operations
 */
export const storage = {
  /**
   * Save data to storage
   */
  async set<T>(key: StorageKey, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving to storage [${key}]:`, error);
      throw error;
    }
  },

  /**
   * Get data from storage
   */
  async get<T>(key: StorageKey): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error reading from storage [${key}]:`, error);
      return null;
    }
  },

  /**
   * Remove data from storage
   */
  async remove(key: StorageKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage [${key}]:`, error);
      throw error;
    }
  },

  /**
   * Clear all app data
   */
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  /**
   * Get all keys in storage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },
};

/**
 * Sync operation types
 */
type SyncOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'child' | 'vaccine' | 'appointment' | 'growth';
  data: any;
  timestamp: number;
};

/**
 * Sync Queue Manager
 * Manages pending sync operations when offline
 */
export const syncQueue = {
  /**
   * Add operation to sync queue
   */
  async addToQueue(operation: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<void> {
    try {
      const pending = await storage.get<SyncOperation[]>(STORAGE_KEYS.PENDING_SYNC) || [];
      const newOperation: SyncOperation = {
        ...operation,
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      pending.push(newOperation);
      await storage.set(STORAGE_KEYS.PENDING_SYNC, pending);
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  },

  /**
   * Get all pending operations
   */
  async getPending(): Promise<SyncOperation[]> {
    return await storage.get<SyncOperation[]>(STORAGE_KEYS.PENDING_SYNC) || [];
  },

  /**
   * Remove operation from queue after successful sync
   */
  async removeFromQueue(operationId: string): Promise<void> {
    try {
      const pending = await storage.get<SyncOperation[]>(STORAGE_KEYS.PENDING_SYNC) || [];
      const filtered = pending.filter(op => op.id !== operationId);
      await storage.set(STORAGE_KEYS.PENDING_SYNC, filtered);
    } catch (error) {
      console.error('Error removing from sync queue:', error);
    }
  },

  /**
   * Clear all pending operations
   */
  async clearQueue(): Promise<void> {
    await storage.remove(STORAGE_KEYS.PENDING_SYNC);
  },

  /**
   * Process pending sync operations
   * Call this when coming back online
   */
  async processPending(syncFn: (operation: SyncOperation) => Promise<boolean>): Promise<{
    success: number;
    failed: number;
  }> {
    const pending = await this.getPending();
    let success = 0;
    let failed = 0;

    for (const operation of pending) {
      try {
        const result = await syncFn(operation);
        if (result) {
          await this.removeFromQueue(operation.id);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Sync failed for operation ${operation.id}:`, error);
        failed++;
      }
    }

    // Update last sync time if any operations succeeded
    if (success > 0) {
      await storage.set(STORAGE_KEYS.LAST_SYNC, Date.now());
    }

    return { success, failed };
  },
};

/**
 * Sync Status
 */
export const syncStatus = {
  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<number | null> {
    return await storage.get<number>(STORAGE_KEYS.LAST_SYNC);
  },

  /**
   * Update last sync timestamp
   */
  async updateLastSync(): Promise<void> {
    await storage.set(STORAGE_KEYS.LAST_SYNC, Date.now());
  },

  /**
   * Check if sync is needed (e.g., last sync > 24 hours ago)
   */
  async needsSync(maxAge: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    const lastSync = await this.getLastSync();
    if (!lastSync) return true;
    return Date.now() - lastSync > maxAge;
  },

  /**
   * Get pending sync count
   */
  async getPendingCount(): Promise<number> {
    const pending = await syncQueue.getPending();
    return pending.length;
  },
};

/**
 * User Preferences
 */
export interface UserPreferences {
  language: 'en' | 'si' | 'ta';
  notificationsEnabled: boolean;
  reminderTime: string; // HH:mm format
  theme: 'light' | 'dark' | 'system';
  biometricEnabled: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  notificationsEnabled: true,
  reminderTime: '09:00',
  theme: 'light',
  biometricEnabled: false,
};

export const preferences = {
  /**
   * Get user preferences
   */
  async get(): Promise<UserPreferences> {
    const stored = await storage.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
    return { ...DEFAULT_PREFERENCES, ...stored };
  },

  /**
   * Update user preferences
   */
  async update(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.get();
    const updated = { ...current, ...updates };
    await storage.set(STORAGE_KEYS.USER_PREFERENCES, updated);
    return updated;
  },

  /**
   * Reset to default preferences
   */
  async reset(): Promise<void> {
    await storage.set(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES);
  },
};

export default {
  storage,
  syncQueue,
  syncStatus,
  preferences,
  STORAGE_KEYS,
};
