import authService from './authService';
// import { GOOGLE_SHEETS_CONFIG } from '../config/googleConfig'; // Commented out for demo

class GoogleSheetsService {
  constructor() {
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  async getAccessToken() {
    return await authService.getAccessToken();
  }

  async createSpreadsheet(title = 'ExpensO Data') {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: title,
          },
          sheets: [{
            properties: {
              title: 'Values',
              gridProperties: {
                rowCount: 1000,
                columnCount: 10,
              },
            },
          }],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Initialize with headers
        await this.addValues(data.spreadsheetId, [['Value', 'Date', 'Time']], 'Values!A1:C1');
        return { success: true, spreadsheetId: data.spreadsheetId };
      } else {
        throw new Error(data.error?.message || 'Failed to create spreadsheet');
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      return { success: false, error: error.message };
    }
  }

  async addValues(spreadsheetId, values, range = 'Values!A:C') {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        throw new Error(data.error?.message || 'Failed to add values');
      }
    } catch (error) {
      console.error('Error adding values to sheet:', error);
      return { success: false, error: error.message };
    }
  }

  async getValues(spreadsheetId, range = 'Values!A:C') {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/${spreadsheetId}/values/${range}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, values: data.values || [] };
      } else {
        throw new Error(data.error?.message || 'Failed to get values');
      }
    } catch (error) {
      console.error('Error getting values from sheet:', error);
      return { success: false, error: error.message };
    }
  }

  async syncValueToSheet(value) {
    try {
      const userEmail = await authService.getCurrentUser();
      if (!userEmail || !userEmail.user?.email) {
        return { success: false, error: 'User not authenticated' };
      }

      // For demo purposes, we'll simulate successful sync
      console.log('Demo: Syncing value to Google Sheets:', value);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return success for demo
      return { success: true, message: 'Demo sync completed' };
    } catch (error) {
      console.error('Error syncing to sheet:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new GoogleSheetsService();