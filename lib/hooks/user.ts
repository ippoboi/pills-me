import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "../queries";
import { userKeys } from "../queries";
import { plannerKeys } from "../keys/planner-keys";
import type { CurrentUser } from "../types";
import {
  deleteAccount,
  getUserInformation,
  updateUserInformation,
  type DeleteAccountResponse,
  type UserInformationInput,
  type UserInformationResponse,
  type UpdateUserInformationResponse,
} from "../mutations/users";

// =============================================================================
// Current User
// =============================================================================

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

// =============================================================================
// User Information (Demographics)
// =============================================================================

/**
 * Query hook for user demographics (birthdate, sex)
 */
export function useUserInformation() {
  return useQuery<UserInformationResponse, Error>({
    queryKey: [...userKeys.current, "information"],
    queryFn: getUserInformation,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation hook for updating user demographics
 * Invalidates user queries and planner limits (which depend on demographics)
 */
export function useUpdateUserInformation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateUserInformationResponse, Error, UserInformationInput>({
    mutationFn: updateUserInformation,
    onSuccess: async () => {
      // Invalidate user queries
      await queryClient.invalidateQueries({
        queryKey: userKeys.current,
      });

      // Invalidate planner limits and active intake (depend on demographics)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plannerKeys.limits(),
        }),
        queryClient.invalidateQueries({
          queryKey: plannerKeys.activeIntake(),
        }),
      ]);
    },
    onError: (error) => {
      console.error("Failed to update user information:", error);
    },
  });
}

// =============================================================================
// Delete Account
// =============================================================================

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
