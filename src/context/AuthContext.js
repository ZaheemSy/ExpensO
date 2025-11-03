import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseEmailService from '../services/firebaseEmailService';
import ExpenseSyncService from '../services/expenseSyncService';
import { auth } from '../config/firebase';

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
    // Listen for Firebase auth state changes
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true);
        setUserEmail(user.email);
        // Initialize sync service with user email
        ExpenseSyncService.setUserEmail(user.email);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        ExpenseSyncService.setUserEmail(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const currentUser = auth().currentUser;

      if (currentUser && currentUser.emailVerified) {
        setIsAuthenticated(true);
        setUserEmail(currentUser.email);
        ExpenseSyncService.setUserEmail(currentUser.email);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        ExpenseSyncService.setUserEmail(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUserEmail(null);
      ExpenseSyncService.setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Use Firebase authentication
      const result = await firebaseEmailService.signInWithEmail(
        email,
        password,
      );

      if (result.success) {
        setUserEmail(result.user.email);
        setIsAuthenticated(true);
        // Initialize sync service
        ExpenseSyncService.setUserEmail(result.user.email);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Remove Google login for now since authService is not defined
      // You can implement this later when you set up Google authentication
      console.log('Google login not implemented yet');
      return { success: false, error: 'Google login not available yet' };

      // If you want to implement Google login later, uncomment this:
      /*
      const result = await authService.signInWithGoogle();
      if (result.success) {
        setUserEmail(result.userInfo.user.email);
        setIsAuthenticated(true);
        ExpenseSyncService.setUserEmail(result.userInfo.user.email);
        return { success: true, userInfo: result.userInfo };
      } else {
        return { success: false, error: result.message };
      }
      */
    } catch (error) {
      console.error('Error during Google login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await firebaseEmailService.signOut();
      setIsAuthenticated(false);
      setUserEmail(null);
      ExpenseSyncService.setUserEmail(null);
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const sendPasswordResetEmail = async email => {
    try {
      await auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      // Return the error message from Firebase
      return { success: false, error: error.message };
    }
  };

  const value = {
    isAuthenticated,
    userEmail,
    isLoading,
    login,
    loginWithGoogle,
    logout,
    refreshAuth,
    sendPasswordResetEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
