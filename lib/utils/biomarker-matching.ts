import Fuse from "fuse.js";
import { createClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/database.types";

// ============================================================================
// TYPES
// ============================================================================

type BiomarkerInformation = Tables<"biomarkers_information">;

interface BiomarkerMatch {
  biomarker_id: string;
  biomarker_name: string;
  short_name: string;
  slug: string;
  category_id: string;
  unit: string;
  matched_synonym: string | null;
  match_score: number;
  match_type: "exact" | "synonym" | "fuzzy";
}

interface MatchResult {
  original_name: string;
  match: BiomarkerMatch | null;
  confidence: number;
}

interface BiomarkerData {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  category_id: string;
  unit: string;
  synonyms: string[];
}

interface OCRBiomarkerResult {
  name: string;
  value: number | null;
  value_in_text?: string | null;
}

export interface EnrichedBiomarkerResult {
  original_ocr_name: string;
  biomarker_id: string | null;
  biomarker_name: string | null;
  short_name: string | null;
  slug: string | null;
  category_id: string | null;
  unit: string | null;
  value: number | null;
  value_in_text: string | null;
  match_type: "exact" | "synonym" | "fuzzy" | "unmatched";
  match_confidence: number;
}

// ============================================================================
// SUPABASE ADMIN CLIENT
// ============================================================================

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ============================================================================
// STRING NORMALIZATION HELPERS
// ============================================================================

export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

export function cleanOcrName(name: string): string {
  const fillerPatterns = [
    /\s+soit\s*:?\s*$/i,
    /\s+dont\s*:?\s*$/i,
    /\s+soit\s+:?\s*$/i,
    /\s+dont\s+:?\s*$/i,
    /\s+%\s*$/,
    /\s+:?\s*$/,
  ];

  let cleaned = name.trim();
  for (const pattern of fillerPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}

// ============================================================================
// FETCH & CACHE BIOMARKERS WITH SYNONYMS
// ============================================================================

async function fetchBiomarkersWithSynonyms(): Promise<BiomarkerData[]> {
  const { data, error } = await supabaseAdmin
    .from("biomarkers_information")
    .select(
      `
      id,
      name,
      short_name,
      slug,
      category_id,
      unit,
      biomarker_synonyms (
        synonym
      )
    `
    );

  if (error) {
    throw new Error(`Failed to fetch biomarkers: ${error.message}`);
  }

  const rows = (data ?? []) as (BiomarkerInformation & {
    biomarker_synonyms?: { synonym: string }[] | null;
  })[];

  return rows.map((biomarker) => ({
    id: biomarker.id,
    name: biomarker.name,
    short_name: biomarker.short_name,
    slug: biomarker.slug,
    category_id: biomarker.category_id,
    unit: biomarker.unit,
    synonyms: (biomarker.biomarker_synonyms ?? []).map(
      (s: { synonym: string }) => s.synonym
    ),
  }));
}

let biomarkersCache: BiomarkerData[] | null = null;

type FuseItem = {
  biomarker_id: string;
  biomarker_name: string;
  short_name: string;
  slug: string;
  category_id: string;
  unit: string;
  searchText: string;
  matchedSynonym: string | null;
  type: "canonical" | "synonym";
};

let biomarkersFuseIndex: Fuse<FuseItem> | null = null;

async function getBiomarkersCache(): Promise<BiomarkerData[]> {
  if (!biomarkersCache) {
    console.log("📚 Loading biomarkers cache...");
    biomarkersCache = await fetchBiomarkersWithSynonyms();
    console.log(`✅ Cached ${biomarkersCache.length} biomarkers`);
  }
  return biomarkersCache;
}

// ============================================================================
// EXACT & FUZZY MATCHING
// ============================================================================

function tryExactMatch(
  normalizedOcrName: string,
  biomarkers: BiomarkerData[]
): BiomarkerMatch | null {
  for (const biomarker of biomarkers) {
    const normalizedCanonical = normalizeString(biomarker.name);
    if (normalizedOcrName === normalizedCanonical) {
      return {
        biomarker_id: biomarker.id,
        biomarker_name: biomarker.name,
        short_name: biomarker.short_name,
        slug: biomarker.slug,
        category_id: biomarker.category_id,
        unit: biomarker.unit,
        matched_synonym: null,
        match_score: 1,
        match_type: "exact",
      };
    }

    for (const synonym of biomarker.synonyms) {
      const normalizedSynonym = normalizeString(synonym);
      if (normalizedOcrName === normalizedSynonym) {
        return {
          biomarker_id: biomarker.id,
          biomarker_name: biomarker.name,
          short_name: biomarker.short_name,
          slug: biomarker.slug,
          category_id: biomarker.category_id,
          unit: biomarker.unit,
          matched_synonym: synonym,
          match_score: 1,
          match_type: "synonym",
        };
      }
    }
  }

  return null;
}

export function buildFuseIndex(biomarkers: BiomarkerData[]): Fuse<FuseItem> {
  const searchableData: FuseItem[] = biomarkers.flatMap((biomarker) => {
    const canonical: FuseItem = {
      biomarker_id: biomarker.id,
      biomarker_name: biomarker.name,
      short_name: biomarker.short_name,
      slug: biomarker.slug,
      category_id: biomarker.category_id,
      unit: biomarker.unit,
      searchText: biomarker.name,
      matchedSynonym: null,
      type: "canonical",
    };

    const synonymItems: FuseItem[] = biomarker.synonyms.map((synonym) => ({
      biomarker_id: biomarker.id,
      biomarker_name: biomarker.name,
      short_name: biomarker.short_name,
      slug: biomarker.slug,
      category_id: biomarker.category_id,
      unit: biomarker.unit,
      searchText: synonym,
      matchedSynonym: synonym,
      type: "synonym",
    }));

    return [canonical, ...synonymItems];
  });

  return new Fuse<FuseItem>(searchableData, {
    keys: ["searchText"],
    threshold: 0.3,
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
  });
}

function getFuseIndex(biomarkers: BiomarkerData[]): Fuse<FuseItem> {
  if (!biomarkersFuseIndex) {
    biomarkersFuseIndex = buildFuseIndex(biomarkers);
  }
  return biomarkersFuseIndex;
}

function tryFuzzyMatch(
  normalizedOcrName: string,
  fuseIndex: Fuse<FuseItem>,
  threshold = 0.4
): BiomarkerMatch | null {
  const results = fuseIndex.search(normalizedOcrName);
  if (results.length === 0) return null;

  const bestResult = results[0];
  const matchScore = 1 - (bestResult.score ?? 0);

  if (matchScore < threshold) {
    return null;
  }

  const item = bestResult.item;

  return {
    biomarker_id: item.biomarker_id,
    biomarker_name: item.biomarker_name,
    short_name: item.short_name,
    slug: item.slug,
    category_id: item.category_id,
    unit: item.unit,
    matched_synonym: item.matchedSynonym,
    match_score: matchScore,
    match_type: "fuzzy",
  };
}

// ============================================================================
// PUBLIC MATCHING APIS
// ============================================================================

export async function matchBiomarkerName(
  ocrExtractedName: string,
  fuzzyMatchThreshold = 0.65
): Promise<MatchResult> {
  const biomarkers = await getBiomarkersCache();
  const cleanedName = cleanOcrName(ocrExtractedName);
  const normalizedName = normalizeString(cleanedName);

  console.log(
    `🔍 Matching: "${ocrExtractedName}" -> cleaned: "${cleanedName}"`
  );

  let match = tryExactMatch(normalizedName, biomarkers);
  if (match) {
    console.log(
      `   ✅ Exact match: ${match.biomarker_name} (${match.short_name})`
    );
    return {
      original_name: ocrExtractedName,
      match,
      confidence: 1,
    };
  }

  console.log("   Building fuzzy search index...");
  const fuseIndex = getFuseIndex(biomarkers);
  match = tryFuzzyMatch(normalizedName, fuseIndex, fuzzyMatchThreshold);

  if (match) {
    console.log(
      `   ⚠️  Fuzzy match: ${match.biomarker_name} (${
        match.short_name
      }) - score: ${match.match_score.toFixed(2)}`
    );
    return {
      original_name: ocrExtractedName,
      match,
      confidence: match.match_score,
    };
  }

  console.log(`   ❌ No match found (threshold: ${fuzzyMatchThreshold})`);
  return {
    original_name: ocrExtractedName,
    match: null,
    confidence: 0,
  };
}

export async function matchBiomarkerNames(
  ocrExtractedNames: string[]
): Promise<MatchResult[]> {
  console.log(`\n🔄 Matching ${ocrExtractedNames.length} biomarker names...\n`);

  const biomarkers = await getBiomarkersCache();
  const fuseIndex = getFuseIndex(biomarkers);
  const results: MatchResult[] = [];

  for (const name of ocrExtractedNames) {
    const cleanedName = cleanOcrName(name);
    const normalizedName = normalizeString(cleanedName);

    console.log(`🔍 Matching: "${name}"`);

    let match = tryExactMatch(normalizedName, biomarkers);
    if (match) {
      console.log(
        `   ✅ Exact match: ${match.biomarker_name} (${match.short_name})`
      );
      results.push({
        original_name: name,
        match,
        confidence: 1,
      });
      continue;
    }

    match = tryFuzzyMatch(normalizedName, fuseIndex, 0.65);
    if (match) {
      console.log(
        `   ⚠️  Fuzzy match: ${match.biomarker_name} (${
          match.short_name
        }) - score: ${match.match_score.toFixed(2)}`
      );
      results.push({
        original_name: name,
        match,
        confidence: match.match_score,
      });
    } else {
      console.log("   ❌ No match found");
      results.push({
        original_name: name,
        match: null,
        confidence: 0,
      });
    }
  }

  const matched = results.filter((r) => r.match !== null);
  const unmatched = results.filter((r) => r.match === null);

  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Matching Summary");
  console.log(`${"=".repeat(60)}`);
  console.log(`✅ Matched: ${matched.length}/${results.length}`);
  console.log(`❌ Unmatched: ${unmatched.length}/${results.length}`);

  if (unmatched.length > 0) {
    console.log(`\n⚠️  Unmatched biomarkers:`);
    unmatched.forEach((r) => {
      console.log(`   • ${r.original_name}`);
    });
  }

  return results;
}

export async function enrichOcrResults(
  ocrResults: OCRBiomarkerResult[]
): Promise<EnrichedBiomarkerResult[]> {
  console.log(
    `\n🧬 Enriching ${ocrResults.length} OCR results with biomarker data...\n`
  );

  const matchResults = await matchBiomarkerNames(ocrResults.map((r) => r.name));

  return matchResults.map((matchResult, index) => {
    const { value, value_in_text } = ocrResults[index];

    if (matchResult.match) {
      return {
        original_ocr_name: matchResult.original_name,
        biomarker_id: matchResult.match.biomarker_id,
        biomarker_name: matchResult.match.biomarker_name,
        short_name: matchResult.match.short_name,
        slug: matchResult.match.slug,
        category_id: matchResult.match.category_id,
        unit: matchResult.match.unit,
        value,
        value_in_text: value_in_text ?? null,
        match_type: matchResult.match.match_type,
        match_confidence: matchResult.confidence,
      };
    }

    return {
      original_ocr_name: matchResult.original_name,
      biomarker_id: null,
      biomarker_name: null,
      short_name: null,
      slug: null,
      category_id: null,
      unit: null,
      value,
      value_in_text: value_in_text ?? null,
      match_type: "unmatched",
      match_confidence: 0,
    };
  });
}
