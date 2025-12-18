/**
 * Auth Store (Auth0 Version)
 * 
 * Zustand store for managing authentication state with Auth0.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth0Service, Auth0User, Auth0Tokens } from '../services/auth0Service';
import { apiClient } from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  auth0Id?: string;
}

interface AuthState {
  // Auth state
  user: AppUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  auth0AccessToken: string | null;
  status: AuthStatus;
  error: string | null;
  
  // Actions
  loginWithAuth0: (auth0Tokens: Auth0Tokens, auth0User: Auth0User) => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Internal actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuth0Token: (token: string | null) => void;
  setUser: (user: AppUser | null) => void;
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
      auth0AccessToken: null,
      status: 'idle',
      error: null,

      /**
       * Login with Auth0 tokens
       * Validates with backend and stores app tokens
       */
      loginWithAuth0: async (auth0Tokens: Auth0Tokens, auth0User: Auth0User) => {
        set({ status: 'loading', error: null });
        
        try {
          // Validate Auth0 token with backend and get app tokens
          const response = await auth0Service.validateWithBackend(auth0Tokens.accessToken);
          
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            auth0AccessToken: auth0Tokens.accessToken,
            user: response.user,
            status: 'authenticated',
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Authentication failed';
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
          const tokens = await auth0Service.refreshAppToken(currentRefreshToken);
          
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
          const response = await apiClient.get<{ user: AppUser }>(API_ENDPOINTS.AUTH.ME);
          set({ user: response.data.user });
        } catch (error) {
          console.log('Failed to fetch profile:', error);
          // Don't throw - profile fetch failure shouldn't break auth
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        const currentRefreshToken = get().refreshToken;
        
        try {
          if (currentRefreshToken) {
            await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken: currentRefreshToken });
          }
        } catch {
          // Continue with local logout even if API call fails
        }
        
        get().clearAuth();
      },

      /**
       * Set tokens
       */
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      /**
       * Set Auth0 access token
       */
      setAuth0Token: (token: string | null) => {
        set({ auth0AccessToken: token });
      },

      /**
       * Set user
       */
      setUser: (user: AppUser | null) => {
        set({ user });
      },

      /**
       * Set auth status
       */
      setStatus: (status: AuthStatus) => {
        set({ status });
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error, status: error ? 'error' : get().status });
      },

      /**
       * Clear all auth state
       */
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          auth0AccessToken: null,
          status: 'unauthenticated',
          error: null,
        });
      },

      /**
       * Check if user is authenticated
       */
      isAuthenticated: () => {
        return get().status === 'authenticated' && !!get().accessToken;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        auth0AccessToken: state.auth0AccessToken,
        status: state.status === 'authenticated' ? 'authenticated' : 'unauthenticated',
      }),
    }
  )
);
