import { describe, it, expect } from "vitest";
import {
  isValidUUID,
  validateCreatePlanInput,
  validateUpdatePlanInput,
  validateActivatePlanInput,
} from "@/lib/utils/planner-validation";

describe("isValidUUID", () => {
  it("returns true for valid UUID", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("returns false for invalid UUID", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("")).toBe(false);
    expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false);
  });
});

describe("validateCreatePlanInput", () => {
  it("validates correct input", () => {
    const result = validateCreatePlanInput({
      name: "My Plan",
      notes: "Some notes",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it("validates name only (notes optional)", () => {
    const result = validateCreatePlanInput({ name: "My Plan" });
    expect(result.valid).toBe(true);
  });

  it("rejects missing name", () => {
    const result = validateCreatePlanInput({ notes: "Some notes" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required and must be a string");
  });

  it("rejects empty name", () => {
    const result = validateCreatePlanInput({ name: "   " });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name cannot be empty");
  });

  it("rejects name over 100 chars", () => {
    const result = validateCreatePlanInput({ name: "a".repeat(101) });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name must be 100 characters or less");
  });

  it("rejects notes over 500 chars", () => {
    const result = validateCreatePlanInput({
      name: "Plan",
      notes: "a".repeat(501),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Notes must be 500 characters or less");
  });

  it("rejects non-object input", () => {
    const result = validateCreatePlanInput("not an object");
    expect(result.valid).toBe(false);
  });
});

describe("validateUpdatePlanInput", () => {
  it("validates name update", () => {
    const result = validateUpdatePlanInput({ name: "New Name" });
    expect(result.valid).toBe(true);
  });

  it("validates status update", () => {
    const result = validateUpdatePlanInput({ status: "active" });
    expect(result.valid).toBe(true);
  });

  it("validates notes update", () => {
    const result = validateUpdatePlanInput({ notes: "New notes" });
    expect(result.valid).toBe(true);
  });

  it("rejects empty update", () => {
    const result = validateUpdatePlanInput({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "At least one field (name, notes, or status) must be provided"
    );
  });

  it("rejects invalid status", () => {
    const result = validateUpdatePlanInput({ status: "invalid" });
    expect(result.valid).toBe(false);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["draft", "active", "paused", "archived"]) {
      const result = validateUpdatePlanInput({ status });
      expect(result.valid).toBe(true);
    }
  });
});

describe("validateActivatePlanInput", () => {
  it("validates correct input", () => {
    const result = validateActivatePlanInput({
      schedules: ["MORNING", "DINNER"],
      timezone: "Europe/Sofia",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing schedules", () => {
    const result = validateActivatePlanInput({ timezone: "UTC" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Schedules array is required");
  });

  it("rejects empty schedules array", () => {
    const result = validateActivatePlanInput({ schedules: [], timezone: "UTC" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("At least one schedule time is required");
  });

  it("rejects invalid schedule times", () => {
    const result = validateActivatePlanInput({
      schedules: ["MORNING", "INVALID"],
      timezone: "UTC",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects missing timezone", () => {
    const result = validateActivatePlanInput({ schedules: ["MORNING"] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Timezone is required");
  });

  it("accepts all valid time of day options", () => {
    const result = validateActivatePlanInput({
      schedules: ["MORNING", "LUNCH", "DINNER", "BEFORE_SLEEP"],
      timezone: "UTC",
    });
    expect(result.valid).toBe(true);
  });
});
