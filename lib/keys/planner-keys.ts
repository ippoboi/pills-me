/**
 * Query Keys for Planner
 *
 * Centralized query key management for the Supplement Planner feature.
 * Follows the hierarchical factory pattern for consistent caching.
 */

import type { PlanStatus } from "@/lib/types/planner";

export const plannerKeys = {
  /** Root key for all planner queries */
  all: () => ["planner"] as const,

  /** Nutrients reference data (rarely changes) */
  nutrients: () => ["planner", "nutrients"] as const,

  /** Nutrient limits based on user demographics */
  limits: () => ["planner", "limits"] as const,

  /** Plan-related queries */
  plans: {
    /** Root key for all plan queries */
    all: () => ["planner", "plans"] as const,
    /** List of plans with optional status filter */
    list: (status?: PlanStatus) =>
      ["planner", "plans", "list", status] as const,
    /** Single plan by ID */
    byId: (id: string) => ["planner", "plans", "detail", id] as const,
    /** Plan items for a specific plan */
    items: (planId: string) =>
      ["planner", "plans", "detail", planId, "items"] as const,
  },

  /** Active intake calculations */
  activeIntake: (includeCalculation?: boolean) =>
    ["planner", "active-intake", includeCalculation] as const,
} as const;
