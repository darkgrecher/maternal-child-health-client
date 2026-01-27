/**
 * Navigation Setup
 * 
 * Main navigation configuration using React Navigation.
 * Implements bottom tab navigation with stack navigators for each tab.
 * Includes authentication flow with Login screen.
 * Supports separate navigation for Child and Pregnancy tracking.
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONT_SIZE } from '../constants';
import { useAuthStore, useThemeStore, useChildStore, usePregnancyStore } from '../stores';

// Screens
import {
  HomeScreen,
  ProfileScreen,
  EditProfileScreen,
  VaccinesScreen,
  GrowthScreen,
  FeedingScreen,
  ScheduleScreen,
  SettingsScreen,
  ActivitiesScreen,
  AddChildScreen,
  CreatePregnancyScreen,
  PregnancyDashboardScreen,
  PregnancyCheckupsScreen,
  PregnancyHealthScreen,
  PregnancyJournalScreen,
  AuthScreen,
} from '../screens';

// Types
import { RootStackParamList, TabParamList, PregnancyTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<TabParamList>();
const PregnancyTab = createBottomTabNavigator<PregnancyTabParamList>();
const ProfileStack = createNativeStackNavigator();

// Icon type mapping
type IoniconsName = keyof typeof Ionicons.glyphMap;

/**
 * Tab icon mapping for Child tracking
 */
const tabIcons: Record<keyof TabParamList, { focused: IoniconsName; unfocused: IoniconsName }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Vaccines: { focused: 'shield-checkmark', unfocused: 'shield-checkmark-outline' },
  Growth: { focused: 'trending-up', unfocused: 'trending-up-outline' },
  Feeding: { focused: 'restaurant', unfocused: 'restaurant-outline' },
  Schedule: { focused: 'calendar', unfocused: 'calendar-outline' },
};

/**
 * Tab icon mapping for Pregnancy tracking
 */
const pregnancyTabIcons: Record<keyof PregnancyTabParamList, { focused: IoniconsName; unfocused: IoniconsName }> = {
  PregnancyHome: { focused: 'heart', unfocused: 'heart-outline' },
  Checkups: { focused: 'calendar', unfocused: 'calendar-outline' },
  Health: { focused: 'fitness', unfocused: 'fitness-outline' },
  Journal: { focused: 'book', unfocused: 'book-outline' },
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
 * Profile Stack Navigator - Profile with Edit capability
 */
const ProfileStackNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
};

/**
 * Bottom Tab Navigator for Child Tracking
 */
const ChildTabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const { profile, children } = useChildStore();
  const { currentPregnancy, pregnancies } = usePregnancyStore();
  
  // Check if user has any profile (child or pregnancy)
  const hasProfile = profile !== null || children.length > 0 || currentPregnancy !== null || pregnancies.length > 0;

  // Show alert when trying to access tabs without profile
  const showCreateProfileAlert = () => {
    Alert.alert(
      t('navigation.profileRequired', 'Profile Required'),
      t('navigation.profileRequiredMessage', 'Please create a pregnancy profile or add a child profile to access this feature.'),
      [{ text: t('common.ok', 'OK') }]
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: hasProfile ? {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          paddingTop: 8,
          paddingBottom: 8,
          height: 90,
        } : {
          display: 'none',
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          marginTop: 4,
          marginBottom: 8,
        },
        // Disable non-Home tabs when no profile exists
        tabBarButton: (props) => {
          const isHomeTab = route.name === 'Home';
          if (!isHomeTab && !hasProfile) {
            return (
              <TouchableOpacity
                {...props}
                onPress={(e) => {
                  e.preventDefault();
                  showCreateProfileAlert();
                }}
              />
            );
          }
          return <TouchableOpacity {...props} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: t('navigation.home') }}
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
 * Bottom Tab Navigator for Pregnancy Tracking
 */
const PregnancyTabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();

  return (
    <PregnancyTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = pregnancyTabIcons[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          paddingTop: 8,
          paddingBottom: 8,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          marginTop: 4,
          marginBottom: 8,
        },
      })}
    >
      <PregnancyTab.Screen 
        name="PregnancyHome" 
        component={PregnancyDashboardScreen}
        options={{ tabBarLabel: t('navigation.pregnancyHome', 'Home') }}
      />
      <PregnancyTab.Screen 
        name="Checkups" 
        component={PregnancyCheckupsScreen}
        options={{ tabBarLabel: t('navigation.checkups', 'Checkups') }}
      />
      <PregnancyTab.Screen 
        name="Health" 
        component={PregnancyHealthScreen}
        options={{ tabBarLabel: t('navigation.health', 'Health') }}
      />
      <PregnancyTab.Screen 
        name="Journal" 
        component={PregnancyJournalScreen}
        options={{ tabBarLabel: t('navigation.journal', 'Journal') }}
      />
    </PregnancyTab.Navigator>
  );
};

/**
 * Root Stack Navigator
 */
const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={ChildTabNavigator} />
      <Stack.Screen name="PregnancyMain" component={PregnancyTabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Activities" component={ActivitiesScreen} />
      <Stack.Screen name="AddChild" component={AddChildScreen} />
      <Stack.Screen name="CreatePregnancy" component={CreatePregnancyScreen} />
      <Stack.Screen name="PregnancyDashboard" component={PregnancyDashboardScreen} />
    </Stack.Navigator>
  );
};

/**
 * Loading Screen
 */
const LoadingScreen: React.FC = () => {
  const { colors } = useThemeStore();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

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
  },
});

export default Navigation;
