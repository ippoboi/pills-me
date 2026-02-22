# PillsMe Migration Plan: Supabase → Neon/Prisma/better-auth/Zod

**Created:** 2025-02-22
**Status:** Planning
**Branch:** TBD (recommend `feature/neon-prisma-better-auth-migration`)

---

## Executive Summary

Migrate PillsMe from Supabase PostgreSQL + SimpleWebAuthn to Neon PostgreSQL + Prisma ORM + better-auth (passkey plugin) + Zod validation.

**Motivation:**

- Cost reduction (Neon pricing)
- Tech consolidation (better-auth ecosystem)
- Type safety improvements (Zod as source of truth)

**Approach:** Big Bang migration with feature freeze (~8-10 days)

---

## Current Architecture

### Database (Supabase PostgreSQL)

| Table                            | Purpose                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| `supplements`                    | Core supplement data with soft deletes                        |
| `supplement_schedules`           | Time-of-day scheduling (MORNING, LUNCH, DINNER, BEFORE_SLEEP) |
| `supplement_adherence`           | Dosage tracking with UTC timestamps                           |
| `passkeys`                       | WebAuthn credentials (SimpleWebAuthn format)                  |
| `passkey_challenges`             | Auth challenge storage (60s expiry)                           |
| `notification_preferences`       | Push notification settings                                    |
| `push_subscriptions`             | Web push subscriptions                                        |
| `user_information`               | User profile (sex, birthdate)                                 |
| `nutrient_*`                     | Planner feature tables                                        |
| `supplement_plans`, `plan_items` | Plan management                                               |

### Authentication (SimpleWebAuthn)

- Custom HMAC-signed session tokens (`pm_session` cookie, 7-day expiry)
- WebAuthn config in `/lib/webauthn.ts`
- Session management in `/lib/session.ts`
- Auth helper in `/lib/auth-helper.ts`

### Type System

- Auto-generated Supabase types (`/lib/supabase/database.types.ts`)
- Custom types in `/lib/types/`
- Manual validation in `/lib/utils/validation.ts`

---

## Target Architecture

### Database: Neon PostgreSQL + Prisma

- Prisma schema as source of truth
- `@prisma/adapter-neon` for serverless connections
- Application-level user filtering (no RLS)

### Authentication: better-auth + @better-auth/passkey

- Prisma adapter for database
- Passkey plugin handles WebAuthn
- Managed sessions (replaces custom HMAC tokens)

### Validation: Zod

- Zod schemas → inferred TypeScript types
- Replaces manual validation functions
- Single source of truth for input validation

---

## Phase 1: Setup

### 1.1 Install Dependencies

```bash
pnpm add @prisma/client @prisma/adapter-neon @neondatabase/serverless better-auth @better-auth/passkey zod ws
pnpm add -D prisma
```

### 1.2 Create Neon Database

1. Create project at [console.neon.tech](https://console.neon.tech)
2. Copy connection string with `?sslmode=require`

### 1.3 Environment Variables

**Add to `.env.local`:**

```env
DATABASE_URL="postgres://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
BETTER_AUTH_URL="https://your-domain.com"
```

**Keep:**

```env
NEXT_PUBLIC_RP_ID="your-domain.com"
NEXT_PUBLIC_RP_NAME="PillsMe"
```

**Remove after migration:**

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_SESSION_SECRET
```

---

## Phase 2: Prisma Schema

### 2.1 Create `/prisma/schema.prisma`

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum SupplementStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

enum TimeOfDay {
  MORNING
  LUNCH
  DINNER
  BEFORE_SLEEP
}

enum PlanStatus {
  draft
  active
  paused
  archived
}

enum UserSex {
  male
  female
}

// ============================================================================
// BETTER-AUTH MANAGED TABLES
// ============================================================================

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // better-auth relations
  sessions      Session[]
  accounts      Account[]
  passkeys      Passkey[]

  // App relations
  supplements           Supplement[]
  supplementAdherence   SupplementAdherence[]
  userPreferences       UserPreferences?
  notificationPreferences NotificationPreferences?
  pushSubscriptions     PushSubscription[]
  userInformation       UserInformation?
  supplementPlans       SupplementPlan[]
  auditLogs             AuditLog[]

  @@map("user")
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("account")
}

model Passkey {
  id           String   @id @default(cuid())
  name         String?
  publicKey    String
  userId       String
  credentialID String
  counter      Int
  deviceType   String
  backedUp     Boolean
  transports   String?
  createdAt    DateTime @default(now())
  aaguid       String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([credentialID])
  @@map("passkey")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verification")
}

// ============================================================================
// APP TABLES
// ============================================================================

model Supplement {
  id                   String           @id @default(uuid())
  userId               String           @map("user_id")
  name                 String           @db.VarChar(255)
  capsulesPerTake      Int              @default(1) @map("capsules_per_take")
  recommendation       String?          @db.VarChar(255)
  reason               String?          @db.VarChar(255)
  sourceName           String?          @map("source_name") @db.VarChar(255)
  sourceUrl            String?          @map("source_url")
  startDate            DateTime         @map("start_date") @db.Timestamptz
  endDate              DateTime?        @map("end_date") @db.Timestamptz
  status               SupplementStatus @default(ACTIVE)
  deletedAt            DateTime?        @map("deleted_at") @db.Timestamptz
  createdAt            DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime         @updatedAt @map("updated_at") @db.Timestamptz
  inventoryTotal       Int?             @map("inventory_total")
  lowInventoryThreshold Int?            @default(10) @map("low_inventory_threshold")
  planId               String?          @map("plan_id")
  brand                String?
  categoryId           String?          @map("category_id")

  user                User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan                SupplementPlan?       @relation(fields: [planId], references: [id], onDelete: SetNull)
  category            SupplementCategory?   @relation(fields: [categoryId], references: [id])
  schedules           SupplementSchedule[]
  adherenceRecords    SupplementAdherence[]

  @@index([userId])
  @@index([status])
  @@index([startDate])
  @@index([deletedAt])
  @@map("supplements")
}

model SupplementSchedule {
  id           String    @id @default(uuid())
  supplementId String    @map("supplement_id")
  timeOfDay    TimeOfDay @map("time_of_day")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz

  supplement        Supplement            @relation(fields: [supplementId], references: [id], onDelete: Cascade)
  adherenceRecords  SupplementAdherence[]

  @@unique([supplementId, timeOfDay])
  @@index([supplementId])
  @@map("supplement_schedules")
}

model SupplementAdherence {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  supplementId String   @map("supplement_id")
  scheduleId   String   @map("schedule_id")
  takenAt      DateTime @map("taken_at") @db.Timestamptz
  markedAt     DateTime @default(now()) @map("marked_at") @db.Timestamptz
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  user       User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  supplement Supplement         @relation(fields: [supplementId], references: [id], onDelete: Cascade)
  schedule   SupplementSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@unique([supplementId, scheduleId, takenAt])
  @@index([userId])
  @@index([supplementId])
  @@index([takenAt])
  @@map("supplement_adherence")
}

model UserPreferences {
  id              String   @id @default(uuid())
  userId          String   @unique @map("user_id")
  reminderEnabled Boolean  @default(false) @map("reminder_enabled")
  reminderTimes   Json?    @map("reminder_times")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

model NotificationPreferences {
  id                          String   @id @default(uuid())
  userId                      String   @unique @map("user_id")
  supplementRemindersEnabled  Boolean  @default(true) @map("supplement_reminders_enabled")
  refillRemindersEnabled      Boolean  @default(true) @map("refill_reminders_enabled")
  appUpdatesEnabled           Boolean  @default(true) @map("app_updates_enabled")
  systemNotificationsEnabled  Boolean  @default(true) @map("system_notifications_enabled")
  reminderTimes               Json?    @map("reminder_times")
  timezone                    String   @default("UTC")
  createdAt                   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt                   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}

model PushSubscription {
  id               String   @id @default(uuid())
  userId           String   @map("user_id")
  subscriptionData Json     @map("subscription_data")
  endpoint         String
  userAgent        String?  @map("user_agent")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, endpoint])
  @@index([userId])
  @@map("push_subscriptions")
}

model UserInformation {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  sex       UserSex
  birthdate DateTime? @db.Date
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_information")
}

model AuditLog {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  action       String
  resourceType String   @map("resource_type")
  resourceId   String?  @map("resource_id")
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  details      Json?
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("audit_logs")
}

// ============================================================================
// PLANNER TABLES (Reference Data)
// ============================================================================

model NutrientCategory {
  id          String  @id
  label       String
  description String?
  icon        String?
  sortOrder   Int?    @default(0) @map("sort_order")

  nutrients Nutrient[]

  @@map("nutrient_categories")
}

model Nutrient {
  id               String   @id @default(uuid())
  name             String
  slug             String   @unique
  categoryId       String?  @map("category_id")
  defaultUnit      String   @map("default_unit")
  alternateUnit    String?  @map("alternate_unit")
  conversionFactor Decimal? @map("conversion_factor")
  description      String?
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz

  category NutrientCategory? @relation(fields: [categoryId], references: [id])
  limits   NutrientLimit[]

  @@index([slug])
  @@map("nutrients")
}

model NutrientLimit {
  id          String   @id @default(uuid())
  nutrientId  String   @map("nutrient_id")
  ageGroup    String   @map("age_group")
  sex         String
  rda         Decimal?
  upperLimit  Decimal? @map("upper_limit")
  safeLevel   Decimal? @map("safe_level")
  unit        String
  source      String?  @default("EFSA")
  ulContext   String?  @map("ul_context")

  nutrient Nutrient @relation(fields: [nutrientId], references: [id], onDelete: Cascade)

  @@unique([nutrientId, ageGroup, sex, source])
  @@index([nutrientId, ageGroup, sex])
  @@map("nutrient_limits")
}

model SupplementCategory {
  id          String  @id
  label       String
  description String?
  icon        String?
  sortOrder   Int?    @default(0) @map("sort_order")

  supplements Supplement[]

  @@map("supplement_categories")
}

model SupplementPlan {
  id         String     @id @default(uuid())
  userId     String     @map("user_id")
  name       String
  isDefault  Boolean    @default(false) @map("is_default")
  status     PlanStatus @default(draft)
  startDate  DateTime?  @map("start_date") @db.Date
  notes      String?
  createdAt  DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       PlanItem[]
  supplements Supplement[]

  @@index([userId])
  @@map("supplement_plans")
}

model PlanItem {
  id             String   @id @default(uuid())
  planId         String   @map("plan_id")
  name           String
  brand          String?
  servingsPerDay Decimal? @default(1) @map("servings_per_day")
  nutrients      Json     @default("[]")
  sourceType     String?  @default("manual") @map("source_type")
  imageUrl       String?  @map("image_url")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz

  plan SupplementPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId])
  @@map("plan_items")
}
```

### 2.2 Create Prisma Client `/lib/prisma.ts`

```typescript
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";

// WebSocket for local dev
if (process.env.NODE_ENV !== "production") {
  neonConfig.webSocketConstructor = require("ws");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## Phase 3: Zod Schemas

### 3.1 Create `/lib/schemas/supplements.ts`

```typescript
import { z } from "zod";

// Enums
export const TimeOfDaySchema = z.enum([
  "MORNING",
  "LUNCH",
  "DINNER",
  "BEFORE_SLEEP",
]);
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

export const SupplementStatusSchema = z.enum([
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);
export type SupplementStatus = z.infer<typeof SupplementStatusSchema>;

// Input schema
export const SupplementInputSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    capsules_per_take: z.number().int().positive(),
    time_of_day: z.array(TimeOfDaySchema).min(1, "At least one time required"),
    recommendation: z.string().max(255).optional(),
    source_url: z.string().url().optional().or(z.literal("")),
    source_name: z.string().max(255).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    reason: z.string().max(255).optional(),
    inventory_total: z.number().int().nonnegative().optional(),
    low_inventory_threshold: z.number().int().nonnegative().optional(),
    missed_days: z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      !data.end_date || new Date(data.end_date) > new Date(data.start_date),
    { message: "End date must be after start date", path: ["end_date"] }
  );

export type SupplementInput = z.infer<typeof SupplementInputSchema>;

// Adherence toggle
export const AdherenceToggleSchema = z.object({
  supplement_id: z.string().uuid(),
  schedule_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
});

export type AdherenceToggle = z.infer<typeof AdherenceToggleSchema>;
```

### 3.2 Create `/lib/schemas/user.ts`

```typescript
import { z } from "zod";

export const UserSexSchema = z.enum(["male", "female"]);
export type UserSex = z.infer<typeof UserSexSchema>;

export const NotificationPreferencesUpdateSchema = z.object({
  supplement_reminders_enabled: z.boolean().optional(),
  refill_reminders_enabled: z.boolean().optional(),
  app_updates_enabled: z.boolean().optional(),
  system_notifications_enabled: z.boolean().optional(),
  reminder_times: z.record(z.string()).optional(),
  timezone: z.string().optional(),
});

export type NotificationPreferencesUpdate = z.infer<
  typeof NotificationPreferencesUpdateSchema
>;
```

### 3.3 Create `/lib/schemas/index.ts`

```typescript
export * from "./supplements";
export * from "./user";
```

---

## Phase 4: better-auth Setup

### 4.1 Server Config `/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  advanced: {
    cookiePrefix: "pm",
  },

  plugins: [
    passkey({
      rpID: process.env.NEXT_PUBLIC_RP_ID || "localhost",
      rpName: process.env.NEXT_PUBLIC_RP_NAME || "PillsMe",
      origin: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

### 4.2 Client Config `/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [passkeyClient()],
});

export const { signIn, signOut, signUp, useSession, passkey } = authClient;
```

### 4.3 API Handler `/app/api/auth/[...all]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

---

## Phase 5: Data Migration

### 5.1 Backup Supabase Data

```bash
# Full SQL dump
supabase db dump -f backup_$(date +%Y%m%d).sql

# JSON export for transformation
node scripts/export-supabase-data.js
```

### 5.2 Migration Order

1. `npx prisma db push` - Create tables in Neon
2. Seed reference data (nutrients, categories)
3. Migrate users (create mapping: Supabase UUID → better-auth CUID)
4. Migrate passkeys (transform format)
5. Migrate app data with FK updates

### 5.3 Passkey Format Transformation

| Supabase (Current)         | better-auth (Target)       |
| -------------------------- | -------------------------- |
| `credential_id`            | `credentialID`             |
| `public_key` (base64)      | `publicKey` (same)         |
| `counter`                  | `counter`                  |
| `authenticator_attachment` | `deviceType`               |
| `backup_state`             | `backedUp`                 |
| `transports[]`             | `transports` (JSON string) |
| `device_info.name`         | `name`                     |

**deviceType mapping:**

- `'platform'` → `'singleDevice'`
- `'cross-platform'` → `'multiDevice'`

### 5.4 Migration Script Structure

```typescript
// scripts/migrate-data.ts
interface MigrationContext {
  userIdMap: Map<string, string>; // old UUID → new CUID
}

async function migrate() {
  const ctx: MigrationContext = { userIdMap: new Map() };

  // 1. Migrate users
  await migrateUsers(supabaseUsers, ctx);

  // 2. Migrate passkeys
  await migratePasskeys(supabasePasskeys, ctx);

  // 3. Migrate supplements (update user_id FKs)
  await migrateSupplements(supabaseSupplements, ctx);

  // 4. Migrate adherence
  await migrateAdherence(supabaseAdherence, ctx);

  // 5. Migrate preferences
  await migratePreferences(supabasePreferences, ctx);
}
```

---

## Phase 6: API Route Updates

### 6.1 New Auth Helper `/lib/auth-helper.ts`

```typescript
import { NextRequest } from "next/server";
import { auth } from "./auth";
import { prisma } from "./prisma";

export async function authenticateRequest(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) return null;

  return {
    userId: session.user.id,
    user: session.user,
    session: session.session,
    prisma,
  };
}
```

### 6.2 Route Changes

| Route                | Action                                |
| -------------------- | ------------------------------------- |
| `/api/passkey/*`     | **DELETE** (better-auth handles)      |
| `/api/auth/logout`   | **DELETE** (use better-auth signOut)  |
| `/api/auth/me`       | **REWRITE** - use better-auth session |
| `/api/supplements/*` | **UPDATE** - Prisma queries + Zod     |
| `/api/push/*`        | **UPDATE** - Prisma queries           |

### 6.3 Query Pattern Migration

```typescript
// BEFORE (Supabase)
const { data, error } = await supabase
  .from("supplements")
  .select("*, supplement_schedules(*)")
  .eq("user_id", userId)
  .is("deleted_at", null);

// AFTER (Prisma)
const data = await prisma.supplement.findMany({
  where: { userId, deletedAt: null },
  include: { schedules: true },
});
```

### 6.4 Validation Pattern

```typescript
// BEFORE (manual)
const { isValid, error } = validateSupplementInput(body);
if (!isValid) return Response.json({ error }, { status: 400 });

// AFTER (Zod)
const result = SupplementInputSchema.safeParse(body);
if (!result.success) {
  return Response.json(
    {
      error: "Validation failed",
      details: result.error.errors,
    },
    { status: 400 }
  );
}
const data = result.data;
```

---

## Phase 7: Client Updates

### 7.1 Login Page

```typescript
// Replace SimpleWebAuthn with better-auth
import { authClient } from "@/lib/auth-client";

const handleLogin = async () => {
  const result = await authClient.passkey.signIn();
  if (result.error) {
    setError(result.error.message);
    return;
  }
  router.push("/todos");
};
```

### 7.2 Registration

```typescript
const handleRegister = async () => {
  const result = await authClient.passkey.signUp({
    name: displayName,
    email: `${userId}@pillsme.local`, // Passkey-only, no real email
  });
  // ...
};
```

### 7.3 Auth Context

```typescript
import { authClient } from "@/lib/auth-client";

export function AuthProvider({ children }) {
  const { data: session, isPending } = authClient.useSession();
  // ...
}
```

---

## Phase 8: Middleware

### 8.1 New `/middleware.ts`

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./lib/auth";

const publicPaths = ["/", "/login", "/onboarding", "/privacy", "/terms"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths and auth API
  if (publicPaths.includes(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

---

## Phase 9: Cleanup

### 9.1 Files to Delete

```
lib/supabase/           # Entire directory
lib/session.ts          # Custom HMAC session
lib/webauthn.ts         # SimpleWebAuthn config
app/api/passkey/        # All passkey routes
supabase/               # Migrations (archive first)
```

### 9.2 Dependencies to Remove

```bash
pnpm remove @supabase/supabase-js @supabase/ssr @simplewebauthn/browser @simplewebauthn/server
```

### 9.3 Type Updates

- Delete `/lib/supabase/database.types.ts`
- Update `/lib/types/` to import from Prisma client and Zod schemas

---

## Phase 10: Testing & Verification

### 10.1 Data Verification Script

```typescript
async function verify() {
  console.log("Verifying user counts...");
  assert(oldUserCount === newUserCount);

  console.log("Verifying supplement counts...");
  assert(oldSupplementCount === newSupplementCount);

  console.log("Verifying adherence records...");
  assert(oldAdherenceCount === newAdherenceCount);

  console.log("All counts match ✓");
}
```

### 10.2 Manual Auth Testing

- [ ] New passkey registration works
- [ ] Migrated passkey login works
- [ ] Session persists across browser restart
- [ ] Session expires after 7 days
- [ ] Protected routes redirect when logged out

### 10.3 Regression Tests

```bash
pnpm test:run
```

---

## Rollback Plan

### Pre-Migration Backup

```bash
supabase db dump -f backup_pre_migration.sql
node scripts/export-all-data.js > backup.json
```

### Rollback Steps

1. Revert to pre-migration commit
2. Restore Supabase env vars
3. Deploy previous version
4. Supabase data unchanged

### Safety Net

- Keep Supabase project for 30 days post-migration
- Only delete after confirming production stability

---

## Timeline Estimate

| Phase                   | Duration      |
| ----------------------- | ------------- |
| Phase 1: Setup          | 0.5 day       |
| Phase 2: Prisma Schema  | 1 day         |
| Phase 3: Zod Schemas    | 0.5 day       |
| Phase 4: better-auth    | 1 day         |
| Phase 5: Data Migration | 1-2 days      |
| Phase 6: API Routes     | 2 days        |
| Phase 7: Client Updates | 1 day         |
| Phase 8: Middleware     | 0.5 day       |
| Phase 9: Cleanup        | 0.5 day       |
| Phase 10: Testing       | 1-2 days      |
| **Total**               | **8-10 days** |

---

## Critical Files Summary

| File                              | Purpose                |
| --------------------------------- | ---------------------- |
| `/prisma/schema.prisma`           | Database schema        |
| `/lib/prisma.ts`                  | Prisma client          |
| `/lib/auth.ts`                    | better-auth server     |
| `/lib/auth-client.ts`             | better-auth client     |
| `/lib/auth-helper.ts`             | Request authentication |
| `/lib/schemas/*.ts`               | Zod validation         |
| `/app/api/auth/[...all]/route.ts` | Auth API               |
| `/middleware.ts`                  | Route protection       |
| `/scripts/migrate-data.ts`        | Data migration         |
