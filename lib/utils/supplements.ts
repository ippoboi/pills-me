import type { TimeOfDay, SupplementStatus } from "../types";

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
