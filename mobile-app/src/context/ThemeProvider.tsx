/**
 * Theme Provider
 *
 * Side-effect provider that keeps the active theme in sync with the selected
 * child's gender. Theme colors are consumed directly from `useThemeStore`
 * throughout the app, so this component intentionally renders its children
 * without a React context.
 */

import React, { useEffect, ReactNode } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useChildStore } from '../stores/childStore';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const setThemeByGender = useThemeStore((state) => state.setThemeByGender);
  const profile = useChildStore((state) => state.profile);

  // Update theme whenever the selected child's gender changes
  useEffect(() => {
    setThemeByGender(profile?.gender);
  }, [profile?.gender, setThemeByGender]);

  return <>{children}</>;
};

export default ThemeProvider;
