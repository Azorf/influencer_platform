'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { setAccessToken, getAccessToken, clearTokens } from '@/lib/api/axios';
import { useProfile, useLogout } from '@/lib/hooks/useAuth';
import type { UserWithProfile, UserType } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface AuthContextValue {
  user: UserWithProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  login: (token: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user profile
  const {
    data: user,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useProfile({
    enabled: isInitialized && !!getAccessToken(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Logout mutation
  const logoutMutation = useLogout();

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setAccessToken(token);
    }
    setIsInitialized(true);
  }, []);

  // Login handler
  const login = useCallback((token: string, refreshToken?: string) => {
    setAccessToken(token);
    if (refreshToken && typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', refreshToken);
    }
    refetchProfile();
  }, [refetchProfile]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Even if API logout fails, clear local state
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      queryClient.clear();
      router.push('/login');
    }
  }, [logoutMutation, queryClient, router]);

  // Refresh user data
  const refreshUser = useCallback(() => {
    refetchProfile();
  }, [refetchProfile]);

  // Memoized context value
  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading: !isInitialized || isProfileLoading,
      isAuthenticated: !!user,
      userType: user?.user_type ?? null,
      login,
      logout,
      refreshUser,
    }),
    [user, isInitialized, isProfileLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// =============================================================================
// HOC for protected routes
// =============================================================================

interface WithAuthOptions {
  redirectTo?: string;
  allowedUserTypes?: UserType[];
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { redirectTo = '/login', allowedUserTypes } = options;

  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }

      if (
        !isLoading &&
        isAuthenticated &&
        allowedUserTypes &&
        user &&
        !allowedUserTypes.includes(user.user_type)
      ) {
        router.push('/unauthorized');
      }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (
      allowedUserTypes &&
      user &&
      !allowedUserTypes.includes(user.user_type)
    ) {
      return null;
    }

    return <Component {...props} />;
  };
}

// =============================================================================
// Exports
// =============================================================================

export default AuthContext;
