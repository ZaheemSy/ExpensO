import ExpenseSyncService from '../services/expenseSyncService';
import GoogleSheetsSyncService from '../services/googleSheetsSyncService';
import SyncService from '../services/syncService';

class SheetSyncFixer {
  /**
   * Fix a single local sheet by creating its Google Sheet
   */
  async fixLocalSheet(sheetId, userEmail) {
    try {
      console.log('🔧 Attempting to fix local sheet:', sheetId);

      const sheet = await ExpenseSyncService.getExpenseSheet(sheetId);

      if (!sheet) {
        return {
          success: false,
          error: 'Sheet not found',
        };
      }

      // Check if already synced
      if (sheet.googleSheetId && sheet.synced) {
        return {
          success: true,
          alreadySynced: true,
          message: 'Sheet is already synced',
          googleSheetId: sheet.googleSheetId,
        };
      }

      console.log('📝 Creating Google Sheet for:', sheet.name);

      // Create the Google Sheet
      const result = await GoogleSheetsSyncService.createSpreadsheet(
        sheet.name,
        userEmail,
      );

      if (result.success && result.spreadsheetId) {
        // Update local sheet with Google Sheet ID
        const sheets = await ExpenseSyncService.getExpenseSheets();
        const sheetIndex = sheets.findIndex(s => s.id === sheetId);

        if (sheetIndex !== -1) {
          sheets[sheetIndex].googleSheetId = result.spreadsheetId;
          sheets[sheetIndex].synced = true;
          sheets[sheetIndex].syncStatus = 'synced';
          sheets[sheetIndex].lastSynced = new Date().toISOString();

          await ExpenseSyncService.saveExpenseSheets(sheets);

          console.log('✅ Sheet synced successfully:', result.spreadsheetId);

          // Now sync all expenses for this sheet
          const expenses = sheets[sheetIndex].transactions || [];
          const unsyncedExpenses = expenses.filter(e => !e.synced);

          if (unsyncedExpenses.length > 0) {
            console.log(`📤 Syncing ${unsyncedExpenses.length} expenses...`);

            for (const expense of unsyncedExpenses) {
              await SyncService.addPendingExpenseOperation('create', {
                ...expense,
                sheet: sheets[sheetIndex],
              });
            }

            // Trigger sync
            await SyncService.scheduleSync(1000);
          }

          return {
            success: true,
            message: 'Sheet synced successfully',
            googleSheetId: result.spreadsheetId,
            expensesSyncing: unsyncedExpenses.length,
          };
        }
      }

      return {
        success: false,
        error: result.error || 'Failed to create Google Sheet',
      };
    } catch (error) {
      console.error('❌ Error fixing local sheet:', error);
      return {
        success: false,
        error: error.message || 'Failed to fix sheet',
      };
    }
  }

  /**
   * Fix all local sheets for the current user
   */
  async fixAllLocalSheets(userEmail) {
    try {
      console.log('🔧 Fixing all local sheets...');

      const sheets = await ExpenseSyncService.getExpenseSheets();
      const localSheets = sheets.filter(
        sheet => !sheet.googleSheetId || !sheet.synced,
      );

      if (localSheets.length === 0) {
        return {
          success: true,
          message: 'All sheets are already synced',
          fixedCount: 0,
        };
      }

      console.log(`📋 Found ${localSheets.length} local sheets to fix`);

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const sheet of localSheets) {
        const result = await this.fixLocalSheet(sheet.id, userEmail);
        results.push({
          sheetId: sheet.id,
          sheetName: sheet.name,
          result,
        });

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }

        // Small delay between fixes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        message: `Fixed ${successCount} sheets (${failureCount} failed)`,
        fixedCount: successCount,
        failedCount: failureCount,
        details: results,
      };
    } catch (error) {
      console.error('❌ Error fixing all local sheets:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get list of all local (unsynced) sheets
   */
  async getLocalSheets() {
    try {
      const sheets = await ExpenseSyncService.getExpenseSheets();
      return sheets.filter(sheet => !sheet.googleSheetId || !sheet.synced);
    } catch (error) {
      console.error('Error getting local sheets:', error);
      return [];
    }
  }

  /**
   * Check sync status of all sheets
   */
  async checkAllSheetsSyncStatus() {
    try {
      const sheets = await ExpenseSyncService.getExpenseSheets();

      const status = {
        total: sheets.length,
        synced: 0,
        local: 0,
        syncing: 0,
        error: 0,
        sheets: [],
      };

      for (const sheet of sheets) {
        const sheetStatus = {
          id: sheet.id,
          name: sheet.name,
          googleSheetId: sheet.googleSheetId,
          synced: sheet.synced,
          syncStatus: sheet.syncStatus || 'unknown',
          lastSynced: sheet.lastSynced,
          expenseCount: sheet.transactions?.length || 0,
          unsyncedExpenses:
            sheet.transactions?.filter(e => !e.synced).length || 0,
        };

        status.sheets.push(sheetStatus);

        if (sheet.synced && sheet.googleSheetId) {
          status.synced++;
        } else if (sheet.syncStatus === 'syncing') {
          status.syncing++;
        } else if (sheet.syncStatus === 'error') {
          status.error++;
        } else {
          status.local++;
        }
      }

      return status;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return null;
    }
  }
}

export default new SheetSyncFixer();
