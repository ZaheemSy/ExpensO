import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
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
      await AsyncStorage.removeItem('user_email');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_info');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const userInfo = await AsyncStorage.getItem('user_info');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

export default new AuthService();