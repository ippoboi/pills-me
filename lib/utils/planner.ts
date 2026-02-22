/**
 * Planner Calculation Utilities
 *
 * Pure functions for calculating supplement intake, age groups,
 * and nutrient status for the Supplement Planner feature.
 */

import type {
  AgeGroup,
  IntakeStatus,
  IntakeResult,
  LocalPlanItem,
  Nutrient,
  NutrientLimit,
} from "@/lib/types/planner";

/**
 * Calculate age from birthdate.
 *
 * @param birthdate - The person's date of birth
 * @param today - Optional reference date (defaults to current date)
 * @returns Age in years
 */
export function calculateAge(birthdate: Date, today?: Date): number {
  const referenceDate = today ?? new Date();

  let age = referenceDate.getFullYear() - birthdate.getFullYear();

  // Check if birthday hasn't occurred yet this year
  const monthDiff = referenceDate.getMonth() - birthdate.getMonth();
  const dayDiff = referenceDate.getDate() - birthdate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

/**
 * Map age to EFSA age group.
 *
 * Age groups: '18-50', '51-70', '71+'
 * Edge case: age < 18 returns '18-50' (youngest adult group)
 *
 * @param birthdate - The person's date of birth
 * @param today - Optional reference date (defaults to current date)
 * @returns EFSA age group
 */
export function getAgeGroup(birthdate: Date, today?: Date): AgeGroup {
  const age = calculateAge(birthdate, today);

  if (age <= 50) {
    return "18-50";
  } else if (age <= 70) {
    return "51-70";
  } else {
    return "71+";
  }
}

/**
 * Determine intake status based on total intake and upper limit.
 *
 * - 'ok': under 80% of limit OR no limit exists
 * - 'warning': 80-100% of limit
 * - 'danger': over 100% of limit
 *
 * @param total - Total daily intake amount
 * @param upperLimit - Upper limit (null if not established)
 * @returns Intake status
 */
export function getIntakeStatus(
  total: number,
  upperLimit: number | null
): IntakeStatus {
  if (upperLimit === null) {
    return "ok";
  }

  const percentage = (total / upperLimit) * 100;

  if (percentage > 100) {
    return "danger";
  } else if (percentage >= 80) {
    return "warning";
  } else {
    return "ok";
  }
}

/**
 * Calculate total nutrient intake from draft items and active supplements.
 *
 * Sums nutrients across all items with servingsPerDay multiplier,
 * looks up limits, calculates percentages, and determines status.
 *
 * @param draftItems - Items in the draft plan
 * @param activeSupplements - Currently active supplements
 * @param limits - Map of nutrient ID to nutrient limit
 * @param nutrients - Map of nutrient ID to nutrient data
 * @returns Array of intake results for each nutrient
 */
export function calculateIntake(
  draftItems: LocalPlanItem[],
  activeSupplements: LocalPlanItem[],
  limits: Map<string, NutrientLimit>,
  nutrients: Map<string, Nutrient>
): IntakeResult[] {
  // Combine all items
  const allItems = [...draftItems, ...activeSupplements];

  // Aggregate totals by nutrient ID
  const totals = new Map<
    string,
    {
      nutrientId: string;
      nutrientSlug: string;
      total: number;
      unit: string;
    }
  >();

  for (const item of allItems) {
    for (const entry of item.nutrients) {
      const existing = totals.get(entry.nutrientId);

      if (existing) {
        existing.total += entry.amount * item.servingsPerDay;
      } else {
        totals.set(entry.nutrientId, {
          nutrientId: entry.nutrientId,
          nutrientSlug: entry.nutrientSlug,
          total: entry.amount * item.servingsPerDay,
          unit: entry.unit,
        });
      }
    }
  }

  // Build results array
  const results: IntakeResult[] = [];

  for (const [nutrientId, data] of totals) {
    const nutrient = nutrients.get(nutrientId);
    const limit = limits.get(nutrientId);

    // Get effective upper limit (upper_limit or safe_level)
    const effectiveUpperLimit = limit?.upper_limit ?? limit?.safe_level ?? null;

    // Calculate percentages
    const percentOfRda =
      limit?.rda !== null && limit?.rda !== undefined
        ? (data.total / limit.rda) * 100
        : null;

    const percentOfLimit =
      effectiveUpperLimit !== null
        ? (data.total / effectiveUpperLimit) * 100
        : null;

    // Determine status
    const status = getIntakeStatus(data.total, effectiveUpperLimit);

    results.push({
      nutrientId: data.nutrientId,
      nutrientName: nutrient?.name ?? data.nutrientSlug,
      nutrientSlug: data.nutrientSlug,
      category: nutrient?.category_id ?? "unknown",
      total: data.total,
      unit: data.unit,
      rda: limit?.rda ?? null,
      upperLimit: effectiveUpperLimit,
      percentOfRda,
      percentOfLimit,
      status,
    });
  }

  return results;
}
