import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageUtils {
  constructor() {
    this.SYNC_QUEUE_KEY = 'sync_queue';
    this.PENDING_OPERATIONS_KEY = 'pending_operations';
    this.LAST_SYNC_TIMESTAMP_KEY = 'last_sync_timestamp';
  }

  // Generic storage methods
  async storeData(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error storing data:', error);
      return false;
    }
  }

  async getData(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  }

  async removeData(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    }
  }

  // Sync queue management
  async addToSyncQueue(operation) {
    try {
      const queue = await this.getSyncQueue();
      const newOperation = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        ...operation,
        retryCount: 0,
        lastAttempt: null,
      };

      queue.push(newOperation);
      await this.storeData(this.SYNC_QUEUE_KEY, queue);
      return newOperation.id;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      return null;
    }
  }

  async getSyncQueue() {
    const queue = await this.getData(this.SYNC_QUEUE_KEY);
    return Array.isArray(queue) ? queue : [];
  }

  async removeFromSyncQueue(operationId) {
    try {
      const queue = await this.getSyncQueue();
      const filteredQueue = queue.filter(op => op.id !== operationId);
      await this.storeData(this.SYNC_QUEUE_KEY, filteredQueue);
      return true;
    } catch (error) {
      console.error('Error removing from sync queue:', error);
      return false;
    }
  }

  async updateSyncOperation(operationId, updates) {
    try {
      const queue = await this.getSyncQueue();
      const updatedQueue = queue.map(op =>
        op.id === operationId ? { ...op, ...updates } : op,
      );
      await this.storeData(this.SYNC_QUEUE_KEY, updatedQueue);
      return true;
    } catch (error) {
      console.error('Error updating sync operation:', error);
      return false;
    }
  }

  async clearSyncQueue() {
    return await this.storeData(this.SYNC_QUEUE_KEY, []);
  }

  // Pending operations (for expenses, categories, etc.)
  async addPendingOperation(type, data) {
    try {
      const operations = await this.getPendingOperations();
      const newOperation = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        data,
        timestamp: Date.now(),
        synced: false,
      };

      operations.push(newOperation);
      await this.storeData(this.PENDING_OPERATIONS_KEY, operations);
      return newOperation.id;
    } catch (error) {
      console.error('Error adding pending operation:', error);
      return null;
    }
  }

  async getPendingOperations() {
    const operations = await this.getData(this.PENDING_OPERATIONS_KEY);
    return Array.isArray(operations) ? operations : [];
  }

  async markOperationAsSynced(operationId) {
    try {
      const operations = await this.getPendingOperations();
      const updatedOperations = operations.map(op =>
        op.id === operationId
          ? { ...op, synced: true, syncedAt: Date.now() }
          : op,
      );
      await this.storeData(this.PENDING_OPERATIONS_KEY, updatedOperations);
      return true;
    } catch (error) {
      console.error('Error marking operation as synced:', error);
      return false;
    }
  }

  async removeSyncedOperations() {
    try {
      const operations = await this.getPendingOperations();
      const pendingOperations = operations.filter(op => !op.synced);
      await this.storeData(this.PENDING_OPERATIONS_KEY, pendingOperations);
      return true;
    } catch (error) {
      console.error('Error removing synced operations:', error);
      return false;
    }
  }

  // Last sync timestamp
  async setLastSyncTimestamp() {
    return await this.storeData(this.LAST_SYNC_TIMESTAMP_KEY, Date.now());
  }

  async getLastSyncTimestamp() {
    return await this.getData(this.LAST_SYNC_TIMESTAMP_KEY);
  }

  // User-specific storage helpers
  async getUserKey(key, userEmail) {
    return userEmail
      ? `${key}_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
      : key;
  }

  async storeUserData(key, data, userEmail) {
    const userKey = await this.getUserKey(key, userEmail);
    return await this.storeData(userKey, data);
  }

  async getUserData(key, userEmail) {
    const userKey = await this.getUserKey(key, userEmail);
    return await this.getData(userKey);
  }

  // Bulk operations
  async getUnsyncedData() {
    const [queue, operations] = await Promise.all([
      this.getSyncQueue(),
      this.getPendingOperations(),
    ]);

    return {
      syncQueue: queue,
      pendingOperations: operations.filter(op => !op.synced),
    };
  }

  // Cleanup old failed operations (older than 7 days)
  async cleanupOldOperations() {
    try {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Clean sync queue
      const queue = await this.getSyncQueue();
      const freshQueue = queue.filter(op => op.timestamp > sevenDaysAgo);
      await this.storeData(this.SYNC_QUEUE_KEY, freshQueue);

      // Clean pending operations
      const operations = await this.getPendingOperations();
      const freshOperations = operations.filter(
        op => op.timestamp > sevenDaysAgo,
      );
      await this.storeData(this.PENDING_OPERATIONS_KEY, freshOperations);

      return true;
    } catch (error) {
      console.error('Error cleaning up old operations:', error);
      return false;
    }
  }
}

export default new StorageUtils();
