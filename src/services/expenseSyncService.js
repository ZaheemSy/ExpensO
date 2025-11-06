import SyncService from './syncService';
import StorageUtils from '../utils/storageUtils';

class ExpenseSyncService {
  constructor() {
    this.userEmail = null;
  }

  setUserEmail(email) {
    this.userEmail = email;
  }

  // Expense Sheet Operations
  async createExpenseSheet(sheetData) {
    const { name, userEmail } = sheetData;

    try {
      // Generate unique ID for the sheet
      const sheetId = Date.now().toString();
      const newSheet = {
        id: sheetId,
        name: name.trim(),
        createdAt: new Date().toISOString(),
        googleSheetId: null, // Will be set when synced
        synced: false,
        lastModified: new Date().toISOString(),
        lastSynced: null,
        transactions: [],
        syncStatus: 'pending', // 'pending', 'syncing', 'synced', 'error'
      };

      // Save locally first
      const sheets = await this.getExpenseSheets();
      sheets.push(newSheet);
      await this.saveExpenseSheets(sheets);

      console.log(
        '📝 Sheet created locally, queueing for Google Sheets sync...',
      );

      // Queue for sync
      await SyncService.queueOperation('CREATE_SHEET', {
        userEmail,
        sheetName: name,
        sheetId,
      });

      // Update sync status
      await this.updateSheetSyncStatus(sheetId, 'syncing');

      return {
        success: true,
        sheet: newSheet,
        message: 'Sheet created locally. Syncing to Google Sheets...',
      };
    } catch (error) {
      console.error('Error creating expense sheet:', error);
      return {
        success: false,
        error: 'Failed to create sheet',
      };
    }
  }

  async getExpenseSheets() {
    if (!this.userEmail) {
      console.error('User email not set');
      return [];
    }

    const sheets = await StorageUtils.getUserData(
      'expense_sheets',
      this.userEmail,
    );
    return Array.isArray(sheets) ? sheets : [];
  }

  async saveExpenseSheets(sheets) {
    if (!this.userEmail) {
      console.error('User email not set');
      return false;
    }

    return await StorageUtils.storeUserData(
      'expense_sheets',
      sheets,
      this.userEmail,
    );
  }

  async getExpenseSheet(sheetId) {
    const sheets = await this.getExpenseSheets();
    return sheets.find(sheet => sheet.id === sheetId) || null;
  }

  async updateSheetSyncStatus(sheetId, status) {
    try {
      const sheets = await this.getExpenseSheets();
      const sheetIndex = sheets.findIndex(s => s.id === sheetId);

      if (sheetIndex !== -1) {
        sheets[sheetIndex].syncStatus = status;

        if (status === 'synced') {
          sheets[sheetIndex].synced = true;
          sheets[sheetIndex].lastSynced = new Date().toISOString();
        }

        await this.saveExpenseSheets(sheets);
        console.log(`🔄 Sheet ${sheetId} sync status updated to: ${status}`);
      }
    } catch (error) {
      console.error('Error updating sheet sync status:', error);
    }
  }

  // Expense Operations
  async addExpense(sheetId, expenseData) {
    try {
      const { amount, purpose, category, type, image } = expenseData;

      // Validate required fields
      if (!amount || !purpose || !type) {
        return {
          success: false,
          error: 'Amount, purpose, and type are required',
        };
      }

      const expense = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        amount: parseFloat(amount),
        purpose: purpose.trim(),
        category: category?.trim() || 'Misc',
        type: type, // 'spend' or 'collected'
        image: image || null,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString(),
        synced: false,
        lastSynced: null,
        sheetId,
      };

      // Save locally first
      const sheets = await this.getExpenseSheets();
      const sheetIndex = sheets.findIndex(sheet => sheet.id === sheetId);

      if (sheetIndex === -1) {
        return {
          success: false,
          error: 'Sheet not found',
        };
      }

      // Check if sheet has Google Sheet ID
      const sheet = sheets[sheetIndex];
      if (!sheet.googleSheetId) {
        console.warn(
          '⚠️ Sheet not yet synced to Google Sheets. Expense will sync when sheet is ready.',
        );
      }

      // Initialize transactions array if it doesn't exist
      if (!sheets[sheetIndex].transactions) {
        sheets[sheetIndex].transactions = [];
      }

      sheets[sheetIndex].transactions.unshift(expense);
      sheets[sheetIndex].lastModified = new Date().toISOString();

      await this.saveExpenseSheets(sheets);

      console.log(
        '📝 Expense added locally, queueing for Google Sheets sync...',
      );

      // Add to pending operations for sync
      await SyncService.addPendingExpenseOperation('create', {
        ...expense,
        sheet: sheets[sheetIndex],
      });

      return {
        success: true,
        expense,
        message: sheet.googleSheetId
          ? 'Expense added. Syncing to Google Sheets...'
          : 'Expense added locally. Will sync when sheet is ready.',
      };
    } catch (error) {
      console.error('Error adding expense:', error);
      return {
        success: false,
        error: 'Failed to add expense',
      };
    }
  }

  async getExpenses(sheetId) {
    const sheet = await this.getExpenseSheet(sheetId);
    return sheet?.transactions || [];
  }

  async updateExpense(sheetId, expenseId, updates) {
    try {
      const sheets = await this.getExpenseSheets();
      const sheetIndex = sheets.findIndex(sheet => sheet.id === sheetId);

      if (sheetIndex === -1) {
        return {
          success: false,
          error: 'Sheet not found',
        };
      }

      const expenseIndex = sheets[sheetIndex].transactions?.findIndex(
        exp => exp.id === expenseId,
      );

      if (expenseIndex === -1) {
        return {
          success: false,
          error: 'Expense not found',
        };
      }

      // Update expense
      sheets[sheetIndex].transactions[expenseIndex] = {
        ...sheets[sheetIndex].transactions[expenseIndex],
        ...updates,
        lastModified: new Date().toISOString(),
        synced: false,
      };

      sheets[sheetIndex].lastModified = new Date().toISOString();
      await this.saveExpenseSheets(sheets);

      // Queue for sync
      await SyncService.addPendingExpenseOperation('update', {
        expenseId,
        sheetId,
        updates,
        sheet: sheets[sheetIndex],
      });

      return {
        success: true,
        expense: sheets[sheetIndex].transactions[expenseIndex],
        message: 'Expense updated. Syncing to Google Sheets...',
      };
    } catch (error) {
      console.error('Error updating expense:', error);
      return {
        success: false,
        error: 'Failed to update expense',
      };
    }
  }

  async deleteExpense(sheetId, expenseId) {
    try {
      const sheets = await this.getExpenseSheets();
      const sheetIndex = sheets.findIndex(sheet => sheet.id === sheetId);

      if (sheetIndex === -1) {
        return {
          success: false,
          error: 'Sheet not found',
        };
      }

      const expenseIndex = sheets[sheetIndex].transactions?.findIndex(
        exp => exp.id === expenseId,
      );

      if (expenseIndex === -1) {
        return {
          success: false,
          error: 'Expense not found',
        };
      }

      const deletedExpense = sheets[sheetIndex].transactions[expenseIndex];

      // Remove expense
      sheets[sheetIndex].transactions.splice(expenseIndex, 1);
      sheets[sheetIndex].lastModified = new Date().toISOString();
      await this.saveExpenseSheets(sheets);

      // Queue for sync
      await SyncService.addPendingExpenseOperation('delete', {
        expenseId,
        sheetId,
        deletedExpense,
        sheet: sheets[sheetIndex],
      });

      return {
        success: true,
        message: 'Expense deleted. Syncing to Google Sheets...',
      };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return {
        success: false,
        error: 'Failed to delete expense',
      };
    }
  }

  // Category Management
  async getCategories() {
    if (!this.userEmail) {
      console.error('User email not set');
      return ['Misc']; // Default category
    }

    const categories = await StorageUtils.getUserData(
      'categories',
      this.userEmail,
    );
    return Array.isArray(categories) && categories.length > 0
      ? categories
      : ['Misc'];
  }

  async saveCategories(categories) {
    if (!this.userEmail) {
      console.error('User email not set');
      return false;
    }

    return await StorageUtils.storeUserData(
      'categories',
      categories,
      this.userEmail,
    );
  }

  async addCategory(categoryName) {
    try {
      const categories = await this.getCategories();
      const normalizedName = categoryName.trim();

      // Check for duplicates
      if (
        categories.some(
          cat => cat.toLowerCase() === normalizedName.toLowerCase(),
        )
      ) {
        return {
          success: false,
          error: 'Category already exists',
        };
      }

      // Add new category
      categories.push(normalizedName);
      await this.saveCategories(categories);

      // Queue for sync
      await SyncService.queueOperation('CREATE_CATEGORY', {
        categoryName: normalizedName,
        userEmail: this.userEmail,
      });

      return {
        success: true,
        category: normalizedName,
        message: 'Category added successfully.',
      };
    } catch (error) {
      console.error('Error adding category:', error);
      return {
        success: false,
        error: 'Failed to add category',
      };
    }
  }

  async deleteCategory(categoryName) {
    try {
      const categories = await this.getCategories();
      const normalizedName = categoryName.trim();

      // Prevent deleting "Misc" category
      if (normalizedName.toLowerCase() === 'misc') {
        return {
          success: false,
          error: 'Cannot delete the Misc category',
        };
      }

      // Check if category exists
      const categoryIndex = categories.findIndex(
        cat => cat.toLowerCase() === normalizedName.toLowerCase(),
      );

      if (categoryIndex === -1) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      // Remove category
      categories.splice(categoryIndex, 1);
      await this.saveCategories(categories);

      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting category:', error);
      return {
        success: false,
        error: 'Failed to delete category',
      };
    }
  }

  // Calculations
  calculateSheetTotals(sheet) {
    if (!sheet || !sheet.transactions) {
      return { spent: 0, collected: 0, balance: 0 };
    }

    const spent = sheet.transactions
      .filter(expense => expense.type === 'spend')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const collected = sheet.transactions
      .filter(expense => expense.type === 'collected')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const balance = collected - spent;

    return { spent, collected, balance };
  }

  // Sync status for a specific sheet
  async getSheetSyncStatus(sheetId) {
    const sheet = await this.getExpenseSheet(sheetId);
    if (!sheet) return null;

    const unsyncedExpenses =
      sheet.transactions?.filter(exp => !exp.synced) || [];
    const syncStatus = await SyncService.getSyncStatus();

    return {
      sheetId,
      sheetName: sheet.name,
      googleSheetId: sheet.googleSheetId,
      synced: sheet.synced,
      syncStatus: sheet.syncStatus,
      lastSynced: sheet.lastSynced,
      totalExpenses: sheet.transactions?.length || 0,
      unsyncedExpenses: unsyncedExpenses.length,
      lastModified: sheet.lastModified,
      overallSyncStatus: syncStatus,
    };
  }

  // Force sync for a specific sheet
  async forceSheetSync(sheetId) {
    const sheet = await this.getExpenseSheet(sheetId);
    if (!sheet) {
      return {
        success: false,
        error: 'Sheet not found',
      };
    }

    // If sheet doesn't have Google Sheet ID, try to create it first
    if (!sheet.googleSheetId) {
      await SyncService.queueOperation('CREATE_SHEET', {
        userEmail: this.userEmail,
        sheetName: sheet.name,
        sheetId: sheet.id,
      });
    }

    // Queue all unsynced expenses for this sheet
    const unsyncedExpenses =
      sheet.transactions?.filter(exp => !exp.synced) || [];

    for (const expense of unsyncedExpenses) {
      await SyncService.addPendingExpenseOperation('create', {
        ...expense,
        sheet,
      });
    }

    // Trigger immediate sync
    const syncResult = await SyncService.manualSync();

    return {
      success: true,
      message: `Queued ${unsyncedExpenses.length} expenses for sync`,
      syncResult,
    };
  }

  // Manual retry for failed sheet sync
  async retrySheetSync(sheetId) {
    try {
      const sheet = await this.getExpenseSheet(sheetId);
      if (!sheet) {
        return { success: false, error: 'Sheet not found' };
      }

      console.log('🔄 Retrying sheet sync:', sheet.name);

      // Update status to syncing
      await this.updateSheetSyncStatus(sheetId, 'syncing');

      // Re-queue the sheet creation
      await SyncService.queueOperation('CREATE_SHEET', {
        userEmail: this.userEmail,
        sheetName: sheet.name,
        sheetId: sheet.id,
      });

      // Trigger sync
      await SyncService.scheduleSync(500);

      return {
        success: true,
        message: 'Sheet sync retry queued',
      };
    } catch (error) {
      console.error('Error retrying sheet sync:', error);
      return {
        success: false,
        error: 'Failed to retry sync',
      };
    }
  }

  // Cleanup user data
  async clearUserData() {
    if (!this.userEmail) return;

    await StorageUtils.removeData(
      await StorageUtils.getUserKey('expense_sheets', this.userEmail),
    );
    await StorageUtils.removeData(
      await StorageUtils.getUserKey('categories', this.userEmail),
    );
  }
}

export default new ExpenseSyncService();
