import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import type { CurrencyCode } from '@/types';

// =============================================================================
// Date Formatters
// =============================================================================

/**
 * Format ISO date string to readable format
 */
export const formatDate = (
  dateString: string | null | undefined,
  formatStr: string = 'MMM d, yyyy'
): string => {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '-';
    return format(date, formatStr);
  } catch {
    return '-';
  }
};

/**
 * Format date to include time
 */
export const formatDateTime = (
  dateString: string | null | undefined
): string => {
  return formatDate(dateString, 'MMM d, yyyy h:mm a');
};

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '-';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '-';
  }
};

/**
 * Format date for API requests (ISO format)
 */
export const formatDateForApi = (date: Date): string => {
  return date.toISOString();
};

// =============================================================================
// Number Formatters
// =============================================================================

/**
 * Format number with thousand separators
 */
export const formatNumber = (
  num: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US', options).format(num);
};

/**
 * Format number as compact (e.g., 1.2K, 3.4M)
 */
export const formatCompactNumber = (
  num: number | null | undefined
): string => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
};

/**
 * Format number as percentage
 */
export const formatPercentage = (
  num: number | null | undefined,
  decimals: number = 1
): string => {
  if (num === null || num === undefined) return '-';
  return `${num.toFixed(decimals)}%`;
};

/**
 * Format decimal as percentage (0.15 -> "15%")
 */
export const formatDecimalAsPercentage = (
  num: number | null | undefined,
  decimals: number = 1
): string => {
  if (num === null || num === undefined) return '-';
  return `${(num * 100).toFixed(decimals)}%`;
};

// =============================================================================
// Currency Formatters
// =============================================================================

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; symbol: string }> = {
  MAD: { locale: 'fr-MA', symbol: 'DH' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'fr-FR', symbol: '€' },
  GBP: { locale: 'en-GB', symbol: '£' },
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency: CurrencyCode = 'MAD'
): string => {
  if (amount === null || amount === undefined) return '-';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '-';

  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.MAD;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Format currency with compact notation
 */
export const formatCompactCurrency = (
  amount: number | string | null | undefined,
  currency: CurrencyCode = 'MAD'
): string => {
  if (amount === null || amount === undefined) return '-';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '-';

  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.MAD;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(numAmount);
};

// =============================================================================
// String Formatters
// =============================================================================

/**
 * Truncate string with ellipsis
 */
export const truncate = (
  str: string | null | undefined,
  maxLength: number
): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert snake_case to Title Case
 */
export const snakeToTitle = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .split('_')
    .map((word) => capitalize(word))
    .join(' ');
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (
  phone: string | null | undefined
): string => {
  if (!phone) return '-';
  // Basic formatting - can be enhanced for specific country formats
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// =============================================================================
// File Size Formatters
// =============================================================================

/**
 * Format bytes to human readable size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// =============================================================================
// Social Media Formatters
// =============================================================================

/**
 * Format engagement rate
 */
export const formatEngagementRate = (
  rate: number | null | undefined
): string => {
  if (rate === null || rate === undefined) return '-';
  return `${rate.toFixed(2)}%`;
};

/**
 * Format follower count with appropriate suffix
 */
export const formatFollowerCount = (
  count: number | null | undefined
): string => {
  if (count === null || count === undefined) return '-';

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};
