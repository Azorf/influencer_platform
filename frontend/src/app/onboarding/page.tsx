'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { agencyService } from '@/lib/api';

const organizationTypes = [
  { value: 'agency', label: 'Marketing Agency' },
  { value: 'brand', label: 'Brand / Company' },
  { value: 'freelancer', label: 'Freelancer / Consultant' },
  { value: 'other', label: 'Other' },
];

const organizationSizes = [
  { value: '1', label: 'Just me' },
  { value: '2-10', label: '2-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '200+', label: '200+ employees' },
];

const industries = [
  'Fashion & Beauty',
  'Technology',
  'Food & Beverage',
  'Travel & Tourism',
  'Health & Wellness',
  'Entertainment',
  'Sports & Fitness',
  'Finance',
  'Education',
  'Real Estate',
  'E-commerce',
  'Other',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    email: '',
    phone: '',
    website: '',
    organizationType: '',
    organizationSize: '',
    industry: '',
    description: '',
    country: 'Morocco',
    city: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await agencyService.setupAgency({
        name: formData.name,
        displayName: formData.displayName || formData.name,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        organizationType: formData.organizationType,
        organizationSize: formData.organizationSize,
        industry: formData.industry,
        description: formData.description,
        country: formData.country,
        city: formData.city,
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Failed to create agency:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agency. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = formData.name && formData.email && formData.organizationType;
  const canProceedStep2 = formData.organizationSize && formData.industry;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Welcome to InfluencerHub</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className={step >= 1 ? 'text-gray-900 font-medium' : ''}>1. Basic Info</span>
            <span>→</span>
            <span className={step >= 2 ? 'text-gray-900 font-medium' : ''}>2. Details</span>
            <span>→</span>
            <span className={step >= 3 ? 'text-gray-900 font-medium' : ''}>3. Finish</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let&apos;s set up your agency</h2>
              <p className="text-gray-600 mb-8">Tell us about your organization to get started.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Acme Marketing Agency"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => updateField('displayName', e.target.value)}
                    placeholder="How you want to appear to influencers"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="contact@youragency.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {organizationTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => updateField('organizationType', type.value)}
                        className={`px-4 py-3 border rounded-lg text-left transition-all ${
                          formData.organizationType === type.value
                            ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className="font-medium text-gray-900">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">A few more details</h2>
              <p className="text-gray-600 mb-8">This helps us personalize your experience.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Size <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {organizationSizes.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => updateField('organizationSize', size.value)}
                        className={`px-3 py-2 border rounded-lg text-sm transition-all ${
                          formData.organizationSize === size.value
                            ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select your industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="e.g., Casablanca"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://youragency.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Finish */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost there!</h2>
              <p className="text-gray-600 mb-8">Review your information and create your agency.</p>

              <div className="space-y-4 bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Organization</span>
                  <span className="font-medium text-gray-900">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium text-gray-900">
                    {organizationTypes.find(t => t.value === formData.organizationType)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size</span>
                  <span className="font-medium text-gray-900">
                    {organizationSizes.find(s => s.value === formData.organizationSize)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry</span>
                  <span className="font-medium text-gray-900">{formData.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium text-gray-900">{formData.city}, {formData.country}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about your agency (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="What do you specialize in? What are your goals with influencer marketing?"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Agency & Continue'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
