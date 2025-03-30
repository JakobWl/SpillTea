import { Platform } from 'react-native';

// This is a fallback config file that doesn't rely on any external dependencies
// It can be used if there are issues with the environment variable setup

// For development environments (localhost)
const DEV_API_URL = 'https://localhost:5001';
const DEV_SIGNALR_URL = 'https://localhost:5001/hubs/chat';

// For production environments
const PROD_API_URL = 'https://fadechat.azurewebsites.net';
const PROD_SIGNALR_URL = 'https://fadechat.azurewebsites.net/hubs/chat';

// Determine if we're in production - you can modify this as needed
const isProduction = false; // Set to true for production builds

// Helper to convert local URLs to the correct IP when running in an emulator
const convertLocalhost = (url: string): string => {
  if (Platform.OS === 'android' && url.includes('localhost')) {
    // Android emulator can't access localhost directly, need to use 10.0.2.2
    return url.replace('localhost', '10.0.2.2');
  }
  return url;
};

/**
 * Application configuration
 */
const config = {
  /**
   * Current environment (development, production, etc.)
   */
  environment: isProduction ? 'production' : 'development',
  
  /**
   * Base URL for API calls
   */
  apiUrl: convertLocalhost(isProduction ? PROD_API_URL : DEV_API_URL),
  
  /**
   * Base URL for SignalR hub connections
   */
  signalRUrl: convertLocalhost(isProduction ? PROD_SIGNALR_URL : DEV_SIGNALR_URL),
  
  /**
   * Other configuration values can be added here
   */
  auth: {
    tokenExpirationDays: 30,
  },
  
  /**
   * Check if the app is running in development mode
   */
  isDevelopment: () => !isProduction,
  
  /**
   * Check if the app is running in production mode
   */
  isProduction: () => isProduction
};

export default config;

/*
HOW TO USE THIS FILE:
If you're having issues with environment variables, rename this file to config.ts.
For example:

mv src/config.direct.ts src/config.ts

This will use the hardcoded URLs instead of trying to load from environment variables.
*/