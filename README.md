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

PillsMe is an open-source supplement tracking application that helps you stay on top of your daily supplement routine. With a focus on security and user experience, PillsMe uses modern passkey authentication (WebAuthn) to provide a password-free, secure sign-in experience.

## Features

### 🔐 Password-Free Authentication

- **Passkey-based authentication** using WebAuthn/SimpleWebAuthn
- Sign in with Face ID, Touch ID, or other biometric authentication
- No passwords to remember or manage
- Secure, phishing-resistant authentication

### 📊 Supplement Tracking

- **Track multiple supplements** with custom schedules
- **Flexible timing**: Schedule supplements for Morning, Lunch, Dinner, or Before Sleep
- **Adherence tracking**: Mark doses as taken and view your adherence history
- **Customizable details**: Add supplement name, dosage, reason, and source information
- **Date range support**: Set start and end dates for supplement regimens

### 🎨 Modern User Interface

- Clean, intuitive design built with [shadcn/ui](https://ui.shadcn.com/)
- Responsive layout that works on all devices
- Beautiful empty states and loading indicators
- Organized by time of day for easy daily tracking

### 🔒 Security & Privacy

- Built on [Supabase](https://supabase.com) with Row Level Security (RLS)
- User data is isolated and secure
- Open source - audit the code yourself

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication**: [SimpleWebAuthn](https://simplewebauthn.dev/) (WebAuthn/Passkeys)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **Language**: TypeScript

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

   Create a `.env.local` file in the root directory:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # WebAuthn Configuration
   NEXT_PUBLIC_RP_ID=localhost
   NEXT_PUBLIC_RP_NAME=PillsMe
   NEXT_PUBLIC_EXPECTED_ORIGIN=http://localhost:3000
   ```

   You can find your Supabase credentials in your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

4. **Run database migrations**

   Apply the database schema to your Supabase project:

   ```bash
   # Using Supabase CLI (recommended)
   supabase db push

   # Or manually run the migration file:
   # supabase/migrations/create_supplement_tracking_schema.sql
   ```

   The migration creates the following tables:

   - `supplements` - Stores supplement information
   - `supplement_schedules` - Defines when supplements should be taken
   - `supplement_adherence` - Tracks when doses are marked as taken
   - `user_preferences` - User-specific settings

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com)
- Authentication powered by [SimpleWebAuthn](https://simplewebauthn.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

Made with ❤️ for better health tracking
