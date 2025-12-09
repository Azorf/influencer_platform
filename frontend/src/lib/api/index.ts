// =============================================================================
// API Client & Helpers
// =============================================================================
export {
  apiClient,
  setAccessToken,
  getAccessToken,
  clearTokens,
  get,
  post,
  put,
  patch,
  del,
  upload,
  download,
} from './axios';

// =============================================================================
// API Services
// =============================================================================
export { accountsApi } from './accounts';
export { agenciesApi } from './agencies';
export { influencersApi } from './influencers';
export { campaignsApi } from './campaigns';
export { paymentsApi } from './payments';
export { reportsApi } from './reports';

// =============================================================================
// Default Export - Combined API
// =============================================================================
import { accountsApi } from './accounts';
import { agenciesApi } from './agencies';
import { influencersApi } from './influencers';
import { campaignsApi } from './campaigns';
import { paymentsApi } from './payments';
import { reportsApi } from './reports';

const api = {
  accounts: accountsApi,
  agencies: agenciesApi,
  influencers: influencersApi,
  campaigns: campaignsApi,
  payments: paymentsApi,
  reports: reportsApi,
};

export default api;
