// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard paginated response from Django REST Framework
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Generic API error response
 */
export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
  status?: number;
}

/**
 * API success response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * API root response
 */
export interface ApiRootResponse {
  message: string;
  version: string;
  endpoints: {
    admin: string;
    auth: string;
    agencies: string;
    influencers: string;
    campaigns: string;
    payments: string;
    reports: string;
    docs: string;
  };
}

// =============================================================================
// Common Types
// =============================================================================

/**
 * ISO 8601 date string
 */
export type ISODateString = string;

/**
 * Currency code (e.g., 'MAD', 'USD', 'EUR')
 */
export type CurrencyCode = 'MAD' | 'USD' | 'EUR' | 'GBP';

/**
 * File upload response
 */
export interface FileUpload {
  url: string;
  filename: string;
  size: number;
  content_type: string;
}

/**
 * Generic ID type
 */
export type ID = number;

// =============================================================================
// Query Parameters
// =============================================================================

/**
 * Common pagination parameters
 */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

/**
 * Common search parameters
 */
export interface SearchParams extends PaginationParams {
  search?: string;
  ordering?: string;
}

/**
 * Date range filter parameters
 */
export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}
