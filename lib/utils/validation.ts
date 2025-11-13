import type { SupplementInput, TimeOfDay, ValidationResult } from "../types";

/**
 * Validate supplement input data
 */
export function validateSupplementInput(
  data: SupplementInput
): ValidationResult {
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

  if (data.missed_days && !Array.isArray(data.missed_days)) {
    errors.push("Missed days must be an array");
  } else if (data.missed_days && Array.isArray(data.missed_days)) {
    const invalidDates = data.missed_days.filter(
      (date) => typeof date !== "string" || date.trim().length === 0
    );
    if (invalidDates.length > 0) {
      errors.push("All missed days must be non-empty strings");
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
