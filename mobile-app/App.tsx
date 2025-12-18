/**
 * Maternal and Child Health Management System
 * Mobile Application Entry Point
 * 
 * Main entry point for the React Native application.
 * Sets up providers, navigation, and initializes the app.
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// i18n setup - must be imported before any component that uses translations
import './src/i18n';

// Navigation
import Navigation from './src/navigation';

// Stores
import { useAppStore, useChildStore, useVaccineStore, useAppointmentStore, useAuthStore } from './src/stores';

// Constants
import { COLORS } from './src/constants';

/**
 * Loading Screen Component
 * Displayed while the app is initializing
 */
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

/**
 * App Initializer Component
 * Handles app initialization and data loading
 */
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { setOnlineStatus } = useAppStore();
  const { loadMockData: loadChildData } = useChildStore();
  const { loadMockData: loadAppointmentData } = useAppointmentStore();
  const { status, accessToken, setStatus, fetchProfile } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check authentication status
        if (accessToken && status === 'idle') {
          setStatus('authenticated');
          // Try to fetch user profile
          try {
            await fetchProfile();
          } catch {
            // Profile fetch failed, but we still have tokens
            console.log('Profile fetch failed, continuing with cached data');
          }
        } else if (!accessToken && status === 'idle') {
          setStatus('unauthenticated');
        }
        
        // Load mock data for development
        // In production, this would load from AsyncStorage or API
        loadChildData();
        loadAppointmentData();
        
        // Set online status (could be from NetInfo in production)
        setOnlineStatus(true);
        
        // Add small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsInitialized(true); // Continue anyway to show error state
      }
    };

    initialize();
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

/**
 * Main App Component
 */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppInitializer>
          <Navigation />
        </AppInitializer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
