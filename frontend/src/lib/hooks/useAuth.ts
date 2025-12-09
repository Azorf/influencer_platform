import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { accountsApi, type DashboardData } from '@/lib/api/accounts';
import { setAccessToken, clearTokens } from '@/lib/api/axios';
import { accountKeys } from '@/lib/query-keys';
import type {
  ApiError,
  UserWithProfile,
  UserProfile,
  LoginResponse,
  SignupRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ProfileUpdateRequest,
  UserTypeUpdateRequest,
  User,
} from '@/types';

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to get current user profile
 * Maps to GET /accounts/profile/
 */
export const useProfile = (
  options?: Omit<
    UseQueryOptions<UserWithProfile, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<UserWithProfile, ApiError>({
    queryKey: accountKeys.profile(),
    queryFn: accountsApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to get dashboard data
 * Maps to GET /accounts/dashboard/
 */
export const useDashboard = (
  options?: Omit<
    UseQueryOptions<DashboardData, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<DashboardData, ApiError>({
    queryKey: accountKeys.dashboard(),
    queryFn: accountsApi.getDashboard,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook for user signup
 * Maps to POST /accounts/signup/
 */
export const useSignup = (
  options?: UseMutationOptions<LoginResponse, ApiError, SignupRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, ApiError, SignupRequest>({
    mutationFn: accountsApi.signup,
    onSuccess: (data: LoginResponse) => {
      setAccessToken(data.token);
      queryClient.setQueryData(accountKeys.profile(), data.user);
    },
    ...options,
  });
};

/**
 * Hook for user logout
 * Maps to POST /accounts/logout/
 */
export const useLogout = (
  options?: UseMutationOptions<void, ApiError, void>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: accountsApi.logout,
    onSuccess: () => {
      clearTokens();
      queryClient.clear(); // Clear all cached data
    },
    onError: () => {
      // Even on error, clear tokens locally
      clearTokens();
      queryClient.clear();
    },
    ...options,
  });
};

/**
 * Hook for password reset request
 * Maps to POST /auth/password/reset/
 */
export const useRequestPasswordReset = (
  options?: UseMutationOptions<{ detail: string }, ApiError, PasswordResetRequest>
) => {
  return useMutation<{ detail: string }, ApiError, PasswordResetRequest>({
    mutationFn: accountsApi.requestPasswordReset,
    ...options,
  });
};

/**
 * Hook for password reset confirmation
 * Maps to POST /auth/password/reset/confirm/
 */
export const useConfirmPasswordReset = (
  options?: UseMutationOptions<
    { detail: string },
    ApiError,
    PasswordResetConfirmRequest
  >
) => {
  return useMutation<{ detail: string }, ApiError, PasswordResetConfirmRequest>({
    mutationFn: accountsApi.confirmPasswordReset,
    ...options,
  });
};

/**
 * Hook for profile update
 * Maps to PATCH /accounts/profile/edit/
 */
export const useUpdateProfile = (
  options?: UseMutationOptions<UserProfile, ApiError, ProfileUpdateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, ApiError, ProfileUpdateRequest>({
    mutationFn: accountsApi.updateProfile,
    onSuccess: (data: UserProfile) => {
      // Update profile in cache
      queryClient.setQueryData<UserWithProfile>(
        accountKeys.profile(),
        (old: UserWithProfile | undefined) => {
          if (!old) return old;
          return { ...old, profile: data };
        }
      );
    },
    ...options,
  });
};

/**
 * Hook for profile update with avatar
 * Maps to PATCH /accounts/profile/edit/ (multipart)
 */
export const useUpdateProfileWithAvatar = (
  options?: UseMutationOptions<
    UserProfile,
    ApiError,
    ProfileUpdateRequest & { avatar?: File }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, ApiError, ProfileUpdateRequest & { avatar?: File }>({
    mutationFn: accountsApi.updateProfileWithAvatar,
    onSuccess: (data: UserProfile) => {
      queryClient.setQueryData<UserWithProfile>(
        accountKeys.profile(),
        (old: UserWithProfile | undefined) => {
          if (!old) return old;
          return { ...old, profile: data };
        }
      );
    },
    ...options,
  });
};

/**
 * Hook for updating user type
 * Maps to POST /accounts/api/update-user-type/
 */
export const useUpdateUserType = (
  options?: UseMutationOptions<User, ApiError, UserTypeUpdateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, UserTypeUpdateRequest>({
    mutationFn: accountsApi.updateUserType,
    onSuccess: (data: User) => {
      queryClient.setQueryData<UserWithProfile>(
        accountKeys.profile(),
        (old: UserWithProfile | undefined) => {
          if (!old) return old;
          return { ...old, ...data };
        }
      );
    },
    ...options,
  });
};

/**
 * Hook for account deletion
 * Maps to POST /accounts/delete/
 */
export const useDeleteAccount = (
  options?: UseMutationOptions<void, ApiError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: accountsApi.deleteAccount,
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
    },
    ...options,
  });
};

// =============================================================================
// Export All Hooks
// =============================================================================

export const authHooks = {
  useProfile,
  useDashboard,
  useSignup,
  useLogout,
  useRequestPasswordReset,
  useConfirmPasswordReset,
  useUpdateProfile,
  useUpdateProfileWithAvatar,
  useUpdateUserType,
  useDeleteAccount,
};

export default authHooks;
