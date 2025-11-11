import type { TimeOfDay, SupplementStatus, SupplementSchedule } from "../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";

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
 * Calculate adherence progress for a supplement based on days
 * Returns percentage: (days taken / total days) * 100
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
  referenceDate?: string
): Promise<{ percentage: number }> {
  console.log("🔍 [ADHERENCE DEBUG] Starting calculation for:", {
    supplementId,
    userId,
    startDate,
    endDate,
    referenceDate,
  });

  // Use reference date or today (ensure YYYY-MM-DD format)
  const today = referenceDate || new Date().toISOString().split("T")[0];

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
    return { percentage: 0 };
  }
  if (!dateRegex.test(today)) {
    console.error("❌ [ADHERENCE DEBUG] Invalid referenceDate format:", today);
    return { percentage: 0 };
  }
  if (normalizedEndDate && !dateRegex.test(normalizedEndDate)) {
    console.error(
      "❌ [ADHERENCE DEBUG] Invalid endDate format:",
      normalizedEndDate
    );
    return { percentage: 0 };
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
    return { percentage: 0 };
  }
  if (isNaN(todayObj.getTime())) {
    console.error("❌ [ADHERENCE DEBUG] Invalid referenceDate:", today);
    return { percentage: 0 };
  }
  if (endDateObj && isNaN(endDateObj.getTime())) {
    console.error("❌ [ADHERENCE DEBUG] Invalid endDate:", normalizedEndDate);
    return { percentage: 0 };
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

  // Get distinct days where user took the supplement
  // A day is considered "taken" if there's at least one adherence record
  // Use proper timestamp range filtering for TIMESTAMPTZ column
  const endDateString =
    normalizedEndDate && normalizedEndDate < today ? normalizedEndDate : today;

  // Convert date strings to proper timestamp ranges for TIMESTAMPTZ comparison
  const startTimestamp = normalizedStartDate + "T00:00:00Z";
  const endTimestamp = endDateString + "T23:59:59.999Z";

  console.log("🔍 [ADHERENCE DEBUG] Query parameters:", {
    endDateString,
    startTimestamp,
    endTimestamp,
    supplementId,
    userId,
  });

  const { data: adherenceRecords, error: adherenceError } = await supabase
    .from("supplement_adherence")
    .select("taken_at")
    .eq("supplement_id", supplementId)
    .eq("user_id", userId)
    .gte("taken_at", startTimestamp)
    .lte("taken_at", endTimestamp);

  console.log("📋 [ADHERENCE DEBUG] Database query result:", {
    recordsCount: adherenceRecords?.length || 0,
    records: adherenceRecords,
    error: adherenceError,
  });

  if (adherenceError) {
    console.error(
      "❌ [ADHERENCE DEBUG] Error fetching adherence records:",
      adherenceError
    );
    return { percentage: 0 };
  }

  // Count distinct days taken
  // taken_at is a TIMESTAMPTZ column, extract date part for daily counting
  // This ensures timezone-independent daily adherence tracking
  const distinctDates = (adherenceRecords || []).map((r) => {
    const date = new Date(r.taken_at);
    const dateStr = date.toISOString().split("T")[0];
    console.log("📅 [ADHERENCE DEBUG] Processing record:", {
      originalTakenAt: r.taken_at,
      parsedDate: date.toISOString(),
      extractedDateStr: dateStr,
    });
    return dateStr;
  });

  const distinctDaysTaken = new Set(distinctDates).size;

  console.log("🎯 [ADHERENCE DEBUG] Distinct days processing:", {
    allDates: distinctDates,
    uniqueDates: Array.from(new Set(distinctDates)),
    distinctDaysTaken,
  });

  // Calculate percentage: days taken / total days * 100
  const adherencePercentage =
    totalDays > 0 ? Math.round((distinctDaysTaken / totalDays) * 100) : 0;

  console.log("✅ [ADHERENCE DEBUG] Final calculation:", {
    distinctDaysTaken,
    totalDays,
    adherencePercentage,
    calculation: `${distinctDaysTaken}/${totalDays} * 100 = ${adherencePercentage}%`,
  });

  return { percentage: adherencePercentage };
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
export function getAdherenceColorClass(adherencePercentage: number): string {
  if (adherencePercentage >= 90) {
    return "text-green-600";
  } else if (adherencePercentage >= 70) {
    return "text-amber-600";
  } else {
    return "text-red-600";
  }
}
