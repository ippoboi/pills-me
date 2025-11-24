import type { TimeOfDay } from "@/lib/types";

/**
 * Canonical local times for each TimeOfDay slot (in 24-hour format)
 */
export const TIME_OF_DAY_HOURS: Record<TimeOfDay, number> = {
  MORNING: 8,
  LUNCH: 12,
  DINNER: 18,
  BEFORE_SLEEP: 22,
} as const;

/**
 * Time window in minutes around each TimeOfDay slot for notifications
 * e.g., MORNING notifications can be sent between 08:00-08:15
 */
export const NOTIFICATION_WINDOW_MINUTES = 15;

/**
 * Get local date and hour for a specific timezone
 */
export function getLocalDateAndHourForTimezone(
  nowUTC: Date,
  timezone: string
): { localDate: string; hour: number; minute: number } {
  try {
    // Use Intl.DateTimeFormat to get local time components
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(nowUTC);
    const partsMap = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as Record<string, string>);

    const localDate = `${partsMap.year}-${partsMap.month}-${partsMap.day}`;
    const hour = parseInt(partsMap.hour, 10);
    const minute = parseInt(partsMap.minute, 10);

    return { localDate, hour, minute };
  } catch (error) {
    console.error(`Error getting local time for timezone ${timezone}:`, error);
    // Fallback to UTC
    const utcDate = nowUTC.toISOString().split("T")[0];
    return {
      localDate: utcDate,
      hour: nowUTC.getUTCHours(),
      minute: nowUTC.getUTCMinutes(),
    };
  }
}

/**
 * Map local time to TimeOfDay window, considering notification windows
 * Returns null if the current time is not within any notification window
 */
export function mapLocalTimeToTimeOfDay(
  hour: number,
  minute: number
): TimeOfDay | null {
  const currentMinutes = hour * 60 + minute;

  // Check each TimeOfDay slot
  for (const [timeOfDay, targetHour] of Object.entries(TIME_OF_DAY_HOURS)) {
    const targetMinutes = targetHour * 60;
    const windowStart = targetMinutes;
    const windowEnd = targetMinutes + NOTIFICATION_WINDOW_MINUTES;

    if (currentMinutes >= windowStart && currentMinutes < windowEnd) {
      return timeOfDay as TimeOfDay;
    }
  }

  return null;
}

/**
 * Check if the current local time is within a notification window for any TimeOfDay
 */
export function isWithinNotificationWindow(
  nowUTC: Date,
  timezone: string
): { timeOfDay: TimeOfDay | null; localTime: string } {
  const { hour, minute } = getLocalDateAndHourForTimezone(nowUTC, timezone);
  const timeOfDay = mapLocalTimeToTimeOfDay(hour, minute);
  const localTime = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  return { timeOfDay, localTime };
}

/**
 * Get the next notification time for a specific TimeOfDay in a user's timezone
 * Returns the next occurrence of that time slot (today if not passed, tomorrow otherwise)
 */
export function getNextNotificationTime(
  timeOfDay: TimeOfDay,
  timezone: string,
  baseTime: Date = new Date()
): Date {
  const targetHour = TIME_OF_DAY_HOURS[timeOfDay];
  const { hour, minute } = getLocalDateAndHourForTimezone(baseTime, timezone);

  // Convert to user's timezone (this is a bit tricky with Date objects)
  // We'll use a different approach: create the time in UTC then adjust
  try {
    // Get the timezone offset for the target time
    const tempDate = new Date();
    const utcTime = tempDate.getTime() + tempDate.getTimezoneOffset() * 60000;
    const targetTimezoneTime = new Date(
      utcTime + getTimezoneOffset(timezone, tempDate) * 60000
    );

    // Set to target hour
    targetTimezoneTime.setHours(targetHour, 0, 0, 0);

    // If the time has already passed today, move to tomorrow
    const currentLocalMinutes = hour * 60 + minute;
    const targetMinutes = targetHour * 60;

    if (currentLocalMinutes >= targetMinutes) {
      targetTimezoneTime.setDate(targetTimezoneTime.getDate() + 1);
    }

    return targetTimezoneTime;
  } catch (error) {
    console.error("Error calculating next notification time:", error);
    // Fallback: just add target hour to current UTC time
    const fallback = new Date(baseTime);
    fallback.setUTCHours(targetHour, 0, 0, 0);
    if (fallback <= baseTime) {
      fallback.setUTCDate(fallback.getUTCDate() + 1);
    }
    return fallback;
  }
}

/**
 * Helper function to get timezone offset in minutes
 * Positive values are east of UTC, negative values are west of UTC
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    // Create two dates: one in UTC, one in the target timezone
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(
      date.toLocaleString("en-US", { timeZone: timezone })
    );

    // The difference is the offset
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  } catch (error) {
    console.error(`Error getting timezone offset for ${timezone}:`, error);
    return 0; // Fallback to UTC
  }
}

/**
 * Format a TimeOfDay enum value to a human-readable label
 */
export function formatTimeOfDayLabel(timeOfDay: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    MORNING: "Morning",
    LUNCH: "Lunch",
    DINNER: "Dinner",
    BEFORE_SLEEP: "Before Sleep",
  };

  return labels[timeOfDay];
}

/**
 * Get all TimeOfDay values that should be checked for a given time range
 * Useful for batch processing notifications
 */
export function getTimeOfDayWindowsInRange(
  startTime: Date,
  endTime: Date,
  timezone: string
): Array<{ timeOfDay: TimeOfDay; localTime: string }> {
  const windows: Array<{ timeOfDay: TimeOfDay; localTime: string }> = [];
  const current = new Date(startTime);

  // Check every minute in the range (this is for precision, but in practice
  // we'll likely check every 15 minutes via cron)
  while (current <= endTime) {
    const { timeOfDay, localTime } = isWithinNotificationWindow(
      current,
      timezone
    );

    if (timeOfDay && !windows.some((w) => w.timeOfDay === timeOfDay)) {
      windows.push({ timeOfDay, localTime });
    }

    // Move to next minute
    current.setMinutes(current.getMinutes() + 1);
  }

  return windows;
}
