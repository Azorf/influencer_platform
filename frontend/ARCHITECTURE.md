# Influencer Platform Frontend Architecture

## Overview

This Next.js 14+ App Router frontend is designed to consume the Django REST API backend for the Influencer Marketing Platform. The architecture follows a modular, type-safe approach with React Query for server state management.

## Project Structure

```
influencer-platform-frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (auth)/                   # Auth group (login, signup, etc.)
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── agencies/
│   │   │   ├── influencers/
│   │   │   ├── campaigns/
│   │   │   ├── payments/
│   │   │   ├── reports/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── providers.tsx             # Client providers wrapper
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # Base UI components (buttons, inputs, etc.)
│   │   ├── forms/                    # Form components
│   │   ├── layouts/                  # Layout components
│   │   ├── agencies/                 # Agency-specific components
│   │   ├── influencers/              # Influencer-specific components
│   │   ├── campaigns/                # Campaign-specific components
│   │   ├── payments/                 # Payment-specific components
│   │   └── reports/                  # Report-specific components
│   │
│   ├── lib/                          # Core utilities
│   │   ├── api/                      # API layer
│   │   │   ├── axios.ts              # Axios instance with interceptors
│   │   │   ├── accounts.ts           # Account API functions
│   │   │   ├── agencies.ts           # Agency API functions
│   │   │   ├── influencers.ts        # Influencer API functions
│   │   │   ├── campaigns.ts          # Campaign API functions
│   │   │   ├── payments.ts           # Payment API functions
│   │   │   └── reports.ts            # Report API functions
│   │   │
│   │   ├── hooks/                    # React Query hooks
│   │   │   ├── useAuth.ts            # Authentication hooks
│   │   │   ├── useAgencies.ts        # Agency hooks
│   │   │   ├── useInfluencers.ts     # Influencer hooks
│   │   │   ├── useCampaigns.ts       # Campaign hooks
│   │   │   ├── usePayments.ts        # Payment hooks
│   │   │   └── useReports.ts         # Report hooks
│   │   │
│   │   ├── contexts/                 # React contexts
│   │   │   ├── AuthContext.tsx       # Authentication context
│   │   │   └── AgencyContext.tsx     # Current agency context
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── formatters.ts         # Date, currency, number formatters
│   │   │   ├── validators.ts         # Form validation helpers
│   │   │   └── constants.ts          # App constants
│   │   │
│   │   └── query-keys.ts             # React Query cache keys
│   │
│   └── types/                        # TypeScript types
│       ├── api.ts                    # API response types
│       ├── models/                   # Domain model types
│       │   ├── user.ts
│       │   ├── agency.ts
│       │   ├── influencer.ts
│       │   ├── campaign.ts
│       │   ├── payment.ts
│       │   └── report.ts
│       └── index.ts                  # Type exports
│
├── public/                           # Static assets
├── .env.local                        # Environment variables
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## Backend to Frontend Mapping

### Django Apps → Frontend Modules

| Django App    | Frontend Module        | Description                           |
|---------------|------------------------|---------------------------------------|
| `accounts`    | `/app/(auth)/*`        | User authentication & profiles        |
| `agencies`    | `/app/(dashboard)/agencies/*` | Agency management & teams      |
| `influencers` | `/app/(dashboard)/influencers/*` | Influencer discovery & management |
| `campaigns`   | `/app/(dashboard)/campaigns/*` | Campaign lifecycle management   |
| `payments`    | `/app/(dashboard)/payments/*` | Invoices, payments, payouts      |
| `reports`     | `/app/(dashboard)/reports/*` | Analytics & dashboards           |

### API Endpoints → React Query Hooks

Each Django endpoint maps to a corresponding React Query hook:

- **GET endpoints** → `useQuery` hooks (data fetching)
- **POST/PUT/PATCH endpoints** → `useMutation` hooks (data modification)
- **DELETE endpoints** → `useMutation` hooks (data deletion)

### Models → TypeScript Types

Django models are represented as TypeScript interfaces with full type safety:

- Model fields → Interface properties
- Choice fields → Union types / enums
- ForeignKey relations → Nested types or ID references
- JSON fields → Generic `Record<string, unknown>` or specific interfaces

## Key Design Decisions

1. **App Router**: Using Next.js 14+ App Router for better performance and server components
2. **React Query**: Server state management with automatic caching and background updates
3. **Axios**: HTTP client with interceptors for auth token injection and error handling
4. **TypeScript**: Full type safety from API to UI
5. **Route Groups**: `(auth)` and `(dashboard)` for layout separation
6. **Colocation**: Related code grouped by feature/domain
