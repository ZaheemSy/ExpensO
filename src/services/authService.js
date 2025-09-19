import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // Simulated Google Sign-In for demo (replace with real implementation later)
  async signInWithGoogle() {
    try {
      // For demo purposes, we'll simulate Google sign-in
      const mockUserInfo = {
        user: {
          email: 'demo@gmail.com',
          name: 'Demo User',
          id: 'demo_user_id'
        },
        idToken: 'demo_id_token_' + Date.now(),
        serverAuthCode: 'demo_server_auth_code'
      };

      await this.storeUserInfo(mockUserInfo);
      return { success: true, userInfo: mockUserInfo };
    } catch (error) {
      console.error('Demo Google Sign-In Error:', error);
      return { success: false, message: 'Demo sign in failed: ' + error.message };
    }
  }

  async storeUserInfo(userInfo) {
    try {
      await AsyncStorage.setItem('google_user_info', JSON.stringify(userInfo));
      await AsyncStorage.setItem('user_email', userInfo.user.email);
      await AsyncStorage.setItem('user_name', userInfo.user.name);
      await AsyncStorage.setItem('auth_token', userInfo.idToken);
      await AsyncStorage.setItem('access_token', userInfo.serverAuthCode || '');
    } catch (error) {
      console.error('Error storing user info:', error);
      throw error;
    }
  }

  async getStoredUserInfo() {
    try {
      const userInfo = await AsyncStorage.getItem('google_user_info');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error getting stored user info:', error);
      return null;
    }
  }

  async getAccessToken() {
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      return storedToken || 'demo_access_token';
    } catch (error) {
      console.error('Error getting access token:', error);
      return 'demo_access_token';
    }
  }

  async isAuthenticated() {
    try {
      const userEmail = await AsyncStorage.getItem('user_email');
      const authToken = await AsyncStorage.getItem('auth_token');
      return !!userEmail && !!authToken;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('google_user_info');
      await AsyncStorage.removeItem('user_email');
      await AsyncStorage.removeItem('user_name');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('verification_code');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const storedUserInfo = await AsyncStorage.getItem('google_user_info');
      return storedUserInfo ? JSON.parse(storedUserInfo) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // User registration system
  async register(email, password, isVerified = true) {
    try {
      // Store registered users in AsyncStorage (in real app, this would be on server)
      const registeredUsersKey = 'registered_users';
      const existingUsers = await AsyncStorage.getItem(registeredUsersKey);
      const users = existingUsers ? JSON.parse(existingUsers) : [];

      // Check if user already exists
      const userExists = users.find(user => user.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return { success: false, error: 'User already registered. Please login instead.' };
      }

      // Add new user
      const newUser = {
        email: email.toLowerCase(),
        password, // In real app, this should be hashed
        registeredAt: new Date().toISOString(),
        verified: isVerified
      };

      users.push(newUser);
      await AsyncStorage.setItem(registeredUsersKey, JSON.stringify(users));

      return { success: true, message: 'User registered successfully' };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async registerUser(email, password) {
    return await this.register(email, password, false);
  }

  async loginWithEmailPassword(email, password) {
    try {
      // Get registered users
      const registeredUsersKey = 'registered_users';
      const existingUsers = await AsyncStorage.getItem(registeredUsersKey);
      const users = existingUsers ? JSON.parse(existingUsers) : [];

      // Find user
      const user = users.find(u =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        return { success: false, message: 'Invalid email or password. Please signup if you don\'t have an account.' };
      }

      // Store login session
      const userInfo = {
        user: {
          email: user.email,
          name: user.email.split('@')[0], // Use email prefix as name
          id: 'user_' + Date.now()
        },
        idToken: 'token_' + Date.now(),
        serverAuthCode: 'auth_' + Date.now()
      };

      await this.storeUserInfo(userInfo);
      return { success: true, userInfo };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  async isEmailRegistered(email) {
    try {
      const registeredUsersKey = 'registered_users';
      const existingUsers = await AsyncStorage.getItem(registeredUsersKey);
      const users = existingUsers ? JSON.parse(existingUsers) : [];

      return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    } catch (error) {
      console.error('Error checking email registration:', error);
      return false;
    }
  }

  // Email verification functionality
  async sendVerificationCode(email) {
    // In a real app, this would send an email through your backend
    // For demo purposes, we'll generate a random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await AsyncStorage.setItem('verification_code', code);
    await AsyncStorage.setItem('verification_email', email);

    console.log('Verification code (demo):', code); // In real app, this would be sent via email
    return { success: true, message: 'Verification code sent to ' + email };
  }

  async verifyCodeAndRegister(inputCode, password) {
    try {
      const storedCode = await AsyncStorage.getItem('verification_code');
      const email = await AsyncStorage.getItem('verification_email');

      if (inputCode !== storedCode) {
        return { success: false, message: 'Invalid verification code' };
      }

      // Code is valid, now register the user
      const registerResult = await this.registerUser(email, password);
      if (registerResult.success) {
        await AsyncStorage.removeItem('verification_code');
        await AsyncStorage.removeItem('verification_email');

        // Mark user as verified
        const registeredUsersKey = 'registered_users';
        const existingUsers = await AsyncStorage.getItem(registeredUsersKey);
        const users = existingUsers ? JSON.parse(existingUsers) : [];

        const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (userIndex !== -1) {
          users[userIndex].verified = true;
          await AsyncStorage.setItem(registeredUsersKey, JSON.stringify(users));
        }

        return { success: true, email, message: 'Account verified and registered successfully!' };
      } else {
        return registerResult;
      }
    } catch (error) {
      return { success: false, message: 'Error verifying code' };
    }
  }
}

export default new AuthService();