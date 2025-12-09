import { get, post, patch, del } from './axios';
import type {
  User,
  UserWithProfile,
  UserProfile,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ProfileUpdateRequest,
  UserTypeUpdateRequest,
} from '@/types';

// =============================================================================
// API Endpoints (maps to accounts/urls.py)
// =============================================================================

const ENDPOINTS = {
  // Authentication (via django-allauth)
  signup: '/accounts/signup/',
  logout: '/accounts/logout/',
  
  // Profile
  profile: '/accounts/profile/',
  profileEdit: '/accounts/profile/edit/',
  
  // Dashboard
  dashboard: '/accounts/dashboard/',
  
  // User management
  updateUserType: '/accounts/api/update-user-type/',
  deleteAccount: '/accounts/delete/',
} as const;

// =============================================================================
// Authentication Functions
// =============================================================================

/**
 * Sign up a new user
 * POST /accounts/signup/
 */
export const signup = async (data: SignupRequest): Promise<LoginResponse> => {
  return post<LoginResponse>(ENDPOINTS.signup, data);
};

/**
 * Log out current user
 * POST /accounts/logout/
 */
export const logout = async (): Promise<void> => {
  return post<void>(ENDPOINTS.logout);
};

/**
 * Request password reset email
 * POST /auth/password/reset/ (via allauth)
 */
export const requestPasswordReset = async (
  data: PasswordResetRequest
): Promise<{ detail: string }> => {
  return post<{ detail: string }>('/auth/password/reset/', data);
};

/**
 * Confirm password reset with token
 * POST /auth/password/reset/confirm/ (via allauth)
 */
export const confirmPasswordReset = async (
  data: PasswordResetConfirmRequest
): Promise<{ detail: string }> => {
  return post<{ detail: string }>('/auth/password/reset/confirm/', data);
};

// =============================================================================
// Profile Functions
// =============================================================================

/**
 * Get current user profile
 * GET /accounts/profile/
 */
export const getProfile = async (): Promise<UserWithProfile> => {
  return get<UserWithProfile>(ENDPOINTS.profile);
};

/**
 * Update user profile
 * PATCH /accounts/profile/edit/
 */
export const updateProfile = async (
  data: ProfileUpdateRequest
): Promise<UserProfile> => {
  return patch<UserProfile>(ENDPOINTS.profileEdit, data);
};

/**
 * Update profile with avatar (multipart)
 * PATCH /accounts/profile/edit/
 */
export const updateProfileWithAvatar = async (
  data: ProfileUpdateRequest & { avatar?: File }
): Promise<UserProfile> => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return patch<UserProfile>(ENDPOINTS.profileEdit, formData);
};

// =============================================================================
// Dashboard Functions
// =============================================================================

/**
 * Get dashboard data
 * GET /accounts/dashboard/
 */
export interface DashboardData {
  user: UserWithProfile;
  stats: {
    total_campaigns?: number;
    active_campaigns?: number;
    total_collaborations?: number;
    pending_payments?: number;
  };
  recent_activity: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export const getDashboard = async (): Promise<DashboardData> => {
  return get<DashboardData>(ENDPOINTS.dashboard);
};

// =============================================================================
// User Management Functions
// =============================================================================

/**
 * Update user type
 * POST /accounts/api/update-user-type/
 */
export const updateUserType = async (
  data: UserTypeUpdateRequest
): Promise<User> => {
  return post<User>(ENDPOINTS.updateUserType, data);
};

/**
 * Delete user account
 * POST /accounts/delete/
 */
export const deleteAccount = async (password: string): Promise<void> => {
  return post<void>(ENDPOINTS.deleteAccount, { password });
};

// =============================================================================
// Export all functions
// =============================================================================

export const accountsApi = {
  signup,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
  getProfile,
  updateProfile,
  updateProfileWithAvatar,
  getDashboard,
  updateUserType,
  deleteAccount,
};

export default accountsApi;
