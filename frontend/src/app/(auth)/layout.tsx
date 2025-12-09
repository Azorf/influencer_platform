export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Influencer Platform
          </h1>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
