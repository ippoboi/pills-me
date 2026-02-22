# Supplement Planner Implementation - Progress Tracker

**Branch:** `feature/supplement-planner`
**Started:** 2026-02-20
**Last Updated:** 2026-02-22 (night)

---

## Completed Tasks

### Task 1: Drop Biomarker Tables

- **Status:** DONE
- **Commit:** `603d8d2`
- **Files:** `supabase/migrations/20260220_drop_biomarker_tables.sql`
- **Notes:** Applied via Supabase dashboard

### Task 2: Setup Vitest

- **Status:** DONE
- **Commit:** `0b2a3a9`
- **Files:**
  - `vitest.config.ts` - Vitest 4.0.18 with jsdom, React plugin, path aliases
  - `lib/__tests__/setup.ts` - Test setup with jest-dom
  - `package.json` - Added test scripts: `test`, `test:run`, `test:coverage`
- **Dependencies Added:**
  - `vitest@4.0.18`
  - `@testing-library/react@16.3.2`
  - `@testing-library/jest-dom@6.9.1`
  - `@vitejs/plugin-react@5.1.4`
  - `jsdom@28.1.0`

### Task 3: Create Planner Schema

- **Status:** DONE
- **Commit:** `fa81cd9`
- **Files:** `supabase/migrations/20260220_create_planner_schema.sql`
- **Tables Created:**
  - `nutrient_categories` - Categories for nutrients (vitamins, minerals, etc.)
  - `nutrients` - Master nutrient table with units and conversions
  - `nutrient_limits` - EFSA reference values by age/sex
  - `supplement_categories` - Categories for supplements (sleep, energy, etc.)
  - `supplement_plans` - User plans with status lifecycle
  - `plan_items` - Supplements within a plan (before activation)
- **Columns Added:**
  - `supplements.plan_id` - Link to plan
  - `supplements.brand` - Brand name
  - `supplements.category_id` - Supplement category
  - `user_information.birthdate` - For age-based limits
- **RLS Policies:** Applied via Supabase MCP
  - Reference tables (nutrients, limits, categories) - read-only for authenticated users
  - User tables (plans, plan_items) - full access for own records

### Database Types Regenerated

- **Status:** DONE
- **File:** `lib/supabase/database.types.ts`
- **New Types Include:**
  - `nutrient_categories`, `nutrients`, `nutrient_limits`
  - `supplement_categories`, `supplement_plans`, `plan_items`
  - `plan_status` enum: `draft | active | paused | archived`
  - `user_information.birthdate` field

### Task 4: Seed EFSA Nutrient Data + Clinical Research

- **Status:** DONE
- **Applied via:** Supabase MCP
- **Files Created:**
  - `lib/data/nutrients.ts` - 42 nutrients across 5 categories with unit conversions
  - `lib/data/nutrient-limits.ts` - 137 limit records (EFSA/IOM + researched safe levels)
  - `supabase/seed/seed-nutrients.sql` - SQL seed for nutrients table
  - `supabase/seed/seed-nutrient-limits.sql` - SQL seed for all limits
  - `supabase/migrations/20260221_add_safe_level_to_nutrient_limits.sql` - Added `safe_level` and `ul_context` columns
- **Database Records:**
  - `nutrient_categories`: 5 (vitamins, minerals, fatty-acids, amino-acids, other)
  - `supplement_categories`: 10 (general, sleep, energy, immune, etc.)
  - `nutrients`: 42 nutrients with units and conversions
  - `nutrient_limits`: 137 records (50 with `safe_level` for non-essential nutrients)
- **Research Completed for Nutrients Without Official DRVs:**
  - Omega-3 EPA/DHA/ALA (individual fatty acids)
  - L-Theanine, L-Tyrosine, L-Glutamine, Taurine, Glycine (amino acids)
  - Melatonin, CoQ10, Ashwagandha, Collagen, Probiotics, Creatine (other)
- **New ULSource Type:** Added `'TYPICAL_RANGE'` for clinical study-based limits
- **Sources:** EFSA DRVs, IOM DRIs, NIH ODS, PubMed, Examine.com, clinical trials

### Task 5: Type Definitions

- **Status:** DONE
- **Files Created:**
  - `lib/types/planner.ts` - 154 lines of planner-specific types
  - `lib/types/index.ts` - Added export for planner types
- **Types Defined:**
  - Database row types: `Nutrient`, `NutrientCategory`, `NutrientLimit`, `SupplementPlan`, `PlanItem`, `PlanStatus`, `UserSex`
  - Nutrient entry: `NutrientEntry` - single nutrient in a plan item
  - localStorage drafts: `LocalDraftPlan`, `LocalPlanItem`
  - Intake calculations: `IntakeStatus`, `IntakeResult`
  - API responses: `NutrientWithCategory`, `NutrientLimitWithNutrient`, `PlanWithItems`
  - User demographics: `UserDemographics`, `AgeGroup`

### Task 6: Calculation Utils (TDD)

- **Status:** DONE
- **Files Created:**
  - `lib/utils/planner.ts` - 182 lines with 4 utility functions
  - `__tests__/planner.test.ts` - 38 tests
- **Functions Implemented:**
  - `calculateAge(birthdate, today?)` - Calculate age from birthdate
  - `getAgeGroup(birthdate, today?)` - Map to EFSA age groups ('18-50', '51-70', '71+')
  - `getIntakeStatus(total, upperLimit)` - Determine status ('ok', 'warning', 'danger')
  - `calculateIntake(draftItems, activeSupplements, limits, nutrients)` - Full intake calculation with RDA/UL percentages

### Task 7: localStorage Hooks (TDD)

- **Status:** DONE
- **Files Created:**
  - `lib/hooks/use-draft-plans.ts` - localStorage draft management hook
  - `__tests__/use-draft-plans.test.ts` - 27 tests
- **Hook API:**
  - `drafts` - Array of draft plans
  - `createDraft(name, notes?)` - Create new draft, returns ID
  - `updateDraft(id, updates)` - Update name/notes
  - `deleteDraft(id)` - Remove draft
  - `addItem(draftId, item)` - Add supplement to draft
  - `updateItem(draftId, itemId, updates)` - Update supplement
  - `removeItem(draftId, itemId)` - Remove supplement
  - `getDraft(id)` - Get draft by ID
- **Features:** Auto-persistence to localStorage, graceful error handling, SSR-safe

### Task 7.1: Test Consolidation

- **Status:** DONE
- **Change:** Moved all tests to root `__tests__/` folder
- **Files:**
  - `__tests__/setup.ts` - jest-dom matchers
  - `__tests__/planner.test.ts` - 38 planner util tests
  - `__tests__/use-draft-plans.test.ts` - 27 hook tests
- **Config Update:** `vitest.config.ts` - Added `dir: './__tests__'` (Vitest recommended)
- **Deleted:** `lib/__tests__/`, `lib/utils/__tests__/`, `lib/hooks/__tests__/`
- **Result:** 86 tests passing (65 original + 21 validation tests)

### Task 8: GET /api/planner/nutrients

- **Status:** DONE
- **Files Created:**
  - `app/api/planner/nutrients/route.ts`
- **Endpoint:** Returns all nutrients with category data joined
- **Response:** `{ nutrients: NutrientWithCategory[] }`

### Task 9: GET /api/planner/limits

- **Status:** DONE
- **Files Created:**
  - `app/api/planner/limits/route.ts`
- **Endpoint:** Returns nutrient limits based on user's age/sex demographics
- **Features:**
  - Auto-determines age group using `getAgeGroup(birthdate)`
  - Returns limits matching user's sex OR 'all'
  - Returns 400 if birthdate/sex not set
- **Response:** `{ limits: NutrientLimitWithNutrient[], demographics: { ageGroup, sex } }`

### Task 10: CRUD /api/planner/plans

- **Status:** DONE
- **Files Created:**
  - `app/api/planner/plans/route.ts` - GET (list with ?status filter), POST (create)
  - `app/api/planner/plans/[id]/route.ts` - GET (with items), PUT (with status validation), DELETE
- **Validation:** `lib/utils/planner-validation.ts` with 21 tests
- **Business Rules:**
  - Cannot update archived plans
  - Cannot change status from active → draft

### Task 11: POST /api/planner/plans/[id]/activate

- **Status:** DONE
- **Files Created:**
  - `app/api/planner/plans/[id]/activate/route.ts`
- **Endpoint:** Converts draft plan items to active supplements
- **Logic:**
  - Validates plan is draft with items
  - Creates supplements from plan_items with plan_id link
  - Creates schedules for each supplement
  - Updates plan status to 'active' with start_date
  - Rollback on schedule creation failure
- **Response:** `{ success, plan, supplements, schedulesCreated }`

### Task 12: GET /api/planner/active-intake

- **Status:** DONE
- **Files Created:**
  - `app/api/planner/active-intake/route.ts`
- **Endpoint:** Returns active supplements with nutrient data
- **Features:**
  - Optional `?include_calculation=true` for intake calculation
  - Fetches nutrients from plan_items via plan_id
  - Uses `calculateIntake()` for RDA/UL percentages
- **Response:** `{ supplements, intakeResults?, demographics? }`

### Shared Infrastructure

- **Status:** DONE
- **Files Created:**
  - `lib/utils/planner-validation.ts` - Validation utilities (isValidUUID, validateCreatePlanInput, validateUpdatePlanInput, validateActivatePlanInput)
  - `__tests__/planner-validation.test.ts` - 21 tests
- **Files Extended:**
  - `lib/types/planner.ts` - Added API request/response types (CreatePlanInput, UpdatePlanInput, ActivatePlanInput, NutrientsResponse, LimitsResponse, PlansListResponse, PlanResponse, ActivatePlanResponse, ActiveIntakeResponse, ActiveSupplementWithNutrients)

---

## Next Tasks

_All planned API routes complete. Next phase: React Query hooks and UI components._

---

## Commits Log

| Commit    | Message                                                  | Tasks          |
| --------- | -------------------------------------------------------- | -------------- |
| `7571a11` | chore: update dependencies and refactor test setup       | Task 5,6,7,7.1 |
| `caf74ae` | feat: seed EFSA nutrient data and update database schema | Task 4         |
| `fa81cd9` | feat: add planner schema (nutrients, limits, plans)      | Task 3         |
| `0b2a3a9` | chore: setup vitest for testing                          | Task 2         |
| `603d8d2` | chore: drop biomarker tables for planner feature         | Task 1         |

---

## Notes

- Migrations applied via Supabase dashboard due to naming convention mismatch with existing migrations
- RLS policies added via `mcp__supabase__apply_migration` after initial schema creation
- Vitest configured with Context7 latest docs (v4.0.18)
- Task 4 nutrient data seeded directly via Supabase MCP (no git commit yet)
- Researched safe levels for 14 nutrients without official EFSA/IOM limits using clinical studies
- All tests consolidated to root `__tests__/` folder using Vitest `test.dir` option
- Tasks 5-7 complete: types, utils, and hooks ready for API implementation
- Tasks 8-12 are API routes that can be developed in parallel
