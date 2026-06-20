/**
 * API Client Service
 * 
 * HTTP client for communicating with the backend API.
 */

import { API_BASE_URL } from '../config/api';

// Dynamic import to avoid circular dependency
const getAuthStore = () => require('../stores/auth0Store').useAuthStore;

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  // Holds the in-flight token refresh so concurrent 401s share a single
  // refresh instead of each racing with their own (rotating) refresh token.
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an authenticated request
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    // Add authorization header if required
    if (requiresAuth) {
      const useAuthStore = getAuthStore();
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && requiresAuth) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the original request with new token
          const useAuthStore = getAuthStore();
          const newToken = useAuthStore.getState().accessToken;
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers,
          });
          
          return this.handleResponse<T>(retryResponse);
        } else {
          // Refresh failed, logout user
          const useAuthStore = getAuthStore();
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please sign in again.');
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  /**
   * Handle response and parse JSON
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  /**
   * Try to refresh the access token.
   *
   * Concurrent callers (e.g. several requests that all get a 401 at once)
   * share a single in-flight refresh. Because the backend rotates refresh
   * tokens (each one is single-use), letting every request refresh on its
   * own would make all but the first fail and log the user out.
   */
  private tryRefreshToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  /**
   * Perform the actual token refresh network request.
   */
  private async performTokenRefresh(): Promise<boolean> {
    const useAuthStore = getAuthStore();
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.data) {
        useAuthStore.getState().setTokens(
          data.data.accessToken,
          data.data.refreshToken
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
