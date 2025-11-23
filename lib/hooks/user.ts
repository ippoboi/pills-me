import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "../queries";
import { userKeys } from "../queries";
import type { CurrentUser } from "../types";
import { deleteAccount, type DeleteAccountResponse } from "../mutations/users";

export function useCurrentUser() {
  return useQuery<CurrentUser, Error>({
    queryKey: userKeys.current,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: (failureCount, error) => {
      if (error.message === "Unauthorized") {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });
}

// Delete Account Mutation Hook
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<DeleteAccountResponse, Error, void>({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      // Invalidate all user-related queries
      await queryClient.invalidateQueries({
        queryKey: userKeys.current,
      });

      // Clear all queries to remove cached data
      queryClient.clear();
    },
    onError: (error) => {
      console.error("Failed to delete account:", error);
    },
  });
}
