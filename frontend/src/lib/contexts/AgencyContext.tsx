'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useAgency, useAgencies } from '@/lib/hooks/useAgencies';
import { useAuth } from './AuthContext';
import type { Agency, AgencyWithOwner } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface AgencyContextValue {
  currentAgency: AgencyWithOwner | null;
  agencies: Agency[];
  isLoading: boolean;
  hasAgency: boolean;
  selectAgency: (agencyId: number) => void;
  clearAgency: () => void;
}

// =============================================================================
// Context
// =============================================================================

const AgencyContext = createContext<AgencyContextValue | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

interface AgencyProviderProps {
  children: React.ReactNode;
}

export function AgencyProvider({ children }: AgencyProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);

  // Fetch user's agencies
  const { data: agenciesData, isLoading: isAgenciesLoading } = useAgencies(
    { page_size: 100 },
    { enabled: isAuthenticated && user?.user_type === 'agency' }
  );

  // Fetch selected agency details
  const { data: currentAgency, isLoading: isAgencyLoading } = useAgency(
    selectedAgencyId ?? 0,
    { enabled: !!selectedAgencyId }
  );

  // Auto-select first agency if none selected
  useEffect(() => {
    if (
      !selectedAgencyId &&
      agenciesData?.results &&
      agenciesData.results.length > 0
    ) {
      // Try to restore from localStorage first
      const storedAgencyId =
        typeof window !== 'undefined'
          ? localStorage.getItem('selected_agency_id')
          : null;

      if (storedAgencyId) {
        const parsedId = parseInt(storedAgencyId, 10);
        const agencyExists = agenciesData.results.some(
          (agency: Agency) => agency.id === parsedId
        );
        if (agencyExists) {
          setSelectedAgencyId(parsedId);
          return;
        }
      }

      // Default to first agency
      setSelectedAgencyId(agenciesData.results[0].id);
    }
  }, [selectedAgencyId, agenciesData]);

  // Persist selected agency to localStorage
  useEffect(() => {
    if (selectedAgencyId && typeof window !== 'undefined') {
      localStorage.setItem('selected_agency_id', String(selectedAgencyId));
    }
  }, [selectedAgencyId]);

  // Select agency handler
  const selectAgency = useCallback((agencyId: number) => {
    setSelectedAgencyId(agencyId);
  }, []);

  // Clear agency handler
  const clearAgency = useCallback(() => {
    setSelectedAgencyId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selected_agency_id');
    }
  }, []);

  // Memoized context value
  const value = useMemo<AgencyContextValue>(
    () => ({
      currentAgency: currentAgency ?? null,
      agencies: agenciesData?.results ?? [],
      isLoading: isAgenciesLoading || isAgencyLoading,
      hasAgency: !!currentAgency,
      selectAgency,
      clearAgency,
    }),
    [
      currentAgency,
      agenciesData,
      isAgenciesLoading,
      isAgencyLoading,
      selectAgency,
      clearAgency,
    ]
  );

  return (
    <AgencyContext.Provider value={value}>{children}</AgencyContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useCurrentAgency(): AgencyContextValue {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error('useCurrentAgency must be used within an AgencyProvider');
  }
  return context;
}

// =============================================================================
// Exports
// =============================================================================

export default AgencyContext;
