import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import masterLogo from '../../assets/icons/masterLogo.png';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const { login } = useAuth();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const logoScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleFocus = field => {
    setIsFocused({ ...isFocused, [field]: true });
    if (field === 'email') {
      Animated.spring(logoScale, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleBlur = field => {
    setIsFocused({ ...isFocused, [field]: false });
    if (field === 'email' && !email) {
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => navigation.navigate('Signup');
  const handleForgotPassword = () => navigation.navigate('ForgotPassword');

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.safeArea}
      >
        <View style={styles.container}>
          {/* Animated Background Elements */}
          <View style={styles.backgroundElements}>
            <View style={[styles.floatingCircle, styles.circle1]} />
            <View style={[styles.floatingCircle, styles.circle2]} />
            <View style={[styles.floatingCircle, styles.circle3]} />
          </View>

          {/* Main Content */}
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo Section */}
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <View style={styles.logoContainer}>
                <Image
                  source={masterLogo}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.logoGlow} />
              </View>
              <Text style={styles.appName}>
                Expens<Text style={styles.appNameAccent}>Ooo</Text>
              </Text>
              <Text style={styles.subtitle}>Welcome back</Text>
            </Animated.View>

            {/* Input Fields */}
            <View style={styles.inputsContainer}>
              {/* Email Input */}
              <View
                style={[
                  styles.inputWrapper,
                  isFocused.email && styles.inputFocused,
                ]}
              >
                <Icon
                  name="mail-outline"
                  size={20}
                  color={isFocused.email ? '#00B8D4' : '#b3c1ff'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#b3c1ff"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')}>
                    <Icon name="close-circle" size={20} color="#b3c1ff" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Password Input */}
              <View
                style={[
                  styles.inputWrapper,
                  isFocused.password && styles.inputFocused,
                ]}
              >
                <Icon
                  name="lock-closed-outline"
                  size={20}
                  color={isFocused.password ? '#00B8D4' : '#b3c1ff'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#b3c1ff"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Icon
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={isFocused.password ? '#00B8D4' : '#b3c1ff'}
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={isLoading}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPassword}>Forgot your password?</Text>
                <Icon
                  name="arrow-forward"
                  size={16}
                  color="#00B8D4"
                  style={styles.forgotPasswordIcon}
                />
              </TouchableOpacity>

              {/* Login Button */}
              <PrimaryButton
                title="Log in"
                onPress={handleLogin}
                loading={isLoading}
                disabled={!email || !password}
                iconName="arrow-forward-circle"
              />
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Options */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => {
                  Alert.alert(
                    'Coming Soon',
                    'Google login will be available in the next update',
                  );
                }}
              >
                <Icon name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Section */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignup} disabled={isLoading}>
                <View style={styles.signUpLinkContainer}>
                  <Text style={styles.signUpLink}>Sign up</Text>
                  <Icon name="person-add-outline" size={16} color="#00B8D4" />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 500,
    backgroundColor: 'rgba(47, 63, 159, 0.1)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -50,
    backgroundColor: 'rgba(0, 184, 212, 0.1)',
  },
  circle3: {
    width: 150,
    height: 150,
    top: '40%',
    right: '20%',
    backgroundColor: 'rgba(47, 63, 159, 0.05)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  logo: {
    width: 80,
    height: 80,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    backgroundColor: 'rgba(0, 184, 212, 0.3)',
    borderRadius: 45,
    top: -5,
    zIndex: 1,
  },
  appName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  appNameAccent: {
    color: '#00B8D4',
  },
  subtitle: {
    color: '#b3c1ff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '300',
  },
  inputsContainer: {
    marginTop: 50,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    width: '100%',
    height: 56,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(0, 184, 212, 0.5)',
    shadowColor: '#00B8D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  eyeButton: {
    marginLeft: 8,
    padding: 4,
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPassword: {
    color: '#00B8D4',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordIcon: {
    marginLeft: 5,
  },
  loginButton: {
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
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#b3c1ff',
    paddingHorizontal: 15,
    fontSize: 12,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: '#b3c1ff',
    fontSize: 14,
  },
  signUpLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpLink: {
    color: '#00B8D4',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default LoginScreen;
