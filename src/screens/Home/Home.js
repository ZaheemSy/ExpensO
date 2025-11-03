import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

const Home = ({ navigation }) => {
  const { logout, userEmail } = useAuth();

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.success) {
        Alert.alert('Error', result.error || 'Logout failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  const handleExpensoPress = () => {
    navigation.navigate('ExpenseHome');
  };

  const handleProxpencePress = () => {
    Alert.alert('Coming Soon', 'Proxpence feature will be available soon!');
  };

  const handleDebtPress = () => {
    Alert.alert(
      'Coming Soon',
      'Debt management feature will be available soon!',
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with User Details */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Icon name="person-circle-outline" size={60} color="#007bff" />
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Welcome!</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color="#dc3545" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Icons Menu */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Manage Your Expenses</Text>

        <View style={styles.iconsGrid}>
          {/* Expenso Icon */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleExpensoPress}
          >
            <View style={[styles.iconContainer, styles.expensoIcon]}>
              <Icon name="wallet-outline" size={32} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Expenso</Text>
            <Text style={styles.menuItemSubtext}>Expense Sheets</Text>
          </TouchableOpacity>

          {/* Proxpence Icon */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleProxpencePress}
          >
            <View style={[styles.iconContainer, styles.proxpenceIcon]}>
              <Icon name="trending-up-outline" size={32} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Proxpence</Text>
            <Text style={styles.menuItemSubtext}>Coming Soon</Text>
          </TouchableOpacity>

          {/* Debt Icon */}
          <TouchableOpacity style={styles.menuItem} onPress={handleDebtPress}>
            <View style={[styles.iconContainer, styles.debtIcon]}>
              <Icon name="card-outline" size={32} color="#ffffff" />
            </View>
            <Text style={styles.menuItemText}>Debt</Text>
            <Text style={styles.menuItemSubtext}>Coming Soon</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats/Summary */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Quick Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Sheets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₹0</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₹0</Text>
            <Text style={styles.statLabel}>Total Collected</Text>
          </View>
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  logoutText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  menuContainer: {
    padding: 20,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 25,
  },
  iconsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  expensoIcon: {
    backgroundColor: '#007bff',
  },
  proxpenceIcon: {
    backgroundColor: '#28a745',
  },
  debtIcon: {
    backgroundColor: '#ffc107',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  menuItemSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  statsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default Home;
