/**
 * Auth0 Configuration
 *
 * Values come from ./env (see .env.example). Get them from
 * https://manage.auth0.com → Applications → Your Native App.
 */

import { ENV } from './env';

export const AUTH0_CONFIG = {
  ...ENV.auth0,

  // Scopes requested during login
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

// Validation to ensure config is set (env.ts already validates at startup,
// this is a convenience guard for call sites).
export function validateAuth0Config(): boolean {
  if (!AUTH0_CONFIG.domain) {
    console.error('⚠️ Auth0 domain not configured. Set EXPO_PUBLIC_AUTH0_DOMAIN in .env');
    return false;
  }
  if (!AUTH0_CONFIG.clientId) {
    console.error('⚠️ Auth0 Client ID not configured. Set EXPO_PUBLIC_AUTH0_CLIENT_ID in .env');
    return false;
  }
  return true;
}
