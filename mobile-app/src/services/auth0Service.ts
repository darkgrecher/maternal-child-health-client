/**
 * Auth0 Service
 * 
 * Service for handling Auth0 authentication including:
 * - Email/Password login
 * - Email/Password signup
 * - Social logins (Google, etc.)
 * - Token management
 */

import { useCallback, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AUTH0_CONFIG, validateAuth0Config } from '../config/auth0';
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

// Complete auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Types
export interface Auth0User {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  nickname?: string;
}

export interface Auth0Tokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResult {
  user: Auth0User;
  tokens: Auth0Tokens;
}

// Auth0 endpoints
const getAuth0Endpoints = () => ({
  authorization: `https://${AUTH0_CONFIG.domain}/authorize`,
  token: `https://${AUTH0_CONFIG.domain}/oauth/token`,
  userInfo: `https://${AUTH0_CONFIG.domain}/userinfo`,
  logout: `https://${AUTH0_CONFIG.domain}/v2/logout`,
  dbSignup: `https://${AUTH0_CONFIG.domain}/dbconnections/signup`,
});

/**
 * Get redirect URI based on environment
 */
const getRedirectUri = (): string => {
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (isExpoGo) {
    // For Expo Go, use Expo's auth session redirect
    return AuthSession.makeRedirectUri({
      scheme: 'maternal-child-app',
    });
  }
  
  // For standalone builds
  return AuthSession.makeRedirectUri({
    scheme: 'maternal-child-app',
    path: 'callback',
  });
};

/**
 * Hook for Auth0 authentication
 * Handles authorization code flow with PKCE
 */
export function useAuth0() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const redirectUri = getRedirectUri();
  const endpoints = getAuth0Endpoints();
  
  // Discovery document for Auth0
  const discovery = {
    authorizationEndpoint: endpoints.authorization,
    tokenEndpoint: endpoints.token,
    revocationEndpoint: `https://${AUTH0_CONFIG.domain}/oauth/revoke`,
  };
  
  // Auth request with PKCE
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CONFIG.clientId,
      redirectUri,
      scopes: AUTH0_CONFIG.scopes,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        audience: AUTH0_CONFIG.audience,
      },
    },
    discovery
  );
  
  /**
   * Exchange authorization code for tokens
   */
  const exchangeCodeForTokens = useCallback(async (code: string): Promise<Auth0Tokens> => {
    const tokenResponse = await fetch(endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: AUTH0_CONFIG.clientId,
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
    }
    
    const tokens = await tokenResponse.json();
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
    };
  }, [endpoints.token, redirectUri]);
  
  /**
   * Get user info from Auth0
   */
  const getUserInfo = useCallback(async (accessToken: string): Promise<Auth0User> => {
    const response = await fetch(endpoints.userInfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return response.json();
  }, [endpoints.userInfo]);
  
  /**
   * Login with email/password using Resource Owner Password Grant
   * Note: Requires enabling "Password" grant type in Auth0 application settings
   */
  const loginWithEmailPassword = useCallback(async (
    email: string, 
    password: string
  ): Promise<AuthResult> => {
    if (!validateAuth0Config()) {
      throw new Error('Auth0 is not properly configured');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenResponse = await fetch(endpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'password',
          client_id: AUTH0_CONFIG.clientId,
          username: email,
          password,
          audience: AUTH0_CONFIG.audience,
          scope: AUTH0_CONFIG.scopes.join(' '),
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error_description || 'Login failed');
      }
      
      const tokens = await tokenResponse.json();
      
      const auth0Tokens: Auth0Tokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type,
      };
      
      const user = await getUserInfo(auth0Tokens.accessToken);
      
      return { user, tokens: auth0Tokens };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [endpoints.token, getUserInfo]);
  
  /**
   * Sign up with email/password
   */
  const signupWithEmailPassword = useCallback(async (
    email: string, 
    password: string,
    name?: string
  ): Promise<void> => {
    if (!validateAuth0Config()) {
      throw new Error('Auth0 is not properly configured');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const signupPayload = {
        client_id: AUTH0_CONFIG.clientId,
        email,
        password,
        connection: AUTH0_CONFIG.databaseConnection,
        name,
      };
      
      console.log('Signup request to:', endpoints.dbSignup);
      console.log('Signup payload:', { ...signupPayload, password: '***' });
      
      const signupResponse = await fetch(endpoints.dbSignup, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupPayload),
      });
      
      const responseText = await signupResponse.text();
      console.log('Signup response status:', signupResponse.status);
      console.log('Signup response:', responseText);
      
      if (!signupResponse.ok) {
        let errorMessage = 'Signup failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.description || errorData.message || errorData.error || 'Signup failed';
          
          // Provide more specific error messages
          if (errorMessage.toLowerCase().includes('invalid sign up')) {
            errorMessage = [
              'Unable to create account. Please verify:',
              '',
              '• Password is at least 8 characters with letters and numbers',
              '• Email address is valid and not already registered',
              '• Auth0 database connection is properly configured',
              '',
              'If the issue persists, check the console logs for details.'
            ].join('\n');
          } else if (errorMessage.toLowerCase().includes('user already exists')) {
            errorMessage = 'An account with this email already exists. Please log in instead.';
          }
        } catch {
          errorMessage = `Signup failed: ${responseText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Signup successful - user should now login
      console.log('Signup successful');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      console.error('Signup error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [endpoints.dbSignup]);
  
  /**
   * Login with social provider (Google, etc.)
   * Uses authorization code flow with PKCE
   */
  const loginWithSocial = useCallback(async (
    connection: 'google-oauth2' | 'apple' | string
  ): Promise<void> => {
    if (!validateAuth0Config()) {
      throw new Error('Auth0 is not properly configured');
    }
    
    if (!request) {
      throw new Error('Auth request not ready');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prompt with specific connection (e.g., Google)
      await promptAsync({
        extraParams: {
          connection,
        },
      } as any);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Social login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [request, promptAsync]);
  
  /**
   * Universal login - opens Auth0's hosted login page
   */
  const loginWithUniversalLogin = useCallback(async (): Promise<void> => {
    if (!validateAuth0Config()) {
      throw new Error('Auth0 is not properly configured');
    }
    
    if (!request) {
      throw new Error('Auth request not ready');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await promptAsync();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [request, promptAsync]);
  
  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async (currentRefreshToken: string): Promise<Auth0Tokens> => {
    const tokenResponse = await fetch(endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: AUTH0_CONFIG.clientId,
        refresh_token: currentRefreshToken,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Token refresh failed');
    }
    
    const tokens = await tokenResponse.json();
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || currentRefreshToken,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
    };
  }, [endpoints.token]);
  
  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    const logoutUrl = `${endpoints.logout}?client_id=${AUTH0_CONFIG.clientId}&returnTo=${encodeURIComponent(redirectUri)}`;
    await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
  }, [endpoints.logout, redirectUri]);
  
  return {
    // State
    isLoading,
    error,
    isReady: !!request,
    redirectUri,
    
    // Auth response (for handling callback)
    authResponse: response,
    
    // Methods
    loginWithEmailPassword,
    signupWithEmailPassword,
    loginWithSocial,
    loginWithUniversalLogin,
    refreshToken,
    logout,
    exchangeCodeForTokens,
    getUserInfo,
    
    // Utils
    setError,
    clearError: () => setError(null),
  };
}

/**
 * Auth0 API Service for backend communication
 */
export const auth0Service = {
  /**
   * Validate Auth0 token with backend and get app-specific tokens
   */
  async validateWithBackend(auth0Token: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { accessToken: string; refreshToken: string; user: any };
    }>(
      API_ENDPOINTS.AUTH.AUTH0,
      { auth0Token },
      { requiresAuth: false }
    );
    return response.data;
  },
  
  /**
   * Refresh app token using refresh token
   */
  async refreshAppToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { accessToken: string; refreshToken: string };
    }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken },
      { requiresAuth: false }
    );
    return response.data;
  },
};
