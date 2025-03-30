import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL, SIGNALR_URL, ENV } from '@env';

// Get config from Expo Constants if available
const getExpoValue = (key: string): string | undefined => {
  // @ts-ignore - Constants.manifest exists but may have different structure 
  // depending on Expo version
  if (Constants.manifest && Constants.manifest.extra && Constants.manifest.extra[key]) {
    // @ts-ignore
    return Constants.manifest.extra[key];
  }
  // @ts-ignore - Newer Expo versions use expoConfig
  if (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra[key]) {
    // @ts-ignore
    return Constants.expoConfig.extra[key];
  }
  return undefined;
};

// Try to get values from different sources, with fallbacks
const apiUrl = getExpoValue('apiUrl') || API_URL || 'https://localhost:5001'; 
const signalrUrl = getExpoValue('signalrUrl') || SIGNALR_URL || 'https://localhost:5001/hubs/chat';
const environment = getExpoValue('env') || ENV || 'development';

// Helper to convert local URLs to the correct IP when running in an emulator
const convertLocalhost = (url: string): string => {
  if (Platform.OS === 'android' && url.includes('localhost')) {
    // Android emulator can't access localhost directly, need to use 10.0.2.2
    return url.replace('localhost', '10.0.2.2');
  }
  return url;
};

// Log config info for debugging
console.log('Environment:', environment);
console.log('API URL:', apiUrl);
console.log('SignalR URL:', signalrUrl);

/**
 * Application configuration
 */
const config = {
  /**
   * Current environment (development, production, etc.)
   */
  environment,
  
  /**
   * Base URL for API calls
   */
  apiUrl: convertLocalhost(apiUrl),
  
  /**
   * Base URL for SignalR hub connections
   */
  signalRUrl: convertLocalhost(signalrUrl),
  
  /**
   * Other configuration values can be added here
   */
  auth: {
    tokenExpirationDays: 30,
  },
  
  /**
   * Check if the app is running in development mode
   */
  isDevelopment: () => environment === 'development',
  
  /**
   * Check if the app is running in production mode
   */
  isProduction: () => environment === 'production'
};

export default config;