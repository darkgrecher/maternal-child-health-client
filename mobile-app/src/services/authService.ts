/**
 * Authentication Service
 * 
 * Service for handling Google Sign-In and authentication API calls.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { GOOGLE_CONFIG } from '../config/google';
import { 
  AuthResponse, 
  UserProfileResponse, 
  AuthTokens,
  AuthUser,
} from '../types';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Expo proxy URL - THIS IS THE KEY!
const EXPO_PROXY_REDIRECT_URI = 'https://auth.expo.io/@darkgrechers-organization/maternal-child-app';

/**
 * Hook for Google Sign-In
 * Must be called within a React component
 * 
 * For Expo Go: Uses Expo's auth proxy (https://auth.expo.io)
 * For standalone builds: Uses native OAuth
 */
export function useGoogleAuth() {
  // Determine if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  
  // For Expo Go, MUST use the Expo proxy redirect URI
  // For standalone builds, use native scheme
  const redirectUri = isExpoGo
    ? EXPO_PROXY_REDIRECT_URI
    : AuthSession.makeRedirectUri({
        scheme: 'maternal-child-app',
        path: 'redirect',
      });

  console.log('🔑 OAuth Config:');
  console.log('  - Running in Expo Go:', isExpoGo);
  console.log('  - Redirect URI:', redirectUri);

  // For Expo Go, ALWAYS use Web client ID (supports redirect URIs)
  // For standalone builds, use platform-specific client IDs
  const clientId = isExpoGo ? GOOGLE_CONFIG.webClientId : undefined;
  const iosClientId = !isExpoGo ? GOOGLE_CONFIG.iosClientId : undefined;
  const androidClientId = !isExpoGo ? GOOGLE_CONFIG.androidClientId : undefined;

  // Use useAuthRequest (returns authorization code) - works with Expo proxy
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    iosClientId,
    androidClientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  return {
    request,
    response,
    promptAsync,
    isReady: !!request,
    redirectUri,
  };
}

/**
 * Authentication API Service
 */
export const authService = {
  /**
   * Authenticate with Google ID token or authorization code
   */
  async signInWithGoogle(idToken: string, code?: string, redirectUri?: string): Promise<AuthTokens> {
    // Build request body - send either idToken or code
    const body: { idToken?: string; code?: string; redirectUri?: string } = {};
    
    if (idToken) {
      body.idToken = idToken;
    }
    if (code) {
      body.code = code;
      body.redirectUri = redirectUri;
    }
    
    console.log('Sending to backend:', JSON.stringify(body, null, 2));
    
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.GOOGLE,
      body,
      { requiresAuth: false }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Authentication failed');
    }
    
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken },
      { requiresAuth: false }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Token refresh failed');
    }
    
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<AuthUser> {
    const response = await apiClient.get<UserProfileResponse>(
      API_ENDPOINTS.AUTH.ME
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get profile');
    }
    
    return response.data;
  },

  /**
   * Logout (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.AUTH.LOGOUT,
      { refreshToken }
    );
  },

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT_ALL);
  },
};
