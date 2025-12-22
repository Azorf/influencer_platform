// ===========================================
// Library Exports
// ===========================================

// API Client
export { default as apiClient, ApiError } from './api-client';

// API Services
export {
  authService,
  agencyService,
  influencerService,
  campaignService,
} from './api';

// Payment Service (for your Invoice/Payout models)
export { paymentService } from './payment-service';

// Report Service (for reports, dashboards, subscriptions)
export { reportService } from './report-service';

// Data Transformers
export {
  transformInfluencerToDisplay,
  transformDisplayToInfluencer,
  transformCampaignToDisplay,
  transformDisplayToCampaign,
  type InfluencerDisplay,
  type CampaignDisplay,
} from './transformers';

// React Hooks
export {
  useApi,
  usePaginatedApi,
  useMutation,
  useFormApi,
  useDebounce,
  useSearch,
} from './hooks';
