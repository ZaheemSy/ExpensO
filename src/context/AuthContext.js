import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const authStatus = await authService.isAuthenticated();
      const email = await AsyncStorage.getItem('user_email');

      setIsAuthenticated(authStatus && !!email);
      setUserEmail(email);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email) => {
    try {
      await AsyncStorage.setItem('user_email', email);
      await AsyncStorage.setItem('auth_token', 'demo_token_' + Date.now());
      setUserEmail(email);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUserEmail(null);
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const value = {
    isAuthenticated,
    userEmail,
    isLoading,
    login,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};