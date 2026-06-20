/**
 * API Configuration
 *
 * Configuration for API endpoints and client setup.
 */

import { ENV } from './env';

// API Base URL (validated in ./env)
export const API_BASE_URL = ENV.api.baseUrl;

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
  PREGNANCIES: {
    BASE: '/pregnancies',
    BY_ID: (id: string) => `/pregnancies/${id}`,
    ACTIVE: '/pregnancies/active',
    CONVERT: (id: string) => `/pregnancies/${id}/convert-to-child`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    DEVICES: '/notifications/devices',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },
} as const;
