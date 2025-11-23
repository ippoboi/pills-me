import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationPreferences,
  updateNotificationPreference,
  updateNotificationPreferences,
} from "@/app/actions/notification-preferences";
import type { NotificationPreferences } from "@/lib/types/user";

// Query keys
export const notificationPreferencesKeys = {
  all: ["notificationPreferences"] as const,
  current: ["notificationPreferences", "current"] as const,
};

/**
 * Hook to get current user's notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationPreferencesKeys.current,
    queryFn: async () => {
      const result = await getNotificationPreferences();
      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch notification preferences"
        );
      }
      return result.data!;
    },
    retry: (failureCount, error) => {
      if (error.message === "User not authenticated") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to update a single notification preference
 */
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      field,
      value,
    }: {
      field: keyof Pick<
        NotificationPreferences,
        | "supplement_reminders_enabled"
        | "refill_reminders_enabled"
        | "app_updates_enabled"
        | "system_notifications_enabled"
        | "timezone"
      >;
      value: boolean | string;
    }) => {
      const result = await updateNotificationPreference(field, value);
      if (!result.success) {
        throw new Error(result.error || "Failed to update preference");
      }
      return result.data!;
    },
    onMutate: async ({ field, value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationPreferencesKeys.current,
      });

      // Snapshot the previous value
      const previousPreferences =
        queryClient.getQueryData<NotificationPreferences>(
          notificationPreferencesKeys.current
        );

      // Optimistically update to the new value
      if (previousPreferences) {
        queryClient.setQueryData<NotificationPreferences>(
          notificationPreferencesKeys.current,
          {
            ...previousPreferences,
            [field]: value,
          }
        );
      }

      // Return a context object with the snapshotted value
      return { previousPreferences };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          notificationPreferencesKeys.current,
          context.previousPreferences
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: notificationPreferencesKeys.current,
      });
    },
  });
}

/**
 * Hook to update multiple notification preferences at once
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Partial<
        Pick<
          NotificationPreferences,
          | "supplement_reminders_enabled"
          | "refill_reminders_enabled"
          | "app_updates_enabled"
          | "system_notifications_enabled"
          | "timezone"
        >
      >
    ) => {
      const result = await updateNotificationPreferences(updates);
      if (!result.success) {
        throw new Error(result.error || "Failed to update preferences");
      }
      return result.data!;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationPreferencesKeys.current,
      });

      // Snapshot the previous value
      const previousPreferences =
        queryClient.getQueryData<NotificationPreferences>(
          notificationPreferencesKeys.current
        );

      // Optimistically update to the new values
      if (previousPreferences) {
        queryClient.setQueryData<NotificationPreferences>(
          notificationPreferencesKeys.current,
          {
            ...previousPreferences,
            ...updates,
          }
        );
      }

      // Return a context object with the snapshotted value
      return { previousPreferences };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          notificationPreferencesKeys.current,
          context.previousPreferences
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: notificationPreferencesKeys.current,
      });
    },
  });
}
