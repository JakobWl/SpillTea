import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
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
    // Simulating checking auth state on app load
    const checkAuthState = async () => {
      setIsLoading(true);
      
      // Simulated authentication check - in a real app, you'd check tokens or session
      // For demo purposes, we'll just set a mock user after a delay
      setTimeout(() => {
        // Demo: user is not authenticated initially
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }, 1000);
    };

    checkAuthState();
  }, []);

  const login = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulated login - in a real app this would be an API call
      // Here we'll just set a mock user after a delay
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = {
            id: '1',
            name: 'User',
            email: 'user@example.com'
          };
          
          setUser(mockUser);
          setIsAuthenticated(true);
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

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulated logout - in a real app this would clear tokens/session
      return new Promise((resolve) => {
        setTimeout(() => {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          resolve();
        }, 1000);
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};