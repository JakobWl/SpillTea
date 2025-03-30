import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Button, Text, TextInput, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const { loginWithEmail, loginWithGoogle, loginWithFacebook } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const success = await loginWithEmail({ email, password });
      if (!success) {
        setErrorMessage('Invalid email or password');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const success = await loginWithGoogle();
      if (!success) {
        setErrorMessage('Google login failed');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const success = await loginWithFacebook();
      if (!success) {
        setErrorMessage('Facebook login failed');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Facebook login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>FadeChat</Text>
          <Text style={styles.subtitle}>Connect with random people</Text>
        </View>
        
        <View style={styles.contentContainer}>
          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            <Button
              mode="outlined"
              icon="google"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={[styles.socialButton, styles.googleButton]}
              contentStyle={styles.socialButtonContent}
            >
              Continue with Google
            </Button>
            
            <Button
              mode="outlined"
              icon="facebook"
              onPress={handleFacebookLogin}
              disabled={isLoading}
              style={[styles.socialButton, styles.facebookButton]}
              contentStyle={styles.socialButtonContent}
            >
              Continue with Facebook
            </Button>
          </View>
          
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <Divider style={styles.divider} />
          </View>
          
          {/* Email/Password Login Form */}
          <View style={styles.formContainer}>
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
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              mode="outlined"
              style={styles.input}
              disabled={isLoading}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? 'eye-off' : 'eye'}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                />
              }
            />
            
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
            
            <Button
              mode="contained"
              onPress={handleEmailLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Sign In
            </Button>
            
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordLink}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
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
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  socialButtonsContainer: {
    marginBottom: 20,
  },
  socialButton: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  googleButton: {
    borderColor: '#4285F4',
  },
  facebookButton: {
    borderColor: '#3b5998',
  },
  socialButtonContent: {
    height: 48,
    justifyContent: 'flex-start',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  formContainer: {
    marginBottom: 20,
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    marginRight: 5,
  },
  registerLink: {
    color: '#6200ee',
    fontWeight: '500',
  },
});

export default LoginScreen;