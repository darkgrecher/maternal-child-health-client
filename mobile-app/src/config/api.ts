/**
 * API Configuration
 * 
 * Configuration for API endpoints and client setup.
 */

// API Base URL - Update this with your server URL
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-production-server.com/api';  // Production

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
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
