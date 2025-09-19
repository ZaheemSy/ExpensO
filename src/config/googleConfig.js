// Demo configuration - replace with real values when setting up Google OAuth
export const GOOGLE_CONFIG = {
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual Web Client ID
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ],
  offlineAccess: true,
  forceCodeForRefreshToken: true
};

export const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: 'YOUR_SPREADSHEET_ID', // Replace with your Google Sheet ID
  range: 'Sheet1!A:C' // Adjust based on your sheet structure
};