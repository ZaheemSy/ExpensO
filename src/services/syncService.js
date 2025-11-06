import NetworkService from './networkService';
import StorageUtils from '../utils/storageUtils';
import GoogleSheetsSyncService from './googleSheetsSyncService';
import ExpenseSyncService from './expenseSyncService';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.syncCallbacks = new Set();
    this.initialize();
  }

  initialize() {
    // Listen for network connectivity changes
    NetworkService.addListener(isConnected => {
      if (isConnected) {
        console.log('Network connected, scheduling sync...');
        this.scheduleSync();
      } else {
        console.log('Network disconnected');
      }
    });

    // Periodic sync check (every 2 minutes when online)
    this.syncInterval = setInterval(() => {
      if (NetworkService.isOnline() && !this.isSyncing) {
        console.log('Periodic sync check...');
        this.scheduleSync();
      }
    }, 2 * 60 * 1000);

    // Cleanup old operations on startup
    StorageUtils.cleanupOldOperations();
  }

  // Add callback for sync events
  addSyncListener(callback) {
    this.syncCallbacks.add(callback);
    return () => this.syncCallbacks.delete(callback);
  }

  // Notify all sync listeners
  notifySyncListeners(event, data = {}) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  async scheduleSync(delay = 2000) {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    console.log(`Scheduling sync in ${delay}ms...`);
    setTimeout(async () => {
      await this.syncAll();
    }, delay);
  }

  async syncAll() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    this.notifySyncListeners('sync_started');

    try {
      if (!NetworkService.isOnline()) {
        console.log('No network connection, skipping sync');
        this.notifySyncListeners('sync_skipped', { reason: 'no_network' });
        return;
      }

      console.log('Starting sync process...');
      this.notifySyncListeners('sync_progress', {
        message: 'Starting sync...',
      });

      // Get all unsynced data
      const unsyncedData = await StorageUtils.getUnsyncedData();

      if (
        unsyncedData.syncQueue.length === 0 &&
        unsyncedData.pendingOperations.length === 0
      ) {
        console.log('No data to sync');
        this.notifySyncListeners('sync_completed', {
          syncedItems: 0,
          message: 'No data to sync',
        });
        return;
      }

      console.log(
        `Syncing ${unsyncedData.syncQueue.length} queue items and ${unsyncedData.pendingOperations.length} pending operations`,
      );

      let totalSynced = 0;

      // Process sync queue first (higher priority)
      const queueResults = await this.processSyncQueue(unsyncedData.syncQueue);
      totalSynced += queueResults.successCount;

      // Process pending operations
      const pendingResults = await this.processPendingOperations(
        unsyncedData.pendingOperations,
      );
      totalSynced += pendingResults.successCount;

      // Update last sync timestamp
      await StorageUtils.setLastSyncTimestamp();

      console.log(`Sync completed successfully. ${totalSynced} items synced.`);
      this.notifySyncListeners('sync_completed', {
        syncedItems: totalSynced,
        queueItems: unsyncedData.syncQueue.length,
        pendingItems: unsyncedData.pendingOperations.length,
        message: `Successfully synced ${totalSynced} items`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      this.notifySyncListeners('sync_failed', {
        error: error.message,
        message: 'Sync failed',
      });
    } finally {
      this.isSyncing = false;
    }
  }

  async processSyncQueue(queue) {
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < queue.length; i++) {
      const operation = queue[i];

      try {
        console.log(
          `Processing sync operation [${i + 1}/${queue.length}]: ${
            operation.type
          }`,
          operation.id,
        );

        this.notifySyncListeners('sync_progress', {
          message: `Syncing ${operation.type}...`,
          current: i + 1,
          total: queue.length,
        });

        // Execute the operation based on type
        const success = await this.executeSyncOperation(operation);

        if (success) {
          // Remove from queue on success
          await StorageUtils.removeFromSyncQueue(operation.id);
          successCount++;
          console.log(`Successfully synced operation: ${operation.id}`);
        } else {
          // Handle retry logic
          await this.handleFailedOperation(operation);
          failureCount++;
        }

        // Small delay between operations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing operation ${operation.id}:`, error);
        await this.handleFailedOperation(operation, error);
        failureCount++;
      }
    }

    return { successCount, failureCount };
  }

  async processPendingOperations(operations) {
    const expenseOperations = operations.filter(op =>
      op.type.startsWith('expense_'),
    );

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < expenseOperations.length; i++) {
      const operation = expenseOperations[i];

      try {
        console.log(
          `Processing pending operation [${i + 1}/${
            expenseOperations.length
          }]: ${operation.type}`,
          operation.id,
        );

        this.notifySyncListeners('sync_progress', {
          message: `Processing ${operation.type.replace('expense_', '')}...`,
          current: i + 1,
          total: expenseOperations.length,
        });

        const success = await this.executePendingOperation(operation);

        if (success) {
          await StorageUtils.markOperationAsSynced(operation.id);
          successCount++;
          console.log(
            `Successfully processed pending operation: ${operation.id}`,
          );
        } else {
          failureCount++;
        }

        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(
          `Error processing pending operation ${operation.id}:`,
          error,
        );
        failureCount++;
      }
    }

    return { successCount, failureCount };
  }

  async executeSyncOperation(operation) {
    try {
      switch (operation.type) {
        case 'CREATE_SHEET':
          return await this.syncCreateSheet(operation.data);
        case 'ADD_EXPENSE':
          return await this.syncAddExpense(operation.data);
        case 'UPDATE_EXPENSE':
          return await this.syncUpdateExpense(operation.data);
        case 'DELETE_EXPENSE':
          return await this.syncDeleteExpense(operation.data);
        case 'CREATE_CATEGORY':
          return await this.syncCreateCategory(operation.data);
        default:
          console.warn(`Unknown operation type: ${operation.type}`);
          return true; // Remove unknown operations
      }
    } catch (error) {
      console.error(`Error executing sync operation ${operation.type}:`, error);
      return false;
    }
  }

  async executePendingOperation(operation) {
    try {
      switch (operation.type) {
        case 'expense_create':
          return await this.syncAddExpense(operation.data);
        case 'expense_update':
          return await this.syncUpdateExpense(operation.data);
        case 'expense_delete':
          return await this.syncDeleteExpense(operation.data);
        default:
          console.warn(`Unknown pending operation type: ${operation.type}`);
          return true;
      }
    } catch (error) {
      console.error(
        `Error executing pending operation ${operation.type}:`,
        error,
      );
      return false;
    }
  }

  async handleFailedOperation(operation, error = null) {
    const retryCount = (operation.retryCount || 0) + 1;

    if (retryCount >= this.maxRetries) {
      console.error(
        `Operation ${operation.id} failed after ${retryCount} attempts. Removing from queue.`,
      );
      await StorageUtils.removeFromSyncQueue(operation.id);

      this.notifySyncListeners('operation_failed', {
        operationId: operation.id,
        operationType: operation.type,
        retryCount,
        error: error?.message,
        message: `Operation failed after ${retryCount} attempts`,
      });

      return;
    }

    // Update retry count and schedule retry
    await StorageUtils.updateSyncOperation(operation.id, {
      retryCount,
      lastAttempt: Date.now(),
      lastError: error?.message,
    });

    // Schedule retry with exponential backoff
    const retryDelay = this.retryDelay * Math.pow(2, retryCount - 1);
    console.log(
      `Scheduling retry for operation ${operation.id} in ${retryDelay}ms (attempt ${retryCount})`,
    );

    this.notifySyncListeners('operation_retry', {
      operationId: operation.id,
      operationType: operation.type,
      retryCount,
      retryDelay,
      message: `Retrying operation in ${retryDelay}ms`,
    });

    setTimeout(() => {
      this.scheduleSync();
    }, retryDelay);
  }

  // ============ ACTUAL GOOGLE SHEETS SYNC IMPLEMENTATIONS ============

  async syncCreateSheet(sheetData) {
    try {
      console.log('✅ Syncing sheet creation to Google Sheets:', sheetData);

      // Create spreadsheet in Google Sheets
      const result = await GoogleSheetsSyncService.createSpreadsheet(
        sheetData.sheetName,
        sheetData.userEmail,
      );

      if (result.success && result.spreadsheetId) {
        // Update local sheet with Google Sheet ID
        await this.updateLocalSheetWithGoogleId(
          sheetData.sheetId,
          result.spreadsheetId,
        );

        console.log(
          '✅ Sheet successfully synced to Google Sheets:',
          result.spreadsheetId,
        );
        return true;
      }

      console.error('❌ Failed to create Google Sheet:', result.error);
      return false;
    } catch (error) {
      console.error('❌ Error syncing sheet creation:', error);
      return false;
    }
  }

  async syncAddExpense(expenseData) {
    try {
      console.log('✅ Syncing expense addition to Google Sheets:', expenseData);

      // Get the Google Sheet ID from the sheet
      const sheet = expenseData.sheet;

      if (!sheet || !sheet.googleSheetId) {
        console.error('❌ No Google Sheet ID found for expense');
        return false;
      }

      const result = await GoogleSheetsSyncService.addExpenseToSheet(
        sheet.googleSheetId,
        expenseData,
        sheet.name,
      );

      if (result.success) {
        // Mark expense as synced locally
        await this.markExpenseAsSynced(expenseData.sheetId, expenseData.id);
        console.log('✅ Expense successfully synced to Google Sheets');
        return true;
      }

      console.error('❌ Failed to add expense to Google Sheet:', result.error);
      return false;
    } catch (error) {
      console.error('❌ Error syncing expense addition:', error);
      return false;
    }
  }

  async syncUpdateExpense(expenseData) {
    try {
      console.log('✅ Syncing expense update to Google Sheets:', expenseData);

      // For now, we'll implement update as delete + create
      // You can enhance this later with proper row update logic

      const sheet = expenseData.sheet;
      if (!sheet || !sheet.googleSheetId) {
        console.error('❌ No Google Sheet ID found for expense update');
        return false;
      }

      // Add updated expense as new row
      const result = await GoogleSheetsSyncService.addExpenseToSheet(
        sheet.googleSheetId,
        expenseData.updates,
        sheet.name,
      );

      if (result.success) {
        console.log('✅ Expense update synced to Google Sheets');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error syncing expense update:', error);
      return false;
    }
  }

  async syncDeleteExpense(expenseData) {
    try {
      console.log('✅ Syncing expense deletion to Google Sheets:', expenseData);

      // For delete, we'll just mark it as deleted in comments
      // Full row deletion requires more complex Google Sheets API calls

      const sheet = expenseData.sheet;
      if (!sheet || !sheet.googleSheetId) {
        console.error('❌ No Google Sheet ID found for expense deletion');
        return false;
      }

      // Add a "DELETED" note row
      const deletedNote = {
        ...expenseData.deletedExpense,
        purpose: `[DELETED] ${expenseData.deletedExpense.purpose}`,
        amount: 0,
      };

      const result = await GoogleSheetsSyncService.addExpenseToSheet(
        sheet.googleSheetId,
        deletedNote,
        sheet.name,
      );

      if (result.success) {
        console.log('✅ Expense deletion synced to Google Sheets');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error syncing expense deletion:', error);
      return false;
    }
  }

  async syncCreateCategory(categoryData) {
    try {
      console.log('✅ Category creation logged:', categoryData);

      // Categories are stored locally only for now
      // You can optionally sync them to a separate Google Sheet

      return true;
    } catch (error) {
      console.error('❌ Error syncing category creation:', error);
      return false;
    }
  }

  // ============ HELPER METHODS ============

  async updateLocalSheetWithGoogleId(localSheetId, googleSheetId) {
    try {
      const sheets = await ExpenseSyncService.getExpenseSheets();
      const sheetIndex = sheets.findIndex(s => s.id === localSheetId);

      if (sheetIndex !== -1) {
        sheets[sheetIndex].googleSheetId = googleSheetId;
        sheets[sheetIndex].synced = true;
        sheets[sheetIndex].lastSynced = new Date().toISOString();

        await ExpenseSyncService.saveExpenseSheets(sheets);
        console.log(
          '✅ Local sheet updated with Google Sheet ID:',
          googleSheetId,
        );
      }
    } catch (error) {
      console.error('❌ Error updating local sheet with Google ID:', error);
    }
  }

  async markExpenseAsSynced(sheetId, expenseId) {
    try {
      const sheets = await ExpenseSyncService.getExpenseSheets();
      const sheetIndex = sheets.findIndex(s => s.id === sheetId);

      if (sheetIndex !== -1 && sheets[sheetIndex].transactions) {
        const expenseIndex = sheets[sheetIndex].transactions.findIndex(
          e => e.id === expenseId,
        );

        if (expenseIndex !== -1) {
          sheets[sheetIndex].transactions[expenseIndex].synced = true;
          sheets[sheetIndex].transactions[expenseIndex].lastSynced =
            new Date().toISOString();

          await ExpenseSyncService.saveExpenseSheets(sheets);
          console.log('✅ Expense marked as synced:', expenseId);
        }
      }
    } catch (error) {
      console.error('❌ Error marking expense as synced:', error);
    }
  }

  // ============ PUBLIC API ============

  async queueOperation(type, data) {
    const operationId = await StorageUtils.addToSyncQueue({
      type,
      data,
      timestamp: Date.now(),
    });

    console.log(`📋 Queued operation: ${type} (ID: ${operationId})`);

    // Trigger sync if online
    if (NetworkService.isOnline()) {
      this.scheduleSync(1000); // Shorter delay for new operations
    }

    this.notifySyncListeners('operation_queued', {
      operationId,
      operationType: type,
      data,
    });

    return operationId;
  }

  async addPendingExpenseOperation(operationType, expenseData) {
    const operationId = await StorageUtils.addPendingOperation(
      `expense_${operationType}`,
      expenseData,
    );

    console.log(
      `📋 Queued pending expense operation: ${operationType} (ID: ${operationId})`,
    );

    // Trigger sync if online
    if (NetworkService.isOnline()) {
      this.scheduleSync(1000);
    }

    this.notifySyncListeners('expense_operation_queued', {
      operationId,
      operationType,
      expenseData,
    });

    return operationId;
  }

  async manualSync() {
    if (this.isSyncing) {
      return { success: false, message: 'Sync already in progress' };
    }

    try {
      console.log('🔄 Manual sync triggered by user');
      this.notifySyncListeners('manual_sync_triggered');

      await this.syncAll();
      return { success: true, message: 'Manual sync completed' };
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      return { success: false, message: error.message };
    }
  }

  async getSyncStatus() {
    const [unsyncedData, lastSync] = await Promise.all([
      StorageUtils.getUnsyncedData(),
      StorageUtils.getLastSyncTimestamp(),
    ]);

    const status = {
      isSyncing: this.isSyncing,
      isOnline: NetworkService.isOnline(),
      pendingOperations: unsyncedData.pendingOperations.length,
      syncQueue: unsyncedData.syncQueue.length,
      lastSyncTimestamp: lastSync,
      totalUnsynced:
        unsyncedData.pendingOperations.length + unsyncedData.syncQueue.length,
    };

    return status;
  }

  async hasUnsyncedData() {
    const unsyncedData = await StorageUtils.getUnsyncedData();
    return (
      unsyncedData.syncQueue.length > 0 ||
      unsyncedData.pendingOperations.length > 0
    );
  }

  async clearAllSyncData() {
    await StorageUtils.clearSyncQueue();
    await StorageUtils.storeData(StorageUtils.PENDING_OPERATIONS_KEY, []);
    await StorageUtils.removeData(StorageUtils.LAST_SYNC_TIMESTAMP_KEY);

    console.log('🗑️ All sync data cleared');
    this.notifySyncListeners('sync_data_cleared');
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.syncCallbacks.clear();
    console.log('SyncService destroyed');
  }
}

export default new SyncService();
