/**
 * Google Sign-In Configuration
 * 
 * Configuration for Google OAuth.
 * Get your credentials from: https://console.cloud.google.com/apis/credentials
 */

// Expo Client ID for Google Sign-In
// You need to create OAuth 2.0 credentials in Google Cloud Console
export const GOOGLE_CONFIG = {
  // For Expo Go development and web client
  // Using the same Web Client ID for all (works with Expo AuthSession)
  expoClientId: '819134646852-i5ura8l26b1hac6et5st7oj005163mt0.apps.googleusercontent.com',
  
  // For iOS standalone builds (create iOS OAuth client in Google Console)
  iosClientId: '819134646852-i5ura8l26b1hac6et5st7oj005163mt0.apps.googleusercontent.com',
  
  // For Android standalone builds (create Android OAuth client in Google Console)
  androidClientId: '819134646852-8avco5r1jikmodrdpngq7jls93ej25er.apps.googleusercontent.com',
  
  // For web builds (same as backend GOOGLE_CLIENT_ID)
  webClientId: '819134646852-i5ura8l26b1hac6et5st7oj005163mt0.apps.googleusercontent.com',
};

// Scopes requested during Google Sign-In
export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
];
