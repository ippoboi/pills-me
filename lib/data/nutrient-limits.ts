/**
 * Nutrient Limits Reference Data
 *
 * Primary source: EFSA (European Food Safety Authority) Dietary Reference Values
 * Fallback source: US IOM (Institute of Medicine) for nutrients without EFSA UL
 *
 * Last updated: 2026-02-21
 * Includes 2023-2024 EFSA revisions for: Vitamin B6, Selenium, Vitamin D, Vitamin E, Manganese
 *
 * References:
 * - EFSA DRV: https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values
 * - EFSA UL Summary: https://www.efsa.europa.eu/sites/default/files/2024-05/ul-summary-report.pdf
 */

// ============================================================================
// Types
// ============================================================================

export type AgeGroup = '18-50' | '51-70' | '71+';
export type Sex = 'male' | 'female' | 'all';
export type ULSource = 'EFSA' | 'IOM' | 'EFSA_SAFE_LEVEL' | 'TYPICAL_RANGE';

export interface NutrientLimitData {
  /** Reference to nutrient slug */
  nutrient_slug: string;
  /** Age group this limit applies to */
  age_group: AgeGroup;
  /** Sex this limit applies to ('all' if no difference) */
  sex: Sex;
  /** Population Reference Intake or Adequate Intake (daily) */
  rda: number | null;
  /** Tolerable Upper Intake Level (daily) */
  upper_limit: number | null;
  /** Safe level of intake (when UL cannot be established) */
  safe_level?: number | null;
  /** Unit for all values */
  unit: string;
  /** Source of the UL value */
  ul_source: ULSource | null;
  /** Special context for UL (e.g., 'supplements_only') */
  ul_context?: string;
}

// ============================================================================
// Nutrient Limits Data
// ============================================================================

export const NUTRIENT_LIMITS: NutrientLimitData[] = [
  // ===========================================================================
  // VITAMIN A (mcg RAE)
  // EFSA 2024: UL confirmed at 3000 mcg for adults
  // PRI differs by sex
  // ===========================================================================
  { nutrient_slug: 'vitamin-a', age_group: '18-50', sex: 'male', rda: 750, upper_limit: 3000, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-a', age_group: '18-50', sex: 'female', rda: 650, upper_limit: 3000, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-a', age_group: '51-70', sex: 'male', rda: 750, upper_limit: 3000, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-a', age_group: '51-70', sex: 'female', rda: 650, upper_limit: 3000, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-a', age_group: '71+', sex: 'all', rda: 700, upper_limit: 3000, unit: 'mcg', ul_source: 'EFSA' },

  // ===========================================================================
  // VITAMIN D (mcg) - EFSA 2023 confirmed UL at 100 mcg
  // AI (not PRI) - same for all adults, higher for 71+
  // ===========================================================================
  { nutrient_slug: 'vitamin-d', age_group: '18-50', sex: 'all', rda: 15, upper_limit: 100, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-d', age_group: '51-70', sex: 'all', rda: 15, upper_limit: 100, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-d', age_group: '71+', sex: 'all', rda: 20, upper_limit: 100, unit: 'mcg', ul_source: 'EFSA' },

  // ===========================================================================
  // VITAMIN E (mg alpha-tocopherol) - EFSA 2024 confirmed UL at 300 mg
  // AI differs by sex
  // ===========================================================================
  { nutrient_slug: 'vitamin-e', age_group: '18-50', sex: 'male', rda: 13, upper_limit: 300, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-e', age_group: '18-50', sex: 'female', rda: 11, upper_limit: 300, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-e', age_group: '51-70', sex: 'all', rda: 12, upper_limit: 300, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-e', age_group: '71+', sex: 'all', rda: 12, upper_limit: 300, unit: 'mg', ul_source: 'EFSA' },

  // ===========================================================================
  // VITAMIN K (mcg) - No EFSA UL established
  // AI ~70 mcg (approximately 1 mcg/kg body weight)
  // ===========================================================================
  { nutrient_slug: 'vitamin-k', age_group: '18-50', sex: 'all', rda: 70, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'vitamin-k', age_group: '51-70', sex: 'all', rda: 70, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'vitamin-k', age_group: '71+', sex: 'all', rda: 70, upper_limit: null, unit: 'mcg', ul_source: null },

  // ===========================================================================
  // VITAMIN C (mg) - No EFSA UL, using IOM fallback (2000 mg)
  // PRI differs by sex
  // ===========================================================================
  { nutrient_slug: 'vitamin-c', age_group: '18-50', sex: 'male', rda: 110, upper_limit: 2000, unit: 'mg', ul_source: 'IOM' },
  { nutrient_slug: 'vitamin-c', age_group: '18-50', sex: 'female', rda: 95, upper_limit: 2000, unit: 'mg', ul_source: 'IOM' },
  { nutrient_slug: 'vitamin-c', age_group: '51-70', sex: 'all', rda: 100, upper_limit: 2000, unit: 'mg', ul_source: 'IOM' },
  { nutrient_slug: 'vitamin-c', age_group: '71+', sex: 'all', rda: 100, upper_limit: 2000, unit: 'mg', ul_source: 'IOM' },

  // ===========================================================================
  // VITAMIN B1 - THIAMINE (mg) - No EFSA UL
  // PRI ~1.1 mg (0.1 mg/MJ, energy-based)
  // ===========================================================================
  { nutrient_slug: 'vitamin-b1', age_group: '18-50', sex: 'all', rda: 1.1, upper_limit: null, unit: 'mg', ul_source: null },
  { nutrient_slug: 'vitamin-b1', age_group: '51-70', sex: 'all', rda: 1.1, upper_limit: null, unit: 'mg', ul_source: null },
  { nutrient_slug: 'vitamin-b1', age_group: '71+', sex: 'all', rda: 1.0, upper_limit: null, unit: 'mg', ul_source: null },

  // ===========================================================================
  // VITAMIN B2 - RIBOFLAVIN (mg) - No EFSA UL
  // PRI 1.6 mg for adults (updated 2017)
  // ===========================================================================
  { nutrient_slug: 'vitamin-b2', age_group: '18-50', sex: 'all', rda: 1.6, upper_limit: null, unit: 'mg', ul_source: null },
  { nutrient_slug: 'vitamin-b2', age_group: '51-70', sex: 'all', rda: 1.6, upper_limit: null, unit: 'mg', ul_source: null },
  { nutrient_slug: 'vitamin-b2', age_group: '71+', sex: 'all', rda: 1.6, upper_limit: null, unit: 'mg', ul_source: null },

  // ===========================================================================
  // VITAMIN B3 - NIACIN (mg NE)
  // EFSA UL: Nicotinic acid 10mg, Nicotinamide 900mg
  // Using 35mg (IOM) as general UL since most supplements use nicotinamide
  // ===========================================================================
  { nutrient_slug: 'vitamin-b3', age_group: '18-50', sex: 'male', rda: 16, upper_limit: 35, unit: 'mg', ul_source: 'IOM' },
  { nutrient_slug: 'vitamin-b3', age_group: '18-50', sex: 'female', rda: 14, upper_limit: 35, unit: 'mg', ul_source: 'IOM' },
  { nutrient_slug: 'vitamin-b3', age_group: '51-70', sex: 'all', rda: 15, upper_limit: 35, unit: 'mg', ul_source: 'IOM' },
  { nutrient_slug: 'vitamin-b3', age_group: '71+', sex: 'all', rda: 14, upper_limit: 35, unit: 'mg', ul_source: 'IOM' },

  // ===========================================================================
  // VITAMIN B5 - PANTOTHENIC ACID (mg) - No EFSA UL
  // AI 5 mg for adults
  // ===========================================================================
  { nutrient_slug: 'vitamin-b5', age_group: '18-50', sex: 'all', rda: 5, upper_limit: null, unit: 'mg', ul_source: null },
  { nutrient_slug: 'vitamin-b5', age_group: '51-70', sex: 'all', rda: 5, upper_limit: null, unit: 'mg', ul_source: null },
  { nutrient_slug: 'vitamin-b5', age_group: '71+', sex: 'all', rda: 5, upper_limit: null, unit: 'mg', ul_source: null },

  // ===========================================================================
  // VITAMIN B6 (mg) - EFSA 2023: UL lowered to 12.5 mg (from 25 mg)
  // PRI differs slightly by sex
  // ===========================================================================
  { nutrient_slug: 'vitamin-b6', age_group: '18-50', sex: 'male', rda: 1.7, upper_limit: 12.5, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-b6', age_group: '18-50', sex: 'female', rda: 1.6, upper_limit: 12.5, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-b6', age_group: '51-70', sex: 'all', rda: 1.7, upper_limit: 12.5, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-b6', age_group: '71+', sex: 'all', rda: 1.7, upper_limit: 12.5, unit: 'mg', ul_source: 'EFSA' },

  // ===========================================================================
  // VITAMIN B7 - BIOTIN (mcg) - No EFSA UL
  // AI 40 mcg for adults (higher than US 30 mcg)
  // ===========================================================================
  { nutrient_slug: 'vitamin-b7', age_group: '18-50', sex: 'all', rda: 40, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'vitamin-b7', age_group: '51-70', sex: 'all', rda: 40, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'vitamin-b7', age_group: '71+', sex: 'all', rda: 40, upper_limit: null, unit: 'mcg', ul_source: null },

  // ===========================================================================
  // VITAMIN B9 - FOLATE (mcg DFE)
  // EFSA 2023 confirmed UL at 1000 mcg (applies to synthetic folic acid only)
  // ===========================================================================
  { nutrient_slug: 'vitamin-b9', age_group: '18-50', sex: 'all', rda: 330, upper_limit: 1000, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-b9', age_group: '51-70', sex: 'all', rda: 330, upper_limit: 1000, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'vitamin-b9', age_group: '71+', sex: 'all', rda: 330, upper_limit: 1000, unit: 'mcg', ul_source: 'EFSA' },

  // ===========================================================================
  // VITAMIN B12 (mcg) - No EFSA UL (no adverse effects defined)
  // AI 4 mcg for adults
  // ===========================================================================
  { nutrient_slug: 'vitamin-b12', age_group: '18-50', sex: 'all', rda: 4, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'vitamin-b12', age_group: '51-70', sex: 'all', rda: 4, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'vitamin-b12', age_group: '71+', sex: 'all', rda: 4, upper_limit: null, unit: 'mcg', ul_source: null },

  // ===========================================================================
  // CALCIUM (mg) - EFSA UL 2500 mg
  // PRI 950 mg for adults ≥25 years
  // ===========================================================================
  { nutrient_slug: 'calcium', age_group: '18-50', sex: 'all', rda: 950, upper_limit: 2500, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'calcium', age_group: '51-70', sex: 'all', rda: 950, upper_limit: 2500, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'calcium', age_group: '71+', sex: 'all', rda: 950, upper_limit: 2500, unit: 'mg', ul_source: 'EFSA' },

  // ===========================================================================
  // MAGNESIUM (mg) - EFSA UL 250 mg FOR SUPPLEMENTS ONLY
  // AI differs by sex
  // ===========================================================================
  { nutrient_slug: 'magnesium', age_group: '18-50', sex: 'male', rda: 350, upper_limit: 250, unit: 'mg', ul_source: 'EFSA', ul_context: 'supplements_only' },
  { nutrient_slug: 'magnesium', age_group: '18-50', sex: 'female', rda: 300, upper_limit: 250, unit: 'mg', ul_source: 'EFSA', ul_context: 'supplements_only' },
  { nutrient_slug: 'magnesium', age_group: '51-70', sex: 'all', rda: 350, upper_limit: 250, unit: 'mg', ul_source: 'EFSA', ul_context: 'supplements_only' },
  { nutrient_slug: 'magnesium', age_group: '71+', sex: 'all', rda: 350, upper_limit: 250, unit: 'mg', ul_source: 'EFSA', ul_context: 'supplements_only' },

  // ===========================================================================
  // POTASSIUM (mg) - No EFSA UL
  // AI 3500 mg
  // ===========================================================================
  { nutrient_slug: 'potassium', age_group: '18-50', sex: 'all', rda: 3500, upper_limit: null, unit: 'mg', ul_source: null },
  { nutrient_slug: 'potassium', age_group: '51-70', sex: 'all', rda: 3500, upper_limit: null, unit: 'mg', ul_source: null },
  { nutrient_slug: 'potassium', age_group: '71+', sex: 'all', rda: 3500, upper_limit: null, unit: 'mg', ul_source: null },

  // ===========================================================================
  // PHOSPHORUS (mg) - No EFSA UL, using IOM fallback (4000 mg)
  // AI ~550 mg
  // ===========================================================================
  { nutrient_slug: 'phosphorus', age_group: '18-50', sex: 'all', rda: 550, upper_limit: 4000, unit: 'mg', ul_source: 'IOM' },
  { nutrient_slug: 'phosphorus', age_group: '51-70', sex: 'all', rda: 550, upper_limit: 4000, unit: 'mg', ul_source: 'IOM' },
  { nutrient_slug: 'phosphorus', age_group: '71+', sex: 'all', rda: 550, upper_limit: 3000, unit: 'mg', ul_source: 'IOM' },

  // ===========================================================================
  // IRON (mg) - No EFSA UL (insufficient data)
  // Using safe supplemental level of 25 mg
  // PRI differs significantly: women pre-menopause 16mg, post-menopause 11mg
  // ===========================================================================
  { nutrient_slug: 'iron', age_group: '18-50', sex: 'male', rda: 11, upper_limit: null, safe_level: 25, unit: 'mg', ul_source: 'EFSA_SAFE_LEVEL' },
  { nutrient_slug: 'iron', age_group: '18-50', sex: 'female', rda: 16, upper_limit: null, safe_level: 25, unit: 'mg', ul_source: 'EFSA_SAFE_LEVEL' },
  { nutrient_slug: 'iron', age_group: '51-70', sex: 'all', rda: 11, upper_limit: null, safe_level: 25, unit: 'mg', ul_source: 'EFSA_SAFE_LEVEL' },
  { nutrient_slug: 'iron', age_group: '71+', sex: 'all', rda: 11, upper_limit: null, safe_level: 25, unit: 'mg', ul_source: 'EFSA_SAFE_LEVEL' },

  // ===========================================================================
  // ZINC (mg) - EFSA UL 25 mg
  // PRI differs by sex
  // ===========================================================================
  { nutrient_slug: 'zinc', age_group: '18-50', sex: 'male', rda: 11, upper_limit: 25, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'zinc', age_group: '18-50', sex: 'female', rda: 8, upper_limit: 25, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'zinc', age_group: '51-70', sex: 'all', rda: 10, upper_limit: 25, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'zinc', age_group: '71+', sex: 'all', rda: 10, upper_limit: 25, unit: 'mg', ul_source: 'EFSA' },

  // ===========================================================================
  // SELENIUM (mcg) - EFSA 2023: UL lowered to 255 mcg (from 300 mcg)
  // AI 70 mcg
  // ===========================================================================
  { nutrient_slug: 'selenium', age_group: '18-50', sex: 'all', rda: 70, upper_limit: 255, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'selenium', age_group: '51-70', sex: 'all', rda: 70, upper_limit: 255, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'selenium', age_group: '71+', sex: 'all', rda: 70, upper_limit: 255, unit: 'mcg', ul_source: 'EFSA' },

  // ===========================================================================
  // COPPER (mg) - EFSA UL 5 mg
  // AI 1.3-1.6 mg
  // ===========================================================================
  { nutrient_slug: 'copper', age_group: '18-50', sex: 'all', rda: 1.6, upper_limit: 5, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'copper', age_group: '51-70', sex: 'all', rda: 1.6, upper_limit: 5, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'copper', age_group: '71+', sex: 'all', rda: 1.3, upper_limit: 5, unit: 'mg', ul_source: 'EFSA' },

  // ===========================================================================
  // MANGANESE (mg) - EFSA 2023: No UL, safe level 8 mg
  // AI 3 mg
  // ===========================================================================
  { nutrient_slug: 'manganese', age_group: '18-50', sex: 'all', rda: 3, upper_limit: null, safe_level: 8, unit: 'mg', ul_source: 'EFSA_SAFE_LEVEL' },
  { nutrient_slug: 'manganese', age_group: '51-70', sex: 'all', rda: 3, upper_limit: null, safe_level: 8, unit: 'mg', ul_source: 'EFSA_SAFE_LEVEL' },
  { nutrient_slug: 'manganese', age_group: '71+', sex: 'all', rda: 3, upper_limit: null, safe_level: 8, unit: 'mg', ul_source: 'EFSA_SAFE_LEVEL' },

  // ===========================================================================
  // IODINE (mcg) - EFSA UL 600 mcg
  // AI 150 mcg
  // ===========================================================================
  { nutrient_slug: 'iodine', age_group: '18-50', sex: 'all', rda: 150, upper_limit: 600, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'iodine', age_group: '51-70', sex: 'all', rda: 150, upper_limit: 600, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'iodine', age_group: '71+', sex: 'all', rda: 150, upper_limit: 600, unit: 'mcg', ul_source: 'EFSA' },

  // ===========================================================================
  // CHROMIUM (mcg) - No EFSA DRV or UL
  // Using IOM AI ~35 mcg (men), ~25 mcg (women)
  // ===========================================================================
  { nutrient_slug: 'chromium', age_group: '18-50', sex: 'male', rda: 35, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'chromium', age_group: '18-50', sex: 'female', rda: 25, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'chromium', age_group: '51-70', sex: 'all', rda: 30, upper_limit: null, unit: 'mcg', ul_source: null },
  { nutrient_slug: 'chromium', age_group: '71+', sex: 'all', rda: 30, upper_limit: null, unit: 'mcg', ul_source: null },

  // ===========================================================================
  // MOLYBDENUM (mcg) - EFSA UL 600 mcg
  // AI 65 mcg
  // ===========================================================================
  { nutrient_slug: 'molybdenum', age_group: '18-50', sex: 'all', rda: 65, upper_limit: 600, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'molybdenum', age_group: '51-70', sex: 'all', rda: 65, upper_limit: 600, unit: 'mcg', ul_source: 'EFSA' },
  { nutrient_slug: 'molybdenum', age_group: '71+', sex: 'all', rda: 65, upper_limit: 600, unit: 'mcg', ul_source: 'EFSA' },

  // ===========================================================================
  // OMEGA-3 EPA+DHA (mg) - No EFSA UL (up to 5g/day considered safe)
  // AI 250 mg combined
  // ===========================================================================
  { nutrient_slug: 'omega-3-epa-dha', age_group: '18-50', sex: 'all', rda: 250, upper_limit: 5000, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'omega-3-epa-dha', age_group: '51-70', sex: 'all', rda: 250, upper_limit: 5000, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'omega-3-epa-dha', age_group: '71+', sex: 'all', rda: 250, upper_limit: 5000, unit: 'mg', ul_source: 'EFSA' },

  // ===========================================================================
  // CHOLINE (mg) - EFSA UL 3500 mg
  // AI 400 mg
  // ===========================================================================
  { nutrient_slug: 'choline', age_group: '18-50', sex: 'all', rda: 400, upper_limit: 3500, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'choline', age_group: '51-70', sex: 'all', rda: 400, upper_limit: 3500, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'choline', age_group: '71+', sex: 'all', rda: 400, upper_limit: 3500, unit: 'mg', ul_source: 'EFSA' },

  // ===========================================================================
  // CAFFEINE (mg) - EFSA safe limit 400 mg/day for adults
  // No RDA (not essential), but safe limit established
  // ===========================================================================
  { nutrient_slug: 'caffeine', age_group: '18-50', sex: 'all', rda: null, upper_limit: 400, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'caffeine', age_group: '51-70', sex: 'all', rda: null, upper_limit: 400, unit: 'mg', ul_source: 'EFSA' },
  { nutrient_slug: 'caffeine', age_group: '71+', sex: 'all', rda: null, upper_limit: 400, unit: 'mg', ul_source: 'EFSA' },

  // ===========================================================================
  // OMEGA-3 EPA (mg) - Individual EPA supplementation
  // Source: EFSA (2012) confirmed EPA alone up to 1.8 g/day does not raise safety concerns
  // https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/
  // https://efsa.onlinelibrary.wiley.com/doi/full/10.2903/j.efsa.2026.9858
  // No established AI for EPA alone (combined EPA+DHA AI is 250mg)
  // ===========================================================================
  { nutrient_slug: 'omega-3-epa', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 1800, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'omega-3-epa', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 1800, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'omega-3-epa', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 1800, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // OMEGA-3 DHA (mg) - Individual DHA supplementation
  // Source: EFSA 2026 set conservative safe intake level for DHA
  // Denmark regulatory limit: 1500 mg/day for DHA alone
  // https://www.nutraingredients.com/Article/2026/01/23/efsa-sets-conservative-safe-intake-level-for-dha/
  // No established AI for DHA alone
  // ===========================================================================
  { nutrient_slug: 'omega-3-dha', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 1500, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'omega-3-dha', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 1500, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'omega-3-dha', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 1500, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // OMEGA-3 ALA (mg) - Alpha-linolenic acid (essential omega-3)
  // Source: IOM Adequate Intake: 1.1g (women), 1.6g (men)
  // No established UL; doses >3-5g/day lack long-term safety data
  // https://lpi.oregonstate.edu/mic/other-nutrients/essential-fatty-acids
  // ===========================================================================
  { nutrient_slug: 'omega-3-ala', age_group: '18-50', sex: 'male', rda: 1600, upper_limit: null, safe_level: 3000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'omega-3-ala', age_group: '18-50', sex: 'female', rda: 1100, upper_limit: null, safe_level: 3000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'omega-3-ala', age_group: '51-70', sex: 'all', rda: 1350, upper_limit: null, safe_level: 3000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'omega-3-ala', age_group: '71+', sex: 'all', rda: 1350, upper_limit: null, safe_level: 3000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // L-THEANINE (mg) - Amino acid from tea
  // Source: Clinical studies, WebMD, Healthline, PubMed PMC8475422
  // Typical effective dose: 200-400mg/day for stress/anxiety
  // Studies up to 900mg/day well-tolerated for 8 weeks
  // No serious adverse effects reported at doses up to 6000mg
  // https://www.webmd.com/vitamins/ai/ingredientmono-1053/theanine
  // ===========================================================================
  { nutrient_slug: 'l-theanine', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 600, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'l-theanine', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 600, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'l-theanine', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 400, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // L-TYROSINE (mg) - Dopamine/norepinephrine precursor
  // Source: Drugs.com, WebMD, clinical trials
  // Possibly safe up to 150mg/kg/day short-term (~10-12g for 70-80kg adult)
  // Manufacturers recommend 500-1500mg/day
  // Long-term safety data lacking above 1000mg/day
  // https://www.drugs.com/npp/tyrosine.html
  // ===========================================================================
  { nutrient_slug: 'l-tyrosine', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 2000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'l-tyrosine', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 2000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'l-tyrosine', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 1500, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // L-GLUTAMINE (mg) - Most abundant amino acid
  // Source: PubMed, Drugs.com, Mayo Clinic
  // FDA approved 30g/day for short bowel syndrome
  // Observed safety limit for long-term use: 14g/day
  // Acute doses of 20-30g appear safe in healthy adults
  // https://www.drugs.com/dosage/glutamine.html
  // ===========================================================================
  { nutrient_slug: 'l-glutamine', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 14000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'l-glutamine', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 14000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'l-glutamine', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 10000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // TAURINE (mg) - Conditionally essential amino acid
  // Source: EFSA FEEDAP Panel, clinical studies
  // EFSA observed safe level: 6g/person/day (100mg/kg body weight)
  // Conservative recommendation for long-term: 3g/day
  // https://www.healthline.com/nutrition/what-is-taurine
  // ===========================================================================
  { nutrient_slug: 'taurine', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 3000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'taurine', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 3000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'taurine', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 3000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // GLYCINE (mg) - Non-essential amino acid
  // Source: Clinical studies, WebMD, PubMed
  // No established UL; clinical studies use 3-60g/day
  // Typical therapeutic dose: 3-10g/day
  // Toxicity concern at >500mg/kg body weight
  // https://www.webmd.com/vitamins/ai/ingredientmono-1072/glycine
  // ===========================================================================
  { nutrient_slug: 'glycine', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 10000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'glycine', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 10000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'glycine', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 5000, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // MELATONIN (mg) - Sleep hormone
  // Source: Sleep Foundation, PubMed, WebMD
  // No FDA-established maximum; optimal range 0.5-5mg
  // Doses ≥10mg studied without serious adverse events
  // Higher doses may cause drowsiness, headache, dizziness
  // https://www.sleepfoundation.org/melatonin/melatonin-dosage-how-much-should-you-take
  // ===========================================================================
  { nutrient_slug: 'melatonin', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 10, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'melatonin', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 10, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'melatonin', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 5, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // COENZYME Q10 (mg) - Ubiquinone
  // Source: Mayo Clinic, PubMed, clinical safety studies
  // ADI: 12mg/kg/day (~720mg for 60kg person)
  // Safety studies tested up to 3600mg/day
  // Standard recommendation: 100-200mg/day; therapeutic up to 600mg
  // https://www.mayoclinic.org/drugs-supplements-coenzyme-q10/art-20362602
  // ===========================================================================
  { nutrient_slug: 'coq10', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 600, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'coq10', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 600, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'coq10', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 600, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // ASHWAGANDHA (mg) - Adaptogenic herb (Withania somnifera)
  // Source: NIH ODS, clinical studies on KSM-66 extract
  // Clinical studies: 250-600mg/day root extract
  // Well-tolerated for up to 3 months; long-term data limited
  // Rare reports of liver effects at high doses
  // https://ods.od.nih.gov/factsheets/Ashwagandha-HealthProfessional/
  // ===========================================================================
  { nutrient_slug: 'ashwagandha', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 600, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'ashwagandha', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 600, unit: 'mg', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'ashwagandha', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 450, unit: 'mg', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // COLLAGEN (g) - Hydrolyzed collagen peptides
  // Source: Clinical trials, systematic reviews
  // Clinical trials: 2.5-15g/day typical; some studies up to 60g/day
  // Skin health: 2.5-5g/day; muscle/joint: 10-20g/day
  // https://www.webmd.com/vitamins/ai/ingredientmono-1606/collagen-peptides
  // ===========================================================================
  { nutrient_slug: 'collagen', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 15, unit: 'g', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'collagen', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 15, unit: 'g', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'collagen', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 15, unit: 'g', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // PROBIOTICS (billion CFU) - Colony-forming units
  // Source: NIH ODS, International Probiotics Association
  // Clinical trials: 1-1800 billion CFU/day
  // Typical recommendation: 10-20 billion CFU/day
  // No established upper limit; strain-specific dosing recommended
  // https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional/
  // ===========================================================================
  { nutrient_slug: 'probiotics', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 100, unit: 'billion CFU', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'probiotics', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 100, unit: 'billion CFU', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'probiotics', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 50, unit: 'billion CFU', ul_source: 'TYPICAL_RANGE' },

  // ===========================================================================
  // CREATINE (g) - Creatine monohydrate
  // Source: ISSN position stand, long-term clinical studies
  // Maintenance dose: 3-5g/day; loading: 20-25g/day for 5-7 days
  // Long-term safety proven up to 30g/day for 5 years
  // No increased risk of renal dysfunction at typical doses
  // https://pmc.ncbi.nlm.nih.gov/articles/PMC5469049/
  // ===========================================================================
  { nutrient_slug: 'creatine', age_group: '18-50', sex: 'all', rda: null, upper_limit: null, safe_level: 5, unit: 'g', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'creatine', age_group: '51-70', sex: 'all', rda: null, upper_limit: null, safe_level: 5, unit: 'g', ul_source: 'TYPICAL_RANGE' },
  { nutrient_slug: 'creatine', age_group: '71+', sex: 'all', rda: null, upper_limit: null, safe_level: 5, unit: 'g', ul_source: 'TYPICAL_RANGE' },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the appropriate limit for a nutrient based on user demographics
 */
export function getLimitForUser(
  nutrientSlug: string,
  ageGroup: AgeGroup,
  sex: 'male' | 'female'
): NutrientLimitData | undefined {
  // First try exact match
  let limit = NUTRIENT_LIMITS.find(
    (l) => l.nutrient_slug === nutrientSlug && l.age_group === ageGroup && l.sex === sex
  );

  // If no exact match, try 'all' sex
  if (!limit) {
    limit = NUTRIENT_LIMITS.find(
      (l) => l.nutrient_slug === nutrientSlug && l.age_group === ageGroup && l.sex === 'all'
    );
  }

  return limit;
}

/**
 * Get effective upper limit (UL or safe_level, whichever is available)
 */
export function getEffectiveUpperLimit(limit: NutrientLimitData): number | null {
  return limit.upper_limit ?? limit.safe_level ?? null;
}

/**
 * Get all limits for a specific nutrient
 */
export function getLimitsForNutrient(nutrientSlug: string): NutrientLimitData[] {
  return NUTRIENT_LIMITS.filter((l) => l.nutrient_slug === nutrientSlug);
}

/**
 * Check if a nutrient has any established upper limit
 */
export function hasUpperLimit(nutrientSlug: string): boolean {
  const limits = getLimitsForNutrient(nutrientSlug);
  return limits.some((l) => l.upper_limit !== null || l.safe_level !== null);
}
