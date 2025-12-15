'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/api/axios';

export default function HomePage() {
  // const router = useRouter();

  // // Redirect to dashboard if already logged in
  // useEffect(() => {
  //   const token = getAccessToken();
  //   if (token) {
  //     router.push('/dashboard');
  //   }
  // }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-full"></div>
              <span className="font-semibold text-lg">InfluencerHub</span>
            </div>

            {/* CTA Button */}
            <Link
              href="/login"
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Find Moroccan influencers to grow your brand on autopilot
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover top creators, manage campaigns, and track performance. 
            The all-in-one platform for influencer marketing in Morocco.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Start finding influencers
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Product Preview Section */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Stats Bar */}
          <div className="bg-gray-900 text-white rounded-t-xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium tracking-wide">SCANNING INSTAGRAM</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <span><strong>12,847</strong> creators</span>
              <span><strong>856</strong> brands</span>
              <span><strong>34</strong> niches</span>
            </div>
          </div>
          
          {/* Dashboard Preview */}
          <div className="border border-gray-200 rounded-b-xl bg-gray-50 p-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Mock Browser Bar */}
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white px-4 py-1 rounded text-sm text-gray-500">
                    app.influencerhub.ma
                  </div>
                </div>
              </div>
              
              {/* Mock Dashboard Content */}
              <div className="p-6">
                <div className="flex gap-6">
                  {/* Sidebar Mock */}
                  <div className="w-48 space-y-2">
                    <div className="h-8 bg-gray-100 rounded"></div>
                    <div className="h-8 bg-black rounded"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                  </div>
                  
                  {/* Content Mock */}
                  <div className="flex-1">
                    <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="h-20 bg-gray-100 rounded"></div>
                      <div className="h-20 bg-gray-100 rounded"></div>
                      <div className="h-20 bg-gray-100 rounded"></div>
                      <div className="h-20 bg-gray-100 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-12 bg-gray-50 rounded border border-gray-200"></div>
                      <div className="h-12 bg-gray-50 rounded border border-gray-200"></div>
                      <div className="h-12 bg-gray-50 rounded border border-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple pricing
          </h2>
          <p className="text-gray-600 mb-8">
            One plan with everything you need to scale your influencer marketing.
          </p>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900">199</span>
              <span className="text-xl text-gray-600"> MAD/month</span>
            </div>
            
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited influencer discovery</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Campaign management</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Analytics & reporting</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Team collaboration</span>
              </li>
            </ul>

            <Link
              href="/login"
              className="block w-full py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Get started now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <span>© 2024 InfluencerHub. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
