/**
 * Timezone utility functions for handling user timezone detection and conversions
 * Industry best practices for storing TIMESTAMPTZ in UTC while handling user timezones
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
 * Convert a date string (YYYY-MM-DD) + time in user's timezone to UTC timestamp
 * This is what we store in the database.
 *
 * Example: User in PST (UTC-8) marks "2025-11-10" at 8:00 AM local time
 * → Stored as "2025-11-10T16:00:00.000Z" in database
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param hours - Hour in local time (0-23)
 * @param minutes - Minutes in local time (0-59)
 * @param timezone - IANA timezone identifier (e.g., "America/Los_Angeles")
 * @returns ISO timestamp string in UTC
 */
export function createUTCTimestampFromLocalDateTime(
  dateString: string,
  hours: number,
  minutes: number,
  timezone: string
): string {
  try {
    // Validate date string format
    if (!isValidDateString(dateString)) {
      throw new Error(`Invalid date string format: ${dateString}`);
    }

    // Parse the date components
    const [year, month, day] = dateString.split("-").map(Number);

    // Create a date object in the user's timezone
    // We use a temporary date to get the timezone offset for this specific date
    const tempDate = new Date();
    tempDate.setFullYear(year, month - 1, day);
    tempDate.setHours(hours, minutes, 0, 0);

    // Get the timezone offset for this specific date (handles DST)
    const offsetMinutes = getTimezoneOffsetForDate(tempDate, timezone);

    // Create the UTC timestamp by adjusting for the timezone offset
    const utcTime = tempDate.getTime() - offsetMinutes * 60 * 1000;

    return new Date(utcTime).toISOString();
  } catch (error) {
    console.error("Error creating UTC timestamp from local datetime:", error);
    // Fallback: create a basic UTC timestamp
    return new Date(
      `${dateString}T${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:00Z`
    ).toISOString();
  }
}

/**
 * Get start/end of day in user's timezone, returned as UTC timestamps
 * Used for querying adherence records for a specific date
 *
 * Example: User in PST viewing "2025-11-10"
 * → Returns ["2025-11-10T08:00:00.000Z", "2025-11-11T07:59:59.999Z"]
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param timezone - IANA timezone identifier
 * @returns Tuple of [startOfDay, endOfDay] in UTC
 */
export function getLocalDayBoundariesInUTC(
  dateString: string,
  timezone: string
): [string, string] {
  try {
    // Start of day (00:00:00) in user's timezone
    const startOfDay = createUTCTimestampFromLocalDateTime(
      dateString,
      0,
      0,
      timezone
    );

    // End of day (23:59:59.999) in user's timezone
    const endOfDay = createUTCTimestampFromLocalDateTime(
      dateString,
      23,
      59,
      timezone
    );

    // Add 59 seconds and 999 milliseconds to end of day
    const endOfDayDate = new Date(endOfDay);
    endOfDayDate.setSeconds(59, 999);

    return [startOfDay, endOfDayDate.toISOString()];
  } catch (error) {
    console.error("Error getting local day boundaries in UTC:", error);
    // Fallback to basic UTC day boundaries
    const fallbackStart = new Date(`${dateString}T00:00:00Z`);
    const fallbackEnd = new Date(`${dateString}T23:59:59.999Z`);
    return [fallbackStart.toISOString(), fallbackEnd.toISOString()];
  }
}

/**
 * Convert UTC timestamp back to date string in user's timezone
 * Used for displaying dates to users
 *
 * @param timestamp - ISO timestamp string in UTC
 * @param timezone - IANA timezone identifier
 * @returns Date string in YYYY-MM-DD format
 */
export function formatUTCToLocalDate(
  timestamp: string,
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
    console.error("Error formatting UTC to local date:", error);
    return new Date(timestamp).toISOString().split("T")[0];
  }
}

/**
 * Get timezone offset in minutes for a specific date
 * This handles DST transitions correctly
 *
 * @param date - The date to get offset for
 * @param timezone - IANA timezone identifier
 * @returns Offset in minutes (positive for timezones ahead of UTC)
 */
function getTimezoneOffsetForDate(date: Date, timezone: string): number {
  try {
    // Create formatter for the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Get the formatted parts
    const parts = formatter
      .formatToParts(date)
      .reduce<Record<string, string>>((acc, part) => {
        if (part.type !== "literal") {
          acc[part.type] = part.value;
        }
        return acc;
      }, {});

    // Create a date in UTC with the same components as the local time
    const utcDate = new Date(
      Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second)
      )
    );

    // The difference between the original date and the UTC date is the offset
    return (utcDate.getTime() - date.getTime()) / (60 * 1000);
  } catch (error) {
    console.error("Error getting timezone offset:", error);
    return 0; // Fallback to UTC
  }
}

/**
 * Format a timestamp to YYYY-MM-DD in the specified timezone
 * Legacy function - kept for backward compatibility
 */
export function formatTimestampToDate(
  timestamp: string | Date,
  timezone: string = "UTC"
): string {
  return formatUTCToLocalDate(timestamp.toString(), timezone);
}

/**
 * Get current timestamp for "today" at start of day in user's timezone
 * Legacy function - kept for backward compatibility
 */
export function getTodayTimestamp(
  timezone: string = getUserTimezone()
): string {
  try {
    const now = new Date();
    const todayDateString = formatUTCToLocalDate(now.toISOString(), timezone);
    return createUTCTimestampFromLocalDateTime(todayDateString, 0, 0, timezone);
  } catch (error) {
    console.error("Error getting today timestamp:", error);
    return new Date().toISOString();
  }
}

/**
 * Convert YYYY-MM-DD date string to timestamp at start of day in specified timezone
 * Legacy function - kept for backward compatibility
 */
export function createTimestampForDate(
  dateString: string,
  timezone: string = "UTC"
): string {
  return createUTCTimestampFromLocalDateTime(dateString, 0, 0, timezone);
}

/**
 * Create a schedule-specific timestamp for adherence tracking
 * This ensures unique timestamps for different schedules on the same day
 * Legacy function - kept for backward compatibility
 */
export function createScheduleTimestamp(
  dateString: string,
  timeOfDay: "MORNING" | "LUNCH" | "DINNER" | "BEFORE_SLEEP"
): string {
  const hoursByTimeOfDay: Record<string, number> = {
    MORNING: 8,
    LUNCH: 12,
    DINNER: 18,
    BEFORE_SLEEP: 22,
  };

  const hours = hoursByTimeOfDay[timeOfDay] ?? 0;
  return createUTCTimestampFromLocalDateTime(
    dateString,
    hours,
    0,
    getUserTimezone()
  );
}

/**
 * Get the start and end timestamps for a given date in a timezone
 * Returns [startOfDay, endOfDay] timestamps
 * Legacy function - kept for backward compatibility
 */
export function getDateRangeTimestamps(
  dateString: string,
  timezone: string = "UTC"
): [string, string] {
  return getLocalDayBoundariesInUTC(dateString, timezone);
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
