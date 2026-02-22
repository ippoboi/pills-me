/**
 * Planner Validation Utilities
 *
 * Validation functions for planner API inputs.
 */

import type { ValidationResult } from "@/lib/types/supplements";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_TIME_OF_DAY = ["MORNING", "LUNCH", "DINNER", "BEFORE_SLEEP"];
const VALID_PLAN_STATUS = ["draft", "active", "paused", "archived"];

/**
 * Validates UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validates CreatePlanInput
 */
export function validateCreatePlanInput(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  const input = data as Record<string, unknown>;

  // name: required, 1-100 chars
  if (!input.name || typeof input.name !== "string") {
    errors.push("Name is required and must be a string");
  } else if (input.name.trim().length === 0) {
    errors.push("Name cannot be empty");
  } else if (input.name.trim().length > 100) {
    errors.push("Name must be 100 characters or less");
  }

  // notes: optional, max 500 chars
  if (input.notes !== undefined && input.notes !== null) {
    if (typeof input.notes !== "string") {
      errors.push("Notes must be a string");
    } else if (input.notes.length > 500) {
      errors.push("Notes must be 500 characters or less");
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validates UpdatePlanInput
 */
export function validateUpdatePlanInput(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  const input = data as Record<string, unknown>;

  // At least one field must be provided
  if (
    input.name === undefined &&
    input.notes === undefined &&
    input.status === undefined
  ) {
    errors.push("At least one field (name, notes, or status) must be provided");
  }

  // name: optional, 1-100 chars
  if (input.name !== undefined) {
    if (typeof input.name !== "string") {
      errors.push("Name must be a string");
    } else if (input.name.trim().length === 0) {
      errors.push("Name cannot be empty");
    } else if (input.name.trim().length > 100) {
      errors.push("Name must be 100 characters or less");
    }
  }

  // notes: optional, max 500 chars
  if (input.notes !== undefined && input.notes !== null) {
    if (typeof input.notes !== "string") {
      errors.push("Notes must be a string");
    } else if (input.notes.length > 500) {
      errors.push("Notes must be 500 characters or less");
    }
  }

  // status: optional, must be valid
  if (input.status !== undefined) {
    if (
      typeof input.status !== "string" ||
      !VALID_PLAN_STATUS.includes(input.status)
    ) {
      errors.push(`Status must be one of: ${VALID_PLAN_STATUS.join(", ")}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validates ActivatePlanInput
 */
export function validateActivatePlanInput(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  const input = data as Record<string, unknown>;

  // schedules: required, non-empty array of valid TimeOfDay
  if (!input.schedules) {
    errors.push("Schedules array is required");
  } else if (!Array.isArray(input.schedules)) {
    errors.push("Schedules must be an array");
  } else if (input.schedules.length === 0) {
    errors.push("At least one schedule time is required");
  } else {
    const invalidTimes = input.schedules.filter(
      (time) => typeof time !== "string" || !VALID_TIME_OF_DAY.includes(time)
    );
    if (invalidTimes.length > 0) {
      errors.push(
        `Invalid schedule times: ${invalidTimes.join(", ")}. Valid options: ${VALID_TIME_OF_DAY.join(", ")}`
      );
    }
  }

  // timezone: required, non-empty string
  if (!input.timezone) {
    errors.push("Timezone is required");
  } else if (typeof input.timezone !== "string") {
    errors.push("Timezone must be a string");
  } else if (input.timezone.trim().length === 0) {
    errors.push("Timezone cannot be empty");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
