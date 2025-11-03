import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  iconName = 'arrow-forward-circle',
  iconSize = 22,
  iconColor = '#fff',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        loading && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>{title}</Text>
          <Icon name={iconName} size={iconSize} color={iconColor} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#00B8D4',
    borderRadius: 16,
    width: '100%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B8D4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(0, 184, 212, 0.5)',
    shadowOpacity: 0.1,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default PrimaryButton;
