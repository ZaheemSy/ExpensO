import auth from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from '../config/googleConfig';

class FirebaseGoogleAuthService {
  constructor() {
    this.configureGoogleSignIn();
  }

  configureGoogleSignIn() {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_CONFIG.webClientId,
        offlineAccess: true,
      });
    } catch (error) {
      console.error('Error configuring Google Sign-In:', error);
    }
  }

  async signInWithGoogle() {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices();

      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(
        signInResult.idToken,
        signInResult.accessToken,
      );

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(
        googleCredential,
      );

      // Get additional user info
      const user = userCredential.user;
      const userInfo = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      };

      console.log('Firebase Google Auth successful:', userInfo.email);

      return {
        success: true,
        user: userInfo,
        message: 'Successfully signed in with Google',
      };
    } catch (error) {
      console.error('Firebase Google Auth error:', error);

      let errorMessage = 'Failed to sign in with Google';

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'User cancelled the sign-in flow';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign-in is already in progress';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play Services is not available';
      } else {
        errorMessage = error.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async signOut() {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      console.log('Firebase Google Auth sign out successful');
      return { success: true };
    } catch (error) {
      console.error('Firebase Google Auth sign out error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out',
      };
    }
  }
}

export default new FirebaseGoogleAuthService();
