/**
 * Auth Store
 * 
 * Zustand store for managing authentication state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser, AuthStatus } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  // Auth state
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  error: string | null;
  
  // Actions
  signInWithGoogle: (idToken: string) => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  
  // Internal actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  
  // Computed
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle',
      error: null,

      /**
       * Sign in with Google ID token or authorization code
       */
      signInWithGoogle: async (idToken: string, code?: string, redirectUri?: string) => {
        set({ status: 'loading', error: null });
        
        try {
          const tokens = await authService.signInWithGoogle(idToken, code, redirectUri);
          
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            status: 'authenticated',
          });
          
          // Fetch user profile
          await get().fetchProfile();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign in failed';
          set({ status: 'error', error: message });
          throw error;
        }
      },

      /**
       * Refresh the access token
       */
      refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) return false;
        
        try {
          const tokens = await authService.refreshToken(currentRefreshToken);
          
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
          
          return true;
        } catch {
          get().clearAuth();
          return false;
        }
      },

      /**
       * Fetch user profile from API
       */
      fetchProfile: async () => {
        try {
          const user = await authService.getProfile();
          set({ user });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      },

      /**
       * Logout current session
       */
      logout: async () => {
        const currentRefreshToken = get().refreshToken;
        
        try {
          if (currentRefreshToken) {
            await authService.logout(currentRefreshToken);
          }
        } catch (error) {
          console.error('Logout API error:', error);
        } finally {
          get().clearAuth();
        }
      },

      /**
       * Logout from all devices
       */
      logoutAll: async () => {
        try {
          await authService.logoutAll();
        } catch (error) {
          console.error('Logout all API error:', error);
        } finally {
          get().clearAuth();
        }
      },

      /**
       * Set tokens (used by API client for token refresh)
       */
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      /**
       * Set user
       */
      setUser: (user: AuthUser | null) => {
        set({ user });
      },

      /**
       * Set status
       */
      setStatus: (status: AuthStatus) => {
        set({ status });
      },

      /**
       * Set error
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * Clear all auth state
       */
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: 'unauthenticated',
          error: null,
        });
      },

      /**
       * Check if user is authenticated
       */
      isAuthenticated: () => {
        const { accessToken, status } = get();
        return !!accessToken && status === 'authenticated';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        status: state.status,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set status based on token presence
        if (state?.accessToken) {
          state.status = 'authenticated';
        } else {
          state?.setStatus('unauthenticated');
        }
      },
    }
  )
);
