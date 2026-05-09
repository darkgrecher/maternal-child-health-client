/**
 * API Client for Midwife Web Application
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string | null;
    expiresIn?: number;
  };
}

type RefreshTokenProvider = () => string | null;
type TokensRefreshedHandler = (tokens: { accessToken: string; refreshToken?: string | null }) => void;

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshTokenProvider: RefreshTokenProvider | null = null;
  private onTokensRefreshed: TokensRefreshedHandler | null = null;
  private refreshInFlight: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setRefreshTokenProvider(provider: RefreshTokenProvider | null) {
    this.refreshTokenProvider = provider;
  }

  setOnTokensRefreshed(handler: TokensRefreshedHandler | null) {
    this.onTokensRefreshed = handler;
  }

  private buildHeaders(fetchOptions: RequestInit, requiresAuth: boolean): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    if (requiresAuth && this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.refreshTokenProvider?.();
    if (!refreshToken) {
      return null;
    }

    this.refreshInFlight = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        const data: RefreshTokenResponse | null = await response.json().catch(() => null);
        if (!response.ok) {
          return null;
        }

        const accessToken = data?.data?.accessToken;
        if (!accessToken) {
          return null;
        }

        const nextRefreshToken = data?.data?.refreshToken ?? refreshToken;
        this.setAccessToken(accessToken);
        this.onTokensRefreshed?.({ accessToken, refreshToken: nextRefreshToken });
        return accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.requestWithRetry<T>(endpoint, options, false);
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestOptions,
    didRetry: boolean
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;
    const headers = this.buildHeaders(fetchOptions, requiresAuth);
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (response.status === 401 && requiresAuth && !didRetry) {
        const refreshedToken = await this.refreshAccessToken();
        if (refreshedToken) {
          return this.requestWithRetry<T>(endpoint, options, true);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // GET request
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
