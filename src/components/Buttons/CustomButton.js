import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  iconName,
  iconSize = 22,
  iconColor = '#fff',
  variant = 'primary', // 'primary', 'secondary', 'outline'
  size = 'medium', // 'small', 'medium', 'large'
  fullWidth = true,
}) => {
  const getButtonStyle = () => {
    let style = [styles.button, styles[size]];

    if (fullWidth) {
      style.push(styles.fullWidth);
    }

    switch (variant) {
      case 'secondary':
        style.push(styles.secondaryButton);
        break;
      case 'outline':
        style.push(styles.outlineButton);
        break;
      default:
        style.push(styles.primaryButton);
    }

    if (disabled || loading) {
      style.push(styles.disabledButton);
    }

    return style;
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : '#00B8D4'}
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          <Text style={getTextStyle()}>{title}</Text>
          {iconName && (
            <Icon
              name={iconName}
              size={iconSize}
              color={variant === 'primary' ? iconColor : '#00B8D4'}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  small: {
    height: 40,
    paddingHorizontal: 20,
  },
  medium: {
    height: 56,
    paddingHorizontal: 24,
  },
  large: {
    height: 64,
    paddingHorizontal: 32,
  },
  primaryButton: {
    backgroundColor: '#00B8D4',
    shadowColor: '#00B8D4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00B8D4',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  outlineText: {
    color: '#00B8D4',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default CustomButton;
