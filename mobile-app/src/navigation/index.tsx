/**
 * Navigation Setup
 * 
 * Main navigation configuration using React Navigation.
 * Implements bottom tab navigation with stack navigators for each tab.
 * Includes authentication flow with Login screen.
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZE } from '../constants';
import { useAuthStore } from '../stores';

// Screens
import {
  HomeScreen,
  ProfileScreen,
  VaccinesScreen,
  GrowthScreen,
  FeedingScreen,
  ScheduleScreen,
  AuthScreen,
} from '../screens';

// Types
import { RootStackParamList, TabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<TabParamList>();

// Icon type mapping
type IoniconsName = keyof typeof Ionicons.glyphMap;

/**
 * Tab icon mapping
 */
const tabIcons: Record<keyof TabParamList, { focused: IoniconsName; unfocused: IoniconsName }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Profile: { focused: 'person-circle', unfocused: 'person-circle-outline' },
  Vaccines: { focused: 'shield-checkmark', unfocused: 'shield-checkmark-outline' },
  Growth: { focused: 'trending-up', unfocused: 'trending-up-outline' },
  Feeding: { focused: 'restaurant', unfocused: 'restaurant-outline' },
  Schedule: { focused: 'calendar', unfocused: 'calendar-outline' },
};

/**
 * Auth Navigator - Login/Signup flow
 */
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Auth" component={AuthScreen} />
    </AuthStack.Navigator>
  );
};

/**
 * Bottom Tab Navigator
 */
const TabNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray[100],
          paddingTop: 8,
          paddingBottom: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: t('navigation.home') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: t('navigation.profile') }}
      />
      <Tab.Screen 
        name="Vaccines" 
        component={VaccinesScreen}
        options={{ tabBarLabel: t('navigation.vaccines') }}
      />
      <Tab.Screen 
        name="Growth" 
        component={GrowthScreen}
        options={{ tabBarLabel: t('navigation.growth') }}
      />
      <Tab.Screen 
        name="Feeding" 
        component={FeedingScreen}
        options={{ tabBarLabel: t('navigation.feeding') }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ tabBarLabel: t('navigation.schedule') }}
      />
    </Tab.Navigator>
  );
};

/**
 * Root Stack Navigator
 */
const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
    </Stack.Navigator>
  );
};

/**
 * Loading Screen
 */
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

/**
 * App Navigation Container
 * Handles authentication state and shows appropriate navigator
 */
export const Navigation: React.FC = () => {
  const { status, accessToken } = useAuthStore();
  
  // Show loading while checking auth status
  if (status === 'idle' || status === 'loading') {
    return <LoadingScreen />;
  }
  
  const isAuthenticated = !!accessToken && status === 'authenticated';

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default Navigation;
