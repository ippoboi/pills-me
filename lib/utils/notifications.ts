import { type NotificationPayload } from "@/app/actions/push-notifications";

/**
 * Notification utility functions for Pills-Me
 * Provides standardized notification formatting and scheduling
 */

export interface SupplementReminder {
  supplementId: string;
  supplementName: string;
  dosage?: string;
  timeOfDay: "morning" | "afternoon" | "evening";
  scheduledTime?: string;
}

export interface RefillReminder {
  supplementId: string;
  supplementName: string;
  currentInventory: number;
  daysRemaining: number;
}

/**
 * Create a supplement reminder notification payload
 */
export function createSupplementReminderNotification(
  reminder: SupplementReminder
): NotificationPayload {
  const timeEmoji = {
    morning: "🌅",
    afternoon: "☀️",
    evening: "🌙",
  };

  const title = `${timeEmoji[reminder.timeOfDay]} Time for your supplement!`;

  let body = `Don't forget to take your ${reminder.supplementName}`;
  if (reminder.dosage) {
    body += ` (${reminder.dosage})`;
  }

  return {
    title,
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    url: `/supplements/${reminder.supplementId}`,
    tag: `supplement-reminder-${reminder.supplementId}`,
    requireInteraction: true,
    data: {
      type: "supplement_reminder",
      supplementId: reminder.supplementId,
      timeOfDay: reminder.timeOfDay,
    },
    actions: [
      {
        action: "mark_taken",
        title: "Mark as Taken",
        icon: "/icon-192x192.png",
      },
      {
        action: "snooze",
        title: "Remind Later",
        icon: "/icon-192x192.png",
      },
    ],
  };
}

/**
 * Create a refill reminder notification payload
 */
export function createRefillReminderNotification(
  reminder: RefillReminder
): NotificationPayload {
  const urgencyLevel = reminder.daysRemaining <= 3 ? "urgent" : "normal";
  const emoji = urgencyLevel === "urgent" ? "🚨" : "📦";

  const title = `${emoji} Refill reminder`;

  let body = `You have ${reminder.currentInventory} ${reminder.supplementName} left`;
  if (reminder.daysRemaining > 0) {
    body += ` (${reminder.daysRemaining} days remaining)`;
  } else {
    body += " - time to reorder!";
  }

  return {
    title,
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    url: `/supplements/${reminder.supplementId}`,
    tag: `refill-reminder-${reminder.supplementId}`,
    requireInteraction: urgencyLevel === "urgent",
    data: {
      type: "refill_reminder",
      supplementId: reminder.supplementId,
      urgencyLevel,
      daysRemaining: reminder.daysRemaining,
    },
    actions: [
      {
        action: "refill_now",
        title: "Refill Now",
        icon: "/icon-192x192.png",
      },
      {
        action: "remind_tomorrow",
        title: "Remind Tomorrow",
        icon: "/icon-192x192.png",
      },
    ],
  };
}

/**
 * Create an achievement notification payload
 */
export function createAchievementNotification(
  achievementType: string,
  description: string,
  supplementName?: string
): NotificationPayload {
  const achievements = {
    streak_7: { emoji: "🔥", title: "7-day streak!" },
    streak_30: { emoji: "🏆", title: "30-day streak!" },
    streak_100: { emoji: "💎", title: "100-day streak!" },
    first_supplement: { emoji: "🎉", title: "Welcome to Pills-Me!" },
    perfect_week: { emoji: "⭐", title: "Perfect week!" },
    perfect_month: { emoji: "🌟", title: "Perfect month!" },
  };

  const achievement = achievements[
    achievementType as keyof typeof achievements
  ] || {
    emoji: "🎊",
    title: "Achievement unlocked!",
  };

  let body = description;
  if (supplementName) {
    body += ` with ${supplementName}`;
  }

  return {
    title: `${achievement.emoji} ${achievement.title}`,
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    url: "/supplements",
    tag: `achievement-${achievementType}`,
    data: {
      type: "achievement",
      achievementType,
      supplementName,
    },
  };
}

/**
 * Create a system notification payload
 */
export function createSystemNotification(
  title: string,
  message: string,
  url?: string
): NotificationPayload {
  return {
    title: `📱 ${title}`,
    body: message,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    url: url || "/supplements",
    tag: "system-notification",
    data: {
      type: "system",
    },
  };
}

/**
 * Calculate the next reminder time based on time of day preference
 */
export function calculateNextReminderTime(
  timeOfDay: "morning" | "afternoon" | "evening",
  customTime?: string
): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Default times if no custom time is provided
  const defaultTimes = {
    morning: "08:00",
    afternoon: "14:00",
    evening: "20:00",
  };

  const timeString = customTime || defaultTimes[timeOfDay];
  const [hours, minutes] = timeString.split(":").map(Number);

  // Set the time for today
  const reminderTime = new Date(now);
  reminderTime.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  return reminderTime;
}

/**
 * Format notification time for display
 */
export function formatNotificationTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Check if notifications are supported in the current environment
 */
export function isNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error("Notifications are not supported in this browser");
  }

  return await Notification.requestPermission();
}

/**
 * Validate notification payload
 */
export function validateNotificationPayload(
  payload: unknown
): payload is NotificationPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  return (
    typeof obj.title === "string" &&
    typeof obj.body === "string" &&
    obj.title.length > 0 &&
    obj.body.length > 0
  );
}

/**
 * Create a notification for testing purposes
 */
export function createTestNotification(message?: string): NotificationPayload {
  return {
    title: "Test Notification",
    body: message || "This is a test notification from Pills-Me",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    url: "/supplements",
    tag: "test-notification",
    data: {
      type: "test",
      timestamp: Date.now(),
    },
  };
}

/**
 * Get notification settings for a user (to be used with notification preferences)
 */
export interface NotificationSettings {
  supplementReminders: boolean;
  refillReminders: boolean;
  achievements: boolean;
  system: boolean;
  reminderTimes: {
    morning?: string;
    afternoon?: string;
    evening?: string;
  };
}

export const defaultNotificationSettings: NotificationSettings = {
  supplementReminders: true,
  refillReminders: true,
  achievements: true,
  system: true,
  reminderTimes: {
    morning: "08:00",
    afternoon: "14:00",
    evening: "20:00",
  },
};
