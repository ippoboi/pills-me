"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNotificationPreferences } from "@/lib/hooks/notification-preferences";
import { scheduleSupplementNotifications } from "@/lib/utils/notifications";
import { getUserTimezone } from "@/lib/utils/timezone";

// Query function to fetch supplements with schedules
async function fetchSupplementsWithSchedules() {
  const response = await fetch("/api/supplements/list", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch supplements");
  }

  return response.json();
}

/**
 * Component that handles automatic scheduling of supplement notifications
 * Should be mounted once in the app layout to manage notifications
 */
export default function NotificationScheduler() {
  // Fetch notification preferences
  const {
    data: preferences,
    isLoading: preferencesLoading,
    error: preferencesError,
  } = useNotificationPreferences();

  // Fetch supplements with schedules
  const {
    data: supplements,
    isLoading: supplementsLoading,
    error: supplementsError,
  } = useQuery({
    queryKey: ["supplements", "with-schedules"],
    queryFn: fetchSupplementsWithSchedules,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes("Unauthorized")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Schedule notifications when data changes
  useEffect(() => {
    // Don't schedule if still loading or if there are errors
    if (preferencesLoading || supplementsLoading) {
      return;
    }

    if (preferencesError || supplementsError) {
      console.error("Error loading data for notification scheduling:", {
        preferencesError,
        supplementsError,
      });
      return;
    }

    // Don't schedule if notifications are disabled
    if (
      !preferences?.system_notifications_enabled ||
      !preferences?.supplement_reminders_enabled
    ) {
      console.log("Notifications disabled, skipping scheduling");
      return;
    }

    // Schedule notifications
    if (supplements && Array.isArray(supplements)) {
      const timezone = getUserTimezone();

      console.log("Scheduling notifications for supplements:", {
        supplementCount: supplements.length,
        preferences,
        timezone,
      });

      scheduleSupplementNotifications(supplements, preferences, timezone);
    }
  }, [
    preferences,
    supplements,
    preferencesLoading,
    supplementsLoading,
    preferencesError,
    supplementsError,
  ]);

  // Re-schedule when preferences change
  useEffect(() => {
    if (!preferences || preferencesLoading) return;

    // If notifications are disabled, we could clear existing schedules
    if (
      !preferences.system_notifications_enabled ||
      !preferences.supplement_reminders_enabled
    ) {
      console.log("Notifications disabled, clearing schedules");
      // Note: clearScheduledNotifications() could be called here if needed
    }
  }, [preferences, preferencesLoading]);

  // This component doesn't render anything visible
  return null;
}
