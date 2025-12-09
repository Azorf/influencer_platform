import type { ID, ISODateString } from '../api';

// =============================================================================
// User Types (maps to accounts.CustomUser)
// =============================================================================

/**
 * User type choices from Django model
 */
export type UserType = 'agency' | 'influencer' | 'brand' | 'admin';

/**
 * Base user interface matching CustomUser model
 */
export interface User {
  id: ID;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  is_verified: boolean;
  phone_number: string | null;
  is_active: boolean;
  is_staff: boolean;
  date_joined: ISODateString;
  last_login: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * User with profile information
 */
export interface UserWithProfile extends User {
  profile: UserProfile | null;
}

// =============================================================================
// User Profile Types (maps to accounts.UserProfile)
// =============================================================================

/**
 * User profile matching UserProfile model
 */
export interface UserProfile {
  id: ID;
  user: ID;
  bio: string | null;
  avatar: string | null;
  location: string | null;
  website: string | null;
  date_of_birth: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// =============================================================================
// Authentication Types
// =============================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: UserWithProfile;
  token: string;
  refresh_token?: string;
}

/**
 * Signup request payload
 */
export interface SignupRequest {
  email: string;
  password1: string;
  password2: string;
  username?: string;
  user_type: UserType;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirm
 */
export interface PasswordResetConfirmRequest {
  uid: string;
  token: string;
  new_password1: string;
  new_password2: string;
}

/**
 * Profile update request
 */
export interface ProfileUpdateRequest {
  bio?: string;
  location?: string;
  website?: string;
  date_of_birth?: string;
  instagram_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  twitter_url?: string;
}

/**
 * User type update request
 */
export interface UserTypeUpdateRequest {
  user_type: UserType;
}

// =============================================================================
// Session Types
// =============================================================================

/**
 * Current authenticated session
 */
export interface AuthSession {
  user: UserWithProfile;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}
