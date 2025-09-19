import authService from './authService';
import { SHEETS_CONFIG } from '../config/googleConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SheetsService {
  constructor() {
    this.baseUrl = SHEETS_CONFIG.baseUrl;
    this.driveUrl = SHEETS_CONFIG.driveUrl;
  }

  async getHeaders() {
    try {
      const accessToken = await authService.getAccessToken();
      return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting headers:', error);
      throw error;
    }
  }

  async createExpenseSheet(userEmail) {
    try {
      const headers = await this.getHeaders();
      const sheetTitle = `ExpensO - ${userEmail} - ${new Date().getFullYear()}`;

      // Create new spreadsheet
      const createResponse = await fetch(`${this.driveUrl}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          name: sheetTitle,
          mimeType: 'application/vnd.google-apps.spreadsheet'
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create spreadsheet');
      }

      const spreadsheetData = await createResponse.json();
      const spreadsheetId = spreadsheetData.id;

      // Store the spreadsheet ID
      await AsyncStorage.setItem('user_spreadsheet_id', spreadsheetId);

      // Add headers to the spreadsheet
      const headerValues = [
        ['Date', 'Category', 'Description', 'Amount', 'Type', 'Payment Method', 'Notes']
      ];

      const updateResponse = await fetch(`${this.baseUrl}/${spreadsheetId}/values/Sheet1!A1:G1?valueInputOption=RAW`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          values: headerValues
        })
      });

      if (!updateResponse.ok) {
        console.warn('Failed to add headers to spreadsheet');
      }

      return { success: true, spreadsheetId };
    } catch (error) {
      console.error('Error creating expense sheet:', error);
      return { success: false, error: error.message };
    }
  }

  async addExpense(expenseData) {
    try {
      const headers = await this.getHeaders();
      const spreadsheetId = await AsyncStorage.getItem('user_spreadsheet_id');

      if (!spreadsheetId) {
        throw new Error('No spreadsheet found. Please create one first.');
      }

      const values = [[
        expenseData.date || new Date().toISOString().split('T')[0],
        expenseData.category || '',
        expenseData.description || '',
        expenseData.amount || 0,
        expenseData.type || 'Expense',
        expenseData.paymentMethod || '',
        expenseData.notes || ''
      ]];

      const response = await fetch(`${this.baseUrl}/${spreadsheetId}/values/Sheet1!A:G:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          values: values
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      const responseData = await response.json();
      return { success: true, updatedRows: responseData.updates?.updatedRows || 1 };
    } catch (error) {
      console.error('Error adding expense:', error);
      return { success: false, error: error.message };
    }
  }

  async getExpenses(dateRange = null) {
    try {
      const headers = await this.getHeaders();
      const spreadsheetId = await AsyncStorage.getItem('user_spreadsheet_id');

      if (!spreadsheetId) {
        return { success: true, expenses: [] };
      }

      const response = await fetch(`${this.baseUrl}/${spreadsheetId}/values/Sheet1!A2:G`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        throw new Error('Failed to get expenses');
      }

      const responseData = await response.json();
      let expenses = responseData.values || [];

      if (dateRange && dateRange.start && dateRange.end) {
        expenses = expenses.filter(expense => {
          const expenseDate = new Date(expense[0]);
          return expenseDate >= new Date(dateRange.start) && expenseDate <= new Date(dateRange.end);
        });
      }

      const formattedExpenses = expenses.map((expense, index) => ({
        id: index + 2,
        date: expense[0] || '',
        category: expense[1] || '',
        description: expense[2] || '',
        amount: parseFloat(expense[3]) || 0,
        type: expense[4] || '',
        paymentMethod: expense[5] || '',
        notes: expense[6] || ''
      }));

      return { success: true, expenses: formattedExpenses };
    } catch (error) {
      console.error('Error getting expenses:', error);
      return { success: false, error: error.message, expenses: [] };
    }
  }

  // Additional methods can be implemented as needed
  // For now, keeping it simple with create, add, and get functionality
}

export default new SheetsService();