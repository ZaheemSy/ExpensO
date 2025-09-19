# Firebase Email Authentication Setup Guide

To enable real email verification for your ExpensO app, follow these steps:

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "ExpensO")
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)

## Step 2: Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click on **Sign-in method** tab
3. Find **Email/Password** in the list
4. Click on it and toggle **Enable**
5. Click **Save**

## Step 3: Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to "Your apps" section
4. Click **Add app** and select **Web** (</> icon)
5. Register your app with a nickname (e.g., "ExpensO Web")
6. Copy the configuration object that appears

## Step 4: Update Your App Configuration

1. Open `src/config/firebase.js`
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

## Step 5: Configure Android (Required for React Native)

1. In Firebase Console, add an Android app:
   - Click **Add app** and select **Android**
   - Package name: Find it in `android/app/build.gradle` (look for `applicationId`)
   - App nickname: "ExpensO Android"
   - Download `google-services.json`

2. Place `google-services.json` in `android/app/` directory

3. Update `android/build.gradle`:
```gradle
buildscript {
  dependencies {
    // Add this line
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

4. Update `android/app/build.gradle`:
```gradle
// Add at the bottom of the file
apply plugin: 'com.google.gms.google-services'
```

## Step 6: Configure iOS (If building for iOS)

1. In Firebase Console, add an iOS app:
   - Click **Add app** and select **iOS**
   - Bundle ID: Find it in Xcode or `ios/YourApp.xcodeproj`
   - Download `GoogleService-Info.plist`

2. Add `GoogleService-Info.plist` to your iOS project using Xcode

3. Run `cd ios && pod install`

## Step 7: Update Your Signup Component

The app is already configured to use Firebase. To switch from simulated to real email:

1. Open `src/screens/SignUp/Signup.js`
2. Import Firebase service instead of the simulated one:

```javascript
// Replace this:
import emailVerificationService from '../../services/emailVerificationService';

// With this:
import firebaseEmailService from '../../services/firebaseEmailService';
```

3. Update the method calls to use Firebase service

## Step 8: Test Email Verification

1. Rebuild your app:
   - Android: `npx react-native run-android`
   - iOS: `npx react-native run-ios`

2. Sign up with a real Gmail address
3. Check your email for the verification link
4. Click the link to verify your email
5. Login with your credentials

## Important Security Notes

- **Never commit** your Firebase configuration to a public repository
- Consider using environment variables for sensitive data
- Add `src/config/firebase.js` to `.gitignore` if sharing code publicly
- Enable Firebase Security Rules to protect your data

## Troubleshooting

### Email not received?
- Check spam/junk folder
- Verify Firebase Email/Password auth is enabled
- Check Firebase Console for any error logs

### Network errors?
- Ensure device has internet connection
- Check if Firebase project is active
- Verify API keys are correct

### Authentication errors?
- Double-check Firebase configuration
- Ensure `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) is in place
- Rebuild the app after configuration changes

## Alternative: Using Custom Backend

If you prefer not to use Firebase, you can integrate with other email services:

1. **SendGrid** - Popular email API service
2. **AWS SES** - Amazon's email service
3. **Mailgun** - Developer-friendly email API
4. **Custom SMTP** - Use your own email server

These would require setting up a backend server to handle email sending securely.