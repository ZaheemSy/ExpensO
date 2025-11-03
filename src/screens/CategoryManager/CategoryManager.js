import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import ExpenseSyncService from '../../services/expenseSyncService';

const CategoryManager = ({ navigation }) => {
  const { userEmail } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userEmail) {
      ExpenseSyncService.setUserEmail(userEmail);
    }
    loadCategories();
  }, [userEmail]);

  const loadCategories = async () => {
    try {
      const categoryList = await ExpenseSyncService.getCategories();
      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Check for duplicates (case insensitive)
    const duplicateCategory = categories.find(
      cat => cat.toLowerCase() === newCategoryName.trim().toLowerCase(),
    );

    if (duplicateCategory) {
      Alert.alert(
        'Category Exists',
        `Category "${newCategoryName}" already exists. Please choose a different name.`,
        [{ text: 'OK' }],
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await ExpenseSyncService.addCategory(
        newCategoryName.trim(),
      );

      if (result.success) {
        setNewCategoryName('');
        setIsAddModalVisible(false);
        await loadCategories(); // Reload categories
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = categoryName => {
    // Prevent deleting "Misc" category
    if (categoryName.toLowerCase() === 'misc') {
      Alert.alert(
        'Cannot Delete',
        'The "Misc" category cannot be deleted as it is the default category.',
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(categoryName),
        },
      ],
    );
  };

  const deleteCategory = async categoryName => {
    try {
      const result = await ExpenseSyncService.deleteCategory(categoryName);

      if (result.success) {
        await loadCategories(); // Reload categories
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      Alert.alert('Error', 'Failed to delete category');
    }
  };

  const renderCategoryItem = ({ item, index }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryLeft}>
        <View
          style={[
            styles.categoryIcon,
            item.toLowerCase() === 'misc' ? styles.miscIcon : styles.customIcon,
          ]}
        >
          <Icon
            name={item.toLowerCase() === 'misc' ? 'star' : 'pricetag'}
            size={18}
            color="#ffffff"
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item}</Text>
          <Text style={styles.categoryType}>
            {item.toLowerCase() === 'misc'
              ? 'Default Category'
              : 'Custom Category'}
          </Text>
        </View>
      </View>

      {item.toLowerCase() !== 'misc' && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(item)}
        >
          <Icon name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      )}
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={styles.headerInfo}>
      <Text style={styles.infoText}>
        • "Misc" is the default category and cannot be deleted{'\n'}• Categories
        are used to organize your expenses{'\n'}• Each category name must be
        unique
      </Text>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="pricetags-outline" size={60} color="#cccccc" />
      <Text style={styles.emptyText}>No categories found</Text>
      <Text style={styles.emptySubtext}>
        Start by adding your first custom category
      </Text>
    </View>
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
        <Text style={styles.title}>Category Manager</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Icon name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item, index) => item + index}
        renderItem={renderCategoryItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Category Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <Text style={styles.modalSubtitle}>
              Enter a unique name for your new category
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="e.g., Food, Transport, Entertainment"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus={true}
              maxLength={30}
              autoCapitalize="words"
            />

            <View style={styles.validationInfo}>
              <Text style={styles.validationText}>
                • Must be unique{'\n'}• Max 30 characters{'\n'}• Cannot be
                "Misc"
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsAddModalVisible(false);
                  setNewCategoryName('');
                }}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                onPress={handleAddCategory}
                disabled={isLoading || !newCategoryName.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Adding...' : 'Add Category'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  addButton: {
    padding: 5,
  },
  listContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerInfo: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  infoText: {
    fontSize: 14,
    color: '#0066cc',
    lineHeight: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  miscIcon: {
    backgroundColor: '#ff6b35', // Orange for default category
  },
  customIcon: {
    backgroundColor: '#007bff', // Blue for custom categories
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  categoryType: {
    fontSize: 12,
    color: '#666666',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 15,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '100%',
    borderRadius: 15,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  validationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  validationText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
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

export default CategoryManager;
