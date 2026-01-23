/**
 * Auth0 Configuration
 * 
 * Replace these values with your Auth0 application credentials.
 * 
 * To get these values:
 * 1. Go to https://manage.auth0.com
 * 2. Navigate to Applications → Your Native App
 * 3. Copy the Domain and Client ID
 */

export const AUTH0_CONFIG = {
  // Your Auth0 domain
  domain: 'dev-e5znz5x47bkxbit3.us.auth0.com',
  
  // Your Auth0 Native application Client ID
  // TODO: Get this from Auth0 Dashboard → Applications → Your Native App → Client ID
  clientId: 'zo0l9lQtXYfeAf6A4G7JpPTMaCdwLV4n',
  
  // API identifier (audience) - must match what you created in Auth0 APIs
  audience: 'https://maternal-child-api',
  
  // Database connection name for email/password authentication
  // Default is 'Username-Password-Authentication'
  // Check Auth0 Dashboard → Authentication → Database to verify your connection name
  databaseConnection: 'Username-Password-Authentication',
  
  // Scopes requested during login
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

// Validation to ensure config is set
export function validateAuth0Config(): boolean {
  if (AUTH0_CONFIG.domain === 'YOUR_AUTH0_DOMAIN') {
    console.error('⚠️ Auth0 domain not configured. Update src/config/auth0.ts');
    return false;
  }
  if (AUTH0_CONFIG.clientId === 'YOUR_AUTH0_CLIENT_ID') {
    console.error('⚠️ Auth0 Client ID not configured. Update src/config/auth0.ts');
    return false;
  }
  return true;
}
