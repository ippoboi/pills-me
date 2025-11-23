# PillsMe - Open Source Supplement Tracker

<p align="center">
  <strong>A modern, secure supplement tracking application powered by passkey authentication</strong>
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#contributing"><strong>Contributing</strong></a>
</p>

## Overview

**PillsMe** is a fully open-source supplement tracking application that helps you stay on top of your daily supplement routine. Built with modern web technologies, PillsMe combines password-free authentication, intelligent notifications, and comprehensive tracking features to make managing your supplements effortless.

**Key Highlights:**

- 🔓 **100% Open Source** - View, modify, and contribute to the codebase
- 🔐 **Password-Free Security** - Modern passkey authentication (WebAuthn)
- 📱 **Progressive Web App** - Install on any device, works offline
- 🔔 **Smart Notifications** - Server-side cron jobs + local scheduling
- 📊 **Advanced Tracking** - Adherence percentages, streaks, and analytics
- 🎯 **Zero Vendor Lock-in** - Self-hostable, full control over your data

## Features

### 🔐 Password-Free Authentication

- **Passkey-based authentication** using WebAuthn/SimpleWebAuthn
- Sign in with Face ID, Touch ID, or other biometric authentication
- No passwords to remember or manage
- Secure, phishing-resistant authentication

### 📊 Comprehensive Supplement Tracking

- **Multi-Supplement Management**: Track unlimited supplements with individual schedules
- **Flexible Scheduling**: Set supplements for Morning (8 AM), Lunch (12 PM), Dinner (6 PM), or Before Sleep (10 PM)
- **Quick Actions**: Mark supplements as taken with a single tap directly from the dashboard
- **Detailed Information**: Add supplement name, capsule count per dose, reason, recommendation, and source URLs
- **Date Range Support**: Set start and end dates for time-bound supplement regimens
- **Status Management**: Track supplements as Active, Completed, or Cancelled
- **Cycle Management**: Easily restart or create new cycles for completed regimens

### 📈 Adherence Analytics & Streaks

- **Adherence Percentage**: Real-time calculation showing completion rate per supplement
- **Visual Progress Indicators**: Color-coded adherence badges (green ≥80%, amber ≥50%, red <50%)
- **Day Streak Tracking**: Automatic calculation of consecutive days with at least one supplement taken
- **Historical Data**: View adherence history with date-based tracking
- **Progress Metrics**: See completed vs. total possible doses for each supplement
- **Timezone-Aware**: Accurate tracking across different timezones

### 📦 Inventory Management

- **Stock Tracking**: Monitor current inventory count for each supplement
- **Automatic Deduction**: Inventory decreases automatically when you mark doses as taken
- **Low Stock Alerts**: Set custom thresholds and receive notifications when running low
- **Refill Functionality**: Quick refill action to update inventory counts
- **Inventory History**: Track when and how much you've refilled

### 🎨 Modern User Interface

- **Clean Design**: Intuitive interface built with [shadcn/ui](https://ui.shadcn.com/)
- **Responsive Layout**: Seamless experience on mobile, tablet, and desktop
- **Beautiful Empty States**: Helpful illustrations and guidance when starting out
- **Time-of-Day Organization**: Supplements grouped by Morning, Lunch, Dinner, and Before Sleep
- **Smooth Animations**: Polished transitions and micro-interactions
- **Loading States**: Clear feedback during data fetching and operations

### 📱 Progressive Web App (PWA)

- **Installable**: Add to home screen on iOS, Android, and desktop for a native app experience
- **Offline-First**: Core features work seamlessly without an internet connection
- **Service Worker**: Custom implementation for background sync, caching, and local notifications
- **App-Like Experience**: Standalone display mode, custom icons, and splash screens
- **Cross-Platform**: Works on iOS, Android, Windows, macOS, and Linux
- **Fast Loading**: Optimized caching strategies for instant app startup

### 🔔 Intelligent Notification System

- **Server-Side Cron Jobs**: Reliable scheduled notifications via Vercel Cron (runs at 8 AM, 12 PM, 6 PM, 10 PM UTC)
- **Push Notifications**: Web Push Protocol support for cross-device reminders
- **Local Scheduling**: Offline-capable notifications using Service Worker for when the app is closed
- **Dual Notification System**: Combines server-side reliability with client-side offline support
- **Refill Reminders**: Automatic alerts when supplement inventory drops below threshold
- **Smart Filtering**: Only sends notifications for supplements not yet taken today
- **User Preferences**: Granular control over notification types (supplement reminders, refill alerts, app updates)
- **Secure Authentication**: Cron jobs protected with CRON_SECRET for security

### 🔒 Security & Privacy

- **Passkey-only authentication** - No passwords to remember or compromise
- **Phishing-resistant** - WebAuthn cryptographically binds to your domain
- **Rate limiting** - Protection against brute force attacks (5 requests per 15 minutes)
- **Content Security Policy** - XSS protection via strict CSP headers
- **Row Level Security** - Database-level user data isolation
- **Audit logging** - Complete security event trail for compliance
- **Automated cleanup** - Expired authentication challenges removed hourly
- **Environment validation** - Startup checks ensure secure configuration
- **Open source** - Audit the code yourself

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication**: [SimpleWebAuthn](https://simplewebauthn.dev/) (WebAuthn/Passkeys)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query) (React Query)
- **PWA**: Manual Service Worker implementation with offline support
- **Notifications**: Web Push Protocol + Vercel Cron Jobs
- **Push Notifications**: [web-push](https://github.com/web-push-libs/web-push) library
- **Language**: TypeScript
- **Deployment**: Vercel (with cron job support)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account and project ([create one here](https://database.new))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/pills-me.git
   cd pills-me
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory (or `.env.local` if you prefer):

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # WebAuthn Configuration
   NEXT_PUBLIC_RP_ID=localhost
   NEXT_PUBLIC_RP_NAME=PillsMe
   NEXT_PUBLIC_EXPECTED_ORIGIN=http://localhost:3000

   # Security Configuration
   APP_SESSION_SECRET=your_secure_random_string_at_least_32_characters_long

   # Push Notifications (VAPID Keys)
   # Generate these using: npx web-push generate-vapid-keys
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key

   # Cron Job Security (for scheduled notifications)
   # Generate a secure random string (at least 16 characters)
   # Using openssl: openssl rand -base64 32
   CRON_SECRET=your_secure_random_string_at_least_16_characters_long
   ```

   You can find your Supabase credentials in your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

4. **Run database migrations**

   Apply the database schema to your Supabase project:

   ```bash
   # Using Supabase CLI (recommended)
   supabase db push

   # Or manually run the migration files in order:
   # 1. supabase/migrations/create_supplement_tracking_schema.sql
   # 2. supabase/migrations/add_inventory_and_period_fields.sql
   # 3. supabase/migrations/setup_challenge_cleanup.sql
   # 4. supabase/migrations/create_push_subscriptions_schema.sql
   # 5. supabase/migrations/create_notification_preferences_schema.sql
   ```

   The migrations create the following:

   **Tables:**

   - `supplements` - Stores supplement information (name, dosage, dates, inventory, status)
   - `supplement_schedules` - Defines when supplements should be taken (time_of_day enum)
   - `supplement_adherence` - Tracks when doses are marked as taken (with timestamps)
   - `user_preferences` - User-specific settings and preferences
   - `passkeys` - Stores WebAuthn passkey credentials for authentication
   - `passkey_challenges` - Temporary storage for authentication challenges
   - `audit_logs` - Security audit trail for authentication events
   - `push_subscriptions` - Stores Web Push subscriptions for cross-device notifications
   - `notification_preferences` - User notification settings (reminders, refills, updates)

   **Security Features:**

   - Row Level Security (RLS) policies on all tables
   - Automated cleanup of expired passkey challenges via pg_cron
   - Comprehensive audit logging for compliance

5. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

### First Time Setup

1. Navigate to the auth page
2. Click "Create passkey" to register a new passkey
3. Follow the prompts to create your passkey using your device's biometric authentication
4. Start tracking your supplements!

## Project Structure

```
pills-me/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── auth/         # Authentication endpoints
│   │   ├── passkey/      # Passkey registration and authentication
│   │   └── supplements/  # Supplement CRUD operations
│   ├── auth/             # Authentication pages
│   └── protected/        # Protected pages (require authentication)
├── components/            # React components
│   ├── protected/        # Protected route components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions and helpers
│   ├── api/              # API client functions
│   ├── hooks/            # Custom React hooks
│   ├── supabase/         # Supabase client configuration
│   └── webauthn.ts       # WebAuthn configuration
└── supabase/
    └── migrations/       # Database migrations
```

## Deployment

### Vercel Deployment

PillsMe is optimized for deployment on Vercel with built-in cron job support:

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard (all variables from `.env.local`)
3. **Deploy** - Vercel will automatically:
   - Build the Next.js application
   - Set up cron jobs from `vercel.json`
   - Configure push notification endpoints

### Cron Jobs Configuration

The app includes 4 scheduled cron jobs (defined in `vercel.json`):

- **Morning reminders**: 8:00 AM UTC
- **Lunch reminders**: 12:00 PM UTC
- **Dinner reminders**: 6:00 PM UTC
- **Before Sleep reminders**: 10:00 PM UTC

These jobs automatically send push notifications to users who haven't taken their supplements yet.

### Self-Hosting

PillsMe can be self-hosted on any platform that supports:

- Node.js 18+
- PostgreSQL (via Supabase or standalone)
- Environment variable configuration
- Optional: Cron job scheduling (for server-side notifications)

## Contributing

Contributions are welcome! This is an open-source project, and we appreciate any help.

**Ways to contribute:**

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

**Contribution Process:**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request with a clear description

**Code Style:**

- Follow TypeScript best practices
- Use ESLint configuration provided
- Write meaningful commit messages
- Add comments for complex logic

## License

This project is open source and available under the [MIT License](LICENSE).

## Why Open Source?

PillsMe is open source because we believe:

- 🔓 **Transparency**: You should know exactly how your health data is handled
- 🛡️ **Security**: Open code can be audited and improved by the community
- 🚀 **Innovation**: Community contributions make the app better for everyone
- 🎯 **No Lock-in**: Self-hostable, no vendor dependencies
- 💚 **Privacy**: Full control over your data, no hidden tracking

## Roadmap

Future features we're considering:

- 📊 Advanced analytics and charts
- 📅 Calendar view for supplement schedules
- 🔄 Export/import functionality
- 👥 Multi-user support (family accounts)
- 🌍 Multi-language support
- 📱 Native mobile apps (React Native)
- 🤖 AI-powered supplement recommendations

Have ideas? [Open an issue](https://github.com/yourusername/pills-me/issues)!

## Acknowledgments

- Built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com)
- Authentication powered by [SimpleWebAuthn](https://simplewebauthn.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [HugeIcons](https://hugeicons.com/)

---

<p align="center">
  Made with ❤️ for better health tracking
</p>

<p align="center">
  <strong>100% Open Source</strong> · <strong>Self-Hostable</strong> · <strong>Privacy-First</strong>
</p>
