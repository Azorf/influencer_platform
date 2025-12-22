'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api';
import apiClient from '@/lib/api-client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      // Get the authorization code from URL params
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      
      // Check if Django allauth redirected with a session cookie instead
      // In this case, we need to check if we're already authenticated
      const existingToken = searchParams.get('token');
      
      if (errorParam) {
        setStatus('error');
        setError(errorParam === 'access_denied' 
          ? 'Access denied. Please try again.' 
          : `Authentication failed: ${errorParam}`);
        return;
      }

      // If we have a token directly (from Django redirect)
      if (existingToken) {
        apiClient.setToken(existingToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', existingToken);
        }
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 1000);
        return;
      }

      // If we have a code, exchange it for a token
      if (code) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/accounts/api/google/callback/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/auth/callback`,
          }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
          // Save the token
          apiClient.setToken(data.token);
          if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', data.token);
          }
          
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1000);
        } else {
          setStatus('error');
          setError(data.error || 'Failed to authenticate');
        }
        return;
      }

      // If no code or token, check if we're already authenticated via session
      // This handles the case where Django allauth completed OAuth and redirected back
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/accounts/api/me/`, {
          credentials: 'include', // Include session cookies
        });
        
        if (response.ok) {
          // User is authenticated via session, but we need a token for the frontend
          // For now, redirect to dashboard and rely on session
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1000);
          return;
        }
      } catch {
        // Session check failed, continue to error
      }

      setStatus('error');
      setError('No authentication code received');
      
    } catch (err) {
      console.error('Auth callback error:', err);
      setStatus('error');
      setError('Authentication failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm text-center">
        {status === 'loading' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-500 text-sm">
              Please wait while we verify your account
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Sign in successful!
            </h2>
            <p className="text-gray-500 text-sm">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication failed
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {error || 'Something went wrong'}
            </p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800"
            >
              Try again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
