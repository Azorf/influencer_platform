'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignup } from '@/lib/hooks';
import type { UserType } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const signupMutation = useSignup();
  const [userType, setUserType] = useState<UserType>('agency');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password1 = formData.get('password1') as string;
    const password2 = formData.get('password2') as string;

    if (password1 !== password2) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signupMutation.mutateAsync({
        email,
        password1,
        password2,
        user_type: userType,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.detail || 'Failed to create account');
    }
  };

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
        Create Account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['agency', 'influencer'] as UserType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setUserType(type)}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  userType === type
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {type === 'agency' ? 'Agency / Brand' : 'Influencer'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password1" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password1"
            name="password1"
            type="password"
            required
            minLength={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="password2"
            name="password2"
            type="password"
            required
            minLength={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="mt-1 rounded border-gray-300 text-primary-600"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <Link href="/terms" className="text-primary-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={signupMutation.isPending}
          className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {signupMutation.isPending ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </>
  );
}
