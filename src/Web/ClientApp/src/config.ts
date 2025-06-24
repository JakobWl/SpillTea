import { Platform } from 'react-native';
import { API_URL, SIGNALR_URL, ENV } from '@env';

// Try to get values from different sources, with fallbacks
// Use HTTP by default for Android to avoid HTTPS certificate issues
const defaultApiUrl = Platform.OS === 'android' ? 'http://localhost:5000' : 'https://localhost:5001';
const defaultSignalrUrl = Platform.OS === 'android' ? 'http://localhost:5000/hubs/chat' : 'https://localhost:5001/hubs/chat';

// For Android, force HTTP and 10.0.2.2 to ensure it works
const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : (API_URL || defaultApiUrl); 
const signalrUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000/hubs/chat' : (SIGNALR_URL || defaultSignalrUrl);
const environment = ENV || 'development';

// Helper to convert local URLs for Android emulator (simplified since we're setting URLs directly for Android)
const convertLocalhost = (url: string): string => {
  // No conversion needed since we're already setting the correct URLs above
  return url;
};

// Log config info for debugging
console.log('Platform:', Platform.OS);
console.log('Environment:', environment);
console.log('Raw API URL (before conversion):', apiUrl);
console.log('Raw SignalR URL (before conversion):', signalrUrl);
console.log('Converted API URL:', convertLocalhost(apiUrl));
console.log('Converted SignalR URL:', convertLocalhost(signalrUrl));

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

console.log('Final config.apiUrl:', config.apiUrl);
console.log('Final config.signalRUrl:', config.signalRUrl);

export default config;