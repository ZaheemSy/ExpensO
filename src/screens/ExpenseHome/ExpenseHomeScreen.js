import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import sheetsService from '../../services/sheetsService';

const ExpenseHomeScreen = ({ navigation }) => {
  const { userEmail } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sheetName, setSheetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      const storedSheets = await AsyncStorage.getItem(`expense_sheets_${userEmail}`);
      if (storedSheets) {
        setSheets(JSON.parse(storedSheets));
      }
    } catch (error) {
      console.error('Error loading sheets:', error);
    }
  };

  const saveSheets = async (updatedSheets) => {
    try {
      await AsyncStorage.setItem(`expense_sheets_${userEmail}`, JSON.stringify(updatedSheets));
      setSheets(updatedSheets);
    } catch (error) {
      console.error('Error saving sheets:', error);
    }
  };

  const handleAddSheet = () => {
    setIsModalVisible(true);
    setSheetName('');
  };

  const handleSaveAndOpen = async () => {
    if (!sheetName.trim()) {
      Alert.alert('Error', 'Please enter a sheet name');
      return;
    }

    setIsLoading(true);

    try {
      // Create sheet in Google Sheets
      const result = await sheetsService.createExpenseSheet(userEmail);

      // Check if permissions are required
      if (result.requiresPermission) {
        setIsLoading(false);
        setIsModalVisible(false);

        Alert.alert(
          'Google Sheets Access Required',
          'To sync your expense sheets with Google Sheets, we need your permission to access your Google account.',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Grant Access',
              onPress: () => {
                navigation.navigate('GooglePermissions', {
                  onPermissionGranted: () => {
                    // Retry creating the sheet after permissions are granted
                    handleSaveAndOpen();
                  }
                });
              }
            }
          ]
        );
        return;
      }

      const newSheet = {
        id: Date.now().toString(),
        name: sheetName.trim(),
        createdAt: new Date().toISOString(),
        googleSheetId: result.success ? result.spreadsheetId : null,
        synced: result.success,
        lastModified: new Date().toISOString()
      };

      const updatedSheets = [newSheet, ...sheets];
      await saveSheets(updatedSheets);

      setIsModalVisible(false);
      setSheetName('');

      // Navigate to ExpenseDetailsScreen
      navigation.navigate('ExpenseDetails', {
        sheet: newSheet
      });

      if (result.success) {
        Alert.alert('Success', 'Sheet created and synced to Google Sheets!');
      } else {
        Alert.alert('Info', 'Sheet created locally. Will sync when internet is available.');
      }

    } catch (error) {
      console.error('Error creating sheet:', error);
      Alert.alert('Error', 'Failed to create sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetPress = (sheet) => {
    navigation.navigate('ExpenseDetails', { sheet });
  };

  const renderSheetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => handleSheetPress(item)}
    >
      <View style={styles.sheetInfo}>
        <Text style={styles.sheetName}>{item.name}</Text>
        <Text style={styles.sheetDate}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.syncStatus}>
          <Text style={[styles.syncText, item.synced && styles.syncedText]}>
            {item.synced ? '✓ Synced' : '⏳ Local'}
          </Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Expense Sheets</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <FlatList
          data={sheets}
          keyExtractor={(item) => item.id}
          renderItem={renderSheetItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expense sheets created yet</Text>
              <Text style={styles.emptySubtext}>Tap the button below to create your first sheet</Text>
            </View>
          }
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddSheet}
          disabled={isLoading}
        >
          <Text style={styles.addButtonText}>
            {isLoading ? 'Creating...' : '+ Add Sheet'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Sheet</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Enter sheet name"
              value={sheetName}
              onChangeText={setSheetName}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                onPress={handleSaveAndOpen}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Creating...' : 'Save and Open'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  list: {
    flex: 1,
  },
  sheetItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sheetInfo: {
    flex: 1,
  },
  sheetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  sheetDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  syncStatus: {
    alignSelf: 'flex-start',
  },
  syncText: {
    fontSize: 12,
    color: '#ff9500',
    fontWeight: 'bold',
  },
  syncedText: {
    color: '#28a745',
  },
  arrow: {
    fontSize: 24,
    color: '#cccccc',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
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
    width: '85%',
    borderRadius: 15,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 25,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default ExpenseHomeScreen;