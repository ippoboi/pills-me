/**
 * Nutrient Limits Seeder
 *
 * This script seeds the nutrient_limits table with EFSA/IOM reference data.
 * It must be run AFTER the nutrients table has been seeded.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json lib/data/seed-limits.ts
 *
 * Or via a Next.js API route for development.
 */

import { createClient } from '@supabase/supabase-js';
import { NUTRIENT_LIMITS } from './nutrient-limits';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Seeder Functions
// ============================================================================

async function getNutrientIdMap(): Promise<Map<string, string>> {
  const { data: nutrients, error } = await supabase.from('nutrients').select('id, slug');

  if (error) {
    throw new Error(`Failed to fetch nutrients: ${error.message}`);
  }

  const map = new Map<string, string>();
  for (const nutrient of nutrients || []) {
    map.set(nutrient.slug, nutrient.id);
  }

  return map;
}

async function seedNutrientLimits(): Promise<void> {
  console.log('Fetching nutrient IDs...');
  const nutrientIdMap = await getNutrientIdMap();

  console.log(`Found ${nutrientIdMap.size} nutrients`);

  const limitsToInsert: Array<{
    nutrient_id: string;
    age_group: string;
    sex: string;
    rda: number | null;
    upper_limit: number | null;
    unit: string;
    source: string;
  }> = [];

  const skipped: string[] = [];

  for (const limit of NUTRIENT_LIMITS) {
    const nutrientId = nutrientIdMap.get(limit.nutrient_slug);

    if (!nutrientId) {
      skipped.push(limit.nutrient_slug);
      continue;
    }

    // Determine effective upper limit
    const effectiveUL = limit.upper_limit ?? limit.safe_level ?? null;

    // Determine source string
    let source = 'EFSA';
    if (limit.ul_source === 'IOM') {
      source = 'IOM';
    } else if (limit.ul_source === 'EFSA_SAFE_LEVEL') {
      source = 'EFSA_SAFE';
    }

    limitsToInsert.push({
      nutrient_id: nutrientId,
      age_group: limit.age_group,
      sex: limit.sex,
      rda: limit.rda,
      upper_limit: effectiveUL,
      unit: limit.unit,
      source,
    });
  }

  if (skipped.length > 0) {
    console.warn(`Skipped ${skipped.length} limits (nutrients not found):`, [...new Set(skipped)]);
  }

  console.log(`Inserting ${limitsToInsert.length} nutrient limits...`);

  // Upsert in batches
  const batchSize = 50;
  for (let i = 0; i < limitsToInsert.length; i += batchSize) {
    const batch = limitsToInsert.slice(i, i + batchSize);

    const { error } = await supabase.from('nutrient_limits').upsert(batch, {
      onConflict: 'nutrient_id,age_group,sex,source',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }

  console.log('Done seeding nutrient limits!');
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  try {
    await seedNutrientLimits();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Only run if executed directly (not imported)
if (require.main === module) {
  main();
}

export { seedNutrientLimits };
