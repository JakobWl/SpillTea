import React, { createContext, useContext, useState, useEffect } from 'react';
import authStorage from '../utils/authStorage';

interface User {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  provider?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  loginWithEmail: async () => false,
  loginWithGoogle: async () => false,
  loginWithFacebook: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for stored auth token on app load
    const checkAuthState = async () => {
      setIsLoading(true);
      
      try {
        const userData = await authStorage.getUser();
        const token = await authStorage.getToken();
        
        if (userData && token) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const saveUserData = async (userData: User, token: string) => {
    try {
      await authStorage.setAuth(userData, token);
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  };

  const loginWithEmail = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call to your backend
      // For now, we'll simulate a successful login
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = {
            id: '1',
            name: credentials.email.split('@')[0],
            email: credentials.email,
            provider: 'email'
          };
          
          const mockToken = 'mock-jwt-token-' + Date.now();
          
          setUser(mockUser);
          setIsAuthenticated(true);
          saveUserData(mockUser, mockToken);
          
          setIsLoading(false);
          resolve(true);
        }, 1500);
      });
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // In a real app, this would use expo-auth-session with Google OAuth
      // For now, we'll simulate a successful login
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = {
            id: '2',
            name: 'Google User',
            email: 'google.user@gmail.com',
            photoURL: 'https://ui-avatars.com/api/?name=Google+User&background=random',
            provider: 'google'
          };
          
          const mockToken = 'mock-google-token-' + Date.now();
          
          setUser(mockUser);
          setIsAuthenticated(true);
          saveUserData(mockUser, mockToken);
          
          setIsLoading(false);
          resolve(true);
        }, 1500);
      });
    } catch (error) {
      console.error('Google login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  const loginWithFacebook = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // In a real app, this would use expo-auth-session with Facebook OAuth
      // For now, we'll simulate a successful login
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = {
            id: '3',
            name: 'Facebook User',
            email: 'facebook.user@example.com',
            photoURL: 'https://ui-avatars.com/api/?name=Facebook+User&background=random',
            provider: 'facebook'
          };
          
          const mockToken = 'mock-facebook-token-' + Date.now();
          
          setUser(mockUser);
          setIsAuthenticated(true);
          saveUserData(mockUser, mockToken);
          
          setIsLoading(false);
          resolve(true);
        }, 1500);
      });
    } catch (error) {
      console.error('Facebook login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Clear stored credentials
      await authStorage.clearAuth();
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        loginWithEmail,
        loginWithGoogle,
        loginWithFacebook,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};