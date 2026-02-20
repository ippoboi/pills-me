# Supplement Intake Planner - Design Document

**Date:** 2026-02-20
**Status:** Approved
**Phases:** Manual Entry → History → AI-Assisted

---

## Overview

A planning tool that helps users plan their supplement intake BEFORE buying to avoid nutrient overdose by calculating cumulative daily intake across multiple supplements against safe limits.

### Goals

- Prevent accidental nutrient overdose by showing combined daily intake vs. upper limits
- Organize supplements into thematic plans ("Daily Essentials", "Winter Stack", "Joint Health")
- Support multiple active plans simultaneously
- Provide live feedback as users build their plans

---

## Architecture Decisions

| Decision         | Choice                          | Rationale                                     |
| ---------------- | ------------------------------- | --------------------------------------------- |
| Data approach    | Normalized relational           | Clean model, extensible for History/AI phases |
| Nutrient source  | Static EFSA table               | No external dependencies, EU-focused          |
| Plan persistence | localStorage + explicit DB save | No clutter from abandoned drafts              |
| Plan activation  | Bulk create, edit after         | Less friction to start                        |
| Location         | `/supplements/planner`          | Logical grouping under Supplements            |
| Demographics     | Birthdate in profile            | One-time setup, accurate age-based thresholds |

---

## Database Schema

### Tables to DROP (Biomarker Cleanup)

```sql
DROP TABLE IF EXISTS raw_unmatched_data;
DROP TABLE IF EXISTS user_biomarkers;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS biomarker_synonyms;
DROP TABLE IF EXISTS biomarkers_information;
DROP TABLE IF EXISTS biomarker_categories;

DROP TYPE IF EXISTS report_status;
DROP TYPE IF EXISTS unmatched_processing_status;
DROP TYPE IF EXISTS unmatched_resolution_action;
```

### New Tables

#### `nutrient_categories`

```sql
CREATE TABLE nutrient_categories (
  id          TEXT PRIMARY KEY,        -- "vitamins", "minerals", "fatty-acids"
  label       TEXT NOT NULL,           -- "Vitamins", "Minerals", "Fatty Acids"
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0
);
```

#### `nutrients`

```sql
CREATE TABLE nutrients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,           -- "Vitamin D", "Magnesium"
  slug               TEXT UNIQUE NOT NULL,    -- "vitamin-d", "magnesium"
  category_id        TEXT REFERENCES nutrient_categories(id),
  default_unit       TEXT NOT NULL,           -- "IU", "mg", "mcg"
  alternate_unit     TEXT,                    -- "mcg" for Vitamin D
  conversion_factor  DECIMAL,                 -- 40 (mcg → IU for Vitamin D)
  description        TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);
```

#### `nutrient_limits`

```sql
CREATE TABLE nutrient_limits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrient_id  UUID NOT NULL REFERENCES nutrients(id) ON DELETE CASCADE,
  age_group    TEXT NOT NULL,            -- "19-50", "51-70", "71+"
  sex          TEXT NOT NULL,            -- "male", "female", "all"
  rda          DECIMAL,                  -- Recommended Daily Allowance (PRI/AI in EFSA)
  upper_limit  DECIMAL,                  -- Maximum safe daily intake (NULL = no established limit)
  unit         TEXT NOT NULL,
  source       TEXT DEFAULT 'EFSA',      -- "EFSA", "NIH"

  UNIQUE(nutrient_id, age_group, sex, source)
);
```

#### `supplement_categories`

```sql
CREATE TABLE supplement_categories (
  id          TEXT PRIMARY KEY,        -- "sleep", "energy", "immune"
  label       TEXT NOT NULL,           -- "Sleep Support", "Energy", "Immune Health"
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0
);
```

#### `supplement_plans`

```sql
CREATE TABLE supplement_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,             -- "Daily Essentials", "Winter Stack"
  is_default  BOOLEAN DEFAULT false,     -- true for auto-created default plan
  status      TEXT DEFAULT 'draft',      -- "draft", "active", "paused", "archived"
  start_date  DATE,                      -- set when status changes to 'active'
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE supplement_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plans" ON supplement_plans
  FOR ALL USING (auth.uid() = user_id);
```

#### `plan_items`

```sql
CREATE TABLE plan_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID NOT NULL REFERENCES supplement_plans(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,           -- "NOW Foods Vitamin D3 5000IU"
  brand            TEXT,
  servings_per_day DECIMAL DEFAULT 1,
  nutrients        JSONB NOT NULL,          -- [{nutrient_id, amount, unit}]
  source_type      TEXT DEFAULT 'manual',   -- "manual", "history", "ai"
  image_url        TEXT,                    -- product image (Phase 3, for display only)
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS via plan ownership
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items in own plans" ON plan_items
  FOR ALL USING (
    plan_id IN (SELECT id FROM supplement_plans WHERE user_id = auth.uid())
  );
```

### Schema Modifications

#### `supplements` - Add plan reference, brand, category

```sql
ALTER TABLE supplements
ADD COLUMN plan_id UUID REFERENCES supplement_plans(id) ON DELETE SET NULL,
ADD COLUMN brand TEXT,
ADD COLUMN category_id TEXT REFERENCES supplement_categories(id);
```

#### `user_information` - Add birthdate

```sql
ALTER TABLE user_information
ADD COLUMN birthdate DATE;
```

### New Enums

```sql
CREATE TYPE plan_status AS ENUM ('draft', 'active', 'paused', 'archived');
```

---

## Data Model

### Plans Model

- Every user gets a **"Daily Essentials"** default plan (auto-created on first use)
- Plans are organizational groupings, not date containers
- Multiple plans can be **active simultaneously**
- Supplements track their own lifecycle (start_date, end_date, inventory)

**Plan lifecycle:**

```
draft → active → paused ↔ active → archived
         ↑
    (user buys)                    (done with plan)
```

### Intake Calculation

Active intake = all supplements where:

- `supplement.status = 'ACTIVE'`
- `supplement.plan.status = 'active'`
- `supplement.deleted_at IS NULL`

---

## Component Architecture

### Page Structure

```
/supplements/planner
├── PlannerPage
│   ├── PlanSelector
│   ├── PlanWorkspace
│   │   ├── PlanHeader
│   │   ├── PlanItemsList
│   │   │   ├── PlanItemCard
│   │   │   │   └── NutrientEditor
│   │   │   └── AddItemButton → AddItemModal
│   │   └── IntakeSummary
│   │       ├── NutrientRow
│   │       └── WarningBadges
│   └── PlanActions
│       ├── SaveDraftButton
│       ├── ActivatePlanButton
│       └── DeleteDraftButton
```

### Status Colors

| Status  | Semantic            | Tailwind Classes                        |
| ------- | ------------------- | --------------------------------------- |
| OK      | Within safe limits  | `text-green-600`, `bg-green-50`         |
| Warning | >80% of upper limit | `text-amber-600`, `bg-amber-50`         |
| Danger  | Over upper limit    | `text-destructive`, `bg-destructive/10` |

---

## State Management

### localStorage Structure

```typescript
interface LocalDraftPlan {
  id: string;
  name: string;
  notes?: string;
  items: LocalPlanItem[];
  createdAt: string;
  updatedAt: string;
}

interface LocalPlanItem {
  id: string;
  name: string;
  brand?: string;
  servingsPerDay: number;
  nutrients: NutrientEntry[];
}

interface NutrientEntry {
  nutrientId: string;
  amount: number;
  unit: string;
}
```

### React Query Keys

```typescript
export const plannerKeys = {
  all: ["planner"] as const,
  nutrients: () => [...plannerKeys.all, "nutrients"] as const,
  nutrientLimits: (ageGroup: string, sex: string) =>
    [...plannerKeys.all, "limits", ageGroup, sex] as const,
  savedPlans: () => [...plannerKeys.all, "saved"] as const,
  plan: (id: string) => [...plannerKeys.all, "plan", id] as const,
  activeIntake: () => [...plannerKeys.all, "active-intake"] as const,
};
```

### Custom Hooks

```typescript
useDraftPlans(); // localStorage CRUD
useNutrients(); // fetch nutrients (cached)
useNutrientLimits(user); // limits by age/sex
useActiveIntake(); // sum of active supplements
useIntakeCalculation(draft, active, limits); // live calculation
useSaveDraftPlan(); // mutation: save to DB
useActivatePlan(); // mutation: create supplements
```

---

## API Routes

| Method | Route                              | Purpose                                     |
| ------ | ---------------------------------- | ------------------------------------------- |
| GET    | `/api/planner/nutrients`           | List all nutrients                          |
| GET    | `/api/planner/limits`              | Get limits for user's age/sex               |
| GET    | `/api/planner/plans`               | List user's saved plans                     |
| POST   | `/api/planner/plans`               | Save a draft plan                           |
| PUT    | `/api/planner/plans/[id]`          | Update plan                                 |
| DELETE | `/api/planner/plans/[id]`          | Delete plan                                 |
| POST   | `/api/planner/plans/[id]/activate` | Activate → create supplements               |
| GET    | `/api/planner/active-intake`       | Get nutrient totals from active supplements |

### Activate Plan Flow

1. Fetch plan + items
2. Validate no overdose (optional safety check)
3. Ensure user has default plan if needed
4. Bulk insert into `supplements` table with `plan_id`
5. Update plan status to `active`, set `start_date`
6. Delete `plan_items` (converted to supplements)
7. Return created supplements

---

## Calculation Logic

### Core Function

```typescript
interface IntakeResult {
  nutrientId: string;
  nutrientName: string;
  category: string;
  total: number;
  unit: string;
  rda: number | null;
  upperLimit: number | null;
  percentOfLimit: number | null;
  status: "ok" | "warning" | "danger";
}

function calculateIntake(
  draftItems: LocalPlanItem[],
  activeSupplements: SupplementWithNutrients[],
  limits: NutrientLimit[]
): IntakeResult[];
```

### Age Group Calculation

```typescript
function getAgeGroup(birthdate: Date): string {
  const age = calculateAge(birthdate);

  if (age < 14) return "9-13";
  if (age < 19) return "14-18";
  if (age < 51) return "19-50";
  if (age < 71) return "51-70";
  return "71+";
}
```

### Status Thresholds

- `danger`: total > upperLimit
- `warning`: total > upperLimit × 0.8
- `ok`: everything else

---

## Phased Implementation

### Phase 1: Manual Entry (MVP)

**Scope:**

- Drop biomarker tables
- Add birthdate to user profile
- Seed nutrient reference tables (EFSA data)
- Planner page with manual item entry
- Live intake calculation + warnings
- localStorage drafts
- Save/activate plan flow
- Bulk create supplements

**Not included:** History search, AI, product database

---

### Phase 2: From History

**Scope:**

- "Add from history" shows user's previous supplements
- Pull name + brand from history
- User still enters nutrients manually
- Optional: remember nutrients for re-used supplements

**Enables:** Faster entry for returning users

---

### Phase 3: AI-Assisted

**Scope:**

- Groq integration for intent understanding
- Perplexity Sonar API for web search
- Search user's **preferred brands first** (from history)
- Extract: product name, nutrients, image URL
- Display product images during planning
- Cost controls (rate limiting, caching)

**Flow:**

```
User: "I need something for sleep"
        ↓
Groq: Intent → "Magnesium, L-Theanine, Melatonin"
        ↓
Check history: User's preferred brands (NOW Foods, Thorne)
        ↓
Perplexity Sonar: Search preferred brands first
        ↓
Extract: Product name, nutrients, image URL
        ↓
Display: Product cards with images
        ↓
User: Adds to plan
```

**Priority order for suggestions:**

1. Exact match from history (same supplement used before)
2. Same brand, different product (trusted brand)
3. Web search for new options (only if needed)

**Note:** `image_url` is for planning display only - not stored in `supplements` table after activation.

---

## Nutrient Reference Data

### Source

EFSA (European Food Safety Authority) Dietary Reference Values

### Seed Data Structure

~30-40 common supplement nutrients with limits by age group and sex.

Example:

```typescript
const nutrients = [
  {
    name: "Vitamin D",
    slug: "vitamin-d",
    category: "vitamins",
    unit: "mcg",
    alternate_unit: "IU",
    conversion: 0.025,
  },
  { name: "Magnesium", slug: "magnesium", category: "minerals", unit: "mg" },
  { name: "Zinc", slug: "zinc", category: "minerals", unit: "mg" },
  // ...
];

const limits = [
  {
    nutrient: "vitamin-d",
    age_group: "19-50",
    sex: "all",
    rda: 15,
    upper_limit: 100,
    unit: "mcg",
    source: "EFSA",
  },
  // ...
];
```

---

## Open Items for Implementation

1. Compile full EFSA nutrient reference data
2. Design onboarding flow for birthdate collection
3. Default plan naming UX (auto "Daily Essentials" vs user names it)
4. Unit conversion UI (let user pick preferred unit?)
5. Add success/warning CSS tokens to globals.css (green/amber)
