import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('accessToken', token);
      } else {
        sessionStorage.removeItem('accessToken');
      }
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('accessToken');
    }
    return null;
  }

  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/tapmenu_csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAccessToken();
    const csrfToken = this.getCsrfToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (csrfToken && options.method && options.method !== 'GET') {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message, response.status, data.errors);
    }

    return data;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public fieldErrors: Record<string, string[]> | null = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
