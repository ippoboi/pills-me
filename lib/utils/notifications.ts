/**
 * Client-side notification scheduling utilities
 * Handles communication with Service Worker for supplement reminders
 */

import { getUserTimezone } from "./timezone";
import type { NotificationPreferences } from "@/lib/types/user";
import type { TimeOfDay } from "@/lib/types";

export interface SupplementWithSchedules {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  deleted_at: string | null;
  schedules?: Array<{
    id: string;
    time_of_day: TimeOfDay;
  }>;
}

/**
 * Schedule supplement notifications via Service Worker
 */
export async function scheduleSupplementNotifications(
  supplements: SupplementWithSchedules[],
  preferences: NotificationPreferences | null,
  timezone?: string
): Promise<void> {
  try {
    // Check if Service Worker is supported
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return;
    }

    // Get the active service worker registration
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      console.warn("No active service worker found");
      return;
    }

    // Use provided timezone or detect user's timezone
    const userTimezone = timezone || getUserTimezone();

    // Send scheduling message to Service Worker
    registration.active.postMessage({
      type: "SCHEDULE_SUPPLEMENT_NOTIFICATIONS",
      supplements,
      preferences,
      timezone: userTimezone,
    });

    console.log("Scheduled supplement notifications:", {
      supplementCount: supplements.length,
      preferences,
      timezone: userTimezone,
    });
  } catch (error) {
    console.error("Error scheduling supplement notifications:", error);
  }
}

/**
 * Clear all scheduled supplement notifications
 */
export async function clearScheduledNotifications(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      console.warn("No active service worker found");
      return;
    }

    registration.active.postMessage({
      type: "CLEAR_SCHEDULED_NOTIFICATIONS",
    });

    console.log("Cleared all scheduled notifications");
  } catch (error) {
    console.error("Error clearing scheduled notifications:", error);
  }
}

/**
 * Request notification permission if not already granted
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  // Request permission
  const permission = await Notification.requestPermission();
  console.log("Notification permission:", permission);
  return permission;
}

/**
 * Check if notifications are supported and permitted
 */
export function isNotificationSupported(): boolean {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    Notification.permission === "granted"
  );
}

/**
 * Get the next notification times for active supplements
 * Useful for displaying upcoming reminders to users
 */
export function getNextNotificationTimes(
  supplements: SupplementWithSchedules[],
  preferences: NotificationPreferences | null
): Array<{
  supplementId: string;
  supplementName: string;
  timeOfDay: string;
  nextTime: Date;
}> {
  if (
    !preferences?.system_notifications_enabled ||
    !preferences?.supplement_reminders_enabled
  ) {
    return [];
  }

  const hoursByTimeOfDay: Record<TimeOfDay, number> = {
    MORNING: 8,
    LUNCH: 12,
    DINNER: 18,
    BEFORE_SLEEP: 22,
  };

  const now = new Date();
  const results: Array<{
    supplementId: string;
    supplementName: string;
    timeOfDay: string;
    nextTime: Date;
  }> = [];

  supplements.forEach((supplement) => {
    if (supplement.status !== "ACTIVE" || supplement.deleted_at) {
      return;
    }

    supplement.schedules?.forEach((schedule) => {
      const hour = hoursByTimeOfDay[schedule.time_of_day];
      if (hour === undefined) return;

      // Calculate next notification time
      const nextTime = new Date();
      nextTime.setHours(hour, 0, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (nextTime <= now) {
        nextTime.setDate(nextTime.getDate() + 1);
      }

      results.push({
        supplementId: supplement.id,
        supplementName: supplement.name,
        timeOfDay: schedule.time_of_day,
        nextTime,
      });
    });
  });

  // Sort by next notification time
  results.sort((a, b) => a.nextTime.getTime() - b.nextTime.getTime());

  return results;
}

/**
 * Format time of day for display
 */
export function formatTimeOfDay(timeOfDay: string): string {
  const labels = {
    MORNING: "Morning (8:00 AM)",
    LUNCH: "Lunch (12:00 PM)",
    DINNER: "Dinner (6:00 PM)",
    BEFORE_SLEEP: "Before Sleep (10:00 PM)",
  };

  return labels[timeOfDay as keyof typeof labels] || timeOfDay;
}

/**
 * Show a test notification to verify setup
 */
export async function showTestNotification(): Promise<boolean> {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      // Fallback to direct notification if no Service Worker
      new Notification("Pills-Me Test", {
        body: "Notifications are working correctly!",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
      });
      return true;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      console.warn("No active service worker found");
      return false;
    }

    // Show test notification via Service Worker
    await registration.showNotification("Pills-Me Test", {
      body: "Notifications are working correctly!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "test-notification",
    });

    return true;
  } catch (error) {
    console.error("Error showing test notification:", error);
    return false;
  }
}
