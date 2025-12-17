/**
 * App Store
 * 
 * Zustand store for managing global app settings including
 * language preferences, theme, and sync status.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, AppSettings } from '../types';
import { changeLanguage } from '../i18n';

interface AppState {
  // Settings
  settings: AppSettings;
  
  // Connection status
  isOnline: boolean;
  lastSyncTime: string | null;
  isSyncing: boolean;
  
  // Actions
  setLanguage: (language: Language) => Promise<void>;
  setNotifications: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setOnlineStatus: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: string) => void;
  
  // Utility
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  language: 'en',
  notifications: true,
  darkMode: false,
  offlineMode: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      isOnline: true,
      lastSyncTime: null,
      isSyncing: false,

      // Set language and update i18n
      setLanguage: async (language) => {
        await changeLanguage(language);
        set((state) => ({
          settings: { ...state.settings, language },
        }));
      },

      // Set notification preference
      setNotifications: (enabled) => set((state) => ({
        settings: { ...state.settings, notifications: enabled },
      })),

      // Set dark mode preference
      setDarkMode: (enabled) => set((state) => ({
        settings: { ...state.settings, darkMode: enabled },
      })),

      // Set online status
      setOnlineStatus: (online) => set({ isOnline: online }),

      // Set syncing status
      setSyncing: (syncing) => set({ isSyncing: syncing }),

      // Set last sync time
      setLastSyncTime: (time) => set({ 
        lastSyncTime: time,
        settings: { ...get().settings, lastSyncTime: time },
      }),

      // Reset to default settings
      resetSettings: () => set({
        settings: defaultSettings,
        lastSyncTime: null,
      }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);
