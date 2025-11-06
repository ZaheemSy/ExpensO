import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SheetSyncFixer from '../utils/sheetSyncFixer';

const SheetCard = ({ sheet, onPress, userEmail }) => {
  const [isFixing, setIsFixing] = React.useState(false);

  // Determine if sheet is local (not synced)
  const isLocal = !sheet.googleSheetId || !sheet.synced;
  const isSyncing = sheet.syncStatus === 'syncing';
  const hasError = sheet.syncStatus === 'error';

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle fixing local sheet
  const handleFixSheet = async () => {
    if (isFixing) return;

    Alert.alert(
      'Sync to Google Sheets',
      `Do you want to sync "${sheet.name}" to Google Sheets?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sync Now',
          onPress: async () => {
            setIsFixing(true);
            try {
              const result = await SheetSyncFixer.fixLocalSheet(
                sheet.id,
                userEmail,
              );

              if (result.success) {
                Alert.alert(
                  'Success',
                  result.alreadySynced
                    ? 'Sheet is already synced!'
                    : 'Sheet synced to Google Sheets successfully!',
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to sync sheet');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to sync sheet');
            } finally {
              setIsFixing(false);
            }
          },
        },
      ],
    );
  };

  // Get status badge
  const renderStatusBadge = () => {
    if (isSyncing || isFixing) {
      return (
        <View style={styles.syncingBadge}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.badgeText}>Syncing...</Text>
        </View>
      );
    }

    if (hasError) {
      return (
        <TouchableOpacity
          style={styles.errorBadge}
          onPress={handleFixSheet}
          disabled={isFixing}
        >
          <Text style={styles.badgeText}>⚠️ Sync Error</Text>
        </TouchableOpacity>
      );
    }

    if (isLocal) {
      return (
        <TouchableOpacity
          style={styles.localBadge}
          onPress={handleFixSheet}
          disabled={isFixing}
        >
          <Text style={styles.badgeText}>🏆 Local (Tap to Sync)</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.syncedBadge}>
        <Text style={styles.badgeText}>✅ Synced</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.sheetName}>{sheet.name}</Text>
        {renderStatusBadge()}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.dateText}>
          Created: {formatDate(sheet.createdAt)}
        </Text>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            Spent: ₹{sheet.spent?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.separator}>|</Text>
          <Text style={styles.statText}>
            Collected: ₹{sheet.collected?.toFixed(2) || '0.00'}
          </Text>
        </View>

        {sheet.lastSynced && (
          <Text style={styles.syncText}>
            Last synced: {formatDate(sheet.lastSynced)}
          </Text>
        )}

        {sheet.transactions && sheet.transactions.length > 0 && (
          <Text style={styles.transactionCount}>
            {sheet.transactions.length} transaction
            {sheet.transactions.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardBody: {
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  separator: {
    marginHorizontal: 8,
    color: '#ccc',
  },
  syncText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  transactionCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  localBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  syncedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  syncingBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SheetCard;
