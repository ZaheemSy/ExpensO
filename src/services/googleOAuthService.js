import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_CONFIG } from '../config/googleConfig';

class GoogleOAuthService {
  constructor() {
    this.isConfigured = false;
    this.configure();
  }

  configure() {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_CONFIG.webClientId,
        offlineAccess: GOOGLE_CONFIG.offlineAccess,
        forceCodeForRefreshToken: GOOGLE_CONFIG.forceCodeForRefreshToken,
        scopes: GOOGLE_CONFIG.scopes, // Including Sheets and Drive permissions
      });
      this.isConfigured = true;
      console.log('Google Sign-In configured successfully');
    } catch (error) {
      console.error('Error configuring Google Sign-In:', error);
      this.isConfigured = false;
    }
  }

  async checkPermissions() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        return { hasPermissions: false, reason: 'not_signed_in' };
      }

      const userInfo = await GoogleSignin.getCurrentUser();
      const scopes = userInfo?.scopes || [];

      const requiredScopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ];

      const hasAllScopes = requiredScopes.every(scope =>
        scopes.includes(scope),
      );

      return {
        hasPermissions: hasAllScopes,
        currentScopes: scopes,
        requiredScopes,
        reason: hasAllScopes ? 'all_granted' : 'insufficient_scopes',
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { hasPermissions: false, reason: 'error', error: error.message };
    }
  }

  async requestGoogleSheetsPermissions() {
    try {
      if (!this.isConfigured) {
        throw new Error('Google Sign-In not configured');
      }

      // Check if user is already signed in
      const isSignedIn = await GoogleSignin.isSignedIn();

      if (isSignedIn) {
        // Check if we already have the required permissions
        const permissionCheck = await this.checkPermissions();
        if (permissionCheck.hasPermissions) {
          return { success: true, message: 'Permissions already granted' };
        }

        // Sign out and re-authenticate to request new permissions
        await GoogleSignin.signOut();
      }

      // Sign in with the required scopes
      const userInfo = await GoogleSignin.signIn();

      // Verify we got the permissions we need
      const finalCheck = await this.checkPermissions();

      if (finalCheck.hasPermissions) {
        // Store user info and tokens
        await this.storeUserCredentials(userInfo);
        return {
          success: true,
          userInfo,
          message: 'Google Sheets access granted successfully!',
        };
      } else {
        return {
          success: false,
          error: 'Required permissions not granted',
          details: finalCheck,
        };
      }
    } catch (error) {
      console.error('Error requesting Google Sheets permissions:', error);
      return {
        success: false,
        error: error.message || 'Failed to get Google Sheets permissions',
      };
    }
  }

  async storeUserCredentials(userInfo) {
    try {
      await AsyncStorage.setItem('google_user_info', JSON.stringify(userInfo));
      await AsyncStorage.setItem('google_access_token', userInfo.accessToken);
      await AsyncStorage.setItem('google_sheets_permissions_granted', 'true');
      await AsyncStorage.setItem(
        'google_permissions_timestamp',
        Date.now().toString(),
      );
    } catch (error) {
      console.error('Error storing user credentials:', error);
    }
  }

  async getAccessToken() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        throw new Error('User not signed in to Google');
      }

      // Get fresh tokens
      const tokens = await GoogleSignin.getTokens();

      // Update stored token
      await AsyncStorage.setItem('google_access_token', tokens.accessToken);

      return tokens.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async getUserInfo() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        return await GoogleSignin.getCurrentUser();
      }
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  async hasValidPermissions() {
    try {
      const permissionsGranted = await AsyncStorage.getItem(
        'google_sheets_permissions_granted',
      );
      const timestamp = await AsyncStorage.getItem(
        'google_permissions_timestamp',
      );

      if (permissionsGranted !== 'true') {
        return false;
      }

      // Check if permissions are still valid (less than 1 hour old)
      if (timestamp) {
        const grantedTime = parseInt(timestamp);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (now - grantedTime > oneHour) {
          // Permissions might have expired, recheck
          const check = await this.checkPermissions();
          return check.hasPermissions;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking valid permissions:', error);
      return false;
    }
  }

  async signOut() {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem('google_user_info');
      await AsyncStorage.removeItem('google_access_token');
      await AsyncStorage.removeItem('google_sheets_permissions_granted');
      await AsyncStorage.removeItem('google_permissions_timestamp');
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
  }

  async revokePermissions() {
    try {
      await GoogleSignin.revokeAccess();
      await this.signOut();
      return { success: true, message: 'Permissions revoked successfully' };
    } catch (error) {
      console.error('Error revoking permissions:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new GoogleOAuthService();
