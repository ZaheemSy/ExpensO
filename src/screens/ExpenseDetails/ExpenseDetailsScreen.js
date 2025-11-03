import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import ExpenseSyncService from '../../services/expenseSyncService';

const ExpenseDetailsScreen = ({ navigation, route }) => {
  const { sheet } = route.params;
  const { userEmail } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentType, setCurrentType] = useState('spend'); // 'spend' or 'collected'

  // Form state
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Misc');
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (userEmail) {
      ExpenseSyncService.setUserEmail(userEmail);
    }
    loadExpenses();
    loadCategories();
  }, [userEmail, sheet.id]);

  const loadExpenses = async () => {
    try {
      const expenseList = await ExpenseSyncService.getExpenses(sheet.id);
      setExpenses(expenseList);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoryList = await ExpenseSyncService.getCategories();
      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddExpense = type => {
    setCurrentType(type);
    resetForm();
    setIsAddModalVisible(true);
  };

  const resetForm = () => {
    setAmount('');
    setPurpose('');
    setSelectedCategory('Misc');
    setImage(null);
  };

  const validateForm = () => {
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

  const handleSaveExpense = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const expenseData = {
        amount: parseFloat(amount),
        purpose: purpose.trim(),
        category: selectedCategory,
        type: currentType,
        image: image,
      };

      const result = await ExpenseSyncService.addExpense(sheet.id, expenseData);

      if (result.success) {
        resetForm();
        setIsAddModalVisible(false);
        await loadExpenses(); // Reload expenses to show the new one

        Alert.alert(
          'Success',
          `${
            currentType === 'spend' ? 'Expense' : 'Income'
          } added successfully!`,
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = expenseId => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(expenseId),
        },
      ],
    );
  };

  const deleteExpense = async expenseId => {
    try {
      const result = await ExpenseSyncService.deleteExpense(
        sheet.id,
        expenseId,
      );

      if (result.success) {
        await loadExpenses(); // Reload expenses
        Alert.alert('Success', 'Expense deleted successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const calculateTotals = () => {
    const spent = expenses
      .filter(expense => expense.type === 'spend')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const collected = expenses
      .filter(expense => expense.type === 'collected')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const balance = collected - spent;

    return { spent, collected, balance };
  };

  const totals = calculateTotals();

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              item.type === 'spend'
                ? styles.spentAmount
                : styles.collectedAmount,
            ]}
          >
            {item.type === 'spend' ? '-' : '+'}₹{item.amount.toFixed(2)}
          </Text>
          <Text style={styles.expenseDate}>{item.date}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteExpense(item.id)}
        >
          <Icon name="trash-outline" size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>

      <Text style={styles.purpose}>{item.purpose}</Text>

      <View style={styles.expenseFooter}>
        <View
          style={[
            styles.categoryBadge,
            item.category === 'Misc' && styles.miscBadge,
          ]}
        >
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      {item.image && (
        <TouchableOpacity style={styles.imagePreview}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <Icon name="eye-outline" size={16} color="#666666" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCategoryOption = category => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryOption,
        selectedCategory === category && styles.selectedCategoryOption,
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text
        style={[
          styles.categoryOptionText,
          selectedCategory === category && styles.selectedCategoryOptionText,
        ]}
      >
        {category}
      </Text>
      {selectedCategory === category && (
        <Icon name="checkmark" size={16} color="#007bff" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#007bff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {sheet.name}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.pinButton}>
            <Icon name="pin-outline" size={20} color="#666666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadButton}>
            <Icon name="download-outline" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Icon name="arrow-down-circle" size={24} color="#dc3545" />
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[styles.summaryAmount, styles.spentAmount]}>
              ₹{totals.spent.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Icon name="arrow-up-circle" size={24} color="#28a745" />
            <Text style={styles.summaryLabel}>Total Collected</Text>
            <Text style={[styles.summaryAmount, styles.collectedAmount]}>
              ₹{totals.collected.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Icon
              name="wallet-outline"
              size={24}
              color={totals.balance >= 0 ? '#28a745' : '#dc3545'}
            />
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text
              style={[
                styles.summaryAmount,
                totals.balance >= 0
                  ? styles.collectedAmount
                  : styles.spentAmount,
              ]}
            >
              ₹{Math.abs(totals.balance).toFixed(2)}
              {totals.balance >= 0 ? ' Surplus' : ' Deficit'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.spendButton]}
            onPress={() => handleAddExpense('spend')}
          >
            <Icon name="arrow-down-circle" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Add Spend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.collectButton]}
            onPress={() => handleAddExpense('collected')}
          >
            <Icon name="arrow-up-circle" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Add Collected</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.transactionCount}>
              {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>

          {expenses.length > 0 ? (
            <FlatList
              data={expenses}
              keyExtractor={item => item.id}
              renderItem={renderExpenseItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="receipt-outline" size={60} color="#cccccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Start by adding your first expense or income
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {currentType === 'spend' ? 'Spend' : 'Collected'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                disabled={isLoading}
              >
                <Icon name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    autoFocus={true}
                  />
                </View>
              </View>

              {/* Purpose Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Purpose *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={`What was this ${
                    currentType === 'spend' ? 'expense' : 'income'
                  } for?`}
                  value={purpose}
                  onChangeText={setPurpose}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoriesContainer}>
                  {categories.map(renderCategoryOption)}
                </View>
              </View>

              {/* Image Upload (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Attach Image (Optional)</Text>
                <TouchableOpacity style={styles.imageUploadButton}>
                  <Icon name="camera-outline" size={20} color="#666666" />
                  <Text style={styles.imageUploadText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsAddModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                onPress={handleSaveExpense}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading
                    ? 'Saving...'
                    : `Add ${currentType === 'spend' ? 'Spend' : 'Income'}`}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
    marginLeft: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinButton: {
    padding: 8,
    marginRight: 5,
  },
  downloadButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  spentAmount: {
    color: '#dc3545',
  },
  collectedAmount: {
    color: '#28a745',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  spendButton: {
    backgroundColor: '#dc3545',
  },
  collectButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  transactionCount: {
    fontSize: 14,
    color: '#666666',
  },
  expenseItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  amountContainer: {
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#666666',
  },
  deleteButton: {
    padding: 4,
  },
  purpose: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  miscBadge: {
    backgroundColor: '#fff3cd',
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  time: {
    fontSize: 12,
    color: '#666666',
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  formContainer: {
    padding: 20,
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
    gap: 6,
  },
  selectedCategoryOption: {
    backgroundColor: '#e7f3ff',
    borderColor: '#007bff',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedCategoryOptionText: {
    color: '#007bff',
    fontWeight: '500',
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 15,
    gap: 8,
  },
  imageUploadText: {
    fontSize: 16,
    color: '#666666',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
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
