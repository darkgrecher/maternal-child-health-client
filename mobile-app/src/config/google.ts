/**
 * Google Sign-In Configuration
 *
 * Configuration for Google OAuth. Values come from ./env (see .env.example).
 * Get your credentials from: https://console.cloud.google.com/apis/credentials
 */

import { ENV } from './env';

export const GOOGLE_CONFIG = ENV.google;

// Scopes requested during Google Sign-In
export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
];
