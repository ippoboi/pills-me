"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptionStatus,
  cleanupRevokedSubscriptions,
} from "@/app/actions/push-notifications";

export interface ComprehensiveSubscriptionStatus {
  // Database status
  hasServerSubscription: boolean;
  subscriptionCount: number;

  // Browser status
  browserPermission: NotificationPermission;
  hasBrowserSubscription: boolean;

  // Combined status
  isFullyEnabled: boolean;
  needsBrowserPermission: boolean;
  needsResubscription: boolean;
}

/**
 * Hook to get comprehensive push subscription status
 * Checks both database subscriptions and browser permission/subscription status
 */
export function usePushSubscriptionStatus() {
  return useQuery({
    queryKey: ["push-subscription-status"],
    queryFn: async (): Promise<ComprehensiveSubscriptionStatus> => {
      // Get database status
      const serverStatus = await getSubscriptionStatus();

      // Check browser permission and subscription status
      let browserPermission: NotificationPermission = "default";
      let hasBrowserSubscription = false;

      if (typeof window !== "undefined" && "Notification" in window) {
        browserPermission = Notification.permission;

        // Check if service worker and push manager are available
        if ("serviceWorker" in navigator && "PushManager" in window) {
          try {
            const registration =
              await navigator.serviceWorker.getRegistration();
            if (registration) {
              const subscription =
                await registration.pushManager.getSubscription();
              hasBrowserSubscription = !!subscription;
            }
          } catch (error) {
            console.warn("Failed to check browser subscription:", error);
          }
        }
      }

      const hasServerSubscription = serverStatus.subscribed;
      const isFullyEnabled =
        hasServerSubscription &&
        browserPermission === "granted" &&
        hasBrowserSubscription;

      const needsBrowserPermission = browserPermission !== "granted";
      const needsResubscription =
        hasServerSubscription &&
        browserPermission === "granted" &&
        !hasBrowserSubscription;

      return {
        hasServerSubscription,
        subscriptionCount: serverStatus.count || 0,
        browserPermission,
        hasBrowserSubscription,
        isFullyEnabled,
        needsBrowserPermission,
        needsResubscription,
      };
    },
    staleTime: 30 * 1000, // 30 seconds (shorter since browser status can change)
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Check every minute
  });
}

/**
 * Hook to cleanup database subscriptions when browser permissions are revoked
 */
export function useCleanupRevokedSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cleanupRevokedSubscriptions,
    onSuccess: () => {
      // Invalidate and refetch subscription status
      queryClient.invalidateQueries({ queryKey: ["push-subscription-status"] });
    },
  });
}
