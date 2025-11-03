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
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import ExpenseSyncService from '../../services/expenseSyncService';
import SyncService from '../../services/syncService';

const ExpenseHomeScreen = ({ navigation }) => {
  const { userEmail } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sheetName, setSheetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set user email in sync service
    if (userEmail) {
      ExpenseSyncService.setUserEmail(userEmail);
    }
    loadSheets();
  }, [userEmail]);

  const loadSheets = async () => {
    try {
      const expenseSheets = await ExpenseSyncService.getExpenseSheets();
      setSheets(expenseSheets);
    } catch (error) {
      console.error('Error loading sheets:', error);
      Alert.alert('Error', 'Failed to load expense sheets');
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

    // Check for duplicate sheet names
    const duplicateSheet = sheets.find(
      sheet => sheet.name.toLowerCase() === sheetName.trim().toLowerCase(),
    );

    if (duplicateSheet) {
      Alert.alert('Error', 'A sheet with this name already exists');
      return;
    }

    setIsLoading(true);

    try {
      const result = await ExpenseSyncService.createExpenseSheet({
        name: sheetName.trim(),
        userEmail,
      });

      if (result.success) {
        setIsModalVisible(false);
        setSheetName('');

        // Reload sheets to get the updated list
        await loadSheets();

        // Navigate to ExpenseDetailsScreen with the new sheet
        navigation.navigate('ExpenseDetails', {
          sheet: result.sheet,
        });

        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.error || 'Failed to create sheet');
      }
    } catch (error) {
      console.error('Error creating sheet:', error);
      Alert.alert('Error', 'Failed to create sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetPress = sheet => {
    navigation.navigate('ExpenseDetails', { sheet });
  };

  const handleManualSync = async () => {
    try {
      const result = await SyncService.manualSync();
      if (result.success) {
        Alert.alert('Success', result.message);
        // Reload sheets to reflect sync status
        await loadSheets();
      } else {
        Alert.alert('Sync Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync data');
    }
  };

  const handleCategoryManager = () => {
    navigation.navigate('CategoryManager');
  };

  const renderSheetItem = ({ item }) => {
    const totals = ExpenseSyncService.calculateSheetTotals(item);

    return (
      <TouchableOpacity
        style={styles.sheetItem}
        onPress={() => handleSheetPress(item)}
      >
        <View style={styles.sheetInfo}>
          <Text style={styles.sheetName}>{item.name}</Text>
          <Text style={styles.sheetDate}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <View style={styles.totalsContainer}>
            <Text style={styles.totalsText}>
              Spent: ₹{totals.spent.toFixed(2)} | Collected: ₹
              {totals.collected.toFixed(2)}
            </Text>
          </View>
          <View style={styles.syncStatus}>
            <Text style={[styles.syncText, item.synced && styles.syncedText]}>
              {item.synced ? '✓ Synced' : '⏳ Local'}
            </Text>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleManualSync}
          >
            <Text style={styles.syncButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddSheet}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Creating...' : '+ Create Sheet'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              sheets.length === 0 && styles.disabledButton,
            ]}
            onPress={() =>
              sheets.length > 0 && navigation.navigate('SheetList')
            }
            disabled={sheets.length === 0}
          >
            <Text style={styles.actionButtonText}>📂 Open Sheet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCategoryManager}
          >
            <Text style={styles.actionButtonText}>📊 Category Manager</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={sheets}
          keyExtractor={item => item.id}
          renderItem={renderSheetItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No expense sheets created yet
              </Text>
              <Text style={styles.emptySubtext}>
                Create your first sheet to get started
              </Text>
            </View>
          }
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButton: {
    padding: 8,
    marginLeft: 10,
  },
  syncButtonText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  actionButtons: {
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
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
  totalsContainer: {
    marginBottom: 5,
  },
  totalsText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
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
});

export default ExpenseHomeScreen;
