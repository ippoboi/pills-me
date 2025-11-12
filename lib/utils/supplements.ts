import type { TimeOfDay, SupplementStatus, SupplementSchedule } from "../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";
import { getLocalDayBoundariesInUTC, formatUTCToLocalDate } from "./timezone";
import {
  Activity02FreeIcons,
  Alert02FreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIconProps } from "@hugeicons/react";

/**
 * Check if supplement is active on given date
 */
export function isSupplementActiveOnDate(
  supplement: {
    start_date: string;
    end_date?: string | null;
    status: SupplementStatus;
  },
  date: string
): boolean {
  if (supplement.status !== "ACTIVE") {
    return false;
  }

  const checkDate = new Date(date);
  const startDate = new Date(supplement.start_date);

  if (checkDate < startDate) {
    return false;
  }

  if (supplement.end_date) {
    const endDate = new Date(supplement.end_date);
    if (checkDate > endDate) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate adherence progress for a supplement based on schedules
 * Returns percentage: (completed schedules / total possible schedules) * 100
 *
 * @param supabase - Supabase client instance
 * @param supplementId - ID of the supplement
 * @param userId - ID of the user
 * @param startDate - Start date of the supplement (YYYY-MM-DD)
 * @param endDate - End date of the supplement (YYYY-MM-DD) or null
 * @param referenceDate - Reference date for calculation (defaults to today) (YYYY-MM-DD)
 * @returns Promise with adherence progress percentage
 */
export async function calculateAdherenceProgress(
  supabase: SupabaseClient<Database>,
  supplementId: string,
  userId: string,
  startDate: string,
  endDate: string | null,
  referenceDate?: string,
  timezone: string = "UTC"
): Promise<{ percentage: number; completed: number; total_possible: number }> {
  console.log("🔍 [ADHERENCE DEBUG] Starting schedule-based calculation for:", {
    supplementId,
    userId,
    startDate,
    endDate,
    referenceDate,
  });

  // Use reference date or today (ensure YYYY-MM-DD format)
  const today =
    referenceDate || formatUTCToLocalDate(new Date().toISOString(), timezone);

  // Convert timestamps to date strings if needed
  const normalizedStartDate = startDate.includes("T")
    ? startDate.split("T")[0]
    : startDate;
  const normalizedEndDate = endDate
    ? endDate.includes("T")
      ? endDate.split("T")[0]
      : endDate
    : null;

  console.log("📅 [ADHERENCE DEBUG] Date processing:", {
    originalReferenceDate: referenceDate,
    calculatedToday: today,
    originalStartDate: startDate,
    normalizedStartDate,
    originalEndDate: endDate,
    normalizedEndDate,
  });

  // Validate normalized date strings are in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(normalizedStartDate)) {
    console.error(
      "❌ [ADHERENCE DEBUG] Invalid startDate format:",
      normalizedStartDate
    );
    return { percentage: 0, completed: 0, total_possible: 0 };
  }
  if (!dateRegex.test(today)) {
    console.error("❌ [ADHERENCE DEBUG] Invalid referenceDate format:", today);
    return { percentage: 0, completed: 0, total_possible: 0 };
  }
  if (normalizedEndDate && !dateRegex.test(normalizedEndDate)) {
    console.error(
      "❌ [ADHERENCE DEBUG] Invalid endDate format:",
      normalizedEndDate
    );
    return { percentage: 0, completed: 0, total_possible: 0 };
  }

  // Parse dates and validate they're valid
  const startDateObj = new Date(normalizedStartDate + "T00:00:00");
  const todayObj = new Date(today + "T00:00:00");
  const endDateObj = normalizedEndDate
    ? new Date(normalizedEndDate + "T00:00:00")
    : null;

  console.log("🗓️ [ADHERENCE DEBUG] Parsed date objects:", {
    startDateObj: startDateObj.toISOString(),
    todayObj: todayObj.toISOString(),
    endDateObj: endDateObj?.toISOString() || null,
  });

  // Check if dates are valid
  if (isNaN(startDateObj.getTime())) {
    console.error(
      "❌ [ADHERENCE DEBUG] Invalid startDate:",
      normalizedStartDate
    );
    return { percentage: 0, completed: 0, total_possible: 0 };
  }
  if (isNaN(todayObj.getTime())) {
    console.error("❌ [ADHERENCE DEBUG] Invalid referenceDate:", today);
    return { percentage: 0, completed: 0, total_possible: 0 };
  }
  if (endDateObj && isNaN(endDateObj.getTime())) {
    console.error("❌ [ADHERENCE DEBUG] Invalid endDate:", normalizedEndDate);
    return { percentage: 0, completed: 0, total_possible: 0 };
  }

  // Use the earlier of end_date or today for calculation
  const calculationEndDate =
    endDateObj && endDateObj < todayObj ? endDateObj : todayObj;

  console.log("📊 [ADHERENCE DEBUG] Calculation end date:", {
    endDateObj: endDateObj?.toISOString() || null,
    todayObj: todayObj.toISOString(),
    calculationEndDate: calculationEndDate.toISOString(),
    usingEndDate: endDateObj && endDateObj < todayObj,
  });

  // Calculate total days (inclusive)
  const totalDays = Math.max(
    1,
    Math.floor(
      (calculationEndDate.getTime() - startDateObj.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  console.log("📈 [ADHERENCE DEBUG] Total days calculation:", {
    startTime: startDateObj.getTime(),
    endTime: calculationEndDate.getTime(),
    timeDiff: calculationEndDate.getTime() - startDateObj.getTime(),
    daysDiff: Math.floor(
      (calculationEndDate.getTime() - startDateObj.getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    totalDays,
  });

  // Get supplement schedules to calculate total possible schedules
  const { data: supplementSchedules, error: schedulesError } = await supabase
    .from("supplement_schedules")
    .select("id")
    .eq("supplement_id", supplementId);

  if (schedulesError) {
    console.error(
      "❌ [ADHERENCE DEBUG] Error fetching supplement schedules:",
      schedulesError
    );
    return { percentage: 0, completed: 0, total_possible: 0 };
  }

  const schedulesPerDay = supplementSchedules?.length || 0;
  const totalPossibleSchedules = totalDays * schedulesPerDay;

  console.log("📈 [ADHERENCE DEBUG] Schedule calculation:", {
    totalDays,
    schedulesPerDay,
    totalPossibleSchedules,
  });

  // Get actual adherence count (completed schedules)
  const endDateString =
    normalizedEndDate && normalizedEndDate < today ? normalizedEndDate : today;

  // Convert date strings to proper timestamp ranges using timezone utilities
  const [startTimestamp] = getLocalDayBoundariesInUTC(
    normalizedStartDate,
    timezone
  );
  const [, calculationEndTimestamp] = getLocalDayBoundariesInUTC(
    endDateString,
    timezone
  );

  console.log("🔍 [ADHERENCE DEBUG] Query parameters:", {
    endDateString,
    startTimestamp,
    endTimestamp: calculationEndTimestamp,
    timezone,
    supplementId,
    userId,
  });

  const { count: adherenceCount, error: adherenceError } = await supabase
    .from("supplement_adherence")
    .select("*", { count: "exact", head: true })
    .eq("supplement_id", supplementId)
    .eq("user_id", userId)
    .gte("taken_at", startTimestamp)
    .lte("taken_at", calculationEndTimestamp);

  console.log("📋 [ADHERENCE DEBUG] Database query result:", {
    adherenceCount: adherenceCount || 0,
    error: adherenceError,
  });

  if (adherenceError) {
    console.error(
      "❌ [ADHERENCE DEBUG] Error fetching adherence records:",
      adherenceError
    );
    return { percentage: 0, completed: 0, total_possible: 0 };
  }

  const actualAdherence = adherenceCount || 0;

  // Calculate percentage: completed schedules / total possible schedules * 100
  const adherencePercentage =
    totalPossibleSchedules > 0
      ? Math.round((actualAdherence / totalPossibleSchedules) * 100)
      : 0;

  console.log("✅ [ADHERENCE DEBUG] Final schedule-based calculation:", {
    actualAdherence,
    totalPossibleSchedules,
    adherencePercentage,
    calculation: `${actualAdherence}/${totalPossibleSchedules} * 100 = ${adherencePercentage}%`,
  });

  return {
    percentage: adherencePercentage,
    completed: actualAdherence,
    total_possible: totalPossibleSchedules,
  };
}

/**
 * Group schedule by time of day
 */
export function groupScheduleByTimeOfDay(
  schedules: SupplementSchedule[]
): Record<TimeOfDay, SupplementSchedule[]> {
  const grouped: Record<TimeOfDay, SupplementSchedule[]> = {
    MORNING: [],
    LUNCH: [],
    DINNER: [],
    BEFORE_SLEEP: [],
  };

  schedules.forEach((schedule) => {
    if (schedule.time_of_day && grouped[schedule.time_of_day as TimeOfDay]) {
      grouped[schedule.time_of_day as TimeOfDay].push(schedule);
    }
  });

  return grouped;
}

/**
 * Get time of day sort order for consistent ordering
 */
export function getTimeOfDayOrder(timeOfDay: TimeOfDay): number {
  const order: Record<TimeOfDay, number> = {
    MORNING: 1,
    LUNCH: 2,
    DINNER: 3,
    BEFORE_SLEEP: 4,
  };
  return order[timeOfDay] || 999;
}

/**
 * Get adherence color class based on adherence percentage
 */
export function getAdherenceColorClass(adherencePercentage: number): {
  textColor: string;
  backgroundColor: string;
} {
  if (adherencePercentage >= 90) {
    return { textColor: "text-green-600", backgroundColor: "bg-green-50" };
  } else if (adherencePercentage >= 70) {
    return { textColor: "text-amber-600", backgroundColor: "bg-amber-50" };
  } else {
    return { textColor: "text-red-600", backgroundColor: "bg-red-50" };
  }
}

/**
 * Calculate total takes for a supplement.
 * - Finite period (has end_date): inclusive days × schedulesPerDay
 * - Indefinite period (no end_date): inclusive days since start (no multiplication)
 */
export function calculateTotalTakes(
  startDate: string,
  endDate: string | null,
  schedulesPerDay: number,
  referenceDate?: string,
  timezone: string = "UTC"
): number {
  // Normalize to YYYY-MM-DD
  const normalizedStart = startDate.includes("T")
    ? startDate.split("T")[0]
    : startDate;
  const normalizedEnd = endDate
    ? endDate.includes("T")
      ? endDate.split("T")[0]
      : endDate
    : null;
  const effectiveEnd =
    normalizedEnd ||
    referenceDate ||
    formatUTCToLocalDate(new Date().toISOString(), timezone);

  const start = new Date(normalizedStart + "T00:00:00");
  const end = new Date(effectiveEnd + "T00:00:00");
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysInclusive = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1
  );

  if (normalizedEnd) {
    // Finite: days × schedules per day
    return daysInclusive * Math.max(0, schedulesPerDay);
  }
  // Indefinite: just the number of days since start
  return daysInclusive;
}

/**
 * Enumerate local dates (YYYY-MM-DD) from start to end inclusive.
 * If endDate is null, uses referenceDate or today in given timezone.
 */
export function enumerateLocalDates(
  startDate: string,
  endDate: string | null,
  timezone: string = "UTC",
  referenceDate?: string
): string[] {
  const normalizedStart = startDate.includes("T")
    ? startDate.split("T")[0]
    : startDate;
  const normalizedEnd = endDate
    ? endDate.includes("T")
      ? endDate.split("T")[0]
      : endDate
    : null;
  const effectiveEnd =
    normalizedEnd ||
    referenceDate ||
    formatUTCToLocalDate(new Date().toISOString(), timezone);

  const dates: string[] = [];
  const start = new Date(normalizedStart + "T00:00:00");
  const end = new Date(effectiveEnd + "T00:00:00");
  const msPerDay = 1000 * 60 * 60 * 24;
  for (let t = start.getTime(); t <= end.getTime(); t += msPerDay) {
    const d = new Date(t);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  MORNING: "Morning",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  BEFORE_SLEEP: "Before sleep",
};

export function formatTimeOfDayLabel(timeOfDay: TimeOfDay): string {
  return TIME_OF_DAY_LABELS[timeOfDay] ?? timeOfDay;
}

export function formatTimeOfDayList(timesOfDay: TimeOfDay[]): string {
  return timesOfDay.map(formatTimeOfDayLabel).join(", ");
}

export interface SupplementStatusConfig {
  label: string;
  value: SupplementStatus;
  colorClass: string;
  backgroundClass: string;
  icon: HugeiconsIconProps["icon"];
}

export const SUPPLEMENT_STATUS_CONFIGS: SupplementStatusConfig[] = [
  {
    label: "Active",
    value: "ACTIVE",
    colorClass: "text-blue-600",
    backgroundClass: "bg-blue-50",
    icon: Activity02FreeIcons,
  },
  {
    label: "Completed",
    value: "COMPLETED",
    colorClass: "text-green-600",
    backgroundClass: "bg-green-50",
    icon: Tick02FreeIcons,
  },
  {
    label: "Cancelled",
    value: "CANCELLED",
    colorClass: "text-red-600",
    backgroundClass: "bg-red-50",
    icon: Alert02FreeIcons,
  },
];
