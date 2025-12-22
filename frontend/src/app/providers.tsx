'use client';

import { useEffect } from 'react';
import { authService } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize auth token from localStorage on app load
  useEffect(() => {
    authService.initializeFromStorage();
  }, []);

  return <>{children}</>;
}
