/**
 * API Configuration
 * 
 * Configuration for API endpoints and client setup.
 */

// API Base URL - Update this with your server URL
// Using local network IP instead of localhost for Expo Go on physical devices
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.101:3000/api'  // Development - Use your local IP for physical devices
  : 'https://your-production-server.com/api';  // Production

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
    AUTH0: '/auth/auth0',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
  },
  CHILDREN: {
    BASE: '/children',
    BY_ID: (id: string) => `/children/${id}`,
  },
} as const;
