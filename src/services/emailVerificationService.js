import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFICATION_CODES_KEY = '@verification_codes';
const CODE_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

class EmailVerificationService {
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationEmail(email) {
    try {
      // Generate a 6-digit verification code
      const code = this.generateVerificationCode();

      // Store the code with expiration time
      const verificationData = {
        email,
        code,
        expiresAt: Date.now() + CODE_EXPIRY_TIME,
      };

      // Get existing codes
      const storedCodes = await this.getStoredCodes();

      // Update with new code
      storedCodes[email] = verificationData;

      // Save to storage
      await AsyncStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(storedCodes));

      // In a production environment, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Firebase Email Auth
      // - Mailgun

      // For now, we'll simulate the email sending
      console.log(`Verification code for ${email}: ${code}`);

      // In development, also show an alert with the code
      if (__DEV__) {
        setTimeout(() => {
          alert(`Development Mode\nVerification code for ${email}: ${code}`);
        }, 1000);
      }

      return {
        success: true,
        message: 'Verification code sent to your email',
        code: __DEV__ ? code : undefined, // Only return code in development
      };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return {
        success: false,
        error: 'Failed to send verification email',
      };
    }
  }

  async verifyCode(email, inputCode) {
    try {
      const storedCodes = await this.getStoredCodes();
      const verificationData = storedCodes[email];

      if (!verificationData) {
        return {
          success: false,
          error: 'No verification code found for this email',
        };
      }

      // Check if code has expired
      if (Date.now() > verificationData.expiresAt) {
        // Remove expired code
        delete storedCodes[email];
        await AsyncStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(storedCodes));

        return {
          success: false,
          error: 'Verification code has expired',
        };
      }

      // Verify the code
      if (verificationData.code === inputCode.trim()) {
        // Remove used code
        delete storedCodes[email];
        await AsyncStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(storedCodes));

        return {
          success: true,
          message: 'Email verified successfully',
        };
      } else {
        return {
          success: false,
          error: 'Invalid verification code',
        };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return {
        success: false,
        error: 'Failed to verify code',
      };
    }
  }

  async getStoredCodes() {
    try {
      const codes = await AsyncStorage.getItem(VERIFICATION_CODES_KEY);
      return codes ? JSON.parse(codes) : {};
    } catch (error) {
      console.error('Error getting stored codes:', error);
      return {};
    }
  }

  async clearExpiredCodes() {
    try {
      const storedCodes = await this.getStoredCodes();
      const now = Date.now();

      // Filter out expired codes
      const validCodes = {};
      for (const [email, data] of Object.entries(storedCodes)) {
        if (data.expiresAt > now) {
          validCodes[email] = data;
        }
      }

      await AsyncStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(validCodes));
    } catch (error) {
      console.error('Error clearing expired codes:', error);
    }
  }

  isValidGmail(email) {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  }
}

export default new EmailVerificationService();