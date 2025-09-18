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

import Splashscreen from './src/screens/Splashscreen/Splashscreen';
import Landingscreen from './src/screens/Landing/Landingscreen';
import Signup from './src/screens/SignUp/Signup';
import Home from './src/screens/Home/Home';
import Expenso from './src/screens/Expenso/Expenso';
import Debt from './src/screens/Debt/Debt';

const Stack = createStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
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
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Landing" component={Landingscreen} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="Home" component={Home} />
           <Stack.Screen name="Expenso" component={Expenso} />
            <Stack.Screen name="Debt" component={Debt} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
