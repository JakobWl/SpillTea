import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Constants for storage keys
export const STORAGE_KEYS = {
  USER: "user",
};

/**
 * Storage utility for non-HttpOnly authentication data (like user info)
 * Uses SecureStore for mobile platforms
 * For web, uses localStorage in development and SecureStore's web implementation in production
 */
class AuthStorage {
  /**
   * Store a value securely (native) or in localStorage (web)
   */
  private async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (process.env.NODE_ENV === "development") {
        localStorage.setItem(key, value);
        return;
      } else {
        // Use SecureStore's web implementation for production user info storage
        await SecureStore.setItemAsync(key, value);
        return;
      }
    }
    // Use SecureStore for native platforms
    await SecureStore.setItemAsync(key, value);
  }

  /**
   * Get a stored value (native) or from localStorage (web)
   */
  private async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      if (process.env.NODE_ENV === "development") {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    }
    // Use SecureStore for native platforms
    return await SecureStore.getItemAsync(key);
  }

  /**
   * Remove a stored value (native) or from localStorage (web)
   */
  private async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (process.env.NODE_ENV === "development") {
        localStorage.removeItem(key);
        return;
      } else {
        await SecureStore.deleteItemAsync(key);
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
   * Get stored user object
   */
  async getUser(): Promise<any | null> {
    const userJson = await this.getItem(STORAGE_KEYS.USER);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error("Error parsing user JSON:", error);
        // Consider removing the invalid item
        await this.clearUser();
        return null;
      }
    }
    return null;
  }

  /**
   * Clear stored user object
   */
  async clearUser(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER);
  }

  /**
   * Clear all locally stored auth data (only USER in this case)
   */
  async clearAuth(): Promise<void> {
    await this.clearUser();
  }
}

export default new AuthStorage();
