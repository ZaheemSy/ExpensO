import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import googleOAuthService from '../../services/googleOAuthService';

const PERMISSION_STATUS = {
  CHECKING: 'checking',
  GRANTED: 'granted',
  NOT_GRANTED: 'not_granted',
  ERROR: 'error',
};

const GooglePermissionsScreen = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(PERMISSION_STATUS.CHECKING);
  const [userInfo, setUserInfo] = useState(null);
  const [permissionDetails, setPermissionDetails] = useState(null);

  const { onPermissionGranted } = route.params || {};

  useEffect(() => {
    checkCurrentPermissions();
  }, []);

  const checkCurrentPermissions = async () => {
    try {
      setPermissionStatus(PERMISSION_STATUS.CHECKING);

      const userInfo = await googleOAuthService.getUserInfo();
      setUserInfo(userInfo);

      const permissionCheck = await googleOAuthService.checkPermissions();
      setPermissionDetails(permissionCheck);

      if (permissionCheck.hasPermissions) {
        setPermissionStatus(PERMISSION_STATUS.GRANTED);
      } else {
        setPermissionStatus(PERMISSION_STATUS.NOT_GRANTED);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionStatus(PERMISSION_STATUS.ERROR);
    }
  };

  const handleGrantPermissions = async () => {
    setIsLoading(true);

    try {
      const result = await googleOAuthService.requestGoogleSheetsPermissions();

      if (result.success) {
        Alert.alert(
          'Success!',
          'Google Sheets access granted successfully. You can now create and sync expense sheets.',
          [
            {
              text: 'Continue',
              onPress: () => {
                if (onPermissionGranted) {
                  onPermissionGranted();
                }
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Permission Required',
          result.error || 'Unable to get Google Sheets permissions. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error granting permissions:', error);
      Alert.alert(
        'Error',
        'Something went wrong while requesting permissions. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      await checkCurrentPermissions();
    }
  };

  const performRevoke = async () => {
    setIsLoading(true);
    try {
      const result = await googleOAuthService.revokePermissions();
      if (result.success) {
        Alert.alert('Success', 'Permissions revoked successfully.');
      } else {
        Alert.alert('Error', result.error || 'An unexpected error occurred while revoking permissions.');
      }
    } catch (error) {
      console.error('Error in performRevoke:', error);
      Alert.alert('Error', 'Failed to revoke permissions. Please try again.');
    } finally {
      setIsLoading(false);
      await checkCurrentPermissions();
    }
  };

  const handleRevokePermissions = async () => {
    Alert.alert(
      'Revoke Permissions',
      'This will remove ExpensO\'s access to your Google Sheets and Drive. You\'ll need to grant permissions again to sync data.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: performRevoke,
        }
      ]
    );
  };

  const renderPermissionStatus = () => {
    switch (permissionStatus) {
      case PERMISSION_STATUS.CHECKING:
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.statusText}>Checking permissions...</Text>
          </View>
        );
      case PERMISSION_STATUS.GRANTED:
        return (
          <View style={styles.statusContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successText}>Google Sheets Access Granted</Text>
            <Text style={styles.statusDescription}>
              ExpensO can now create and sync your expense sheets with Google Sheets.
            </Text>
            {userInfo && (
              <View style={styles.userInfoContainer}>
                <Text style={styles.userInfoText}>
                  Connected as: {userInfo.user.email}
                </Text>
              </View>
            )}
          </View>
        );
      case PERMISSION_STATUS.NOT_GRANTED:
        return (
          <View style={styles.statusContainer}>
            <View style={styles.warningIcon}>
              <Text style={styles.warningIconText}>⚠</Text>
            </View>
            <Text style={styles.warningText}>Permissions Required</Text>
            <Text style={styles.statusDescription}>
              To sync your expense data with Google Sheets, ExpensO needs permission to:
            </Text>
            <View style={styles.permissionsList}>
              <Text style={styles.permissionItem}>• Create new Google Sheets</Text>
              <Text style={styles.permissionItem}>• Read and write to your sheets</Text>
              <Text style={styles.permissionItem}>• Access Google Drive for file management</Text>
            </View>
            <Text style={styles.privacyNote}>
              Your data remains private and is only accessible by you. ExpensO doesn't store or share your Google account information.
            </Text>
          </View>
        );
      case PERMISSION_STATUS.ERROR:
      default:
        return (
          <View style={styles.statusContainer}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>✕</Text>
            </View>
            <Text style={styles.errorText}>Unable to Check Permissions</Text>
            <Text style={styles.statusDescription}>
              There was an error checking your Google permissions. Please try again.
            </Text>
          </View>
        );
    }
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
        <Text style={styles.title}>Google Sheets Access</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Why Do We Need This?</Text>
          <Text style={styles.infoText}>
            ExpensO syncs your expense data to your personal Google Sheets, giving you:
          </Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>• Automatic backup of your data</Text>
            <Text style={styles.benefitItem}>• Access from any device with Google Sheets</Text>
            <Text style={styles.benefitItem}>• Easy sharing with family or accountants</Text>
            <Text style={styles.benefitItem}>• Advanced analysis with spreadsheet features</Text>
          </View>
        </View>

        {renderPermissionStatus()}

        <View style={styles.actionButtonsContainer}>
          {permissionStatus === PERMISSION_STATUS.NOT_GRANTED && (
            <TouchableOpacity
              style={[styles.grantButton, isLoading && styles.disabledButton]}
              onPress={handleGrantPermissions}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.grantButtonText}>Grant Google Sheets Access</Text>
              )}
            </TouchableOpacity>
          )}

          {permissionStatus === PERMISSION_STATUS.GRANTED && (
            <TouchableOpacity
              style={[styles.revokeButton, isLoading && styles.disabledButton]}
              onPress={handleRevokePermissions}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.revokeButtonText}>Revoke Access</Text>
              )}
            </TouchableOpacity>
          )}

          {permissionStatus === PERMISSION_STATUS.ERROR && (
            <TouchableOpacity
              style={[styles.retryButton, isLoading && styles.disabledButton]}
              onPress={checkCurrentPermissions}
              disabled={isLoading}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 15,
  },
  benefitsList: {
    marginLeft: 10,
  },
  benefitItem: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 5,
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successIconText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffc107',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  warningIconText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  errorIconText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffc107',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 10,
  },
  statusDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  permissionsList: {
    marginBottom: 15,
    alignSelf: 'stretch',
  },
  permissionItem: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 5,
  },
  privacyNote: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  userInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  userInfoText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    marginTop: 20,
  },
  grantButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  grantButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  revokeButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  revokeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default GooglePermissionsScreen;