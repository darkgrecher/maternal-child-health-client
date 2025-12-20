/**
 * Theme Context
 * 
 * React context provider for theme colors.
 * Uses the theme store to provide colors throughout the app.
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useThemeStore, ThemeColors, PINK_THEME } from '../stores/themeStore';
import { useChildStore } from '../stores/childStore';

// Create context with default colors
const ThemeContext = createContext<ThemeColors>(PINK_THEME);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Wraps the app and provides theme colors based on the selected child's gender.
 * Automatically updates when the child profile changes.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { colors, setThemeByGender } = useThemeStore();
  const { profile } = useChildStore();
  
  // Update theme when child profile changes
  useEffect(() => {
    setThemeByGender(profile?.gender);
  }, [profile?.gender, setThemeByGender]);
  
  return (
    <ThemeContext.Provider value={colors}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access current theme colors
 * 
 * @returns Current theme colors based on child's gender
 */
export const useTheme = (): ThemeColors => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to access theme colors with store actions
 * 
 * @returns Theme colors and actions to change theme
 */
export const useThemeWithActions = () => {
  const colors = useTheme();
  const { setThemeByGender, setTheme, resetToDefault, themeType } = useThemeStore();
  
  return {
    colors,
    themeType,
    setThemeByGender,
    setTheme,
    resetToDefault,
  };
};

export default ThemeProvider;
