/**
 * React Query Cache Keys
 * 
 * Centralized cache key definitions for consistent cache management.
 * Using factory pattern for type-safe, composable keys.
 */

// =============================================================================
// Accounts Keys
// =============================================================================

export const accountKeys = {
  all: ['accounts'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  dashboard: () => [...accountKeys.all, 'dashboard'] as const,
};

// =============================================================================
// Agencies Keys
// =============================================================================

export const agencyKeys = {
  all: ['agencies'] as const,
  lists: () => [...agencyKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...agencyKeys.lists(), filters] as const,
  details: () => [...agencyKeys.all, 'detail'] as const,
  detail: (id: number) => [...agencyKeys.details(), id] as const,
  team: (id: number) => [...agencyKeys.all, 'team', id] as const,
  invitations: (id: number) => [...agencyKeys.all, 'invitations', id] as const,
  subscription: (id: number) => [...agencyKeys.all, 'subscription', id] as const,
};

// =============================================================================
// Influencers Keys
// =============================================================================

export const influencerKeys = {
  all: ['influencers'] as const,
  lists: () => [...influencerKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...influencerKeys.lists(), filters] as const,
  search: (params?: Record<string, unknown>) =>
    [...influencerKeys.all, 'search', params] as const,
  details: () => [...influencerKeys.all, 'detail'] as const,
  detail: (id: number) => [...influencerKeys.details(), id] as const,
  analytics: (id: number) => [...influencerKeys.all, 'analytics', id] as const,
  socialAccounts: (id: number) =>
    [...influencerKeys.all, 'socialAccounts', id] as const,
  tags: () => [...influencerKeys.all, 'tags'] as const,
  categories: () => [...influencerKeys.all, 'categories'] as const,
};

// =============================================================================
// Campaigns Keys
// =============================================================================

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: number) => [...campaignKeys.details(), id] as const,
  collaborations: (id: number) =>
    [...campaignKeys.all, 'collaborations', id] as const,
  collaboration: (id: number) =>
    [...campaignKeys.all, 'collaboration', id] as const,
  content: (collaborationId: number) =>
    [...campaignKeys.all, 'content', collaborationId] as const,
  analytics: (id: number) => [...campaignKeys.all, 'analytics', id] as const,
  performance: (id: number) =>
    [...campaignKeys.all, 'performance', id] as const,
};

// =============================================================================
// Payments Keys
// =============================================================================

export const paymentKeys = {
  all: ['payments'] as const,
  methods: () => [...paymentKeys.all, 'methods'] as const,
  invoices: () => [...paymentKeys.all, 'invoices'] as const,
  invoiceList: (filters?: Record<string, unknown>) =>
    [...paymentKeys.invoices(), 'list', filters] as const,
  invoice: (id: number) => [...paymentKeys.invoices(), id] as const,
  history: (filters?: Record<string, unknown>) =>
    [...paymentKeys.all, 'history', filters] as const,
  payment: (id: number) => [...paymentKeys.all, 'payment', id] as const,
  payouts: () => [...paymentKeys.all, 'payouts'] as const,
  payoutList: (filters?: Record<string, unknown>) =>
    [...paymentKeys.payouts(), 'list', filters] as const,
  payout: (id: number) => [...paymentKeys.payouts(), id] as const,
};

// =============================================================================
// Reports Keys
// =============================================================================

export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: number) => [...reportKeys.details(), id] as const,
  templates: () => [...reportKeys.all, 'templates'] as const,
  template: (id: number) => [...reportKeys.templates(), id] as const,
  dashboards: () => [...reportKeys.all, 'dashboards'] as const,
  dashboard: (id: number) => [...reportKeys.dashboards(), id] as const,
  snapshots: (filters?: Record<string, unknown>) =>
    [...reportKeys.all, 'snapshots', filters] as const,
  subscriptions: () => [...reportKeys.all, 'subscriptions'] as const,
};

// =============================================================================
// Export All Keys
// =============================================================================

export const queryKeys = {
  accounts: accountKeys,
  agencies: agencyKeys,
  influencers: influencerKeys,
  campaigns: campaignKeys,
  payments: paymentKeys,
  reports: reportKeys,
};

export default queryKeys;
