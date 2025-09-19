import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import authService from '../../services/authService';
import firebaseEmailService from '../../services/firebaseEmailService';

const Signup = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState('');


  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!firebaseEmailService.isValidGmail(email)) {
      Alert.alert('Error', 'Please use a valid Gmail address for signup');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Send verification code
    const result = await firebaseEmailService.sendVerificationEmail(email, password);
    if (result.success) {
      setUserEmail(email);
      setIsVerificationSent(true);
      Alert.alert('Verification Code Sent', result.message);
    } else {
      Alert.alert('Error', result.error || 'Failed to send verification code');
    }
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);

    // Check if email has been verified
    const verifyResult = await firebaseEmailService.checkEmailVerification(userEmail);
    setIsVerifying(false);

    if (verifyResult.success) {
      Alert.alert('Success', 'Email verified! You can now login.', [
        { text: 'OK', onPress: () => navigation.navigate('Landing') }
      ]);
    } else {
      Alert.alert('Verification Status', verifyResult.error, [
        { text: 'Try Again', onPress: () => {} },
        { text: 'Resend Email', onPress: handleResendEmail }
      ]);
    }
  };

  const handleResendEmail = async () => {
    const result = await firebaseEmailService.resendVerificationEmail(userEmail);
    Alert.alert(
      result.success ? 'Email Sent' : 'Error',
      result.message || result.error
    );
  };


  const handleLogin = () => {
    navigation.navigate('Landing');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {!isVerificationSent ? (
        <>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Gmail Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Send Verification Code</Text>
          </TouchableOpacity>

        </>
      ) : (
        <>
          <Text style={styles.verificationText}>
            Verification email sent to {userEmail}
          </Text>

          <Text style={styles.instructionText}>
            Please check your email and click the verification link, then tap "Check Verification" below.
          </Text>

          <TouchableOpacity
            style={[styles.signupButton, isVerifying && styles.disabledButton]}
            onPress={handleVerifyCode}
            disabled={isVerifying}
          >
            <Text style={styles.signupButtonText}>
              {isVerifying ? 'Checking...' : 'Check Verification'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResendEmail} style={styles.resendButton}>
            <Text style={styles.linkText}>Resend verification email</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsVerificationSent(false)}>
            <Text style={styles.linkText}>Back to signup</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={handleLogin}>
        <Text style={styles.loginLink}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333333',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  signupButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 20,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  verificationText: {
    color: '#333333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  instructionText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  resendButton: {
    marginVertical: 10,
  },
  linkText: {
    color: '#007bff',
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginVertical: 10,
  },
  loginLink: {
    color: '#007bff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default Signup;