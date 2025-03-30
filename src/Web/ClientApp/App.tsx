import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import AppNavigator, { setTopLevelNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
// Import to ensure proper loading of icons
import './src/utils/materialIcons';

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer 
            ref={navigationRef}
            onReady={() => {
              setTopLevelNavigator(navigationRef.current);
            }}
          >
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}