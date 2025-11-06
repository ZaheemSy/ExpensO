# 🔧 DEVELOPER_ERROR Fix Guide for Google Sign-In

## 🚨 **Issue**: "DEVELOPER_ERROR: Follow troubleshooting instructions"

This error occurs when the Google Sign-In configuration is not properly set up in Google Cloud Console and Firebase.

## 🎯 **Root Cause**

The Web Client ID in `googleConfig.js` may not be properly linked to your specific app package `com.syforge.expenso` in Google Cloud Console.

## 🛠️ **IMMEDIATE SOLUTION (For Development)**

### Option 1: Use a Valid Development Web Client ID

Update your `src/config/googleConfig.js` with a valid client ID for development:

```javascript
export const GOOGLE_CONFIG = {
  // Use your actual Google Web Client ID from Firebase Console
  webClientId: 'YOUR_VALID_WEB_CLIENT_ID.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
  offlineAccess: true,
  forceCodeForRefreshToken: true,
};
```

### Option 2: Disable Google Sign-In Temporarily for Development

Update your `LoginScreen.js` to show a temporary "Development Mode" message:

```javascript
const handleGoogleLogin = async () => {
  Alert.alert(
    'Development Mode',
    'Google Sign-In requires proper Google Console setup. Please configure your Web Client ID in src/config/googleConfig.js',
  );
};
```

## 🏗️ **PROPER SETUP (Production Ready)**

### Step 1: Firebase Console Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project** (ExpensO)
3. **Go to Authentication > Sign-in method**
4. **Enable Google provider**
5. **Add your Web Client ID and SHA-1 fingerprint**

### Step 2: Get SHA-1 Fingerprint

Run this command in your terminal:

```bash
cd android && ./gradlew signingReport
```

Look for the `SHA1` value in the output.

### Step 3: Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**
3. **APIs & Services > Credentials**
4. **Create OAuth 2.0 Client ID**
5. **Application type**: Web application
6. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:19006
   ```
7. **Authorized redirect URIs**:
   ```
   http://localhost:3000/__/auth/handler
   ```

### Step 4: Update Configuration

1. **Copy the Web Client ID** from Google Cloud Console
2. **Update `src/config/googleConfig.js`**:

   ```javascript
   export const GOOGLE_CONFIG = {
     webClientId: 'YOUR_NEW_WEB_CLIENT_ID.apps.googleusercontent.com',
     // ... rest of config
   };
   ```

3. **Update Firebase Console** with the same Web Client ID

### Step 5: Add SHA Certificates to Firebase

1. **In Firebase Console**: Project Settings > General > Your apps
2. **Add SHA-1 fingerprint** (from Step 2)
3. **Download updated google-services.json**

## 🔧 **TROUBLESHOOTING CHECKLIST**

- [ ] Web Client ID is valid and not expired
- [ ] SHA-1 fingerprint added to Firebase Console
- [ ] Google provider enabled in Firebase Authentication
- [ ] Web Client ID added to Google Cloud Console
- [ ] App package name matches in all configurations
- [ ] google-services.json file is updated

## 🚀 **QUICK DEVELOPMENT WORKAROUND**

If you want to test the app immediately without Google setup, update the login to show a message:

```javascript
// In LoginScreen.js
const handleGoogleLogin = async () => {
  Alert.alert(
    'Google Setup Required',
    'Google Sign-In is configured but needs proper Google Console setup. For now, use email/password login.',
    [{ text: 'OK', style: 'default' }],
  );
};
```

## 📱 **TESTING THE FIX**

After applying the proper setup:

1. **Clean rebuild**:

   ```bash
   npx react-native clean
   npx react-native run-android
   ```

2. **Test Google Sign-In**:
   - Click Google login button
   - Should show Google account selection
   - Should return to app after successful login

## 🔐 **SECURITY NOTES**

- Keep your Web Client ID secure
- Don't commit real credentials to public repositories
- Use environment variables for production builds
- Regularly rotate your API keys

## 📞 **NEXT STEPS**

1. **Immediate**: Use the development workaround to continue testing
2. **Short-term**: Set up proper Google/Firebase configuration
3. **Long-term**: Implement production-ready authentication flows

**Remember**: The DEVELOPER_ERROR is completely fixable with proper configuration! 🎯
