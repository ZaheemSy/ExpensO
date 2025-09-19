import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FirebaseEmailService {
  constructor() {
    this.pendingVerifications = new Map();
  }

  async sendVerificationEmail(email, password) {
    try {
      // Create user with email and password
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Send verification email (simple version without custom URL)
      await user.sendEmailVerification();

      // Store pending verification
      this.pendingVerifications.set(email, {
        uid: user.uid,
        password: password,
        timestamp: Date.now()
      });

      return {
        success: true,
        message: 'Verification email sent to ' + email + '. Please check your inbox.',
        uid: user.uid
      };
    } catch (error) {
      console.error('Firebase email error:', error);

      // Handle specific Firebase errors
      let errorMessage = 'Failed to send verification email';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async checkEmailVerification(email) {
    try {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        // Try to get from pending verifications and re-authenticate
        const pending = this.pendingVerifications.get(email);
        if (pending) {
          await auth().signInWithEmailAndPassword(email, pending.password);
        } else {
          return {
            success: false,
            error: 'No verification pending for this email'
          };
        }
      }

      // Reload user to get latest verification status
      await auth().currentUser.reload();
      const user = auth().currentUser;

      if (user.emailVerified) {
        // Clean up pending verification
        this.pendingVerifications.delete(email);

        // Sign out so user can login normally
        await auth().signOut();

        return {
          success: true,
          message: 'Email verified successfully!'
        };
      } else {
        return {
          success: false,
          error: 'Email not yet verified. Please check your inbox.',
          canResend: true
        };
      }
    } catch (error) {
      console.error('Verification check error:', error);
      return {
        success: false,
        error: 'Failed to check verification status'
      };
    }
  }

  async resendVerificationEmail(email) {
    try {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        // Try to get from pending verifications and re-authenticate
        const pending = this.pendingVerifications.get(email);
        if (pending) {
          await auth().signInWithEmailAndPassword(email, pending.password);
        } else {
          return {
            success: false,
            error: 'No verification pending for this email'
          };
        }
      }

      await auth().currentUser.sendEmailVerification();

      return {
        success: true,
        message: 'Verification email resent. Please check your inbox.'
      };
    } catch (error) {
      console.error('Resend email error:', error);

      let errorMessage = 'Failed to resend verification email';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async signInWithEmail(email, password) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await auth().signOut();
        return {
          success: false,
          error: 'Please verify your email before logging in. Check your inbox.',
          needsVerification: true
        };
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);

      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async signOut() {
    try {
      await auth().signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  }

  isValidGmail(email) {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  }

  // Clean up old pending verifications (older than 1 hour)
  cleanupPendingVerifications() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [email, data] of this.pendingVerifications.entries()) {
      if (data.timestamp < oneHourAgo) {
        this.pendingVerifications.delete(email);
      }
    }
  }
}

export default new FirebaseEmailService();