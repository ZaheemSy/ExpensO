import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  FlatList
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import sheetsService from '../../services/sheetsService';

const ExpenseDetailsScreen = ({ navigation, route }) => {
  const { sheet } = route.params;
  const { userEmail } = useAuth();
  const refRBSheet = useRef();

  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [category, setCategory] = useState('');
  const [currentType, setCurrentType] = useState('Spend'); // 'Spend' or 'Received'
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem(`expenses_${sheet.id}_${userEmail}`);
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const saveExpenses = async (updatedExpenses) => {
    try {
      await AsyncStorage.setItem(`expenses_${sheet.id}_${userEmail}`, JSON.stringify(updatedExpenses));
      setExpenses(updatedExpenses);
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  };

  const handleSpendPress = () => {
    setCurrentType('Spend');
    refRBSheet.current.open();
  };

  const handleReceivedPress = () => {
    setCurrentType('Received');
    refRBSheet.current.open();
  };

  const resetForm = () => {
    setAmount('');
    setPurpose('');
    setCategory('');
  };

  const validateEntry = () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return false;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (!purpose.trim()) {
      Alert.alert('Error', 'Please enter a purpose');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateEntry()) {
      return;
    }

    setIsLoading(true);

    try {
      const expenseData = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        purpose: purpose.trim(),
        category: category.trim() || 'General',
        type: currentType,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString(),
        synced: false,
        sheetId: sheet.id
      };

      // Save locally first
      const updatedExpenses = [expenseData, ...expenses];
      await saveExpenses(updatedExpenses);

      // Try to sync to Google Sheets if sheet is synced
      if (sheet.googleSheetId) {
        try {
          const syncResult = await sheetsService.addExpense({
            ...expenseData,
            description: expenseData.purpose,
            paymentMethod: 'Not specified',
            notes: `Type: ${expenseData.type}`,
            spreadsheetId: sheet.googleSheetId
          });

          // Check if permissions are required
          if (syncResult.requiresPermission) {
            Alert.alert(
              'Google Sheets Access Required',
              'To sync your expenses, we need permission to access your Google Sheets.',
              [
                {
                  text: 'Continue Offline',
                  style: 'cancel'
                },
                {
                  text: 'Grant Access',
                  onPress: () => {
                    navigation.navigate('GooglePermissions', {
                      onPermissionGranted: () => {
                        // Don't retry automatically, user can try again
                        Alert.alert('Success', 'Permissions granted! Please try adding the expense again.');
                      }
                    });
                  }
                }
              ]
            );
          } else if (syncResult.success) {
            // Update the expense to mark it as synced
            expenseData.synced = true;
            const syncedExpenses = [expenseData, ...expenses];
            await saveExpenses(syncedExpenses);
          }
        } catch (syncError) {
          console.error('Sync error:', syncError);
          // Continue with local save even if sync fails
        }
      }

      resetForm();
      refRBSheet.current.close();

      Alert.alert(
        'Success',
        `${currentType} entry saved successfully!`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    refRBSheet.current.close();
  };

  const calculateTotal = () => {
    const spent = expenses
      .filter(expense => expense.type === 'Spend')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const received = expenses
      .filter(expense => expense.type === 'Received')
      .reduce((sum, expense) => sum + expense.amount, 0);

    return { spent, received, balance: received - spent };
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <Text style={[
          styles.expenseAmount,
          item.type === 'Spend' ? styles.spentAmount : styles.receivedAmount
        ]}>
          {item.type === 'Spend' ? '-' : '+'}${item.amount.toFixed(2)}
        </Text>
        <Text style={styles.expenseDate}>{item.date}</Text>
      </View>
      <Text style={styles.expensePurpose}>{item.purpose}</Text>
      <View style={styles.expenseFooter}>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={[styles.syncStatus, item.synced && styles.synced]}>
          {item.synced ? '✓ Synced' : '⏳ Local'}
        </Text>
      </View>
    </View>
  );

  const totals = calculateTotal();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{sheet.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryAmount, styles.spentAmount]}>
              -${totals.spent.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Received</Text>
            <Text style={[styles.summaryAmount, styles.receivedAmount]}>
              +${totals.received.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[
              styles.summaryAmount,
              totals.balance >= 0 ? styles.receivedAmount : styles.spentAmount
            ]}>
              ${totals.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Recent Expenses */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {expenses.length > 0 ? (
            <FlatList
              data={expenses.slice(0, 10)} // Show last 10 entries
              keyExtractor={(item) => item.id}
              renderItem={renderExpenseItem}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>Start by adding your first expense or income</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.spendButton} onPress={handleSpendPress}>
          <Text style={styles.actionButtonText}>Spend</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.receivedButton} onPress={handleReceivedPress}>
          <Text style={styles.actionButtonText}>Received</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet for Entry Form */}
      <RBSheet
        ref={refRBSheet}
        closeOnDragDown={true}
        closeOnPressMask={false}
        height={400}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
          draggableIcon: {
            backgroundColor: '#000',
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
        }}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Add {currentType} Entry</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus={true}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Purpose</Text>
              <TextInput
                style={styles.input}
                placeholder="What was this for?"
                value={purpose}
                onChangeText={setPurpose}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Food, Transport, Salary"
                value={category}
                onChangeText={setCategory}
              />
            </View>

            <View style={styles.bottomSheetButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RBSheet>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spentAmount: {
    color: '#dc3545',
  },
  receivedAmount: {
    color: '#28a745',
  },
  recentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  expenseItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666666',
  },
  expensePurpose: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncStatus: {
    fontSize: 10,
    color: '#ff9500',
    fontWeight: 'bold',
  },
  synced: {
    color: '#28a745',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  spendButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  receivedButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  bottomSheetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 20,
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
    backgroundColor: '#007bff',
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

export default ExpenseDetailsScreen;