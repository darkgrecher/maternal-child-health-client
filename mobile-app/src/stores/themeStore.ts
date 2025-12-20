/**
 * Theme Store
 * 
 * Zustand store for managing app theme based on child's gender.
 * - Default/Female: Pink theme
 * - Male: Blue theme
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gender } from '../types';

// ============================================================================
// THEME COLOR DEFINITIONS
// ============================================================================

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Neutral colors
  white: string;
  black: string;
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textLight: string;
  
  // Vaccine status colors
  vaccineCompleted: string;
  vaccineDue: string;
  vaccineUpcoming: string;
  
  // Chart colors
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
}

// Pink theme (default / female)
export const PINK_THEME: ThemeColors = {
  // Primary colors (pink/rose theme)
  primary: '#E91E63',
  primaryLight: '#FCE4EC',
  primaryDark: '#C2185B',
  
  // Secondary colors
  secondary: '#4CAF50',
  secondaryLight: '#E8F5E9',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Background colors
  background: '#FFF5F7',
  backgroundSecondary: '#FFFFFF',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  
  // Vaccine status colors
  vaccineCompleted: '#4CAF50',
  vaccineDue: '#F44336',
  vaccineUpcoming: '#2196F3',
  
  // Chart colors
  chartPrimary: '#E91E63',
  chartSecondary: '#4CAF50',
  chartTertiary: '#2196F3',
};

// Blue theme (male)
export const BLUE_THEME: ThemeColors = {
  // Primary colors (blue theme)
  primary: '#2196F3',
  primaryLight: '#E3F2FD',
  primaryDark: '#1565C0',
  
  // Secondary colors
  secondary: '#4CAF50',
  secondaryLight: '#E8F5E9',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Background colors
  background: '#F5F9FF',
  backgroundSecondary: '#FFFFFF',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  
  // Vaccine status colors
  vaccineCompleted: '#4CAF50',
  vaccineDue: '#F44336',
  vaccineUpcoming: '#2196F3',
  
  // Chart colors
  chartPrimary: '#2196F3',
  chartSecondary: '#4CAF50',
  chartTertiary: '#E91E63',
};

// ============================================================================
// THEME STORE
// ============================================================================

export type ThemeType = 'pink' | 'blue';

interface ThemeState {
  // Current theme
  themeType: ThemeType;
  colors: ThemeColors;
  
  // Actions
  setThemeByGender: (gender: Gender | null | undefined) => void;
  setTheme: (themeType: ThemeType) => void;
  resetToDefault: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // Default to pink theme
      themeType: 'pink',
      colors: PINK_THEME,
      
      // Set theme based on gender
      setThemeByGender: (gender: Gender | null | undefined) => {
        if (gender === 'male') {
          set({ themeType: 'blue', colors: BLUE_THEME });
        } else {
          // Default to pink for female or no gender specified
          set({ themeType: 'pink', colors: PINK_THEME });
        }
      },
      
      // Set theme directly
      setTheme: (themeType: ThemeType) => {
        set({
          themeType,
          colors: themeType === 'blue' ? BLUE_THEME : PINK_THEME,
        });
      },
      
      // Reset to default pink theme
      resetToDefault: () => {
        set({ themeType: 'pink', colors: PINK_THEME });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Helper function to get theme colors based on gender
 * Can be used outside of React components
 */
export const getThemeByGender = (gender: Gender | null | undefined): ThemeColors => {
  return gender === 'male' ? BLUE_THEME : PINK_THEME;
};
