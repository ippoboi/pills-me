# Supplement Intake Planner - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a supplement planning tool that calculates cumulative nutrient intake against safe limits to prevent overdose.

**Architecture:** localStorage-first drafts with explicit DB save. Normalized nutrient/limits tables with EFSA data. Plan items convert to supplements on activation. React Query for server state, custom hooks for localStorage.

**Tech Stack:** Next.js App Router, Supabase, React Query, Tailwind CSS, Vitest for testing

---

## Execution Overview

```
PARALLEL TRACK A: Database & Backend     PARALLEL TRACK B: Testing Setup
─────────────────────────────────────    ────────────────────────────────
Task 1: Drop biomarker tables            Task 2: Setup Vitest
Task 3: Create new schema                        │
        │                                        │
        └──────────────┬─────────────────────────┘
                       │
                       ▼
            SEQUENTIAL: Core Logic
            ────────────────────────
            Task 4: Seed EFSA data
            Task 5: Type definitions
            Task 6: Calculation utils (TDD)
            Task 7: localStorage hooks (TDD)
                       │
                       ▼
            PARALLEL TRACK C: API Routes
            ────────────────────────────
            Task 8:  GET /nutrients
            Task 9:  GET /limits
            Task 10: CRUD /plans
            Task 11: POST /plans/[id]/activate
            Task 12: GET /active-intake
                       │
                       ▼
            SEQUENTIAL: UI Components
            ─────────────────────────
            Task 13: Profile birthdate field
            Task 14: PlannerPage shell
            Task 15: PlanSelector
            Task 16: AddItemModal
            Task 17: PlanItemCard + NutrientEditor
            Task 18: IntakeSummary
            Task 19: PlanActions (save/activate)
                       │
                       ▼
            Task 20: Integration & Polish
```

---

## PARALLEL TRACK A: Database

### Task 1: Drop Biomarker Tables

**Files:**
- Create: `supabase/migrations/YYYYMMDD_drop_biomarker_tables.sql`

**Step 1: Create migration file**

```sql
-- Drop biomarker-related tables (cleanup for planner feature)
-- These tables are being replaced by the nutrient planning system

BEGIN;

-- Drop in dependency order (children first)
DROP TABLE IF EXISTS raw_unmatched_data;
DROP TABLE IF EXISTS user_biomarkers;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS biomarker_synonyms;
DROP TABLE IF EXISTS biomarkers_information;
DROP TABLE IF EXISTS biomarker_categories;

-- Drop related enums
DROP TYPE IF EXISTS report_status;
DROP TYPE IF EXISTS unmatched_processing_status;
DROP TYPE IF EXISTS unmatched_resolution_action;

COMMIT;
```

**Step 2: Apply migration locally**

Run: `npx supabase db push` or apply via Supabase dashboard

**Step 3: Regenerate types**

Run: `npx supabase gen types typescript --project-id <id> --schema public > lib/supabase/database.types.ts`

**Step 4: Commit**

```bash
git add supabase/migrations/ lib/supabase/database.types.ts
git commit -m "chore: drop biomarker tables for planner feature"
```

---

### Task 3: Create Planner Schema

**Files:**
- Create: `supabase/migrations/YYYYMMDD_create_planner_schema.sql`

**Step 1: Create migration file**

```sql
-- Supplement Intake Planner schema
-- Normalized nutrient reference data with EFSA limits

BEGIN;

-- Plan status enum
CREATE TYPE plan_status AS ENUM ('draft', 'active', 'paused', 'archived');

-- Nutrient categories (vitamins, minerals, fatty-acids)
CREATE TABLE nutrient_categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0
);

-- Nutrients master table
CREATE TABLE nutrients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  slug               TEXT UNIQUE NOT NULL,
  category_id        TEXT REFERENCES nutrient_categories(id),
  default_unit       TEXT NOT NULL,
  alternate_unit     TEXT,
  conversion_factor  DECIMAL,
  description        TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nutrients_slug ON nutrients(slug);
CREATE INDEX idx_nutrients_category ON nutrients(category_id);

-- Nutrient limits by age/sex (EFSA data)
CREATE TABLE nutrient_limits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrient_id  UUID NOT NULL REFERENCES nutrients(id) ON DELETE CASCADE,
  age_group    TEXT NOT NULL,
  sex          TEXT NOT NULL,
  rda          DECIMAL,
  upper_limit  DECIMAL,
  unit         TEXT NOT NULL,
  source       TEXT DEFAULT 'EFSA',

  UNIQUE(nutrient_id, age_group, sex, source)
);

CREATE INDEX idx_nutrient_limits_lookup ON nutrient_limits(nutrient_id, age_group, sex);

-- Supplement categories (sleep, energy, immune, etc.)
CREATE TABLE supplement_categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0
);

-- User's supplement plans
CREATE TABLE supplement_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_default  BOOLEAN DEFAULT false,
  status      plan_status DEFAULT 'draft',
  start_date  DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplement_plans_user ON supplement_plans(user_id);
CREATE INDEX idx_supplement_plans_status ON supplement_plans(user_id, status);

-- RLS for plans
ALTER TABLE supplement_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plans" ON supplement_plans
  FOR ALL USING (auth.uid() = user_id);

-- Plan items (before activation)
CREATE TABLE plan_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID NOT NULL REFERENCES supplement_plans(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  brand            TEXT,
  servings_per_day DECIMAL DEFAULT 1,
  nutrients        JSONB NOT NULL DEFAULT '[]',
  source_type      TEXT DEFAULT 'manual',
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_plan_items_plan ON plan_items(plan_id);

-- RLS for plan items (via plan ownership)
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items in own plans" ON plan_items
  FOR ALL USING (
    plan_id IN (SELECT id FROM supplement_plans WHERE user_id = auth.uid())
  );

-- Add columns to existing tables
ALTER TABLE supplements
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES supplement_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES supplement_categories(id);

ALTER TABLE user_information
ADD COLUMN IF NOT EXISTS birthdate DATE;

COMMIT;
```

**Step 2: Apply migration**

Run: `npx supabase db push`

**Step 3: Regenerate types**

Run: `npx supabase gen types typescript --project-id <id> --schema public > lib/supabase/database.types.ts`

**Step 4: Commit**

```bash
git add supabase/migrations/ lib/supabase/database.types.ts
git commit -m "feat: add planner schema (nutrients, limits, plans)"
```

---

## PARALLEL TRACK B: Testing Setup

### Task 2: Setup Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/__tests__/setup.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`

**Step 1: Install dependencies**

Run: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react`

**Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./lib/__tests__/setup.ts'],
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      exclude: ['lib/__tests__/**', 'lib/supabase/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Step 3: Create test setup file**

```typescript
// lib/__tests__/setup.ts
import '@testing-library/jest-dom';
```

**Step 4: Add test scripts to package.json**

Add to scripts section:
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

**Step 5: Verify setup works**

Run: `pnpm test:run`
Expected: "No test files found" (success - setup works)

**Step 6: Commit**

```bash
git add vitest.config.ts lib/__tests__/setup.ts package.json pnpm-lock.yaml
git commit -m "chore: setup vitest for testing"
```

---

## SEQUENTIAL: Core Logic

### Task 4: Seed EFSA Nutrient Data

**Files:**
- Create: `lib/data/nutrients.ts`
- Create: `lib/data/nutrient-limits.ts`
- Create: `supabase/seed/seed-nutrients.sql`

**Step 1: Create nutrient categories and nutrients data**

```typescript
// lib/data/nutrients.ts
export const NUTRIENT_CATEGORIES = [
  { id: 'vitamins', label: 'Vitamins', sort_order: 1 },
  { id: 'minerals', label: 'Minerals', sort_order: 2 },
  { id: 'fatty-acids', label: 'Fatty Acids', sort_order: 3 },
  { id: 'amino-acids', label: 'Amino Acids', sort_order: 4 },
  { id: 'other', label: 'Other', sort_order: 5 },
] as const;

export const NUTRIENTS = [
  // Vitamins
  { name: 'Vitamin A', slug: 'vitamin-a', category_id: 'vitamins', default_unit: 'mcg', alternate_unit: 'IU', conversion_factor: 0.3 },
  { name: 'Vitamin B1 (Thiamine)', slug: 'vitamin-b1', category_id: 'vitamins', default_unit: 'mg' },
  { name: 'Vitamin B2 (Riboflavin)', slug: 'vitamin-b2', category_id: 'vitamins', default_unit: 'mg' },
  { name: 'Vitamin B3 (Niacin)', slug: 'vitamin-b3', category_id: 'vitamins', default_unit: 'mg' },
  { name: 'Vitamin B5 (Pantothenic Acid)', slug: 'vitamin-b5', category_id: 'vitamins', default_unit: 'mg' },
  { name: 'Vitamin B6', slug: 'vitamin-b6', category_id: 'vitamins', default_unit: 'mg' },
  { name: 'Vitamin B7 (Biotin)', slug: 'vitamin-b7', category_id: 'vitamins', default_unit: 'mcg' },
  { name: 'Vitamin B9 (Folate)', slug: 'vitamin-b9', category_id: 'vitamins', default_unit: 'mcg' },
  { name: 'Vitamin B12', slug: 'vitamin-b12', category_id: 'vitamins', default_unit: 'mcg' },
  { name: 'Vitamin C', slug: 'vitamin-c', category_id: 'vitamins', default_unit: 'mg' },
  { name: 'Vitamin D', slug: 'vitamin-d', category_id: 'vitamins', default_unit: 'mcg', alternate_unit: 'IU', conversion_factor: 0.025 },
  { name: 'Vitamin E', slug: 'vitamin-e', category_id: 'vitamins', default_unit: 'mg' },
  { name: 'Vitamin K', slug: 'vitamin-k', category_id: 'vitamins', default_unit: 'mcg' },

  // Minerals
  { name: 'Calcium', slug: 'calcium', category_id: 'minerals', default_unit: 'mg' },
  { name: 'Magnesium', slug: 'magnesium', category_id: 'minerals', default_unit: 'mg' },
  { name: 'Zinc', slug: 'zinc', category_id: 'minerals', default_unit: 'mg' },
  { name: 'Iron', slug: 'iron', category_id: 'minerals', default_unit: 'mg' },
  { name: 'Selenium', slug: 'selenium', category_id: 'minerals', default_unit: 'mcg' },
  { name: 'Copper', slug: 'copper', category_id: 'minerals', default_unit: 'mg' },
  { name: 'Manganese', slug: 'manganese', category_id: 'minerals', default_unit: 'mg' },
  { name: 'Chromium', slug: 'chromium', category_id: 'minerals', default_unit: 'mcg' },
  { name: 'Iodine', slug: 'iodine', category_id: 'minerals', default_unit: 'mcg' },
  { name: 'Potassium', slug: 'potassium', category_id: 'minerals', default_unit: 'mg' },
  { name: 'Phosphorus', slug: 'phosphorus', category_id: 'minerals', default_unit: 'mg' },

  // Fatty Acids
  { name: 'Omega-3 (EPA)', slug: 'omega-3-epa', category_id: 'fatty-acids', default_unit: 'mg' },
  { name: 'Omega-3 (DHA)', slug: 'omega-3-dha', category_id: 'fatty-acids', default_unit: 'mg' },
  { name: 'Omega-3 (ALA)', slug: 'omega-3-ala', category_id: 'fatty-acids', default_unit: 'mg' },

  // Amino Acids
  { name: 'L-Theanine', slug: 'l-theanine', category_id: 'amino-acids', default_unit: 'mg' },
  { name: 'L-Tyrosine', slug: 'l-tyrosine', category_id: 'amino-acids', default_unit: 'mg' },
  { name: 'L-Glutamine', slug: 'l-glutamine', category_id: 'amino-acids', default_unit: 'mg' },

  // Other
  { name: 'Melatonin', slug: 'melatonin', category_id: 'other', default_unit: 'mg' },
  { name: 'Coenzyme Q10', slug: 'coq10', category_id: 'other', default_unit: 'mg' },
  { name: 'Ashwagandha', slug: 'ashwagandha', category_id: 'other', default_unit: 'mg' },
  { name: 'Collagen', slug: 'collagen', category_id: 'other', default_unit: 'g' },
  { name: 'Probiotics', slug: 'probiotics', category_id: 'other', default_unit: 'CFU' },
] as const;
```

**Step 2: Create nutrient limits data (EFSA)**

```typescript
// lib/data/nutrient-limits.ts
// EFSA Dietary Reference Values for EU adults
// Source: https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values

export interface NutrientLimitData {
  nutrient_slug: string;
  age_group: string;
  sex: 'male' | 'female' | 'all';
  rda: number | null;
  upper_limit: number | null;
  unit: string;
}

export const NUTRIENT_LIMITS: NutrientLimitData[] = [
  // Vitamin A (mcg RAE)
  { nutrient_slug: 'vitamin-a', age_group: '19-50', sex: 'male', rda: 750, upper_limit: 3000, unit: 'mcg' },
  { nutrient_slug: 'vitamin-a', age_group: '19-50', sex: 'female', rda: 650, upper_limit: 3000, unit: 'mcg' },
  { nutrient_slug: 'vitamin-a', age_group: '51-70', sex: 'male', rda: 750, upper_limit: 3000, unit: 'mcg' },
  { nutrient_slug: 'vitamin-a', age_group: '51-70', sex: 'female', rda: 650, upper_limit: 3000, unit: 'mcg' },
  { nutrient_slug: 'vitamin-a', age_group: '71+', sex: 'all', rda: 700, upper_limit: 3000, unit: 'mcg' },

  // Vitamin D (mcg)
  { nutrient_slug: 'vitamin-d', age_group: '19-50', sex: 'all', rda: 15, upper_limit: 100, unit: 'mcg' },
  { nutrient_slug: 'vitamin-d', age_group: '51-70', sex: 'all', rda: 15, upper_limit: 100, unit: 'mcg' },
  { nutrient_slug: 'vitamin-d', age_group: '71+', sex: 'all', rda: 20, upper_limit: 100, unit: 'mcg' },

  // Vitamin E (mg)
  { nutrient_slug: 'vitamin-e', age_group: '19-50', sex: 'male', rda: 13, upper_limit: 300, unit: 'mg' },
  { nutrient_slug: 'vitamin-e', age_group: '19-50', sex: 'female', rda: 11, upper_limit: 300, unit: 'mg' },
  { nutrient_slug: 'vitamin-e', age_group: '51-70', sex: 'all', rda: 12, upper_limit: 300, unit: 'mg' },
  { nutrient_slug: 'vitamin-e', age_group: '71+', sex: 'all', rda: 12, upper_limit: 300, unit: 'mg' },

  // Vitamin C (mg)
  { nutrient_slug: 'vitamin-c', age_group: '19-50', sex: 'male', rda: 110, upper_limit: null, unit: 'mg' },
  { nutrient_slug: 'vitamin-c', age_group: '19-50', sex: 'female', rda: 95, upper_limit: null, unit: 'mg' },
  { nutrient_slug: 'vitamin-c', age_group: '51-70', sex: 'all', rda: 100, upper_limit: null, unit: 'mg' },
  { nutrient_slug: 'vitamin-c', age_group: '71+', sex: 'all', rda: 100, upper_limit: null, unit: 'mg' },

  // Vitamin B6 (mg)
  { nutrient_slug: 'vitamin-b6', age_group: '19-50', sex: 'all', rda: 1.6, upper_limit: 25, unit: 'mg' },
  { nutrient_slug: 'vitamin-b6', age_group: '51-70', sex: 'all', rda: 1.7, upper_limit: 25, unit: 'mg' },
  { nutrient_slug: 'vitamin-b6', age_group: '71+', sex: 'all', rda: 1.7, upper_limit: 25, unit: 'mg' },

  // Vitamin B9/Folate (mcg DFE)
  { nutrient_slug: 'vitamin-b9', age_group: '19-50', sex: 'all', rda: 330, upper_limit: 1000, unit: 'mcg' },
  { nutrient_slug: 'vitamin-b9', age_group: '51-70', sex: 'all', rda: 330, upper_limit: 1000, unit: 'mcg' },
  { nutrient_slug: 'vitamin-b9', age_group: '71+', sex: 'all', rda: 330, upper_limit: 1000, unit: 'mcg' },

  // Vitamin B12 (mcg)
  { nutrient_slug: 'vitamin-b12', age_group: '19-50', sex: 'all', rda: 4, upper_limit: null, unit: 'mcg' },
  { nutrient_slug: 'vitamin-b12', age_group: '51-70', sex: 'all', rda: 4, upper_limit: null, unit: 'mcg' },
  { nutrient_slug: 'vitamin-b12', age_group: '71+', sex: 'all', rda: 4, upper_limit: null, unit: 'mcg' },

  // Calcium (mg)
  { nutrient_slug: 'calcium', age_group: '19-50', sex: 'all', rda: 950, upper_limit: 2500, unit: 'mg' },
  { nutrient_slug: 'calcium', age_group: '51-70', sex: 'all', rda: 950, upper_limit: 2500, unit: 'mg' },
  { nutrient_slug: 'calcium', age_group: '71+', sex: 'all', rda: 950, upper_limit: 2500, unit: 'mg' },

  // Magnesium (mg)
  { nutrient_slug: 'magnesium', age_group: '19-50', sex: 'male', rda: 350, upper_limit: 250, unit: 'mg' }, // UL is for supplements only
  { nutrient_slug: 'magnesium', age_group: '19-50', sex: 'female', rda: 300, upper_limit: 250, unit: 'mg' },
  { nutrient_slug: 'magnesium', age_group: '51-70', sex: 'all', rda: 350, upper_limit: 250, unit: 'mg' },
  { nutrient_slug: 'magnesium', age_group: '71+', sex: 'all', rda: 350, upper_limit: 250, unit: 'mg' },

  // Zinc (mg)
  { nutrient_slug: 'zinc', age_group: '19-50', sex: 'male', rda: 11, upper_limit: 25, unit: 'mg' },
  { nutrient_slug: 'zinc', age_group: '19-50', sex: 'female', rda: 8, upper_limit: 25, unit: 'mg' },
  { nutrient_slug: 'zinc', age_group: '51-70', sex: 'all', rda: 10, upper_limit: 25, unit: 'mg' },
  { nutrient_slug: 'zinc', age_group: '71+', sex: 'all', rda: 10, upper_limit: 25, unit: 'mg' },

  // Iron (mg)
  { nutrient_slug: 'iron', age_group: '19-50', sex: 'male', rda: 11, upper_limit: 45, unit: 'mg' },
  { nutrient_slug: 'iron', age_group: '19-50', sex: 'female', rda: 16, upper_limit: 45, unit: 'mg' },
  { nutrient_slug: 'iron', age_group: '51-70', sex: 'all', rda: 11, upper_limit: 45, unit: 'mg' },
  { nutrient_slug: 'iron', age_group: '71+', sex: 'all', rda: 11, upper_limit: 45, unit: 'mg' },

  // Selenium (mcg)
  { nutrient_slug: 'selenium', age_group: '19-50', sex: 'all', rda: 70, upper_limit: 300, unit: 'mcg' },
  { nutrient_slug: 'selenium', age_group: '51-70', sex: 'all', rda: 70, upper_limit: 300, unit: 'mcg' },
  { nutrient_slug: 'selenium', age_group: '71+', sex: 'all', rda: 70, upper_limit: 300, unit: 'mcg' },

  // Copper (mg)
  { nutrient_slug: 'copper', age_group: '19-50', sex: 'all', rda: 1.3, upper_limit: 5, unit: 'mg' },
  { nutrient_slug: 'copper', age_group: '51-70', sex: 'all', rda: 1.3, upper_limit: 5, unit: 'mg' },
  { nutrient_slug: 'copper', age_group: '71+', sex: 'all', rda: 1.3, upper_limit: 5, unit: 'mg' },

  // Iodine (mcg)
  { nutrient_slug: 'iodine', age_group: '19-50', sex: 'all', rda: 150, upper_limit: 600, unit: 'mcg' },
  { nutrient_slug: 'iodine', age_group: '51-70', sex: 'all', rda: 150, upper_limit: 600, unit: 'mcg' },
  { nutrient_slug: 'iodine', age_group: '71+', sex: 'all', rda: 150, upper_limit: 600, unit: 'mcg' },
];
```

**Step 3: Create SQL seed script**

```sql
-- supabase/seed/seed-nutrients.sql
-- Run this after migration to populate reference data

-- Insert categories
INSERT INTO nutrient_categories (id, label, sort_order) VALUES
  ('vitamins', 'Vitamins', 1),
  ('minerals', 'Minerals', 2),
  ('fatty-acids', 'Fatty Acids', 3),
  ('amino-acids', 'Amino Acids', 4),
  ('other', 'Other', 5)
ON CONFLICT (id) DO NOTHING;

-- Insert supplement categories
INSERT INTO supplement_categories (id, label, sort_order) VALUES
  ('general', 'General Health', 1),
  ('sleep', 'Sleep Support', 2),
  ('energy', 'Energy', 3),
  ('immune', 'Immune Health', 4),
  ('cognitive', 'Cognitive', 5),
  ('joint', 'Joint Health', 6),
  ('heart', 'Heart Health', 7),
  ('digestive', 'Digestive', 8)
ON CONFLICT (id) DO NOTHING;

-- Note: Nutrients and limits should be seeded via API or script
-- to maintain TypeScript type safety
```

**Step 4: Commit**

```bash
git add lib/data/ supabase/seed/
git commit -m "feat: add EFSA nutrient reference data"
```

---

### Task 5: Type Definitions

**Files:**
- Create: `lib/types/planner.ts`
- Modify: `lib/types/index.ts`

**Step 1: Create planner types**

```typescript
// lib/types/planner.ts
import type { Database } from '@/lib/supabase/database.types';

// Database row types
export type Nutrient = Database['public']['Tables']['nutrients']['Row'];
export type NutrientCategory = Database['public']['Tables']['nutrient_categories']['Row'];
export type NutrientLimit = Database['public']['Tables']['nutrient_limits']['Row'];
export type SupplementPlan = Database['public']['Tables']['supplement_plans']['Row'];
export type PlanItem = Database['public']['Tables']['plan_items']['Row'];
export type PlanStatus = Database['public']['Enums']['plan_status'];

// Nutrient entry in a plan item
export interface NutrientEntry {
  nutrientId: string;
  nutrientSlug: string;
  amount: number;
  unit: string;
}

// localStorage draft structures
export interface LocalDraftPlan {
  id: string;
  name: string;
  notes?: string;
  items: LocalPlanItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalPlanItem {
  id: string;
  name: string;
  brand?: string;
  servingsPerDay: number;
  nutrients: NutrientEntry[];
}

// Intake calculation results
export type IntakeStatus = 'ok' | 'warning' | 'danger';

export interface IntakeResult {
  nutrientId: string;
  nutrientName: string;
  nutrientSlug: string;
  category: string;
  total: number;
  unit: string;
  rda: number | null;
  upperLimit: number | null;
  percentOfRda: number | null;
  percentOfLimit: number | null;
  status: IntakeStatus;
}

// API response types
export interface NutrientWithCategory extends Nutrient {
  category: NutrientCategory | null;
}

export interface NutrientLimitWithNutrient extends NutrientLimit {
  nutrient: Nutrient;
}

export interface PlanWithItems extends SupplementPlan {
  items: PlanItem[];
}

// User demographics for limit lookup
export interface UserDemographics {
  birthdate: string | null;
  sex: 'male' | 'female';
}

export type AgeGroup = '9-13' | '14-18' | '19-50' | '51-70' | '71+';
```

**Step 2: Export from index**

Add to `lib/types/index.ts`:
```typescript
export * from './planner';
```

**Step 3: Commit**

```bash
git add lib/types/
git commit -m "feat: add planner type definitions"
```

---

### Task 6: Calculation Utils (TDD)

**Files:**
- Create: `lib/utils/planner.ts`
- Create: `lib/utils/__tests__/planner.test.ts`

**Step 1: Write failing tests**

```typescript
// lib/utils/__tests__/planner.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  getAgeGroup,
  calculateIntake,
  getIntakeStatus,
} from '../planner';
import type { LocalPlanItem, NutrientLimit, IntakeResult } from '@/lib/types/planner';

describe('calculateAge', () => {
  it('calculates age correctly for adult', () => {
    const birthdate = new Date('1990-06-15');
    const today = new Date('2026-02-20');
    expect(calculateAge(birthdate, today)).toBe(35);
  });

  it('handles birthday not yet occurred this year', () => {
    const birthdate = new Date('1990-12-15');
    const today = new Date('2026-02-20');
    expect(calculateAge(birthdate, today)).toBe(35);
  });

  it('handles birthday already occurred this year', () => {
    const birthdate = new Date('1990-01-15');
    const today = new Date('2026-02-20');
    expect(calculateAge(birthdate, today)).toBe(36);
  });
});

describe('getAgeGroup', () => {
  it('returns 9-13 for children', () => {
    expect(getAgeGroup(new Date('2015-01-01'), new Date('2026-02-20'))).toBe('9-13');
  });

  it('returns 14-18 for teenagers', () => {
    expect(getAgeGroup(new Date('2010-01-01'), new Date('2026-02-20'))).toBe('14-18');
  });

  it('returns 19-50 for young adults', () => {
    expect(getAgeGroup(new Date('1990-01-01'), new Date('2026-02-20'))).toBe('19-50');
  });

  it('returns 51-70 for middle-aged adults', () => {
    expect(getAgeGroup(new Date('1965-01-01'), new Date('2026-02-20'))).toBe('51-70');
  });

  it('returns 71+ for seniors', () => {
    expect(getAgeGroup(new Date('1950-01-01'), new Date('2026-02-20'))).toBe('71+');
  });
});

describe('getIntakeStatus', () => {
  it('returns ok when under 80% of limit', () => {
    expect(getIntakeStatus(50, 100)).toBe('ok');
  });

  it('returns warning when between 80-100% of limit', () => {
    expect(getIntakeStatus(85, 100)).toBe('warning');
  });

  it('returns danger when over limit', () => {
    expect(getIntakeStatus(110, 100)).toBe('danger');
  });

  it('returns ok when no limit exists', () => {
    expect(getIntakeStatus(1000, null)).toBe('ok');
  });
});

describe('calculateIntake', () => {
  const mockItems: LocalPlanItem[] = [
    {
      id: '1',
      name: 'Vitamin D3',
      servingsPerDay: 1,
      nutrients: [
        { nutrientId: 'vd', nutrientSlug: 'vitamin-d', amount: 50, unit: 'mcg' },
      ],
    },
    {
      id: '2',
      name: 'Multivitamin',
      servingsPerDay: 2,
      nutrients: [
        { nutrientId: 'vd', nutrientSlug: 'vitamin-d', amount: 10, unit: 'mcg' },
        { nutrientId: 'zn', nutrientSlug: 'zinc', amount: 5, unit: 'mg' },
      ],
    },
  ];

  const mockLimits: NutrientLimit[] = [
    { id: '1', nutrient_id: 'vd', age_group: '19-50', sex: 'all', rda: 15, upper_limit: 100, unit: 'mcg', source: 'EFSA' },
    { id: '2', nutrient_id: 'zn', age_group: '19-50', sex: 'male', rda: 11, upper_limit: 25, unit: 'mg', source: 'EFSA' },
  ];

  const mockNutrients = [
    { id: 'vd', name: 'Vitamin D', slug: 'vitamin-d', category_id: 'vitamins', default_unit: 'mcg' },
    { id: 'zn', name: 'Zinc', slug: 'zinc', category_id: 'minerals', default_unit: 'mg' },
  ];

  it('calculates total intake correctly', () => {
    const result = calculateIntake(mockItems, [], mockLimits, mockNutrients);

    const vitD = result.find(r => r.nutrientSlug === 'vitamin-d');
    expect(vitD?.total).toBe(70); // 50 + (10 * 2)

    const zinc = result.find(r => r.nutrientSlug === 'zinc');
    expect(zinc?.total).toBe(10); // 5 * 2
  });

  it('calculates percentage of limit correctly', () => {
    const result = calculateIntake(mockItems, [], mockLimits, mockNutrients);

    const vitD = result.find(r => r.nutrientSlug === 'vitamin-d');
    expect(vitD?.percentOfLimit).toBe(70); // 70/100 * 100
  });

  it('sets correct status based on limits', () => {
    const result = calculateIntake(mockItems, [], mockLimits, mockNutrients);

    const vitD = result.find(r => r.nutrientSlug === 'vitamin-d');
    expect(vitD?.status).toBe('ok'); // 70% is under 80%
  });

  it('combines draft items with active supplements', () => {
    const activeSupplements = [
      {
        id: 'active-1',
        name: 'Fish Oil',
        servingsPerDay: 1,
        nutrients: [
          { nutrientId: 'vd', nutrientSlug: 'vitamin-d', amount: 25, unit: 'mcg' },
        ],
      },
    ];

    const result = calculateIntake(mockItems, activeSupplements, mockLimits, mockNutrients);

    const vitD = result.find(r => r.nutrientSlug === 'vitamin-d');
    expect(vitD?.total).toBe(95); // 70 + 25
    expect(vitD?.status).toBe('warning'); // 95% > 80%
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run lib/utils/__tests__/planner.test.ts`
Expected: FAIL - functions not defined

**Step 3: Write minimal implementation**

```typescript
// lib/utils/planner.ts
import type {
  LocalPlanItem,
  NutrientLimit,
  IntakeResult,
  IntakeStatus,
  AgeGroup,
  Nutrient,
} from '@/lib/types/planner';

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthdate: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get EFSA age group from birthdate
 */
export function getAgeGroup(birthdate: Date, today: Date = new Date()): AgeGroup {
  const age = calculateAge(birthdate, today);

  if (age < 14) return '9-13';
  if (age < 19) return '14-18';
  if (age < 51) return '19-50';
  if (age < 71) return '51-70';
  return '71+';
}

/**
 * Determine intake status based on total vs limit
 */
export function getIntakeStatus(total: number, upperLimit: number | null): IntakeStatus {
  if (upperLimit === null) return 'ok';

  const percentage = (total / upperLimit) * 100;

  if (percentage > 100) return 'danger';
  if (percentage > 80) return 'warning';
  return 'ok';
}

/**
 * Calculate combined nutrient intake from draft items and active supplements
 */
export function calculateIntake(
  draftItems: LocalPlanItem[],
  activeSupplements: LocalPlanItem[],
  limits: NutrientLimit[],
  nutrients: Partial<Nutrient>[]
): IntakeResult[] {
  // Combine all items
  const allItems = [...draftItems, ...activeSupplements];

  // Sum up nutrients by slug
  const totals = new Map<string, { total: number; nutrientId: string; unit: string }>();

  for (const item of allItems) {
    for (const nutrient of item.nutrients) {
      const existing = totals.get(nutrient.nutrientSlug) || {
        total: 0,
        nutrientId: nutrient.nutrientId,
        unit: nutrient.unit,
      };

      existing.total += nutrient.amount * item.servingsPerDay;
      totals.set(nutrient.nutrientSlug, existing);
    }
  }

  // Build results with limit lookups
  const results: IntakeResult[] = [];

  for (const [slug, data] of totals) {
    const nutrient = nutrients.find(n => n.slug === slug);
    const limit = limits.find(l => l.nutrient_id === data.nutrientId);

    const percentOfRda = limit?.rda ? (data.total / limit.rda) * 100 : null;
    const percentOfLimit = limit?.upper_limit ? (data.total / limit.upper_limit) * 100 : null;

    results.push({
      nutrientId: data.nutrientId,
      nutrientName: nutrient?.name || slug,
      nutrientSlug: slug,
      category: nutrient?.category_id || 'other',
      total: data.total,
      unit: data.unit,
      rda: limit?.rda ?? null,
      upperLimit: limit?.upper_limit ?? null,
      percentOfRda,
      percentOfLimit,
      status: getIntakeStatus(data.total, limit?.upper_limit ?? null),
    });
  }

  return results;
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run lib/utils/__tests__/planner.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/utils/planner.ts lib/utils/__tests__/
git commit -m "feat: add intake calculation utils with tests"
```

---

### Task 7: localStorage Hooks (TDD)

**Files:**
- Create: `lib/hooks/use-draft-plans.ts`
- Create: `lib/hooks/__tests__/use-draft-plans.test.ts`

**Step 1: Write failing tests**

```typescript
// lib/hooks/__tests__/use-draft-plans.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftPlans } from '../use-draft-plans';
import type { LocalDraftPlan, LocalPlanItem } from '@/lib/types/planner';

// Mock localStorage
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key: string) => mockStorage[key] || null
  );
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
    (key: string, value: string) => { mockStorage[key] = value; }
  );
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
    (key: string) => { delete mockStorage[key]; }
  );
});

describe('useDraftPlans', () => {
  it('returns empty array when no drafts exist', () => {
    const { result } = renderHook(() => useDraftPlans());
    expect(result.current.drafts).toEqual([]);
  });

  it('creates a new draft plan', () => {
    const { result } = renderHook(() => useDraftPlans());

    act(() => {
      result.current.createDraft('Test Plan');
    });

    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0].name).toBe('Test Plan');
  });

  it('adds item to draft', () => {
    const { result } = renderHook(() => useDraftPlans());

    let draftId: string;
    act(() => {
      draftId = result.current.createDraft('Test Plan');
    });

    const item: Omit<LocalPlanItem, 'id'> = {
      name: 'Vitamin D',
      servingsPerDay: 1,
      nutrients: [{ nutrientId: '1', nutrientSlug: 'vitamin-d', amount: 50, unit: 'mcg' }],
    };

    act(() => {
      result.current.addItem(draftId!, item);
    });

    expect(result.current.drafts[0].items).toHaveLength(1);
    expect(result.current.drafts[0].items[0].name).toBe('Vitamin D');
  });

  it('updates item in draft', () => {
    const { result } = renderHook(() => useDraftPlans());

    let draftId: string;
    act(() => {
      draftId = result.current.createDraft('Test Plan');
      result.current.addItem(draftId, {
        name: 'Vitamin D',
        servingsPerDay: 1,
        nutrients: [],
      });
    });

    const itemId = result.current.drafts[0].items[0].id;

    act(() => {
      result.current.updateItem(draftId!, itemId, { servingsPerDay: 2 });
    });

    expect(result.current.drafts[0].items[0].servingsPerDay).toBe(2);
  });

  it('removes item from draft', () => {
    const { result } = renderHook(() => useDraftPlans());

    let draftId: string;
    act(() => {
      draftId = result.current.createDraft('Test Plan');
      result.current.addItem(draftId, { name: 'Vitamin D', servingsPerDay: 1, nutrients: [] });
    });

    const itemId = result.current.drafts[0].items[0].id;

    act(() => {
      result.current.removeItem(draftId!, itemId);
    });

    expect(result.current.drafts[0].items).toHaveLength(0);
  });

  it('deletes draft', () => {
    const { result } = renderHook(() => useDraftPlans());

    let draftId: string;
    act(() => {
      draftId = result.current.createDraft('Test Plan');
    });

    act(() => {
      result.current.deleteDraft(draftId!);
    });

    expect(result.current.drafts).toHaveLength(0);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useDraftPlans());

    act(() => {
      result.current.createDraft('Persisted Plan');
    });

    expect(mockStorage['pills-me-draft-plans']).toBeDefined();
    const stored = JSON.parse(mockStorage['pills-me-draft-plans']);
    expect(stored[0].name).toBe('Persisted Plan');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test:run lib/hooks/__tests__/use-draft-plans.test.ts`
Expected: FAIL - hook not defined

**Step 3: Write implementation**

```typescript
// lib/hooks/use-draft-plans.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LocalDraftPlan, LocalPlanItem } from '@/lib/types/planner';

const STORAGE_KEY = 'pills-me-draft-plans';

function generateId(): string {
  return crypto.randomUUID();
}

function loadDrafts(): LocalDraftPlan[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: LocalDraftPlan[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function useDraftPlans() {
  const [drafts, setDrafts] = useState<LocalDraftPlan[]>([]);

  // Load on mount
  useEffect(() => {
    setDrafts(loadDrafts());
  }, []);

  // Persist on change
  useEffect(() => {
    if (drafts.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      saveDrafts(drafts);
    }
  }, [drafts]);

  const createDraft = useCallback((name: string, notes?: string): string => {
    const id = generateId();
    const now = new Date().toISOString();

    const newDraft: LocalDraftPlan = {
      id,
      name,
      notes,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    setDrafts(prev => [...prev, newDraft]);
    return id;
  }, []);

  const updateDraft = useCallback((id: string, updates: Partial<Pick<LocalDraftPlan, 'name' | 'notes'>>) => {
    setDrafts(prev => prev.map(draft =>
      draft.id === id
        ? { ...draft, ...updates, updatedAt: new Date().toISOString() }
        : draft
    ));
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => prev.filter(draft => draft.id !== id));
  }, []);

  const addItem = useCallback((draftId: string, item: Omit<LocalPlanItem, 'id'>) => {
    const newItem: LocalPlanItem = {
      ...item,
      id: generateId(),
    };

    setDrafts(prev => prev.map(draft =>
      draft.id === draftId
        ? { ...draft, items: [...draft.items, newItem], updatedAt: new Date().toISOString() }
        : draft
    ));
  }, []);

  const updateItem = useCallback((draftId: string, itemId: string, updates: Partial<LocalPlanItem>) => {
    setDrafts(prev => prev.map(draft =>
      draft.id === draftId
        ? {
            ...draft,
            items: draft.items.map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
            updatedAt: new Date().toISOString(),
          }
        : draft
    ));
  }, []);

  const removeItem = useCallback((draftId: string, itemId: string) => {
    setDrafts(prev => prev.map(draft =>
      draft.id === draftId
        ? {
            ...draft,
            items: draft.items.filter(item => item.id !== itemId),
            updatedAt: new Date().toISOString(),
          }
        : draft
    ));
  }, []);

  const getDraft = useCallback((id: string): LocalDraftPlan | undefined => {
    return drafts.find(draft => draft.id === id);
  }, [drafts]);

  return {
    drafts,
    createDraft,
    updateDraft,
    deleteDraft,
    addItem,
    updateItem,
    removeItem,
    getDraft,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test:run lib/hooks/__tests__/use-draft-plans.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/hooks/use-draft-plans.ts lib/hooks/__tests__/
git commit -m "feat: add localStorage draft plans hook with tests"
```

---

## PARALLEL TRACK C: API Routes

### Task 8: GET /api/planner/nutrients

**Files:**
- Create: `app/api/planner/nutrients/route.ts`

**Step 1: Create route**

```typescript
// app/api/planner/nutrients/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: nutrients, error } = await supabase
      .from('nutrients')
      .select(`
        *,
        category:nutrient_categories(*)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching nutrients:', error);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to fetch nutrients' },
        { status: 500 }
      );
    }

    return NextResponse.json({ nutrients });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/planner/nutrients/
git commit -m "feat: add GET /api/planner/nutrients endpoint"
```

---

### Task 9: GET /api/planner/limits

**Files:**
- Create: `app/api/planner/limits/route.ts`

**Step 1: Create route**

```typescript
// app/api/planner/limits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';
import { getAgeGroup } from '@/lib/utils/planner';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get user's birthdate and sex
    const { data: userInfo, error: userError } = await supabase
      .from('user_information')
      .select('birthdate, sex')
      .eq('user_id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user info:', userError);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to fetch user information' },
        { status: 500 }
      );
    }

    // Determine age group and sex for limit lookup
    const birthdate = userInfo?.birthdate;
    const sex = userInfo?.sex || 'male';
    const ageGroup = birthdate ? getAgeGroup(new Date(birthdate)) : '19-50';

    // Fetch limits for user's demographics
    const { data: limits, error: limitsError } = await supabase
      .from('nutrient_limits')
      .select(`
        *,
        nutrient:nutrients(*)
      `)
      .eq('age_group', ageGroup)
      .or(`sex.eq.${sex},sex.eq.all`);

    if (limitsError) {
      console.error('Error fetching limits:', limitsError);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to fetch nutrient limits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      limits,
      demographics: {
        ageGroup,
        sex,
        birthdate,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/planner/limits/
git commit -m "feat: add GET /api/planner/limits endpoint"
```

---

### Task 10: CRUD /api/planner/plans

**Files:**
- Create: `app/api/planner/plans/route.ts`
- Create: `app/api/planner/plans/[id]/route.ts`

**Step 1: Create list/create routes**

```typescript
// app/api/planner/plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';
import type { LocalDraftPlan } from '@/lib/types/planner';

export async function GET() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: plans, error } = await supabase
      .from('supplement_plans')
      .select(`
        *,
        items:plan_items(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: LocalDraftPlan = await request.json();
    const supabase = await createClient();

    // Create plan
    const { data: plan, error: planError } = await supabase
      .from('supplement_plans')
      .insert({
        user_id: user.id,
        name: body.name,
        notes: body.notes,
        status: 'draft',
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to create plan' },
        { status: 500 }
      );
    }

    // Create plan items
    if (body.items.length > 0) {
      const items = body.items.map(item => ({
        plan_id: plan.id,
        name: item.name,
        brand: item.brand,
        servings_per_day: item.servingsPerDay,
        nutrients: item.nutrients,
        source_type: 'manual',
      }));

      const { error: itemsError } = await supabase
        .from('plan_items')
        .insert(items);

      if (itemsError) {
        console.error('Error creating plan items:', itemsError);
        // Rollback plan
        await supabase.from('supplement_plans').delete().eq('id', plan.id);
        return NextResponse.json(
          { error: 'DatabaseError', message: 'Failed to create plan items' },
          { status: 500 }
        );
      }
    }

    // Fetch complete plan with items
    const { data: completePlan, error: fetchError } = await supabase
      .from('supplement_plans')
      .select(`*, items:plan_items(*)`)
      .eq('id', plan.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ plan });
    }

    return NextResponse.json({ plan: completePlan }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

**Step 2: Create individual plan routes**

```typescript
// app/api/planner/plans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: plan, error } = await supabase
      .from('supplement_plans')
      .select(`*, items:plan_items(*)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'NotFound', message: 'Plan not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching plan:', error);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to fetch plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = await createClient();

    const { data: plan, error } = await supabase
      .from('supplement_plans')
      .update({
        name: body.name,
        notes: body.notes,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to update plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('supplement_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting plan:', error);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to delete plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add app/api/planner/plans/
git commit -m "feat: add CRUD /api/planner/plans endpoints"
```

---

### Task 11: POST /api/planner/plans/[id]/activate

**Files:**
- Create: `app/api/planner/plans/[id]/activate/route.ts`

**Step 1: Create activate route**

```typescript
// app/api/planner/plans/[id]/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';
import type { NutrientEntry } from '@/lib/types/planner';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch plan with items
    const { data: plan, error: planError } = await supabase
      .from('supplement_plans')
      .select(`*, items:plan_items(*)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'NotFound', message: 'Plan not found' },
        { status: 404 }
      );
    }

    if (plan.status !== 'draft') {
      return NextResponse.json(
        { error: 'InvalidState', message: 'Only draft plans can be activated' },
        { status: 400 }
      );
    }

    if (!plan.items || plan.items.length === 0) {
      return NextResponse.json(
        { error: 'ValidationError', message: 'Plan must have at least one item' },
        { status: 400 }
      );
    }

    // Create supplements from plan items
    const today = new Date().toISOString().split('T')[0];
    const supplements = plan.items.map((item: {
      name: string;
      brand?: string;
      servings_per_day: number;
      nutrients: NutrientEntry[];
    }) => ({
      user_id: user.id,
      plan_id: plan.id,
      name: item.name,
      brand: item.brand,
      capsules_per_take: item.servings_per_day,
      start_date: today,
      status: 'ACTIVE',
      // Store nutrients as recommendation for reference
      recommendation: JSON.stringify(item.nutrients),
    }));

    const { data: createdSupplements, error: supplementError } = await supabase
      .from('supplements')
      .insert(supplements)
      .select();

    if (supplementError) {
      console.error('Error creating supplements:', supplementError);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to create supplements' },
        { status: 500 }
      );
    }

    // Update plan status to active
    const { error: updateError } = await supabase
      .from('supplement_plans')
      .update({
        status: 'active',
        start_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating plan status:', updateError);
    }

    // Delete plan items (now converted to supplements)
    await supabase.from('plan_items').delete().eq('plan_id', id);

    return NextResponse.json({
      success: true,
      supplements: createdSupplements,
      message: `Created ${createdSupplements?.length || 0} supplements`,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/planner/plans/
git commit -m "feat: add POST /api/planner/plans/[id]/activate endpoint"
```

---

### Task 12: GET /api/planner/active-intake

**Files:**
- Create: `app/api/planner/active-intake/route.ts`

**Step 1: Create route**

```typescript
// app/api/planner/active-intake/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';
import type { NutrientEntry } from '@/lib/types/planner';

export async function GET() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get all active supplements with their nutrient data
    const { data: supplements, error } = await supabase
      .from('supplements')
      .select('id, name, brand, capsules_per_take, recommendation')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching supplements:', error);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to fetch supplements' },
        { status: 500 }
      );
    }

    // Parse nutrient data from recommendation field
    const activeItems = supplements?.map(s => {
      let nutrients: NutrientEntry[] = [];
      try {
        if (s.recommendation) {
          nutrients = JSON.parse(s.recommendation);
        }
      } catch {
        // Invalid JSON, skip
      }

      return {
        id: s.id,
        name: s.name,
        brand: s.brand,
        servingsPerDay: s.capsules_per_take,
        nutrients,
      };
    }) || [];

    return NextResponse.json({ activeItems });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/planner/active-intake/
git commit -m "feat: add GET /api/planner/active-intake endpoint"
```

---

## SEQUENTIAL: UI Components

### Task 13: Profile Birthdate Field

**Files:**
- Modify: `components/protected/settings-dialog.tsx`
- Create: `lib/hooks/use-user-information.ts`

**Step 1: Create user information hook**

```typescript
// lib/hooks/use-user-information.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserInformation {
  sex: 'male' | 'female';
  birthdate: string | null;
}

async function fetchUserInformation(): Promise<UserInformation> {
  const res = await fetch('/api/user/information');
  if (!res.ok) throw new Error('Failed to fetch user information');
  const data = await res.json();
  return data.userInformation;
}

async function updateUserInformation(data: Partial<UserInformation>): Promise<UserInformation> {
  const res = await fetch('/api/user/information', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update user information');
  return (await res.json()).userInformation;
}

export function useUserInformation() {
  return useQuery({
    queryKey: ['user-information'],
    queryFn: fetchUserInformation,
  });
}

export function useUpdateUserInformation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserInformation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-information'] });
    },
  });
}
```

**Step 2: Create API route for user information**

```typescript
// app/api/user/information/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_information')
      .select('sex, birthdate')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user information:', error);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to fetch user information' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      userInformation: data || { sex: 'male', birthdate: null },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_information')
      .upsert({
        user_id: user.id,
        sex: body.sex,
        birthdate: body.birthdate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user information:', error);
      return NextResponse.json(
        { error: 'DatabaseError', message: 'Failed to update user information' },
        { status: 500 }
      );
    }

    return NextResponse.json({ userInformation: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'ServerError', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

**Step 3: Add birthdate field to settings dialog**

Modify `components/protected/settings-dialog.tsx` to add a birthdate input field in the profile section. Use a date picker similar to the supplement creation form's calendar.

**Step 4: Commit**

```bash
git add lib/hooks/use-user-information.ts app/api/user/information/ components/protected/settings-dialog.tsx
git commit -m "feat: add birthdate field to user profile"
```

---

### Task 14-19: UI Components

Due to length constraints, these tasks follow the same TDD pattern:

1. **Task 14: PlannerPage shell** - Create `/app/(protected)/supplements/planner/page.tsx` with basic layout
2. **Task 15: PlanSelector** - Dropdown to switch between drafts and saved plans
3. **Task 16: AddItemModal** - Modal to add supplement with nutrient entries
4. **Task 17: PlanItemCard + NutrientEditor** - Display/edit plan items
5. **Task 18: IntakeSummary** - Live calculation display with status colors
6. **Task 19: PlanActions** - Save to DB / Activate buttons

Each component should:
- Follow existing patterns in `components/protected/`
- Use Tailwind with existing color tokens
- Include loading/error states
- Use React Query hooks for server state

---

### Task 20: Integration & Polish

**Files:**
- Modify: `app/(protected)/layout.tsx` - Add planner to navigation
- Create: `lib/queries/planner.ts` - React Query query functions
- Create: `lib/mutations/planner.ts` - React Query mutation functions
- Create: `lib/keys/planner-keys.ts` - Query key factory

**Step 1: Add query keys**

```typescript
// lib/keys/planner-keys.ts
export const plannerKeys = {
  all: ['planner'] as const,
  nutrients: () => [...plannerKeys.all, 'nutrients'] as const,
  limits: () => [...plannerKeys.all, 'limits'] as const,
  plans: () => [...plannerKeys.all, 'plans'] as const,
  plan: (id: string) => [...plannerKeys.all, 'plan', id] as const,
  activeIntake: () => [...plannerKeys.all, 'active-intake'] as const,
};
```

**Step 2: Add to navigation**

Add link to `/supplements/planner` in the protected layout navigation.

**Step 3: Final integration testing**

- Test full flow: create draft → add items → see warnings → save → activate
- Verify localStorage persistence
- Verify DB operations
- Test calculation accuracy

**Step 4: Commit**

```bash
git add lib/keys/planner-keys.ts lib/queries/planner.ts lib/mutations/planner.ts app/(protected)/layout.tsx
git commit -m "feat: complete planner integration"
```

---

## Summary

| Track | Tasks | Can Parallelize |
|-------|-------|-----------------|
| A: Database | 1, 3 | Yes (with Track B) |
| B: Testing | 2 | Yes (with Track A) |
| Core Logic | 4, 5, 6, 7 | Sequential (dependencies) |
| C: API Routes | 8, 9, 10, 11, 12 | Yes (all parallel) |
| UI Components | 13-19 | Sequential (dependencies) |
| Integration | 20 | After all above |

**Estimated task count:** 20 tasks
**Parallel opportunities:** 2 major (DB+Testing, API routes)

---

Plan complete and saved to `docs/plans/2026-02-20-supplement-planner-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
