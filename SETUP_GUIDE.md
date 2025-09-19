# ExpensO Google Authentication & Sheets Integration Setup Guide

This guide will help you set up Google authentication with Google Sheets integration for your ExpensO React Native app. This setup is **completely free** and will remain free for personal use.

## Prerequisites

1. Gmail account
2. Google Cloud Console access (free)
3. React Native development environment
4. Android/iOS device or emulator

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select an existing project
3. Enter project name: "ExpensO" (or your preferred name)
4. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Google Sheets API**
   - **Google Drive API**

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the consent screen:
   - Choose "External" user type
   - Fill in app name: "ExpensO"
   - Add your email as a developer email
   - Add required scopes:
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.file`

4. Create TWO OAuth clients:

   **For Web Application:**
   - Application type: "Web application"
   - Name: "ExpensO Web Client"
   - Click "Create"
   - Copy the **Client ID** (ends with `.apps.googleusercontent.com`)

   **For Android (if building for Android):**
   - Application type: "Android"
   - Name: "ExpensO Android Client"
   - Package name: `com.expenso` (or your app's package name)
   - SHA-1 certificate fingerprint: Get from your keystore

## Step 4: Configure the App

1. Open `src/config/googleConfig.js`
2. Replace the placeholder values:

```javascript
export const GOOGLE_CONFIG = {
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  scopes: [
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets'
  ]
};
```

## Step 5: Configure React Native Google Sign-In

### For Android:
No additional setup required for basic functionality.

### For iOS:
1. Open `ios/ExpensO/Info.plist`
2. Add the following (replace with your actual reversed client ID):
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>REVERSED_CLIENT_ID</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

## Step 6: Test the Setup

1. Run your React Native app:
   ```bash
   npm start
   # In another terminal:
   npm run android  # or npm run ios
   ```

2. Try the signup process:
   - Tap "Sign in with Google"
   - Complete Google authentication
   - Send verification email to yourself
   - Enter the verification code

## How It Works

### Signup Process:
1. User taps "Sign in with Google"
2. Google Sign-In modal appears
3. User selects their Google account
4. App gets access to Google Sheets and Drive
5. User manually sends verification email to themselves
6. User enters the 6-digit verification code
7. App creates Google Sheet for expense tracking
8. User is logged in

### Login Process:
1. User enters Gmail address
2. User manually sends verification email to themselves
3. User enters the 6-digit verification code
4. User is logged in

## Free Usage Limits

Google provides generous free quotas:
- **Gmail API**: 1 billion quota units per day
- **Google Sheets API**: 100 requests per 100 seconds per user
- **Google Drive API**: 1000 requests per 100 seconds

These limits are more than sufficient for personal expense tracking.

## Security Features

1. **OAuth 2.0**: Industry-standard authentication
2. **Verification Codes**: Time-limited (10 minutes)
3. **Secure Token Storage**: Using React Native secure storage
4. **Automatic Token Refresh**: Handles expired tokens

## Troubleshooting

### Common Issues:

1. **"OAuth client not found"**: Check Client ID in config
2. **"Access blocked"**: Ensure OAuth consent screen is configured
3. **"Insufficient permissions"**: Verify all required APIs are enabled
4. **"Verification code expired"**: Codes expire after 10 minutes

### Debug Steps:

1. Check Google Cloud Console logs
2. Verify API quotas
3. Ensure correct redirect URI
4. Check network connectivity

## Cost Breakdown

- **Google Cloud APIs**: FREE (within generous limits)
- **Gmail sending**: FREE (using user's own Gmail)
- **Google Sheets storage**: FREE (using user's Google Drive)
- **App maintenance**: $0

## Support

If you encounter issues:
1. Check this setup guide
2. Verify your Google Cloud configuration
3. Test with a new Google account if needed

---

**Important**: Keep your Client ID and Client Secret secure. Never commit them to public repositories.