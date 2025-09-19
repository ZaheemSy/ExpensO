import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Button1 from '../../components/Buttons/Button1';
import { useAuth } from '../../context/AuthContext';

const Home = ({ navigation }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert('Error', result.error || 'Logout failed');
    }
    // Navigation will be handled automatically by the auth state change
  };

  const handleExpensoPress = () => {
    navigation.navigate('Expenso');
  };

  const handleDebtPress = () => {
    navigation.navigate('Debt');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ExpensO</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to your expense tracker!</Text>
        <Text style={styles.subtitle}>Start managing your expenses efficiently</Text>

        <View style={styles.buttonContainer}>
          <Button1
            title="Expenso"
            onPress={handleExpensoPress}
            style={styles.navButton}
          />
          <Button1
            title="Debt"
            onPress={handleDebtPress}
            style={[styles.navButton, styles.debtButton]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#dc3545',
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 40,
    width: '100%',
    paddingHorizontal: 20,
  },
  navButton: {
    width: '100%',
    marginVertical: 8,
  },
  debtButton: {
    backgroundColor: '#28a745',
  },
});

export default Home;