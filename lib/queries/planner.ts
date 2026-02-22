/**
 * Query functions for Supplement Planner
 *
 * Pure async functions for fetching planner data from API endpoints.
 * These are consumed by React Query hooks in lib/hooks/use-planner.ts
 */

import type {
  ApiError,
  NutrientsResponse,
  LimitsResponse,
  PlansListResponse,
  PlanResponse,
  ActiveIntakeResponse,
  PlanStatus,
} from "../types";

/**
 * Fetch all nutrients with their categories
 * Used for nutrient selection in plan items
 */
export async function getNutrients(): Promise<NutrientsResponse> {
  const url = new URL("/api/planner/nutrients", window.location.origin);
  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch nutrients");
  }

  return response.json();
}

/**
 * Fetch nutrient limits based on user demographics
 * Returns limits for user's age group and sex
 */
export async function getLimits(): Promise<LimitsResponse> {
  const url = new URL("/api/planner/limits", window.location.origin);
  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch nutrient limits");
  }

  return response.json();
}

/**
 * Fetch user's supplement plans
 * Optionally filter by status (draft, active, paused, archived)
 */
export async function getPlans(status?: PlanStatus): Promise<PlansListResponse> {
  const url = new URL("/api/planner/plans", window.location.origin);
  if (status) {
    url.searchParams.set("status", status);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch plans");
  }

  return response.json();
}

/**
 * Fetch a single plan by ID with its items
 */
export async function getPlanById(id: string): Promise<PlanResponse> {
  const url = new URL(`/api/planner/plans/${id}`, window.location.origin);
  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch plan");
  }

  return response.json();
}

/**
 * Fetch active supplements with optional intake calculation
 * When includeCalculation is true, returns intake results with RDA/UL percentages
 */
export async function getActiveIntake(
  includeCalculation: boolean = false
): Promise<ActiveIntakeResponse> {
  const url = new URL("/api/planner/active-intake", window.location.origin);
  if (includeCalculation) {
    url.searchParams.set("include_calculation", "true");
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch active intake");
  }

  return response.json();
}
