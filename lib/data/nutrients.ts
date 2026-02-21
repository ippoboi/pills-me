/**
 * Nutrient reference data for the Supplement Planner
 *
 * This file contains static nutrient definitions used for:
 * - Seeding the database
 * - Type-safe nutrient references in the application
 * - Unit conversions (IU to mcg, etc.)
 */

// ============================================================================
// Nutrient Categories
// ============================================================================

export const NUTRIENT_CATEGORIES = [
  { id: 'vitamins', label: 'Vitamins', sort_order: 1 },
  { id: 'minerals', label: 'Minerals', sort_order: 2 },
  { id: 'fatty-acids', label: 'Fatty Acids', sort_order: 3 },
  { id: 'amino-acids', label: 'Amino Acids', sort_order: 4 },
  { id: 'other', label: 'Other', sort_order: 5 },
] as const;

export type NutrientCategoryId = (typeof NUTRIENT_CATEGORIES)[number]['id'];

// ============================================================================
// Supplement Categories (for categorizing user supplements)
// ============================================================================

export const SUPPLEMENT_CATEGORIES = [
  { id: 'general', label: 'General Health', sort_order: 1 },
  { id: 'sleep', label: 'Sleep Support', sort_order: 2 },
  { id: 'energy', label: 'Energy', sort_order: 3 },
  { id: 'immune', label: 'Immune Health', sort_order: 4 },
  { id: 'cognitive', label: 'Cognitive', sort_order: 5 },
  { id: 'joint', label: 'Joint Health', sort_order: 6 },
  { id: 'heart', label: 'Heart Health', sort_order: 7 },
  { id: 'digestive', label: 'Digestive', sort_order: 8 },
  { id: 'skin', label: 'Skin & Beauty', sort_order: 9 },
  { id: 'fitness', label: 'Fitness & Recovery', sort_order: 10 },
] as const;

export type SupplementCategoryId = (typeof SUPPLEMENT_CATEGORIES)[number]['id'];

// ============================================================================
// Nutrient Definitions
// ============================================================================

export interface NutrientDefinition {
  name: string;
  slug: string;
  category_id: NutrientCategoryId;
  default_unit: string;
  alternate_unit?: string;
  /** Multiply alternate_unit value by this to get default_unit */
  conversion_factor?: number;
  description?: string;
}

export const NUTRIENTS: NutrientDefinition[] = [
  // ---------------------------------------------------------------------------
  // Fat-Soluble Vitamins
  // ---------------------------------------------------------------------------
  {
    name: 'Vitamin A',
    slug: 'vitamin-a',
    category_id: 'vitamins',
    default_unit: 'mcg',
    alternate_unit: 'IU',
    conversion_factor: 0.3, // 1 IU retinol = 0.3 mcg RAE
    description: 'Retinol Activity Equivalents (RAE)',
  },
  {
    name: 'Vitamin D',
    slug: 'vitamin-d',
    category_id: 'vitamins',
    default_unit: 'mcg',
    alternate_unit: 'IU',
    conversion_factor: 0.025, // 1 IU = 0.025 mcg (or 40 IU = 1 mcg)
    description: 'Cholecalciferol (D3) or Ergocalciferol (D2)',
  },
  {
    name: 'Vitamin E',
    slug: 'vitamin-e',
    category_id: 'vitamins',
    default_unit: 'mg',
    alternate_unit: 'IU',
    conversion_factor: 0.67, // 1 IU natural = 0.67 mg alpha-tocopherol
    description: 'Alpha-tocopherol',
  },
  {
    name: 'Vitamin K',
    slug: 'vitamin-k',
    category_id: 'vitamins',
    default_unit: 'mcg',
    description: 'Phylloquinone (K1) and Menaquinones (K2)',
  },

  // ---------------------------------------------------------------------------
  // Water-Soluble Vitamins (B-complex)
  // ---------------------------------------------------------------------------
  {
    name: 'Vitamin B1 (Thiamine)',
    slug: 'vitamin-b1',
    category_id: 'vitamins',
    default_unit: 'mg',
  },
  {
    name: 'Vitamin B2 (Riboflavin)',
    slug: 'vitamin-b2',
    category_id: 'vitamins',
    default_unit: 'mg',
  },
  {
    name: 'Vitamin B3 (Niacin)',
    slug: 'vitamin-b3',
    category_id: 'vitamins',
    default_unit: 'mg',
    description: 'Niacin Equivalents (NE). Includes nicotinic acid and nicotinamide.',
  },
  {
    name: 'Vitamin B5 (Pantothenic Acid)',
    slug: 'vitamin-b5',
    category_id: 'vitamins',
    default_unit: 'mg',
  },
  {
    name: 'Vitamin B6',
    slug: 'vitamin-b6',
    category_id: 'vitamins',
    default_unit: 'mg',
    description: 'Pyridoxine, Pyridoxal, Pyridoxamine',
  },
  {
    name: 'Vitamin B7 (Biotin)',
    slug: 'vitamin-b7',
    category_id: 'vitamins',
    default_unit: 'mcg',
  },
  {
    name: 'Vitamin B9 (Folate)',
    slug: 'vitamin-b9',
    category_id: 'vitamins',
    default_unit: 'mcg',
    description: 'Dietary Folate Equivalents (DFE). UL applies to synthetic folic acid only.',
  },
  {
    name: 'Vitamin B12',
    slug: 'vitamin-b12',
    category_id: 'vitamins',
    default_unit: 'mcg',
    description: 'Cobalamin',
  },

  // ---------------------------------------------------------------------------
  // Water-Soluble Vitamins (Other)
  // ---------------------------------------------------------------------------
  {
    name: 'Vitamin C',
    slug: 'vitamin-c',
    category_id: 'vitamins',
    default_unit: 'mg',
    description: 'Ascorbic Acid',
  },

  // ---------------------------------------------------------------------------
  // Macro Minerals
  // ---------------------------------------------------------------------------
  {
    name: 'Calcium',
    slug: 'calcium',
    category_id: 'minerals',
    default_unit: 'mg',
  },
  {
    name: 'Magnesium',
    slug: 'magnesium',
    category_id: 'minerals',
    default_unit: 'mg',
    description: 'UL (250mg) applies to supplements only, not dietary intake.',
  },
  {
    name: 'Potassium',
    slug: 'potassium',
    category_id: 'minerals',
    default_unit: 'mg',
  },
  {
    name: 'Phosphorus',
    slug: 'phosphorus',
    category_id: 'minerals',
    default_unit: 'mg',
  },

  // ---------------------------------------------------------------------------
  // Trace Minerals
  // ---------------------------------------------------------------------------
  {
    name: 'Iron',
    slug: 'iron',
    category_id: 'minerals',
    default_unit: 'mg',
    description: 'No EFSA UL established. Safe supplemental level: ~25mg.',
  },
  {
    name: 'Zinc',
    slug: 'zinc',
    category_id: 'minerals',
    default_unit: 'mg',
  },
  {
    name: 'Selenium',
    slug: 'selenium',
    category_id: 'minerals',
    default_unit: 'mcg',
  },
  {
    name: 'Copper',
    slug: 'copper',
    category_id: 'minerals',
    default_unit: 'mg',
  },
  {
    name: 'Manganese',
    slug: 'manganese',
    category_id: 'minerals',
    default_unit: 'mg',
    description: 'No EFSA UL. Safe level of intake: 8mg for adults.',
  },
  {
    name: 'Iodine',
    slug: 'iodine',
    category_id: 'minerals',
    default_unit: 'mcg',
  },
  {
    name: 'Chromium',
    slug: 'chromium',
    category_id: 'minerals',
    default_unit: 'mcg',
    description: 'No EFSA DRV established.',
  },
  {
    name: 'Molybdenum',
    slug: 'molybdenum',
    category_id: 'minerals',
    default_unit: 'mcg',
  },

  // ---------------------------------------------------------------------------
  // Fatty Acids
  // ---------------------------------------------------------------------------
  {
    name: 'Omega-3 (EPA)',
    slug: 'omega-3-epa',
    category_id: 'fatty-acids',
    default_unit: 'mg',
    description: 'Eicosapentaenoic acid',
  },
  {
    name: 'Omega-3 (DHA)',
    slug: 'omega-3-dha',
    category_id: 'fatty-acids',
    default_unit: 'mg',
    description: 'Docosahexaenoic acid',
  },
  {
    name: 'Omega-3 (ALA)',
    slug: 'omega-3-ala',
    category_id: 'fatty-acids',
    default_unit: 'mg',
    description: 'Alpha-linolenic acid (essential)',
  },
  {
    name: 'Omega-3 (Combined EPA+DHA)',
    slug: 'omega-3-epa-dha',
    category_id: 'fatty-acids',
    default_unit: 'mg',
    description: 'Combined EPA and DHA. EFSA AI: 250mg/day.',
  },

  // ---------------------------------------------------------------------------
  // Amino Acids
  // ---------------------------------------------------------------------------
  {
    name: 'L-Theanine',
    slug: 'l-theanine',
    category_id: 'amino-acids',
    default_unit: 'mg',
    description: 'Amino acid found in tea. No official DRV.',
  },
  {
    name: 'L-Tyrosine',
    slug: 'l-tyrosine',
    category_id: 'amino-acids',
    default_unit: 'mg',
    description: 'Precursor to dopamine and norepinephrine.',
  },
  {
    name: 'L-Glutamine',
    slug: 'l-glutamine',
    category_id: 'amino-acids',
    default_unit: 'mg',
  },
  {
    name: 'Taurine',
    slug: 'taurine',
    category_id: 'amino-acids',
    default_unit: 'mg',
    description: 'Conditionally essential amino acid.',
  },
  {
    name: 'Glycine',
    slug: 'glycine',
    category_id: 'amino-acids',
    default_unit: 'mg',
  },

  // ---------------------------------------------------------------------------
  // Other Nutrients
  // ---------------------------------------------------------------------------
  {
    name: 'Melatonin',
    slug: 'melatonin',
    category_id: 'other',
    default_unit: 'mg',
    description: 'Sleep hormone. Typical dose: 0.5-5mg. No official DRV.',
  },
  {
    name: 'Coenzyme Q10',
    slug: 'coq10',
    category_id: 'other',
    default_unit: 'mg',
    description: 'Ubiquinone. Typical dose: 30-200mg.',
  },
  {
    name: 'Ashwagandha',
    slug: 'ashwagandha',
    category_id: 'other',
    default_unit: 'mg',
    description: 'Adaptogenic herb. Typical dose: 300-600mg extract.',
  },
  {
    name: 'Collagen',
    slug: 'collagen',
    category_id: 'other',
    default_unit: 'g',
    description: 'Hydrolyzed collagen peptides. Typical dose: 2.5-15g.',
  },
  {
    name: 'Probiotics',
    slug: 'probiotics',
    category_id: 'other',
    default_unit: 'CFU',
    description: 'Colony-forming units. Typical dose: 1-100 billion CFU.',
  },
  {
    name: 'Creatine',
    slug: 'creatine',
    category_id: 'other',
    default_unit: 'g',
    description: 'Creatine monohydrate. Typical dose: 3-5g/day.',
  },
  {
    name: 'Caffeine',
    slug: 'caffeine',
    category_id: 'other',
    default_unit: 'mg',
    description: 'EFSA safe limit: 400mg/day for adults.',
  },
  {
    name: 'Choline',
    slug: 'choline',
    category_id: 'other',
    default_unit: 'mg',
    description: 'Essential nutrient. EFSA AI: 400mg/day.',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get nutrient by slug
 */
export function getNutrientBySlug(slug: string): NutrientDefinition | undefined {
  return NUTRIENTS.find((n) => n.slug === slug);
}

/**
 * Get all nutrients by category
 */
export function getNutrientsByCategory(categoryId: NutrientCategoryId): NutrientDefinition[] {
  return NUTRIENTS.filter((n) => n.category_id === categoryId);
}

/**
 * Convert from alternate unit to default unit
 * Example: convertToDefaultUnit('vitamin-d', 1000, 'IU') => 25 (mcg)
 */
export function convertToDefaultUnit(slug: string, value: number, fromUnit: string): number {
  const nutrient = getNutrientBySlug(slug);
  if (!nutrient) return value;

  if (fromUnit === nutrient.default_unit) return value;

  if (fromUnit === nutrient.alternate_unit && nutrient.conversion_factor) {
    return value * nutrient.conversion_factor;
  }

  return value;
}

/**
 * Convert from default unit to alternate unit
 * Example: convertToAlternateUnit('vitamin-d', 25, 'IU') => 1000 (IU)
 */
export function convertToAlternateUnit(slug: string, value: number, toUnit: string): number {
  const nutrient = getNutrientBySlug(slug);
  if (!nutrient) return value;

  if (toUnit === nutrient.default_unit) return value;

  if (toUnit === nutrient.alternate_unit && nutrient.conversion_factor) {
    return value / nutrient.conversion_factor;
  }

  return value;
}
