# PillsMe - Codebase Architecture

## 1. Project Overview

**Project Name:** PillsMe - Open Source Supplement Tracker

**Purpose:** A modern, privacy-first web application for tracking daily supplement intake, managing inventory, monitoring adherence, and tracking health metrics. The app includes biomarker tracking capabilities for comprehensive health monitoring.

**Tech Stack:**

- **Framework:** Next.js 15+ (App Router) with TypeScript
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Authentication:** SimpleWebAuthn (password-free passkey authentication)
- **Frontend State:** TanStack React Query (React Query)
- **UI Components:** shadcn/ui with Radix UI primitives
- **Styling:** Tailwind CSS with custom animations (Motion/Framer Motion)
- **Icons:** HugeIcons
- **Notifications:** Web Push Protocol + Vercel Cron Jobs
- **PWA:** Manual Service Worker implementation with offline support
- **AI Integration:** Groq SDK (installed but not currently used in codebase)
- **Deployment:** Vercel (with built-in cron job support)
- **Other:** Sharp (image processing), web-push, uuid, export-to-csv

---

## 2. Directory Structure

```
pills-me/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/page.tsx        # Login page
│   │   ├── onboarding/page.tsx   # First-time user onboarding
│   │   ├── error/page.tsx        # Auth error page
│   │   └── layout.tsx
│   │
│   ├── (protected)/              # Protected layout group (requires authentication)
│   │   ├── supplements/
│   │   │   ├── page.tsx          # Dashboard / Supplements list
│   │   │   └── [id]/page.tsx     # Individual supplement detail page
│   │   ├── profile/page.tsx      # User profile page
│   │   ├── todos/page.tsx        # TODO tracker
│   │   └── layout.tsx
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── me/route.ts       # Get current user
│   │   │   ├── delete/route.ts   # Delete user account
│   │   │   ├── logout/route.ts   # Logout user
│   │   │   └── lookup-user/route.ts
│   │   │
│   │   ├── passkey/
│   │   │   ├── register/start & finish
│   │   │   ├── authenticate/start & finish
│   │   │   ├── delete/route.ts
│   │   │   └── list/route.ts
│   │   │
│   │   ├── supplements/
│   │   │   ├── create/route.ts   # Create new supplement
│   │   │   ├── list/route.ts     # List all supplements (with grouping by status)
│   │   │   ├── today/route.ts    # Get supplements for specific date
│   │   │   ├── auto-complete/route.ts # Auto-mark expired supplements as COMPLETED
│   │   │   ├── adherence/toggle/route.ts # Mark dose as taken/untaken
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET/PUT/DELETE supplement by ID
│   │   │       └── refill/route.ts # Refill inventory
│   │   │
│   │   └── push/
│   │       ├── send/route.ts     # Send push notifications (cron trigger)
│   │       └── refill/route.ts   # Send refill reminders
│   │
│   ├── actions/                  # Server actions
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── manifest.ts               # PWA manifest
│
├── components/
│   ├── protected/                # Protected/auth-required components
│   ├── ui/                       # shadcn/ui components
│   ├── supplement-creation-form.tsx # Multi-step form for adding supplements
│   ├── notification-scheduler.tsx    # Notification preferences UI
│   └── auth-button.tsx, logout-button.tsx
│
├── lib/
│   ├── api/client.ts             # API client utilities
│   ├── hooks/
│   │   ├── supplements.ts        # useCreateSupplement, useTodaySupplements, etc.
│   │   ├── user.ts
│   │   ├── notification-preferences.ts
│   │   └── push-subscription.ts
│   │
│   ├── mutations/
│   │   ├── supplements.ts        # createSupplement, editSupplement, etc.
│   │   └── users.ts
│   │
│   ├── queries/
│   │   ├── supplements.ts        # getTodaySupplements, getSupplementsList, etc.
│   │   └── user.ts
│   │
│   ├── keys/
│   │   └── keys.ts               # React Query key factory
│   │
│   ├── types/
│   │   ├── supplements.ts        # Supplement-related types
│   │   └── user.ts               # User-related types
│   │
│   ├── utils/
│   │   ├── supplements.ts        # Adherence calculations, supplement utilities
│   │   ├── timezone.ts           # Timezone conversions
│   │   ├── validation.ts         # Input validation
│   │   ├── notifications-time.ts
│   │   └── notifications.ts
│   │
│   ├── supabase/
│   │   ├── client.ts             # Supabase client (browser)
│   │   ├── server.ts             # Supabase client (server)
│   │   ├── middleware.ts         # Auth middleware
│   │   └── database.types.ts     # Auto-generated types from Supabase
│   │
│   ├── contexts/                 # React contexts
│   ├── auth-helper.ts            # Authentication utilities
│   ├── session.ts                # Session management
│   ├── audit-logger.ts           # Audit logging
│   ├── env-validation.ts         # Environment validation
│   ├── rate-limiter.ts           # Rate limiting utilities
│   ├── utils.ts                  # General utilities
│   └── webauthn.ts               # WebAuthn configuration
│
├── supabase/
│   ├── migrations/               # Database migrations
│   │   ├── create_supplement_tracking_schema.sql
│   │   ├── add_inventory_and_period_fields.sql
│   │   ├── create_push_subscriptions_schema.sql
│   │   ├── create_notification_preferences_schema.sql
│   │   ├── create_user_information_table.sql
│   │   ├── create_biomarkers_schema.sql
│   │   ├── add_biomarker_synonyms.sql
│   │   ├── update_biomarker_thresholds_sex_aware.sql
│   │   └── [other migrations]
│   │
│   └── cron/
│       ├── setup_reminders_cron.sql
│       ├── README.md
│       └── TROUBLESHOOTING.md
│
├── public/                       # Static assets
├── tests/                        # Test files
├── package.json
├── tsconfig.json
├── next.config.ts
├── vercel.json                   # Vercel deployment config (cron jobs)
└── README.md
```

---

## 3. Supplement Handling

### Core Supplement Model

**Main Fields (supplements table):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `name` | VARCHAR(255) | Supplement name (required) |
| `capsules_per_take` | INTEGER | Number of capsules per dose (default: 1) |
| `recommendation` | TEXT | Why recommended (optional) |
| `reason` | TEXT | User's reason for taking (optional) |
| `source_name` | TEXT | Source/brand information (optional) |
| `source_url` | TEXT | URL to product/source (optional) |
| `start_date` | TIMESTAMPTZ | When to start taking (required) |
| `end_date` | TIMESTAMPTZ | When to stop taking (optional) |
| `status` | ENUM | ACTIVE, COMPLETED, or CANCELLED |
| `inventory_total` | INTEGER | Current pill count (nullable) |
| `low_inventory_threshold` | INTEGER | Alert threshold (default: 10) |
| `deleted_at` | TIMESTAMPTZ | Soft delete timestamp |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Supplement Schedules

- Each supplement can have multiple time slots per day
- Possible times: MORNING (8 AM), LUNCH (12 PM), DINNER (6 PM), BEFORE_SLEEP (10 PM)
- Uses ENUM `time_of_day` type
- Unique constraint: (supplement_id, time_of_day)

### Supplement Adherence Tracking

- Records when a user marks a dose as taken
- Fields: `user_id`, `supplement_id`, `schedule_id`, `taken_at`, `marked_at`
- Uses UTC timestamps for timezone-independent tracking

### Supplement Lifecycle Features

1. **Creation with Backfill** - Users can create supplements with past start dates, system auto-fills adherence records
2. **Status Management** - ACTIVE → COMPLETED/CANCELLED transitions
3. **Adherence Tracking** - Real-time percentage calculation, day streaks
4. **Inventory Management** - Automatic deduction, refill functionality, low inventory alerts
5. **Soft Delete** - Preserves adherence history

### Supplement API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/supplements/create` | POST | Create new supplement with schedules |
| `/api/supplements/list` | GET | Get all supplements grouped by status |
| `/api/supplements/today` | GET | Get supplements for a specific date |
| `/api/supplements/[id]` | GET/PUT/DELETE | Get, update, or soft-delete |
| `/api/supplements/[id]/refill` | POST | Refill supplement inventory |
| `/api/supplements/adherence/toggle` | POST | Mark dose as taken/untaken |
| `/api/supplements/auto-complete` | POST | Auto-mark expired as COMPLETED |

---

## 4. Database Schema

### Core Tables

**supplements** - Stores all supplement information with soft delete support

**supplement_schedules** - Links supplements to times of day

**supplement_adherence** - Daily tracking of doses taken (timezone-aware)

**user_preferences** - Legacy preference storage

**notification_preferences** - Per-user notification settings including timezone

**push_subscriptions** - Web Push notification subscriptions

**user_information** - Per-user demographics (sex for biomarker thresholds)

### Biomarker Tables

**biomarkers_information** - Canonical biomarker definitions with thresholds

**biomarker_synonyms** - Alternative names for fuzzy matching

**reports** - Blood test reports uploaded by users

**user_biomarkers** - Individual biomarker values from user reports

### Authentication Tables

**passkeys** - WebAuthn credentials

**passkey_challenges** - Temporary authentication challenges

**audit_logs** - Security event trail

### Key Features

- **Row Level Security (RLS)** on all user-related tables
- **Soft Deletes** for data preservation
- **Composite Indexes** for common query patterns
- **Triggers** for auto-updating timestamps

---

## 5. Frontend Organization

### Page Structure

**Public:** `/` - Landing page

**Auth Pages:**
- `/login` - Passkey login/registration
- `/onboarding` - First-time user setup
- `/error` - Auth error display

**Protected Pages:**
- `/supplements` - Main dashboard with today's supplements
- `/supplements/[id]` - Individual supplement detail
- `/profile` - User settings and preferences
- `/todos` - Task management

### Key Components

- **SupplementCreationForm** - Multi-step form with validation
- **NotificationScheduler** - Notification preferences UI
- **Supplement Cards** - Display supplement info with quick actions

### State Management

- TanStack Query with 5-minute cache
- Query functions in `lib/queries/`
- Mutation hooks in `lib/hooks/`
- Query keys in `lib/keys/keys.ts`

---

## 6. Current Scraping & Search Features

**Status: MINIMAL**

- Groq SDK installed but not integrated
- No web scraping features
- No supplement database API integration
- Manual entry only for supplement names

---

## 7. Architectural Patterns

### Security
- Row-Level Security on all tables
- Passkey authentication (password-free)
- Rate limiting on authentication endpoints
- Audit logging for security events
- Soft deletes preserve data integrity

### Performance
- Composite indexes for common queries
- React Query with 5-minute cache
- Service Worker for offline capability

### Timezone Handling
- Uses UTC in database (`TIMESTAMPTZ`)
- User timezone stored in notification_preferences
- Utilities in `lib/utils/timezone.ts` for conversions

### Notification System
- Server-Side Cron via Supabase pg_cron
- Vercel Integration for scheduled times
- Web Push for cross-device notifications
- Granular user control over notification types

---

## 8. Important File Locations

| Purpose | Path |
|---------|------|
| Type definitions | `lib/types/` |
| Supplement utilities | `lib/utils/supplements.ts` |
| Database queries | `lib/queries/supplements.ts` |
| Mutations | `lib/mutations/supplements.ts` |
| React hooks | `lib/hooks/supplements.ts` |
| API routes | `app/api/supplements/` |
| Protected pages | `app/(protected)/supplements/` |
| Migration files | `supabase/migrations/` |
| Database types | `lib/supabase/database.types.ts` |
