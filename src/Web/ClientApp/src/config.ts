import { Platform } from 'react-native';
import { API_URL, SIGNALR_URL, ENV } from '@env';

// Try to get values from different sources, with fallbacks
const apiUrl = API_URL || 'https://localhost:5001'; 
const signalrUrl = SIGNALR_URL || 'https://localhost:5001/hubs/chat';
const environment = ENV || 'development';

// Helper to convert local URLs - with ADB port forwarding, Android can use localhost directly
const convertLocalhost = (url: string): string => {
  // With ADB reverse port forwarding (adb reverse tcp:5001 tcp:5001), 
  // Android emulator can access localhost directly, no conversion needed
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