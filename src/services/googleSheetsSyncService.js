import googleOAuthService from './googleOAuthService';

class GoogleSheetsSyncService {
  constructor() {
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  async getAccessToken() {
    try {
      return await googleOAuthService.getAccessToken();
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error(
        'Failed to get Google access token. Please check your Google Sign-In.',
      );
    }
  }

  async createSpreadsheet(sheetName, userEmail) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `ExpensO - ${sheetName} - ${userEmail}`,
          },
          sheets: [
            {
              properties: {
                title: 'Transactions',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10,
                },
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Sheets API Error:', errorData);
        throw new Error(
          errorData.error?.message || 'Failed to create spreadsheet',
        );
      }

      const data = await response.json();
      const spreadsheetId = data.spreadsheetId;

      // Add headers to the spreadsheet
      await this.addHeaders(spreadsheetId);

      console.log('✅ Google Sheet created successfully:', spreadsheetId);
      return { success: true, spreadsheetId };
    } catch (error) {
      console.error('❌ Error creating Google Sheet:', error);
      return {
        success: false,
        error: error.message,
        requiresPermission:
          error.message.includes('authentication') ||
          error.message.includes('permission') ||
          error.message.includes('sign in'),
      };
    }
  }

  async addHeaders(spreadsheetId) {
    try {
      const accessToken = await this.getAccessToken();

      const headerValues = [
        [
          'Date',
          'Time',
          'Type',
          'Amount',
          'Category',
          'Purpose',
          'Sheet Name',
          'Sync Time',
        ],
      ];

      const response = await fetch(
        `${this.baseUrl}/${spreadsheetId}/values/Transactions!A1:H1?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: headerValues,
          }),
        },
      );

      if (!response.ok) {
        console.warn('Failed to add headers to spreadsheet');
      } else {
        console.log('✅ Headers added to Google Sheet');
      }
    } catch (error) {
      console.error('Error adding headers:', error);
    }
  }

  async addExpenseToSheet(spreadsheetId, expenseData, sheetName) {
    try {
      const accessToken = await this.getAccessToken();

      const values = [
        [
          expenseData.date || new Date().toISOString().split('T')[0],
          expenseData.time || new Date().toLocaleTimeString(),
          expenseData.type || 'spend',
          expenseData.amount || 0,
          expenseData.category || 'Misc',
          expenseData.purpose || '',
          sheetName || 'Unknown Sheet',
          new Date().toISOString(),
        ],
      ];

      const response = await fetch(
        `${this.baseUrl}/${spreadsheetId}/values/Transactions!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Sheets API Error:', errorData);
        throw new Error(
          errorData.error?.message || 'Failed to add expense to sheet',
        );
      }

      console.log('✅ Expense added to Google Sheet:', expenseData.purpose);
      return { success: true };
    } catch (error) {
      console.error('❌ Error adding expense to Google Sheet:', error);
      return {
        success: false,
        error: error.message,
        requiresPermission:
          error.message.includes('authentication') ||
          error.message.includes('permission') ||
          error.message.includes('sign in'),
      };
    }
  }

  async checkPermissions() {
    return await googleOAuthService.checkPermissions();
  }

  async testConnection() {
    try {
      const accessToken = await this.getAccessToken();
      console.log('✅ Google Access Token obtained successfully');

      const permissions = await this.checkPermissions();
      console.log('✅ Google Permissions:', permissions);

      return {
        success: true,
        hasPermissions: permissions.hasPermissions,
        permissions,
      };
    } catch (error) {
      console.error('❌ Google Connection Test Failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new GoogleSheetsSyncService();
