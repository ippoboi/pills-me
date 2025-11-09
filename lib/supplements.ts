import { Database } from "./supabase/database.types";

type TimeOfDay = Database["public"]["Enums"]["time_of_day"];
type SupplementStatus = Database["public"]["Enums"]["supplement_status"];

export interface SupplementInput {
  name: string;
  capsules_per_take: number;
  time_of_day: TimeOfDay[];
  recommendation?: string;
  source_url?: string;
  source_name?: string;
  start_date: string;
  end_date?: string;
  reason?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Validate supplement input data
 */
export function validateSupplementInput(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length === 0
  ) {
    errors.push("Name is required and must be a non-empty string");
  }

  if (
    !data.capsules_per_take ||
    typeof data.capsules_per_take !== "number" ||
    data.capsules_per_take < 1
  ) {
    errors.push("Capsules per take must be a positive number");
  }

  if (
    !data.time_of_day ||
    !Array.isArray(data.time_of_day) ||
    data.time_of_day.length === 0
  ) {
    errors.push("At least one time of day must be specified");
  } else {
    const validTimes: TimeOfDay[] = [
      "MORNING",
      "LUNCH",
      "DINNER",
      "BEFORE_SLEEP",
    ];
    const invalidTimes = data.time_of_day.filter(
      (time: string) => !validTimes.includes(time as TimeOfDay)
    );
    if (invalidTimes.length > 0) {
      errors.push(`Invalid time of day values: ${invalidTimes.join(", ")}`);
    }
  }

  if (!data.start_date || typeof data.start_date !== "string") {
    errors.push("Start date is required");
  } else {
    const startDate = new Date(data.start_date);
    if (isNaN(startDate.getTime())) {
      errors.push("Start date must be a valid date");
    }
  }

  // Optional field validation
  if (data.end_date && typeof data.end_date === "string") {
    const endDate = new Date(data.end_date);
    const startDate = new Date(data.start_date);
    if (isNaN(endDate.getTime())) {
      errors.push("End date must be a valid date");
    } else if (endDate <= startDate) {
      errors.push("End date must be after start date");
    }
  }

  if (data.recommendation && typeof data.recommendation !== "string") {
    errors.push("Recommendation must be a string");
  }

  if (data.reason && typeof data.reason !== "string") {
    errors.push("Reason must be a string");
  }

  if (data.source_url && typeof data.source_url !== "string") {
    errors.push("Source URL must be a string");
  }

  if (data.source_name && typeof data.source_name !== "string") {
    errors.push("Source name must be a string");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

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
 * Group schedule by time of day
 */
export function groupScheduleByTimeOfDay(
  schedules: any[]
): Record<TimeOfDay, any[]> {
  const grouped: Record<TimeOfDay, any[]> = {
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
 * Format adherence data for response
 */
export function formatAdherenceData(rows: any[]): any {
  return rows.map((row) => ({
    supplement_id: row.supplement_id,
    schedule_id: row.schedule_id,
    name: row.name,
    capsules_per_take: row.capsules_per_take,
    recommendation: row.recommendation || "",
    source_name: row.source_name || "",
    source_url: row.source_url || "",
    is_taken: !!row.adherence_id,
  }));
}

/**
 * Calculate stats from schedule data
 */
export function calculateScheduleStats(schedules: any[]): {
  total: number;
  taken: number;
  left: number;
} {
  const total = schedules.length;
  const taken = schedules.filter((s) => s.is_taken).length;
  const left = total - taken;

  return { total, taken, left };
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
