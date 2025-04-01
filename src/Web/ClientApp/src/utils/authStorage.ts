import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Constants for storage keys
export const STORAGE_KEYS = {
  USER: "user",
  AUTH_TOKEN: "authToken",
};

/**
 * Storage utility for authentication data
 * Uses SecureStore for mobile platforms
 * For web, uses localStorage in development and SecureStore's web implementation in production
 */
class AuthStorage {
  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      // For web environment - we'll use localStorage in development
      // In production, SecureStore will handle this appropriately
      if (process.env.NODE_ENV === "development") {
        localStorage.setItem(key, value);
        return;
      }
    }

    // Use SecureStore for all platforms in production
    await SecureStore.setItemAsync(key, value);
  }

  /**
   * Get a stored value
   */
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      // For web environment
      if (process.env.NODE_ENV === "development") {
        return localStorage.getItem(key);
      }
    }

    return await SecureStore.getItemAsync(key);
  }

  /**
   * Remove a stored value
   */
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      // For web environment
      if (process.env.NODE_ENV === "development") {
        localStorage.removeItem(key);
        return;
      }
    }

    await SecureStore.deleteItemAsync(key);
  }

  /**
   * Store user object
   */
  async setUser(user: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Store authentication token
   */
  async setToken(token: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Get stored user object
   */
  async getUser(): Promise<any | null> {
    const userJson = await this.getItem(STORAGE_KEYS.USER);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error("Error parsing user JSON:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get auth token
   */
  async getToken(): Promise<string | null> {
    return await this.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Store both user and token at once
   */
  async setAuth(token: string): Promise<void> {
    await Promise.all([this.setToken(token)]);
  }

  /**
   * Clear all auth data
   */
  async clearAuth(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.USER),
      this.removeItem(STORAGE_KEYS.AUTH_TOKEN),
    ]);
  }
}

export default new AuthStorage();
