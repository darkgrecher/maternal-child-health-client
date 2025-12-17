/**
 * Authentication Types
 * 
 * Types for authentication flow.
 */

/**
 * User information from authentication
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Google Sign-In user info (from Expo)
 */
export interface GoogleUser {
  id: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  photo?: string;
}

/**
 * Authentication state
 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

/**
 * Auth API response
 */
export interface AuthResponse {
  success: boolean;
  data?: AuthTokens;
  message?: string;
}

/**
 * User profile API response
 */
export interface UserProfileResponse {
  success: boolean;
  data?: AuthUser;
  message?: string;
}
