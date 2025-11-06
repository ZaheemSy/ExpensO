import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import ExpenseSyncService from '../../services/expenseSyncService';
import SheetSyncFixer from '../../utils/sheetSyncFixer';

const SheetListScreen = ({ navigation, route }) => {
  const { userEmail } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingSheetId, setSyncingSheetId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
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
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSheets();
  };

  const handleSheetPress = sheet => {
    navigation.navigate('ExpenseDetails', { sheet });
  };

  const handleCreateNewSheet = () => {
    navigation.navigate('ExpensoHomePage');
  };

  const handleSyncSheet = async (sheetId, sheetName) => {
    setSyncingSheetId(sheetId);

    try {
      const result = await SheetSyncFixer.fixLocalSheet(sheetId, userEmail);

      if (result.success) {
        if (result.alreadySynced) {
          Alert.alert('Already Synced', result.message);
        } else {
          Alert.alert(
            'Success',
            `${sheetName} synced successfully!\n${
              result.expensesSyncing > 0
                ? `Syncing ${result.expensesSyncing} expenses...`
                : 'All data synced.'
            }`,
          );
        }
        // Reload sheets to show updated sync status
        await loadSheets();
      } else {
        Alert.alert('Sync Failed', result.error || 'Failed to sync sheet');
      }
    } catch (error) {
      console.error('Error syncing sheet:', error);
      Alert.alert('Error', 'Failed to sync sheet');
    } finally {
      setSyncingSheetId(null);
    }
  };

  const handleSyncAllSheets = async () => {
    const localSheets = sheets.filter(
      sheet => !sheet.googleSheetId || !sheet.synced,
    );

    if (localSheets.length === 0) {
      Alert.alert(
        'All Synced',
        'All sheets are already synced with Google Sheets',
      );
      return;
    }

    Alert.alert(
      'Sync All Sheets',
      `Found ${localSheets.length} unsynced sheet(s). Do you want to sync them all?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync All',
          onPress: async () => {
            setSyncingAll(true);
            try {
              const result = await SheetSyncFixer.fixAllLocalSheets(userEmail);

              if (result.success) {
                Alert.alert('Sync Complete', result.message, [
                  { text: 'OK', onPress: () => loadSheets() },
                ]);
              } else {
                Alert.alert(
                  'Sync Failed',
                  result.error || 'Failed to sync sheets',
                );
              }
            } catch (error) {
              console.error('Error syncing all sheets:', error);
              Alert.alert('Error', 'Failed to sync sheets');
            } finally {
              setSyncingAll(false);
            }
          },
        },
      ],
    );
  };

  const getSheetStats = sheet => {
    const totals = ExpenseSyncService.calculateSheetTotals(sheet);
    const transactionCount = sheet.transactions?.length || 0;

    return {
      ...totals,
      transactionCount,
      lastTransaction: sheet.transactions?.[0]
        ? new Date(sheet.transactions[0].createdAt).toLocaleDateString()
        : 'No transactions',
    };
  };

  const renderSheetItem = ({ item }) => {
    const stats = getSheetStats(item);
    const isUnsynced = !item.googleSheetId || !item.synced;
    const isSyncing = syncingSheetId === item.id;

    return (
      <TouchableOpacity
        style={styles.sheetItem}
        onPress={() => handleSheetPress(item)}
        disabled={isSyncing}
      >
        <View style={styles.sheetHeader}>
          <View style={styles.sheetInfo}>
            <Text style={styles.sheetName}>{item.name}</Text>
            <Text style={styles.sheetDate}>
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.sheetActions}>
            <View
              style={[
                styles.syncStatus,
                item.synced ? styles.synced : styles.notSynced,
              ]}
            >
              <Text style={styles.syncStatusText}>
                {item.synced ? '✓ Synced' : '⏳ Local'}
              </Text>
            </View>

            {/* Sync Button - Only show for unsynced sheets */}
            {isUnsynced && (
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  isSyncing && styles.syncButtonDisabled,
                ]}
                onPress={() => handleSyncSheet(item.id, item.name)}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Icon name="cloud-upload-outline" size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="receipt-outline" size={14} color="#666666" />
            <Text style={styles.statText}>
              {stats.transactionCount} entries
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="arrow-down-circle" size={14} color="#dc3545" />
            <Text style={styles.statText}>₹{stats.spent.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="arrow-up-circle" size={14} color="#28a745" />
            <Text style={styles.statText}>₹{stats.collected.toFixed(2)}</Text>
          </View>
        </View>

        {/* Balance Display */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance:</Text>
          <Text
            style={[
              styles.balanceAmount,
              stats.balance >= 0
                ? styles.positiveBalance
                : styles.negativeBalance,
            ]}
          >
            ₹{Math.abs(stats.balance).toFixed(2)}
            {stats.balance >= 0 ? ' Surplus' : ' Deficit'}
          </Text>
        </View>

        {/* Last Activity */}
        <View style={styles.lastActivity}>
          <Text style={styles.lastActivityText}>
            Last activity: {stats.lastTransaction}
          </Text>
        </View>

        <View style={styles.arrowContainer}>
          <Icon name="chevron-forward" size={20} color="#cccccc" />
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = () => (
    <View style={styles.headerInfo}>
      <View style={styles.headerTitleRow}>
        <View>
          <Text style={styles.headerTitle}>Your Expense Sheets</Text>
          <Text style={styles.headerSubtitle}>
            {sheets.length} {sheets.length === 1 ? 'sheet' : 'sheets'} found
          </Text>
        </View>

        {/* Sync All Button */}
        {sheets.some(s => !s.googleSheetId || !s.synced) && (
          <TouchableOpacity
            style={[
              styles.syncAllButton,
              syncingAll && styles.syncAllButtonDisabled,
            ]}
            onPress={handleSyncAllSheets}
            disabled={syncingAll}
          >
            {syncingAll ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="cloud-upload" size={18} color="#ffffff" />
                <Text style={styles.syncAllButtonText}>Sync All</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="folder-open-outline" size={80} color="#cccccc" />
      <Text style={styles.emptyTitle}>No Sheets Found</Text>
      <Text style={styles.emptySubtitle}>
        You haven't created any expense sheets yet
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateNewSheet}
      >
        <Icon name="add-circle" size={20} color="#ffffff" />
        <Text style={styles.createButtonText}>Create Your First Sheet</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading your sheets...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.title}>Open Sheets</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Icon
            name="refresh"
            size={20}
            color={refreshing ? '#cccccc' : '#007bff'}
          />
        </TouchableOpacity>
      </View>

      {/* Sheets List */}
      <FlatList
        data={sheets}
        keyExtractor={item => item.id}
        renderItem={renderSheetItem}
        ListHeaderComponent={sheets.length > 0 ? ListHeaderComponent : null}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* Floating Action Button for Quick Create */}
      {sheets.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateNewSheet}>
          <Icon name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}
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
  refreshButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  listContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerInfo: {
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  syncAllButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  syncAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sheetItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
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
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  synced: {
    backgroundColor: '#d4edda',
  },
  notSynced: {
    backgroundColor: '#fff3cd',
  },
  syncStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: '#28a745',
  },
  negativeBalance: {
    color: '#dc3545',
  },
  lastActivity: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  lastActivityText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  arrowContainer: {
    position: 'absolute',
    right: 15,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default SheetListScreen;
