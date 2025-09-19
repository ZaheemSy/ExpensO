import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button1 from '../../components/Buttons/Button1';
import { useAuth } from '../../context/AuthContext';
import googleSheetsService from '../../services/googleSheetsService';

const Home = ({ navigation }) => {
  const { logout, userEmail } = useAuth();
  const [value, setValue] = useState('');
  const [savedValues, setSavedValues] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    loadSavedValues();
  }, []);

  const loadSavedValues = async () => {
    try {
      const stored = await AsyncStorage.getItem(`values_${userEmail}`);
      if (stored) {
        setSavedValues(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved values:', error);
    }
  };

  const saveValueLocally = async (newValue) => {
    try {
      const now = new Date();
      const valueEntry = {
        id: Date.now().toString(),
        value: newValue,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        synced: false
      };

      const updatedValues = [valueEntry, ...savedValues];
      setSavedValues(updatedValues);
      await AsyncStorage.setItem(`values_${userEmail}`, JSON.stringify(updatedValues));
      return valueEntry;
    } catch (error) {
      console.error('Error saving value locally:', error);
      throw error;
    }
  };

  const syncToGoogleSheets = async (valueEntry) => {
    try {
      const result = await googleSheetsService.syncValueToSheet(valueEntry.value);
      if (result.success) {
        // Mark as synced
        const updatedValues = savedValues.map(item =>
          item.id === valueEntry.id ? { ...item, synced: true } : item
        );
        setSavedValues(updatedValues);
        await AsyncStorage.setItem(`values_${userEmail}`, JSON.stringify(updatedValues));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!value.trim()) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    try {
      // Save locally first
      const valueEntry = await saveValueLocally(value.trim());
      setValue('');

      // Try to sync to Google Sheets if internet is available
      const synced = await syncToGoogleSheets(valueEntry);

      Alert.alert(
        'Success',
        synced
          ? 'Value saved and synced to Google Sheets!'
          : 'Value saved locally. Will sync when internet is available.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save value');
    }
  };

  const handleCheck = () => {
    setIsModalVisible(true);
  };

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

        <View style={styles.valueContainer}>
          <Text style={styles.valueLabel}>Value:</Text>
          <TextInput
            style={styles.valueInput}
            placeholder="Enter a value"
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
          />
          <View style={styles.valueButtonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
              <Text style={styles.checkButtonText}>Check</Text>
            </TouchableOpacity>
          </View>
        </View>

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

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Values</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={savedValues}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.valueItem}>
                  <View style={styles.valueRow}>
                    <Text style={styles.valueText}>{item.value}</Text>
                    <Text style={[styles.syncStatus, item.synced && styles.synced]}>
                      {item.synced ? '✓ Synced' : '⏳ Local'}
                    </Text>
                  </View>
                  <Text style={styles.dateTimeText}>
                    {item.date} at {item.time}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No values saved yet</Text>
              }
            />
          </View>
        </View>
      </Modal>
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
  valueContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  valueLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  valueInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  valueButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxHeight: '70%',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
  },
  valueItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 15,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  syncStatus: {
    fontSize: 12,
    color: '#ff9500',
    fontWeight: 'bold',
  },
  synced: {
    color: '#28a745',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    marginTop: 20,
  },
});

export default Home;