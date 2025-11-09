import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupplement,
  getTodaySupplements,
  type CreateSupplementResponse,
  type TodaySupplementsResponse,
} from "@/lib/api/supplements";
import { SupplementInput } from "@/lib/supplements";

// Query Keys
export const supplementsKeys = {
  all: ["supplements"] as const,
  today: (date?: string) => ["supplements", "today", date] as const,
};

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
    onSuccess: async (data, variables, context) => {
      // Invalidate all today queries (with and without date)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["supplements", "today"] }),
        queryClient.invalidateQueries({ queryKey: supplementsKeys.all }),
      ]);

      // Force a refetch to ensure data is fresh
      await queryClient.refetchQueries({ queryKey: ["supplements", "today"] });
    },
    onError: (error, variables, context) => {
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
export function useTodaySupplements(date?: string) {
  return useQuery<TodaySupplementsResponse, Error>({
    queryKey: supplementsKeys.today(date),
    queryFn: () => getTodaySupplements(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
