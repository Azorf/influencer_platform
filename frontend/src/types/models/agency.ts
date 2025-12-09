import type { ID, ISODateString, CurrencyCode } from '../api';
import type { User } from './user';

// =============================================================================
// Agency Types (maps to agencies.Agency)
// =============================================================================

/**
 * Agency subscription tier choices
 */
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

/**
 * Agency status choices
 */
export type AgencyStatus = 'active' | 'suspended' | 'pending';

/**
 * Agency interface matching Agency model
 */
export interface Agency {
  id: ID;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  owner: ID;
  status: AgencyStatus;
  subscription_tier: SubscriptionTier;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * Agency with owner details
 */
export interface AgencyWithOwner extends Agency {
  owner_details: User;
}

/**
 * Agency with team members
 */
export interface AgencyWithTeam extends Agency {
  team_members: TeamMember[];
}

// =============================================================================
// Team Member Types (maps to agencies.TeamMember)
// =============================================================================

/**
 * Team member role choices
 */
export type TeamRole = 'admin' | 'manager' | 'member' | 'viewer';

/**
 * Team member interface
 */
export interface TeamMember {
  id: ID;
  agency: ID;
  user: ID;
  user_details?: User;
  role: TeamRole;
  is_active: boolean;
  joined_at: ISODateString;
  invited_by: ID | null;
}

// =============================================================================
// Team Invitation Types (maps to agencies.TeamInvitation)
// =============================================================================

/**
 * Invitation status choices
 */
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

/**
 * Team invitation interface
 */
export interface TeamInvitation {
  id: ID;
  agency: ID;
  email: string;
  role: TeamRole;
  token: string;
  status: InvitationStatus;
  invited_by: ID;
  invited_by_details?: User;
  invited_at: ISODateString;
  expires_at: ISODateString;
  accepted_at: ISODateString | null;
}

// =============================================================================
// Subscription Types (maps to agencies.AgencySubscription)
// =============================================================================

/**
 * Subscription status choices
 */
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing' | 'incomplete';

/**
 * Subscription plan interface
 */
export interface SubscriptionPlan {
  id: ID;
  name: string;
  tier: SubscriptionTier;
  price_monthly: string;
  price_yearly: string;
  currency: CurrencyCode;
  max_team_members: number;
  max_campaigns: number;
  max_influencers: number;
  features: string[];
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
}

/**
 * Agency subscription interface
 */
export interface AgencySubscription {
  id: ID;
  agency: ID;
  plan: ID;
  plan_details?: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: ISODateString;
  current_period_end: ISODateString;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * Agency setup request
 */
export interface AgencySetupRequest {
  name: string;
  description?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
}

/**
 * Agency update request
 */
export interface AgencyUpdateRequest extends Partial<AgencySetupRequest> {
  logo?: File;
}

/**
 * Team member add request (existing user)
 */
export interface TeamAddRequest {
  user_id: ID;
  role: TeamRole;
}

/**
 * Team invitation request (new user)
 */
export interface TeamInviteRequest {
  email: string;
  role: TeamRole;
}

/**
 * Accept invitation request
 */
export interface AcceptInvitationRequest {
  token: string;
}

/**
 * Subscription update request
 */
export interface SubscriptionUpdateRequest {
  plan_id: ID;
  billing_cycle: 'monthly' | 'yearly';
  payment_method_id?: string;
}
