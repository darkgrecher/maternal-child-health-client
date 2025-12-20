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
import { useAppStore, useChildStore, useVaccineStore, useAppointmentStore, useAuthStore, useThemeStore } from './src/stores';

// Context
import { ThemeProvider } from './src/context';

// Constants
import { COLORS } from './src/constants';

/**
 * Loading Screen Component
 * Displayed while the app is initializing
 */
const LoadingScreen: React.FC = () => {
  const { colors } = useThemeStore();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
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
        
        // Load mock data for development (child data only)
        // Appointment data is now fetched from API in each screen
        loadChildData();
        
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
          <ThemeProvider>
            <Navigation />
          </ThemeProvider>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
