export const GOOGLE_CONFIG = {
  webClientId:
    '401903578027-fljrlv2ulfnhd1mnpimjf9nk3jge7t74.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
  offlineAccess: true,
  forceCodeForRefreshToken: true,
};

export const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: 'YOUR_SPREADSHEET_ID',
  range: 'Sheet1!A:C',
};
