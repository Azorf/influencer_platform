import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError } from '@/types';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const TIMEOUT = 30000; // 30 seconds

// =============================================================================
// Token Management
// =============================================================================

let accessToken: string | null = null;

/**
 * Set the access token for authenticated requests
 */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }
};

/**
 * Get the current access token
 */
export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

/**
 * Clear all tokens (logout)
 */
export const clearTokens = (): void => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// =============================================================================
// Axios Instance
// =============================================================================

/**
 * Create configured axios instance
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor - inject auth token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Try to refresh token if available
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('refresh_token')
            : null;

        if (refreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh: refreshToken,
            });
            const newToken = response.data.access;
            setAccessToken(newToken);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Token ${newToken}`;
            }
            return instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        } else {
          // No refresh token, redirect to login
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }

      // Transform error for consistent handling
      const apiError: ApiError = {
        detail: error.response?.data?.detail || error.message,
        message: error.response?.data?.message || 'An error occurred',
        errors: error.response?.data?.errors,
        code: error.code,
        status: error.response?.status,
      };

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// =============================================================================
// API Client Instance
// =============================================================================

export const apiClient = createAxiosInstance();

// =============================================================================
// Helper Methods
// =============================================================================

/**
 * GET request helper
 */
export const get = async <T>(
  url: string,
  params?: Record<string, unknown>
): Promise<T> => {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
};

/**
 * POST request helper
 */
export const post = async <T>(
  url: string,
  data?: unknown
): Promise<T> => {
  const response = await apiClient.post<T>(url, data);
  return response.data;
};

/**
 * PUT request helper
 */
export const put = async <T>(
  url: string,
  data?: unknown
): Promise<T> => {
  const response = await apiClient.put<T>(url, data);
  return response.data;
};

/**
 * PATCH request helper
 */
export const patch = async <T>(
  url: string,
  data?: unknown
): Promise<T> => {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
};

/**
 * DELETE request helper
 */
export const del = async <T>(url: string): Promise<T> => {
  const response = await apiClient.delete<T>(url);
  return response.data;
};

/**
 * Upload file helper (multipart/form-data)
 */
export const upload = async <T>(
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<T> => {
  const response = await apiClient.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });
  return response.data;
};

/**
 * Download file helper
 */
export const download = async (
  url: string,
  filename: string
): Promise<void> => {
  const response = await apiClient.get(url, {
    responseType: 'blob',
  });

  // Create download link
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

// =============================================================================
// Export Default
// =============================================================================

export default apiClient;
