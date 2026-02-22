/**
 * Planner Utility Tests
 *
 * TDD tests for supplement planner calculation utilities.
 */

import type {
  LocalPlanItem,
  Nutrient,
  NutrientLimit,
} from "@/lib/types/planner";

import {
  calculateAge,
  getAgeGroup,
  getIntakeStatus,
  calculateIntake,
} from "@/lib/utils/planner";

// =============================================================================
// calculateAge Tests
// =============================================================================

describe("calculateAge", () => {
  it("calculates age correctly for a 35 year old", () => {
    const birthdate = new Date("1990-06-15");
    const today = new Date("2025-06-16");
    expect(calculateAge(birthdate, today)).toBe(35);
  });

  it("handles birthday not yet occurred this year", () => {
    const birthdate = new Date("1990-06-15");
    const today = new Date("2025-06-14");
    expect(calculateAge(birthdate, today)).toBe(34);
  });

  it("handles birthday already passed this year", () => {
    const birthdate = new Date("1990-03-15");
    const today = new Date("2025-06-15");
    expect(calculateAge(birthdate, today)).toBe(35);
  });

  it("handles birthday on exactly today", () => {
    const birthdate = new Date("1990-06-15");
    const today = new Date("2025-06-15");
    expect(calculateAge(birthdate, today)).toBe(35);
  });

  it("calculates age at year boundary", () => {
    const birthdate = new Date("1990-12-31");
    const today = new Date("2025-01-01");
    expect(calculateAge(birthdate, today)).toBe(34);
  });

  it("uses current date if today is not provided", () => {
    const birthdate = new Date("2000-01-01");
    const age = calculateAge(birthdate);
    expect(age).toBeGreaterThanOrEqual(24);
  });
});

// =============================================================================
// getAgeGroup Tests
// =============================================================================

describe("getAgeGroup", () => {
  it("returns '18-50' for age 18", () => {
    const birthdate = new Date("2007-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("18-50");
  });

  it("returns '18-50' for age 35", () => {
    const birthdate = new Date("1990-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("18-50");
  });

  it("returns '18-50' for age 50", () => {
    const birthdate = new Date("1975-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("18-50");
  });

  it("returns '51-70' for age 51", () => {
    const birthdate = new Date("1974-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("51-70");
  });

  it("returns '51-70' for age 60", () => {
    const birthdate = new Date("1965-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("51-70");
  });

  it("returns '51-70' for age 70", () => {
    const birthdate = new Date("1955-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("51-70");
  });

  it("returns '71+' for age 71", () => {
    const birthdate = new Date("1954-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("71+");
  });

  it("returns '71+' for age 85", () => {
    const birthdate = new Date("1940-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("71+");
  });

  it("returns '18-50' for age under 18 (youngest adult group)", () => {
    const birthdate = new Date("2010-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("18-50");
  });

  it("returns '18-50' for age 17", () => {
    const birthdate = new Date("2008-01-01");
    const today = new Date("2025-06-15");
    expect(getAgeGroup(birthdate, today)).toBe("18-50");
  });
});

// =============================================================================
// getIntakeStatus Tests
// =============================================================================

describe("getIntakeStatus", () => {
  it("returns 'ok' when under 80% of limit", () => {
    expect(getIntakeStatus(70, 100)).toBe("ok");
  });

  it("returns 'ok' when at exactly 79% of limit", () => {
    expect(getIntakeStatus(79, 100)).toBe("ok");
  });

  it("returns 'warning' when at exactly 80% of limit", () => {
    expect(getIntakeStatus(80, 100)).toBe("warning");
  });

  it("returns 'warning' when between 80-100% of limit", () => {
    expect(getIntakeStatus(90, 100)).toBe("warning");
  });

  it("returns 'warning' when at exactly 100% of limit", () => {
    expect(getIntakeStatus(100, 100)).toBe("warning");
  });

  it("returns 'danger' when over 100% of limit", () => {
    expect(getIntakeStatus(101, 100)).toBe("danger");
  });

  it("returns 'danger' when significantly over limit", () => {
    expect(getIntakeStatus(200, 100)).toBe("danger");
  });

  it("returns 'ok' when no limit exists (null)", () => {
    expect(getIntakeStatus(1000, null)).toBe("ok");
  });

  it("returns 'ok' when total is zero", () => {
    expect(getIntakeStatus(0, 100)).toBe("ok");
  });

  it("handles decimal percentages correctly", () => {
    // 79.9% should be 'ok'
    expect(getIntakeStatus(79.9, 100)).toBe("ok");
    // 80.1% should be 'warning'
    expect(getIntakeStatus(80.1, 100)).toBe("warning");
  });
});

// =============================================================================
// calculateIntake Tests
// =============================================================================

describe("calculateIntake", () => {
  // Mock nutrients map
  const nutrients: Map<string, Nutrient> = new Map([
    [
      "nutrient-1",
      {
        id: "nutrient-1",
        name: "Vitamin D",
        slug: "vitamin-d",
        default_unit: "mcg",
        category_id: "vitamins",
        description: null,
        alternate_unit: null,
        conversion_factor: null,
        created_at: null,
      },
    ],
    [
      "nutrient-2",
      {
        id: "nutrient-2",
        name: "Zinc",
        slug: "zinc",
        default_unit: "mg",
        category_id: "minerals",
        description: null,
        alternate_unit: null,
        conversion_factor: null,
        created_at: null,
      },
    ],
    [
      "nutrient-3",
      {
        id: "nutrient-3",
        name: "Vitamin K",
        slug: "vitamin-k",
        default_unit: "mcg",
        category_id: "vitamins",
        description: null,
        alternate_unit: null,
        conversion_factor: null,
        created_at: null,
      },
    ],
  ]);

  // Mock limits map
  const limits: Map<string, NutrientLimit> = new Map([
    [
      "nutrient-1",
      {
        id: "limit-1",
        nutrient_id: "nutrient-1",
        age_group: "18-50",
        sex: "all",
        rda: 15,
        upper_limit: 100,
        safe_level: null,
        unit: "mcg",
        source: "EFSA",
        ul_context: null,
      },
    ],
    [
      "nutrient-2",
      {
        id: "limit-2",
        nutrient_id: "nutrient-2",
        age_group: "18-50",
        sex: "male",
        rda: 11,
        upper_limit: 25,
        safe_level: null,
        unit: "mg",
        source: "EFSA",
        ul_context: null,
      },
    ],
    // Note: nutrient-3 (Vitamin K) has no upper_limit
    [
      "nutrient-3",
      {
        id: "limit-3",
        nutrient_id: "nutrient-3",
        age_group: "18-50",
        sex: "all",
        rda: 70,
        upper_limit: null,
        safe_level: null,
        unit: "mcg",
        source: null,
        ul_context: null,
      },
    ],
  ]);

  it("calculates intake for a single item with one nutrient", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Vitamin D Supplement",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 50,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(draftItems, [], limits, nutrients);

    expect(results).toHaveLength(1);
    expect(results[0].nutrientId).toBe("nutrient-1");
    expect(results[0].nutrientName).toBe("Vitamin D");
    expect(results[0].total).toBe(50);
    expect(results[0].unit).toBe("mcg");
    expect(results[0].rda).toBe(15);
    expect(results[0].upperLimit).toBe(100);
    expect(results[0].percentOfRda).toBeCloseTo(333.33, 1);
    expect(results[0].percentOfLimit).toBe(50);
    expect(results[0].status).toBe("ok");
  });

  it("sums nutrients across multiple items", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Vitamin D Supplement",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 25,
            unit: "mcg",
          },
        ],
      },
      {
        id: "item-2",
        name: "Multivitamin",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 10,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(draftItems, [], limits, nutrients);

    expect(results).toHaveLength(1);
    expect(results[0].total).toBe(35);
  });

  it("applies servingsPerDay multiplier", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Vitamin D Supplement",
        servingsPerDay: 2,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 25,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(draftItems, [], limits, nutrients);

    expect(results).toHaveLength(1);
    expect(results[0].total).toBe(50); // 25 * 2 servings
  });

  it("combines draft items with active supplements", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Vitamin D Supplement",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 30,
            unit: "mcg",
          },
        ],
      },
    ];

    const activeSupplements: LocalPlanItem[] = [
      {
        id: "active-1",
        name: "Daily Multivitamin",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 15,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(
      draftItems,
      activeSupplements,
      limits,
      nutrients
    );

    expect(results).toHaveLength(1);
    expect(results[0].total).toBe(45); // 30 + 15
  });

  it("handles multiple different nutrients", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Multivitamin",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 25,
            unit: "mcg",
          },
          {
            nutrientId: "nutrient-2",
            nutrientSlug: "zinc",
            amount: 15,
            unit: "mg",
          },
        ],
      },
    ];

    const results = calculateIntake(draftItems, [], limits, nutrients);

    expect(results).toHaveLength(2);

    const vitaminD = results.find((r) => r.nutrientSlug === "vitamin-d");
    const zinc = results.find((r) => r.nutrientSlug === "zinc");

    expect(vitaminD?.total).toBe(25);
    expect(zinc?.total).toBe(15);
  });

  it("calculates warning status for 80-100% of limit", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "High Dose Vitamin D",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 85,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(draftItems, [], limits, nutrients);

    expect(results[0].status).toBe("warning");
    expect(results[0].percentOfLimit).toBe(85);
  });

  it("calculates danger status for over 100% of limit", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Very High Dose Vitamin D",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 150,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(draftItems, [], limits, nutrients);

    expect(results[0].status).toBe("danger");
    expect(results[0].percentOfLimit).toBe(150);
  });

  it("returns ok status when no upper limit exists", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Vitamin K Supplement",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-3",
            nutrientSlug: "vitamin-k",
            amount: 500,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(draftItems, [], limits, nutrients);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("ok");
    expect(results[0].upperLimit).toBeNull();
    expect(results[0].percentOfLimit).toBeNull();
  });

  it("returns empty array for empty inputs", () => {
    const results = calculateIntake([], [], limits, nutrients);
    expect(results).toHaveLength(0);
  });

  it("handles items with no nutrients", () => {
    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Empty Supplement",
        servingsPerDay: 1,
        nutrients: [],
      },
    ];

    const results = calculateIntake(draftItems, [], limits, nutrients);
    expect(results).toHaveLength(0);
  });

  it("calculates percentOfRda as null when rda is null", () => {
    const limitsWithNoRda: Map<string, NutrientLimit> = new Map([
      [
        "nutrient-1",
        {
          id: "limit-1",
          nutrient_id: "nutrient-1",
          age_group: "18-50",
          sex: "all",
          rda: null,
          upper_limit: 100,
          safe_level: null,
          unit: "mcg",
          source: "EFSA",
          ul_context: null,
        },
      ],
    ]);

    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Test Supplement",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 50,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(draftItems, [], limitsWithNoRda, nutrients);

    expect(results[0].rda).toBeNull();
    expect(results[0].percentOfRda).toBeNull();
  });

  it("uses safe_level as upper limit when upper_limit is null", () => {
    const limitsWithSafeLevel: Map<string, NutrientLimit> = new Map([
      [
        "nutrient-1",
        {
          id: "limit-1",
          nutrient_id: "nutrient-1",
          age_group: "18-50",
          sex: "all",
          rda: 15,
          upper_limit: null,
          safe_level: 50,
          unit: "mcg",
          source: "EFSA_SAFE_LEVEL",
          ul_context: null,
        },
      ],
    ]);

    const draftItems: LocalPlanItem[] = [
      {
        id: "item-1",
        name: "Test Supplement",
        servingsPerDay: 1,
        nutrients: [
          {
            nutrientId: "nutrient-1",
            nutrientSlug: "vitamin-d",
            amount: 45,
            unit: "mcg",
          },
        ],
      },
    ];

    const results = calculateIntake(
      draftItems,
      [],
      limitsWithSafeLevel,
      nutrients
    );

    expect(results[0].upperLimit).toBe(50);
    expect(results[0].percentOfLimit).toBe(90);
    expect(results[0].status).toBe("warning");
  });
});
