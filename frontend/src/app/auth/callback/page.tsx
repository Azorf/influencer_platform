'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient, { getBackendUrl } from '@/lib/api-client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const errorParam = searchParams.get('error');
      const tokenParam = searchParams.get('token');
      
      // Check for error from OAuth
      if (errorParam) {
        setStatus('error');
        setError(errorParam === 'access_denied' 
          ? 'Access denied. Please try again.' 
          : `Authentication failed: ${errorParam}`);
        return;
      }

      // If we have a token directly in URL (custom implementation)
      if (tokenParam) {
        apiClient.setToken(tokenParam);
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', tokenParam);
        }
        // Check for agency before redirecting
        await checkAgencyAndRedirect(tokenParam);
        return;
      }

      // Django allauth redirects here after successful OAuth with session cookie set
      // We need to call an API endpoint to get a token or verify the session
      const backendUrl = getBackendUrl();
      
      // Try to get current user info (this will work if session cookie is set)
      const response = await fetch(`${backendUrl}/api/accounts/api/me/`, {
        credentials: 'include', // Include session cookies
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // User is authenticated via session
        // Store user data in localStorage for frontend use
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        let authToken: string | null = null;
        
        // Try to get an auth token for API calls
        try {
          const tokenResponse = await fetch(`${backendUrl}/api/accounts/api/get-token/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (tokenData.token) {
              apiClient.setToken(tokenData.token);
              localStorage.setItem('authToken', tokenData.token);
              authToken = tokenData.token;
            }
          }
        } catch (tokenErr) {
          // Token endpoint might not exist, continue with session auth
          console.log('Token endpoint not available, using session auth');
        }
        
        // Check for agency before redirecting
        await checkAgencyAndRedirect(authToken);
        return;
      }

      // If session check failed, the user is not authenticated
      setStatus('error');
      setError('Authentication failed. Please try again.');
      
    } catch (err) {
      console.error('Auth callback error:', err);
      setStatus('error');
      setError('Authentication failed. Please try again.');
    }
  }

  async function checkAgencyAndRedirect(token: string | null) {
    const backendUrl = getBackendUrl();
    
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const agencyResponse = await fetch(`${backendUrl}/api/agencies/me/`, {
        credentials: 'include',
        headers,
      });
      
      setStatus('success');
      
      if (agencyResponse.ok) {
        // User has agency - store it and go to dashboard
        const agencyData = await agencyResponse.json();
        localStorage.setItem('agency', JSON.stringify(agencyData));
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        // No agency - go to onboarding
        setTimeout(() => router.push('/onboarding'), 1000);
      }
    } catch (err) {
      console.log('Agency check failed, redirecting to onboarding:', err);
      setStatus('success');
      setTimeout(() => router.push('/onboarding'), 1000);
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
