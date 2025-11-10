/**
 * Timezone utility functions for handling user timezone detection and conversions
 */

/**
 * Get the user's browser timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn("Failed to detect timezone, falling back to UTC:", error);
    return "UTC";
  }
}

/**
 * Format a timestamp to YYYY-MM-DD in the specified timezone
 */
export function formatTimestampToDate(
  timestamp: string | Date,
  timezone: string = "UTC"
): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid timestamp");
    }

    // Use Intl.DateTimeFormat to get the date in the specified timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return formatter.format(date);
  } catch (error) {
    console.error("Error formatting timestamp to date:", error);
    return new Date(timestamp).toISOString().split("T")[0];
  }
}

/**
 * Get current timestamp for "today" at start of day in user's timezone
 */
export function getTodayTimestamp(
  timezone: string = getUserTimezone()
): string {
  try {
    const now = new Date();
    const todayDateString = formatTimestampToDate(now, timezone);
    return createTimestampForDate(todayDateString, timezone);
  } catch (error) {
    console.error("Error getting today timestamp:", error);
    return new Date().toISOString();
  }
}

/**
 * Convert YYYY-MM-DD date string to timestamp at start of day in specified timezone
 */
export function createTimestampForDate(
  dateString: string,
  timezone: string = "UTC"
): string {
  try {
    // Validate date string format
    if (!isValidDateString(dateString)) {
      throw new Error(`Invalid date string format: ${dateString}`);
    }

    // Just use the current time with the date part replaced
    // This preserves the user's current timezone context
    const now = new Date();
    const [year, month, day] = dateString.split("-").map(Number);

    // Create a new date with today's time but the target date
    const targetDate = new Date(now);
    targetDate.setFullYear(year, month - 1, day);
    targetDate.setHours(0, 0, 0, 0);

    return targetDate.toISOString();
  } catch (error) {
    console.error("Error creating timestamp for date:", error);
    return new Date(`${dateString}T00:00:00Z`).toISOString();
  }
}

/**
 * Get the start and end timestamps for a given date in a timezone
 * Returns [startOfDay, endOfDay] timestamps
 */
export function getDateRangeTimestamps(
  dateString: string,
  timezone: string = "UTC"
): [string, string] {
  try {
    const startOfDay = createTimestampForDate(dateString, timezone);
    const startDate = new Date(startOfDay);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1); // End of day (23:59:59.999)

    return [startOfDay, endDate.toISOString()];
  } catch (error) {
    console.error("Error getting date range timestamps:", error);
    const fallback = new Date(`${dateString}T00:00:00Z`);
    const fallbackEnd = new Date(fallback.getTime() + 24 * 60 * 60 * 1000 - 1);
    return [fallback.toISOString(), fallbackEnd.toISOString()];
  }
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return (
    !isNaN(date.getTime()) && date.toISOString().split("T")[0] === dateString
  );
}

/**
 * Validate ISO timestamp string
 */
export function isValidTimestamp(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return false;
    }

    // Accept both formats: with and without milliseconds
    const isoWithMs = date.toISOString();
    const isoWithoutMs = isoWithMs.replace(".000Z", "Z");

    return timestamp === isoWithMs || timestamp === isoWithoutMs;
  } catch {
    return false;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
