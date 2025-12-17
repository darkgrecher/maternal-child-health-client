/**
 * Navigation Setup
 * 
 * Main navigation configuration using React Navigation.
 * Implements bottom tab navigation with stack navigators for each tab.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZE } from '../constants';

// Types
import { RootStackParamList, TabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
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

// Simple placeholder screen for testing
const PlaceholderScreen: React.FC<{ name: string }> = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F7' }}>
    <Text style={{ fontSize: 24, color: '#212121', fontWeight: '600' }}>{name}</Text>
    <Text style={{ fontSize: 14, color: '#757575', marginTop: 8 }}>Screen is working</Text>
  </View>
);

const HomeScreen = () => <PlaceholderScreen name="Home" />;
const ProfileScreen = () => <PlaceholderScreen name="Profile" />;
const VaccinesScreen = () => <PlaceholderScreen name="Vaccines" />;
const GrowthScreen = () => <PlaceholderScreen name="Growth" />;
const FeedingScreen = () => <PlaceholderScreen name="Feeding" />;
const ScheduleScreen = () => <PlaceholderScreen name="Schedule" />;

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
 * App Navigation Container
 */
export const Navigation: React.FC = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default Navigation;
