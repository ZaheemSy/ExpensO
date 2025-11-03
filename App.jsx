/**
 * ExpensO App
 * Expense tracking application
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import Splashscreen from './src/screens/Splashscreen/Splashscreen';
import LoginScreen from './src/screens/Landing/LoginScreen';
import Signup from './src/screens/SignUp/Signup';
import Home from './src/screens/Home/Home';
import Expenso from './src/screens/Expenso/Expenso';
import Debt from './src/screens/Debt/Debt';
import ForgotPasswordScreen from './src/screens/Landing/ForgotPasswordScreen';
import ExpenseHomeScreen from './src/screens/ExpenseHome/ExpenseHomeScreen';
import CategoryManager from './src/screens/CategoryManager/CategoryManager';
import ExpenseDetailsScreen from './src/screens/ExpenseDetails/ExpenseDetailsScreen';
import SheetListScreen from './src/screens/SheetList/SheetListScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Splashscreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? 'Home' : 'LoginScreen'}
          screenOptions={{
            headerShown: false,
          }}
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Expenso" component={Expenso} />
              <Stack.Screen name="Debt" component={Debt} />
              <Stack.Screen name="ExpenseHome" component={ExpenseHomeScreen} />
              <Stack.Screen
                name="CategoryManager"
                component={CategoryManager}
              />
              <Stack.Screen
                name="ExpenseDetails"
                component={ExpenseDetailsScreen}
              />

              <Stack.Screen name="SheetList" component={SheetListScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="Signup" component={Signup} />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

export default App;
