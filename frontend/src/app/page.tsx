import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900">
          Influencer Platform
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Connect with top Moroccan influencers for your marketing campaigns
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-primary-600 px-6 py-3 text-primary-600 font-medium hover:bg-primary-50 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
