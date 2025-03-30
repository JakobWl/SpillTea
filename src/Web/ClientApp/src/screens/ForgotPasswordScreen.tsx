import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      return false;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Simulate API call to request password reset
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMessage(`Password reset instructions have been sent to ${email}`);
      }, 1500);
    } catch (error) {
      setErrorMessage('Failed to send reset instructions. Please try again.');
      console.error('Password reset error:', error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.description}>
            Enter your email address below and we'll send you instructions to reset your password.
          </Text>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
          />
          
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}
          
          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Send Reset Instructions
          </Button>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backToLoginLink}
            disabled={isLoading}
          >
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  contentContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    lineHeight: 22,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 8,
    padding: 5,
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    marginTop: -5,
  },
  successText: {
    color: 'green',
    marginBottom: 10,
    marginTop: -5,
  },
  backToLoginLink: {
    alignSelf: 'center',
    marginTop: 20,
  },
  backToLoginText: {
    color: '#6200ee',
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;