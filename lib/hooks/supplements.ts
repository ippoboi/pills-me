import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupplement,
  editSupplement,
  softDeleteSupplement,
  refillSupplement,
} from "../mutations/supplements";
import { getSupplementById, getTodaySupplements } from "../queries/supplements";
import { getSupplementsList } from "../queries/supplements";
import { getUserTimezone } from "../utils/timezone";
import { supplementsKeys } from "../keys/keys";
import type {
  CreateSupplementResponse,
  EditSupplementResponse,
  SoftDeleteSupplementResponse,
  RefillSupplementResponse,
  TodaySupplementsResponse,
  SupplementInput,
  SupplementResponse,
} from "../types";
import type { SupplementStatus, SupplementsListResponse } from "../types";

/**
 * React Query hooks for supplement operations
 */

// Create Supplement Mutation Hook
export function useCreateSupplement() {
  const queryClient = useQueryClient();

  return useMutation<CreateSupplementResponse, Error, SupplementInput>({
    mutationFn: createSupplement,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for today's supplements
      await queryClient.cancelQueries({ queryKey: supplementsKeys.today() });

      // Return context for potential rollback
      return { variables };
    },
    onSuccess: async () => {
      // Invalidate all today queries (with and without date)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["supplements", "today"] }),
        queryClient.invalidateQueries({ queryKey: supplementsKeys.all() }),
      ]);

      // Force a refetch to ensure data is fresh
      await queryClient.refetchQueries({ queryKey: ["supplements", "today"] });
    },
    onError: (error) => {
      // Could implement rollback logic here if we had optimistic updates
      console.error("Failed to create supplement:", error);
    },
    onSettled: async () => {
      // Always refetch to ensure consistency
      await queryClient.invalidateQueries({
        queryKey: ["supplements", "today"],
      });
    },
  });
}

// Today's Supplements Query Hook
export function useTodaySupplements(date?: string, timezone?: string) {
  const userTimezone = timezone || getUserTimezone();

  return useQuery<TodaySupplementsResponse, Error>({
    queryKey: supplementsKeys.today(date, userTimezone),
    queryFn: () => getTodaySupplements(date, userTimezone),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

// Supplements List Query Hook (overview)
export function useSupplementsList(status?: SupplementStatus | null) {
  return useQuery<SupplementsListResponse, Error>({
    queryKey: ["supplements", "list", status || "all"],
    queryFn: () => getSupplementsList(status),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Supplement by ID Query Hook
export function useSupplementById(id: string, timezone?: string) {
  const userTimezone = timezone || getUserTimezone();

  return useQuery<SupplementResponse, Error>({
    queryKey: supplementsKeys.byId(id),
    queryFn: () => getSupplementById(id, userTimezone),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Edit Supplement Mutation Hook
export function useEditSupplement() {
  const queryClient = useQueryClient();

  return useMutation<
    EditSupplementResponse,
    Error,
    { supplementId: string; data: Partial<SupplementInput> }
  >({
    mutationFn: ({ supplementId, data }) => editSupplement(supplementId, data),
    onSuccess: async (data, variables) => {
      // Invalidate the specific supplement by ID
      await queryClient.invalidateQueries({
        queryKey: supplementsKeys.byId(variables.supplementId),
      });

      // Invalidate today's supplements since editing might affect schedules, times, etc.
      await queryClient.invalidateQueries({
        queryKey: ["supplements", "today"],
      });

      // Invalidate supplements list since status or other info might have changed
      await queryClient.invalidateQueries({
        queryKey: ["supplements", "list"],
      });
    },
    onError: (error) => {
      console.error("Failed to edit supplement:", error);
    },
  });
}

// Soft Delete Supplement Mutation Hook
export function useSoftDeleteSupplement() {
  const queryClient = useQueryClient();

  return useMutation<SoftDeleteSupplementResponse, Error, string>({
    mutationFn: (supplementId) => softDeleteSupplement(supplementId),
    onSuccess: async (data, supplementId) => {
      // Invalidate the specific supplement by ID
      await queryClient.invalidateQueries({
        queryKey: supplementsKeys.byId(supplementId),
      });

      // Invalidate today's supplements since deleted supplement should be removed
      await queryClient.invalidateQueries({
        queryKey: ["supplements", "today"],
      });

      // Invalidate supplements list to reflect deletion
      await queryClient.invalidateQueries({
        queryKey: ["supplements", "list"],
      });

      // Remove the specific supplement query from cache since it's deleted
      queryClient.removeQueries({
        queryKey: supplementsKeys.byId(supplementId),
      });
    },
    onError: (error) => {
      console.error("Failed to delete supplement:", error);
    },
  });
}

// Refill Supplement Mutation Hook
export function useRefillSupplement() {
  const queryClient = useQueryClient();

  return useMutation<
    RefillSupplementResponse,
    Error,
    { supplementId: string; amount: number }
  >({
    mutationFn: ({ supplementId, amount }) =>
      refillSupplement(supplementId, amount),
    onSuccess: async (data, variables) => {
      // Invalidate the specific supplement by ID since inventory_total changed
      await queryClient.invalidateQueries({
        queryKey: supplementsKeys.byId(variables.supplementId),
      });

      // Note: We don't invalidate today's supplements or list since refill
      // only affects inventory, not the supplement's visibility or schedule
    },
    onError: (error) => {
      console.error("Failed to refill supplement:", error);
    },
  });
}
