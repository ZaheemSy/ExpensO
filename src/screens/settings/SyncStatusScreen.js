import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SheetSyncFixer from '../../utils/sheetSyncFixer';
import SyncService from '../../services/syncService';
import authService from '../../services/authService';

const SyncStatusScreen = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user email
      const userInfo = await authService.getCurrentUser();
      setUserEmail(userInfo?.user?.email || '');

      // Get sync status
      const status = await SheetSyncFixer.checkAllSheetsSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFixAllSheets = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'User email not found');
      return;
    }

    Alert.alert(
      'Sync All Local Sheets',
      `This will sync ${
        syncStatus?.local || 0
      } local sheets to Google Sheets. Continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sync All',
          onPress: async () => {
            setSyncing(true);
            try {
              const result = await SheetSyncFixer.fixAllLocalSheets(userEmail);

              Alert.alert(
                result.success ? 'Success' : 'Error',
                result.message,
                [{ text: 'OK', onPress: handleRefresh }],
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to sync sheets');
            } finally {
              setSyncing(false);
            }
          },
        },
      ],
    );
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await SyncService.manualSync();
      Alert.alert(result.success ? 'Success' : 'Error', result.message, [
        { text: 'OK', onPress: handleRefresh },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Manual sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const renderStatusCard = (title, count, color, onPress) => (
    <TouchableOpacity
      style={[styles.statusCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.statusCount}>{count}</Text>
      <Text style={styles.statusTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderSheetItem = sheet => {
    const getStatusColor = () => {
      if (sheet.synced) return '#4CAF50';
      if (sheet.syncStatus === 'syncing') return '#2196F3';
      if (sheet.syncStatus === 'error') return '#F44336';
      return '#FFA500';
    };

    const getStatusText = () => {
      if (sheet.synced) return '✅ Synced';
      if (sheet.syncStatus === 'syncing') return '🔄 Syncing';
      if (sheet.syncStatus === 'error') return '⚠️ Error';
      return '🏆 Local';
    };

    return (
      <View key={sheet.id} style={styles.sheetItem}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetName}>{sheet.name}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
          >
            <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={styles.sheetDetails}>
          <Text style={styles.detailText}>
            📊 {sheet.expenseCount} transactions
          </Text>
          {sheet.unsyncedExpenses > 0 && (
            <Text style={styles.unsyncedText}>
              {sheet.unsyncedExpenses} unsynced
            </Text>
          )}
          {sheet.lastSynced && (
            <Text style={styles.detailText}>
              Last synced: {new Date(sheet.lastSynced).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sync status...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sync Status</Text>
        <Text style={styles.headerSubtitle}>
          Manage your Google Sheets synchronization
        </Text>
      </View>

      {/* Status Overview */}
      <View style={styles.statusGrid}>
        {renderStatusCard('Total', syncStatus?.total || 0, '#333')}
        {renderStatusCard('Synced', syncStatus?.synced || 0, '#4CAF50')}
        {renderStatusCard(
          'Local',
          syncStatus?.local || 0,
          '#FFA500',
          handleFixAllSheets,
        )}
        {renderStatusCard('Syncing', syncStatus?.syncing || 0, '#2196F3')}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleManualSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>🔄 Manual Sync</Text>
          )}
        </TouchableOpacity>

        {syncStatus?.local > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleFixAllSheets}
            disabled={syncing}
          >
            <Text style={styles.actionButtonText}>
              📤 Sync All Local ({syncStatus.local})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sheet List */}
      <View style={styles.sheetList}>
        <Text style={styles.sectionTitle}>All Sheets</Text>
        {syncStatus?.sheets && syncStatus.sheets.length > 0 ? (
          syncStatus.sheets.map(renderSheetItem)
        ) : (
          <Text style={styles.emptyText}>No sheets found</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FFA500',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sheetItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  unsyncedText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
  },
});

export default SyncStatusScreen;
