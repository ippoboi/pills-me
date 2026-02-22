/**
 * Planner Types
 *
 * Type definitions for the Supplement Intake Planner feature.
 * Includes database row types, localStorage draft structures,
 * and intake calculation types.
 */

import type { Database } from "@/lib/supabase/database.types";

// =============================================================================
// Database Row Types (extracted from Supabase schema)
// =============================================================================

/** Nutrient master record */
export type Nutrient = Database["public"]["Tables"]["nutrients"]["Row"];

/** Nutrient category (vitamins, minerals, etc.) */
export type NutrientCategory =
  Database["public"]["Tables"]["nutrient_categories"]["Row"];

/** Nutrient limit by age/sex (EFSA reference values) */
export type NutrientLimit =
  Database["public"]["Tables"]["nutrient_limits"]["Row"];

/** User's supplement plan */
export type SupplementPlan =
  Database["public"]["Tables"]["supplement_plans"]["Row"];

/** Plan item (supplement in a draft plan) */
export type PlanItem = Database["public"]["Tables"]["plan_items"]["Row"];

/** Plan status enum */
export type PlanStatus = Database["public"]["Enums"]["plan_status"];

/** User sex enum */
export type UserSex = Database["public"]["Enums"]["user_sex"];

// =============================================================================
// Nutrient Entry (JSONB structure in plan_items.nutrients)
// =============================================================================

/** Single nutrient entry in a plan item */
export interface NutrientEntry {
  /** UUID reference to nutrients table */
  nutrientId: string;
  /** Nutrient slug for display (e.g., 'vitamin-d') */
  nutrientSlug: string;
  /** Dosage amount per serving */
  amount: number;
  /** Unit (mcg, mg, g, IU, CFU, etc.) */
  unit: string;
}

// =============================================================================
// localStorage Draft Structures
// =============================================================================

/** Draft plan stored in localStorage */
export interface LocalDraftPlan {
  /** Unique ID (generated client-side) */
  id: string;
  /** Plan name */
  name: string;
  /** Optional notes */
  notes?: string;
  /** Items in the plan */
  items: LocalPlanItem[];
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when last updated */
  updatedAt: string;
}

/** Plan item in localStorage draft */
export interface LocalPlanItem {
  /** Unique ID (generated client-side) */
  id: string;
  /** Supplement name */
  name: string;
  /** Optional brand */
  brand?: string;
  /** Number of servings per day */
  servingsPerDay: number;
  /** Nutrients in this supplement */
  nutrients: NutrientEntry[];
}

// =============================================================================
// Intake Calculation Types
// =============================================================================

/** Status of a nutrient intake level */
export type IntakeStatus = "ok" | "warning" | "danger";

/** Result of intake calculation for a single nutrient */
export interface IntakeResult {
  /** Nutrient UUID */
  nutrientId: string;
  /** Display name */
  nutrientName: string;
  /** Slug for lookups */
  nutrientSlug: string;
  /** Category ID */
  category: string;
  /** Total daily intake */
  total: number;
  /** Unit */
  unit: string;
  /** Recommended Daily Allowance (null if not established) */
  rda: number | null;
  /** Upper Limit (null if not established) */
  upperLimit: number | null;
  /** Percentage of RDA (null if no RDA) */
  percentOfRda: number | null;
  /** Percentage of upper limit (null if no UL) */
  percentOfLimit: number | null;
  /** Status based on upper limit */
  status: IntakeStatus;
}

// =============================================================================
// API Response Types
// =============================================================================

/** Nutrient with its category joined */
export interface NutrientWithCategory extends Nutrient {
  category: NutrientCategory | null;
}

/** Nutrient limit with nutrient data joined */
export interface NutrientLimitWithNutrient extends NutrientLimit {
  nutrient: Nutrient;
}

/** Plan with its items joined */
export interface PlanWithItems extends SupplementPlan {
  items: PlanItem[];
}

// =============================================================================
// User Demographics
// =============================================================================

/** User demographics for limit lookup */
export interface UserDemographics {
  /** User's birthdate (ISO string or null if not set) */
  birthdate: string | null;
  /** User's sex */
  sex: UserSex;
}

/** EFSA age groups for nutrient limits */
export type AgeGroup = "18-50" | "51-70" | "71+";

/** Time of day type (alias for use in this module) */
type TimeOfDay = Database["public"]["Enums"]["time_of_day"];

// =============================================================================
// API Request Types
// =============================================================================

/** Input for creating a new plan */
export interface CreatePlanInput {
  name: string;
  notes?: string;
}

/** Input for updating a plan */
export interface UpdatePlanInput {
  name?: string;
  notes?: string;
  status?: PlanStatus;
}

/** Input for activating a plan */
export interface ActivatePlanInput {
  schedules: TimeOfDay[];
  timezone: string;
}

/** Input for creating a plan item (supplement in a plan) */
export interface CreatePlanItemInput {
  name: string;
  brand?: string;
  servingsPerDay: number;
  nutrients: NutrientEntry[];
}

/** Input for updating a plan item */
export interface UpdatePlanItemInput {
  name?: string;
  brand?: string;
  servingsPerDay?: number;
  nutrients?: NutrientEntry[];
}

// =============================================================================
// API Response Types
// =============================================================================

/** Response for GET /api/planner/nutrients */
export interface NutrientsResponse {
  nutrients: NutrientWithCategory[];
}

/** Response for GET /api/planner/limits */
export interface LimitsResponse {
  limits: NutrientLimitWithNutrient[];
  demographics: {
    ageGroup: AgeGroup;
    sex: UserSex;
  };
}

/** Response for GET /api/planner/plans */
export interface PlansListResponse {
  plans: SupplementPlan[];
}

/** Response for GET /api/planner/plans/[id] */
export interface PlanResponse {
  plan: PlanWithItems;
}

/** Response for POST /api/planner/plans/[id]/activate */
export interface ActivatePlanResponse {
  success: true;
  plan: SupplementPlan;
  supplements: { id: string; name: string }[];
  schedulesCreated: number;
}

/** Active supplement with nutrient data */
export interface ActiveSupplementWithNutrients {
  id: string;
  name: string;
  brand: string | null;
  nutrients: NutrientEntry[];
  servingsPerDay: number;
  planId: string;
}

/** Response for GET /api/planner/active-intake */
export interface ActiveIntakeResponse {
  supplements: ActiveSupplementWithNutrients[];
  intakeResults?: IntakeResult[];
  demographics?: {
    ageGroup: AgeGroup;
    sex: UserSex;
  };
}

/** Response for POST /api/planner/plans/[id]/items */
export interface CreatePlanItemResponse {
  success: true;
  item: PlanItem;
}

/** Response for PUT /api/planner/plans/[id]/items/[itemId] */
export interface UpdatePlanItemResponse {
  success: true;
  item: PlanItem;
}

/** Response for DELETE /api/planner/plans/[id]/items/[itemId] */
export interface DeletePlanItemResponse {
  success: true;
  message: string;
}
