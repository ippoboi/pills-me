/**
 * Mutation functions for Supplement Planner
 *
 * Pure async functions for plan CRUD operations and activation.
 * These are consumed by React Query mutation hooks in lib/hooks/use-planner.ts
 */

import type {
  ApiError,
  CreatePlanInput,
  UpdatePlanInput,
  ActivatePlanInput,
  SupplementPlan,
  ActivatePlanResponse,
  CreatePlanItemInput,
  UpdatePlanItemInput,
  CreatePlanItemResponse,
  UpdatePlanItemResponse,
  DeletePlanItemResponse,
} from "../types";

// =============================================================================
// Response Types
// =============================================================================

export interface CreatePlanResponse {
  success: boolean;
  plan: SupplementPlan;
}

export interface UpdatePlanResponse {
  success: boolean;
  plan: SupplementPlan;
}

export interface DeletePlanResponse {
  success: boolean;
  message: string;
  plan: { id: string; name: string };
}

// =============================================================================
// Mutation Functions
// =============================================================================

/**
 * Create a new supplement plan
 */
export async function createPlan(
  data: CreatePlanInput
): Promise<CreatePlanResponse> {
  const response = await fetch("/api/planner/plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to create plan");
  }

  return response.json();
}

/**
 * Update an existing plan (name, notes, or status)
 */
export async function updatePlan(
  planId: string,
  data: UpdatePlanInput
): Promise<UpdatePlanResponse> {
  const response = await fetch(`/api/planner/plans/${planId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to update plan");
  }

  return response.json();
}

/**
 * Delete a supplement plan
 */
export async function deletePlan(planId: string): Promise<DeletePlanResponse> {
  const response = await fetch(`/api/planner/plans/${planId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to delete plan");
  }

  return response.json();
}

/**
 * Activate a draft plan
 * Converts plan_items to active supplements with schedules
 */
export async function activatePlan(
  planId: string,
  data: ActivatePlanInput
): Promise<ActivatePlanResponse> {
  const response = await fetch(`/api/planner/plans/${planId}/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to activate plan");
  }

  return response.json();
}

// =============================================================================
// Plan Item Mutations
// =============================================================================

/**
 * Add a plan item to a plan
 */
export async function addPlanItem(
  planId: string,
  data: CreatePlanItemInput
): Promise<CreatePlanItemResponse> {
  const response = await fetch(`/api/planner/plans/${planId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to add plan item");
  }

  return response.json();
}

/**
 * Update a plan item
 */
export async function updatePlanItem(
  planId: string,
  itemId: string,
  data: UpdatePlanItemInput
): Promise<UpdatePlanItemResponse> {
  const response = await fetch(`/api/planner/plans/${planId}/items/${itemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to update plan item");
  }

  return response.json();
}

/**
 * Delete a plan item
 */
export async function deletePlanItem(
  planId: string,
  itemId: string
): Promise<DeletePlanItemResponse> {
  const response = await fetch(`/api/planner/plans/${planId}/items/${itemId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to delete plan item");
  }

  return response.json();
}
