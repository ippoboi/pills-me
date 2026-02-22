"use client";

/**
 * React Query Hooks for Supplement Planner
 *
 * Provides hooks for fetching and mutating planner data with
 * proper cache invalidation strategies.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plannerKeys } from "../keys/planner-keys";
import { supplementsKeys } from "../keys/keys";
import {
  getNutrients,
  getLimits,
  getPlans,
  getPlanById,
  getActiveIntake,
} from "../queries/planner";
import {
  createPlan,
  updatePlan,
  deletePlan,
  activatePlan,
  addPlanItem,
  updatePlanItem,
  deletePlanItem,
  CreatePlanResponse,
  UpdatePlanResponse,
  DeletePlanResponse,
} from "../mutations/planner";
import type {
  NutrientsResponse,
  LimitsResponse,
  PlansListResponse,
  PlanResponse,
  ActiveIntakeResponse,
  CreatePlanInput,
  UpdatePlanInput,
  ActivatePlanInput,
  ActivatePlanResponse,
  PlanStatus,
  CreatePlanItemInput,
  UpdatePlanItemInput,
  CreatePlanItemResponse,
  UpdatePlanItemResponse,
  DeletePlanItemResponse,
} from "../types";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Fetch all nutrients with their categories
 * Reference data that rarely changes - 24h stale time
 */
export function useNutrients() {
  return useQuery<NutrientsResponse, Error>({
    queryKey: plannerKeys.nutrients(),
    queryFn: getNutrients,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - reference data rarely changes
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Fetch nutrient limits based on user demographics
 * Returns limits for user's age group and sex
 */
export function useLimits() {
  return useQuery<LimitsResponse, Error>({
    queryKey: plannerKeys.limits(),
    queryFn: getLimits,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 400 (missing demographics)
      if (
        error.message.includes("demographics") ||
        error.message.includes("birthdate") ||
        error.message.includes("sex")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Fetch user's supplement plans
 * Optionally filter by status
 */
export function usePlans(status?: PlanStatus) {
  return useQuery<PlansListResponse, Error>({
    queryKey: plannerKeys.plans.list(status),
    queryFn: () => getPlans(status),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch a single plan by ID with its items
 */
export function usePlanById(id: string, enabled: boolean = true) {
  return useQuery<PlanResponse, Error>({
    queryKey: plannerKeys.plans.byId(id),
    queryFn: () => getPlanById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!id,
  });
}

/**
 * Fetch active supplements with optional intake calculation
 * When includeCalculation is true, returns RDA/UL percentages
 */
export function useActiveIntake(includeCalculation: boolean = false) {
  return useQuery<ActiveIntakeResponse, Error>({
    queryKey: plannerKeys.activeIntake(includeCalculation),
    queryFn: () => getActiveIntake(includeCalculation),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Create a new supplement plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation<CreatePlanResponse, Error, CreatePlanInput>({
    mutationFn: createPlan,
    onSuccess: async () => {
      // Invalidate all plan lists
      await queryClient.invalidateQueries({
        queryKey: plannerKeys.plans.all(),
      });
    },
    onError: (error) => {
      console.error("Failed to create plan:", error);
    },
  });
}

/**
 * Update an existing plan (name, notes, or status)
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdatePlanResponse,
    Error,
    { planId: string; data: UpdatePlanInput }
  >({
    mutationFn: ({ planId, data }) => updatePlan(planId, data),
    onSuccess: async (_, variables) => {
      // Invalidate both the specific plan and all plan lists
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plannerKeys.plans.byId(variables.planId),
        }),
        queryClient.invalidateQueries({
          queryKey: plannerKeys.plans.all(),
        }),
      ]);
    },
    onError: (error) => {
      console.error("Failed to update plan:", error);
    },
  });
}

/**
 * Delete a supplement plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation<DeletePlanResponse, Error, string>({
    mutationFn: deletePlan,
    onSuccess: async (_, planId) => {
      // Invalidate all plan lists
      await queryClient.invalidateQueries({
        queryKey: plannerKeys.plans.all(),
      });

      // Remove the specific plan from cache
      queryClient.removeQueries({
        queryKey: plannerKeys.plans.byId(planId),
      });
    },
    onError: (error) => {
      console.error("Failed to delete plan:", error);
    },
  });
}

/**
 * Activate a draft plan
 * Creates supplements from plan items and sets up schedules
 */
export function useActivatePlan() {
  const queryClient = useQueryClient();

  return useMutation<
    ActivatePlanResponse,
    Error,
    { planId: string; data: ActivatePlanInput }
  >({
    mutationFn: ({ planId, data }) => activatePlan(planId, data),
    onSuccess: async (_, variables) => {
      // Invalidate planner queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plannerKeys.plans.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: plannerKeys.plans.byId(variables.planId),
        }),
        queryClient.invalidateQueries({
          queryKey: plannerKeys.activeIntake(),
        }),
        // Also invalidate supplements since new ones were created
        queryClient.invalidateQueries({
          queryKey: supplementsKeys.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["supplements", "today"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["supplements", "list"],
        }),
      ]);
    },
    onError: (error) => {
      console.error("Failed to activate plan:", error);
    },
  });
}

// =============================================================================
// PLAN ITEM MUTATION HOOKS
// =============================================================================

/**
 * Add a plan item to a plan
 */
export function useAddPlanItem() {
  const queryClient = useQueryClient();

  return useMutation<
    CreatePlanItemResponse,
    Error,
    { planId: string; data: CreatePlanItemInput }
  >({
    mutationFn: ({ planId, data }) => addPlanItem(planId, data),
    onSuccess: async (_, variables) => {
      // Invalidate the specific plan and active intake
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plannerKeys.plans.byId(variables.planId),
        }),
        queryClient.invalidateQueries({
          queryKey: plannerKeys.activeIntake(),
        }),
      ]);
    },
    onError: (error) => {
      console.error("Failed to add plan item:", error);
    },
  });
}

/**
 * Update a plan item
 */
export function useUpdatePlanItem() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdatePlanItemResponse,
    Error,
    { planId: string; itemId: string; data: UpdatePlanItemInput }
  >({
    mutationFn: ({ planId, itemId, data }) =>
      updatePlanItem(planId, itemId, data),
    onSuccess: async (_, variables) => {
      // Invalidate the specific plan and active intake
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plannerKeys.plans.byId(variables.planId),
        }),
        queryClient.invalidateQueries({
          queryKey: plannerKeys.activeIntake(),
        }),
      ]);
    },
    onError: (error) => {
      console.error("Failed to update plan item:", error);
    },
  });
}

/**
 * Delete a plan item
 */
export function useDeletePlanItem() {
  const queryClient = useQueryClient();

  return useMutation<
    DeletePlanItemResponse,
    Error,
    { planId: string; itemId: string }
  >({
    mutationFn: ({ planId, itemId }) => deletePlanItem(planId, itemId),
    onSuccess: async (_, variables) => {
      // Invalidate the specific plan and active intake
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plannerKeys.plans.byId(variables.planId),
        }),
        queryClient.invalidateQueries({
          queryKey: plannerKeys.activeIntake(),
        }),
      ]);
    },
    onError: (error) => {
      console.error("Failed to delete plan item:", error);
    },
  });
}
