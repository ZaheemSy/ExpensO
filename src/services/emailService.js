import AsyncStorage from '@react-native-async-storage/async-storage';
import { openComposer } from 'react-native-email-link';
import { EMAIL_CONFIG } from '../config/googleConfig';

class EmailService {
  constructor() {
    // React Native email service using device's email client
  }

  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async storeVerificationCode(email, code) {
    try {
      const verificationData = {
        email,
        code,
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      };
      await AsyncStorage.setItem('verification_code', JSON.stringify(verificationData));
    } catch (error) {
      console.error('Error storing verification code:', error);
      throw error;
    }
  }

  async getStoredVerificationCode() {
    try {
      const data = await AsyncStorage.getItem('verification_code');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting verification code:', error);
      return null;
    }
  }

  async verifyCode(email, inputCode) {
    try {
      const storedData = await this.getStoredVerificationCode();

      if (!storedData) {
        return { success: false, message: 'No verification code found' };
      }

      if (storedData.email !== email) {
        return { success: false, message: 'Email does not match' };
      }

      if (Date.now() > storedData.expiresAt) {
        await AsyncStorage.removeItem('verification_code');
        return { success: false, message: 'Verification code expired' };
      }

      if (storedData.code !== inputCode) {
        return { success: false, message: 'Invalid verification code' };
      }

      await AsyncStorage.removeItem('verification_code');
      await AsyncStorage.setItem('user_email', email);

      return { success: true, message: 'Verification successful' };
    } catch (error) {
      console.error('Error verifying code:', error);
      return { success: false, message: 'Verification failed' };
    }
  }


  async sendVerificationEmail(email, code) {
    try {
      const subject = `${EMAIL_CONFIG.serviceName} - Verification Code: ${code}`;
      const body = `Hello,\n\nYour verification code for ${EMAIL_CONFIG.serviceName} is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\n${EMAIL_CONFIG.serviceName} Team`;

      await openComposer({
        to: email,
        subject: subject,
        body: body
      });

      return { success: true, message: 'Email composer opened' };
    } catch (error) {
      console.error('Error opening email composer:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email) {
    try {
      const subject = `Welcome to ${EMAIL_CONFIG.serviceName}!`;
      const body = `Welcome to ${EMAIL_CONFIG.serviceName}!\n\nYour account has been successfully verified and is now active.\n\nYou can now start tracking your expenses and managing your finances with our app.\n\nBest regards,\n${EMAIL_CONFIG.serviceName} Team`;

      await openComposer({
        to: email,
        subject: subject,
        body: body
      });

      return { success: true, message: 'Welcome email composer opened' };
    } catch (error) {
      console.error('Error opening welcome email composer:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();