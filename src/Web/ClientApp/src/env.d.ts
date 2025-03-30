declare module '@env' {
  export const API_URL: string;
  export const SIGNALR_URL: string;
  export const ENV: string;
}

// Types for expo-constants
declare module 'expo-constants' {
  interface Constants {
    // For newer Expo versions
    expoConfig?: {
      extra?: {
        apiUrl?: string;
        signalrUrl?: string;
        env?: string;
      }
    };
    
    // For older Expo versions
    manifest?: {
      extra?: {
        apiUrl?: string;
        signalrUrl?: string;
        env?: string;
      }
    };
  }
  
  export default Constants;
}