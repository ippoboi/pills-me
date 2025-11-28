import { authenticateRequest } from "@/lib/auth-helper";
import type { Database, Tables } from "@/lib/supabase/database.types";
import type {
  BiomarkerItem,
  BiomarkersByCategoryResponse,
  BiomarkersByStatusResponse,
  Category,
  SortBy,
  ThresholdBand,
  Thresholds,
} from "@/lib/types/biomarkers";
import { enrichOcrResults } from "@/lib/utils/biomarker-matching";
import { NextRequest, NextResponse } from "next/server";

type Report = Tables<"reports">;
type ReportStatus = Database["public"]["Enums"]["report_status"];

interface IncomingBiomarker {
  name: string;
  value: number | null;
  unit: string | null;
  value_in_text?: string | null;
  selected?: boolean;
}

interface SaveBiomarkersRequest {
  reportId: string;
  biomarkers: IncomingBiomarker[];
}

const MATCH_CONFIDENCE_THRESHOLD = 0.65;

// Helper function to determine status from value and thresholds
// Threshold bands typically use: min (inclusive) <= value < max (exclusive)
function getBiomarkerStatus(
  value: number | null,
  thresholds: Thresholds
): "optimal" | "borderline" | "out_of_range" | null {
  if (value === null || typeof value !== "number" || isNaN(value)) {
    return null;
  }

  // Process bands in order - first match wins
  for (const band of thresholds.bands) {
    const min = band.min ?? Number.NEGATIVE_INFINITY;
    const max = band.max ?? Number.POSITIVE_INFINITY;

    // Check if value falls within this band
    // Pattern: min (inclusive) <= value < max (exclusive)
    if (band.min === null && band.max === null) {
      // Both null - should not happen, but treat as match
      return band.status;
    } else if (band.min === null) {
      // Open-ended on the left: value < max
      if (value < max) {
        return band.status;
      }
    } else if (band.max === null) {
      // Open-ended on the right: value >= min
      if (value >= min) {
        return band.status;
      }
    } else {
      // Both bounds defined: min <= value < max
      if (value >= min && value < max) {
        return band.status;
      }
    }
  }

  // If no band matches, return null (shouldn't happen with proper threshold setup)
  return null;
}

type Sex = "male" | "female" | null;

type RawThresholds = {
  unit: string;
  default: { bands: ThresholdBand[] };
  male: { bands: ThresholdBand[] } | null;
  female: { bands: ThresholdBand[] } | null;
};

function selectBandsForSex(raw: RawThresholds, sex: Sex): ThresholdBand[] {
  if (sex === "male" && raw.male?.bands) return raw.male.bands;
  if (sex === "female" && raw.female?.bands) return raw.female.bands;
  return raw.default?.bands ?? [];
}

export async function POST(request: NextRequest) {
  let reportId: string | undefined;

  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId, supabase } = auth;

    let body: SaveBiomarkersRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { reportId: bodyReportId, biomarkers } = body;
    reportId = bodyReportId;

    if (!reportId || typeof reportId !== "string") {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(biomarkers) || biomarkers.length === 0) {
      return NextResponse.json(
        { error: "At least one biomarker is required" },
        { status: 400 }
      );
    }

    // Ensure report exists and belongs to this user
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", userId)
      .single<Report>();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update status to SAVING
    const { error: savingStatusError } = await supabase
      .from("reports")
      .update({ status: "SAVING" as ReportStatus })
      .eq("id", reportId);

    if (savingStatusError) {
      console.error(
        "Failed to update report status to SAVING:",
        savingStatusError
      );
    }

    const candidates = biomarkers.filter((b) => {
      if (!b) return false;
      if (b.selected === false) return false;
      if (!b.name || typeof b.name !== "string") return false;

      const hasNumeric = typeof b.value === "number" && !Number.isNaN(b.value);
      const text = b.value_in_text ?? null;
      const hasText = typeof text === "string" && text.trim().length > 0;

      return hasNumeric || hasText;
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No valid biomarkers to save" },
        { status: 400 }
      );
    }

    const enriched = await enrichOcrResults(
      candidates.map((b) => ({
        name: b.name,
        value: typeof b.value === "number" ? b.value : null,
        value_in_text: b.value_in_text ?? null,
      }))
    );

    const matchedResults = enriched.filter(
      (r) => r.biomarker_id && r.match_confidence >= MATCH_CONFIDENCE_THRESHOLD
    );

    const unmatchedResults = enriched.filter(
      (r) => !r.biomarker_id || r.match_confidence < MATCH_CONFIDENCE_THRESHOLD
    );

    const inserts = matchedResults.map((r) => ({
      user_id: userId,
      biomarker_id: r.biomarker_id!,
      report_id: report.id,
      measured_at: report.collected_at,
      raw_name: r.original_ocr_name,
      value_numeric: r.value,
      value_text: r.value_in_text,
    }));

    // Log unmatched or low-confidence results for later analysis
    if (unmatchedResults.length > 0) {
      const unmatchedInserts = unmatchedResults.map((r) => ({
        report_id: report.id,
        user_id: userId,
        raw_name: r.original_ocr_name,
        raw_value_numeric: r.value,
        raw_value_text: r.value_in_text,
        raw_unit: r.unit,
        match_confidence: r.match_confidence,
        best_match_biomarker_id: r.biomarker_id ?? null,
        best_match_name: r.biomarker_name ?? null,
      }));

      const rawUnmatchedClient = supabase as unknown as {
        from: (table: "raw_unmatched_data") => {
          insert: (
            rows: typeof unmatchedInserts
          ) => Promise<{ error: unknown }>;
        };
      };

      const { error: unmatchedError } = await rawUnmatchedClient
        .from("raw_unmatched_data")
        .insert(unmatchedInserts);

      if (unmatchedError) {
        console.error(
          "Failed to insert raw_unmatched_data rows:",
          unmatchedError
        );
      }
    }

    if (inserts.length === 0) {
      // All biomarkers were unmatched - set status to UNMATCHED
      const { error: unmatchedStatusError } = await supabase
        .from("reports")
        .update({ status: "UNMATCHED" as ReportStatus })
        .eq("id", reportId);

      if (unmatchedStatusError) {
        console.error(
          "Failed to update report status to UNMATCHED:",
          unmatchedStatusError
        );
      }

      return NextResponse.json(
        {
          success: false,
          insertedCount: 0,
          matchedCount: 0,
          totalProcessed: enriched.length,
          skippedCount: enriched.length,
          threshold: MATCH_CONFIDENCE_THRESHOLD,
          message: "No biomarkers met the confidence threshold for saving",
        },
        { status: 200 }
      );
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from("user_biomarkers")
      .insert(inserts)
      .select();

    if (insertError) {
      console.error("Failed to insert user_biomarkers:", insertError);
      // Mark report as CANCELED on save error
      await supabase
        .from("reports")
        .update({ status: "CANCELED" as ReportStatus })
        .eq("id", reportId);
      return NextResponse.json(
        { error: "Failed to save biomarkers" },
        { status: 500 }
      );
    }

    const insertedCount = insertedRows?.length ?? 0;
    const matchedCount = inserts.length;
    const skippedCount = enriched.length - matchedCount;

    // Determine final status: UNMATCHED if there are unmatched results, otherwise COMPLETED
    const finalStatus: ReportStatus =
      unmatchedResults.length > 0
        ? ("UNMATCHED" as ReportStatus)
        : ("COMPLETED" as ReportStatus);

    // Update status based on whether there are unmatched results
    const { error: statusUpdateError } = await supabase
      .from("reports")
      .update({ status: finalStatus })
      .eq("id", reportId);

    if (statusUpdateError) {
      console.error(
        `Failed to update report status to ${finalStatus}:`,
        statusUpdateError
      );
    }

    return NextResponse.json(
      {
        success: true,
        insertedCount,
        matchedCount,
        totalProcessed: enriched.length,
        skippedCount,
        threshold: MATCH_CONFIDENCE_THRESHOLD,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/biomarkers route:", error);
    // Mark report as CANCELED on any error
    if (reportId) {
      try {
        const auth = await authenticateRequest(request);
        if (auth) {
          await auth.supabase
            .from("reports")
            .update({ status: "CANCELED" as ReportStatus })
            .eq("id", reportId);
        }
      } catch {
        // Ignore errors when trying to mark as CANCELED
      }
    }
    return NextResponse.json(
      { error: "Internal server error while saving biomarkers" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId, supabase } = auth;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const sortByParam = searchParams.get("sortBy");
    const sortBy: SortBy = sortByParam === "CATEGORY" ? "CATEGORY" : "STATUS"; // Default to STATUS

    // Fetch user sex from user_information (if available) for sex-specific thresholds.
    const { data: userInfo, error: userInfoError } = await supabase
      .from("user_information")
      .select("sex")
      .eq("user_id", userId)
      .maybeSingle();

    if (userInfoError) {
      console.error("Error fetching user_information:", userInfoError);
    }

    const userSex: Sex =
      userInfo && (userInfo.sex === "male" || userInfo.sex === "female")
        ? (userInfo.sex as Sex)
        : null;

    // Fetch user biomarkers joined with biomarker definitions and categories.
    // - INNER JOIN via !inner ensures we only include biomarkers that exist in biomarkers_information
    // - .not(\"value_numeric\", \"is\", null) filters out entries without a numeric value
    const { data: joinedRows, error: joinedError } = await supabase
      .from("user_biomarkers")
      .select(
        `
        biomarker_id,
        value_numeric,
        value_text,
        measured_at,
        biomarker:biomarkers_information!inner (
          id,
          name,
          unit,
          thresholds,
          category:biomarker_categories (
            id,
            label,
            description,
            icon,
            sort_order
          )
        )
      `
      )
      .eq("user_id", userId)
      .not("value_numeric", "is", null)
      .order("measured_at", { ascending: false, nullsFirst: false });

    if (joinedError) {
      console.error("Error fetching user biomarkers overview:", joinedError);
      return NextResponse.json(
        { error: "Failed to fetch biomarkers" },
        { status: 500 }
      );
    }

    if (!joinedRows || joinedRows.length === 0) {
      return NextResponse.json({ biomarkers: [] }, { status: 200 });
    }

    // Deduplicate to the latest value per biomarker_id (rows are ordered by measured_at DESC)
    const latestByBiomarker = new Map<string, (typeof joinedRows)[number]>();
    for (const row of joinedRows) {
      if (!latestByBiomarker.has(row.biomarker_id)) {
        latestByBiomarker.set(row.biomarker_id, row);
      }
    }

    // Build the biomarker items with full category objects
    const biomarkerItems: BiomarkerItem[] = Array.from(
      latestByBiomarker.values()
    )
      .map((row) => {
        const biomarkerData = row.biomarker as unknown as {
          id: string;
          name: string;
          unit: string;
          thresholds: unknown;
          category?:
            | {
                id: string;
                label: string;
                description: string | null;
                icon: string | null;
                sort_order: number;
              }
            | {
                id: string;
                label: string;
                description: string | null;
                icon: string | null;
                sort_order: number;
              }[]
            | null;
        } | null;

        if (!biomarkerData) {
          // Should not happen due to inner join, but guard anyway
          return null as unknown as BiomarkerItem;
        }

        const rawThresholds =
          biomarkerData.thresholds as unknown as RawThresholds;
        const bands = selectBandsForSex(rawThresholds, userSex);
        const thresholds: Thresholds = {
          unit: rawThresholds.unit,
          bands,
        };

        // Normalize category structure (Supabase may return single object or array)
        const rawCategory = biomarkerData.category;
        const categoryArray = Array.isArray(rawCategory)
          ? rawCategory
          : rawCategory
          ? [rawCategory]
          : [];
        const categoryRow = categoryArray[0];

        const category: Category = categoryRow
          ? {
              id: categoryRow.id,
              label: categoryRow.label,
              description: categoryRow.description,
              icon: categoryRow.icon,
              sort_order: categoryRow.sort_order,
            }
          : {
              id: "unknown",
              label: "Unknown",
              description: null,
              icon: null,
              sort_order: 999,
            };

        const valueNumeric = row.value_numeric as number | null;
        const status = getBiomarkerStatus(valueNumeric, thresholds);

        return {
          id: biomarkerData.id,
          name: biomarkerData.name,
          category,
          status,
          latestValue: valueNumeric,
          unit: biomarkerData.unit,
          thresholds,
        };
      })
      .filter(Boolean) as BiomarkerItem[];

    // Build response based on sortBy parameter
    if (sortBy === "CATEGORY") {
      // Group by category
      const categoryGroups = new Map<
        string,
        { category: Category; biomarkers: BiomarkerItem[] }
      >();

      for (const item of biomarkerItems) {
        const categoryId = item.category.id;
        if (!categoryGroups.has(categoryId)) {
          categoryGroups.set(categoryId, {
            category: item.category,
            biomarkers: [],
          });
        }
        categoryGroups.get(categoryId)!.biomarkers.push(item);
      }

      // Sort biomarkers within each category by status priority, then by name
      const statusPriority: Record<string, number> = {
        out_of_range: 0,
        borderline: 1,
        optimal: 2,
        null: 3,
      };

      const response: BiomarkersByCategoryResponse[] = Array.from(
        categoryGroups.values()
      )
        .map((group) => {
          // Sort biomarkers within category
          group.biomarkers.sort((a, b) => {
            const aPriority = statusPriority[a.status ?? "null"] ?? 3;
            const bPriority = statusPriority[b.status ?? "null"] ?? 3;
            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }
            return a.name.localeCompare(b.name);
          });
          return group;
        })
        .sort((a, b) => a.category.sort_order - b.category.sort_order);

      return NextResponse.json({ biomarkers: response }, { status: 200 });
    } else {
      // Group by status (default)
      const statusGroups = new Map<
        "optimal" | "borderline" | "out_of_range" | null,
        BiomarkerItem[]
      >();

      for (const item of biomarkerItems) {
        const status = item.status;
        if (!statusGroups.has(status)) {
          statusGroups.set(status, []);
        }
        statusGroups.get(status)!.push(item);
      }

      // Sort biomarkers within each status group by name
      statusGroups.forEach((biomarkers) => {
        biomarkers.sort((a, b) => a.name.localeCompare(b.name));
      });

      // Build response with status priority: out_of_range first, then borderline, then optimal, then null
      const statusPriority: Record<string, number> = {
        out_of_range: 0,
        borderline: 1,
        optimal: 2,
        null: 3,
      };

      const response: BiomarkersByStatusResponse[] = Array.from(
        statusGroups.entries()
      )
        .map(([status, biomarkers]) => ({ status, biomarkers }))
        .sort((a, b) => {
          const aStatusKey = a.status ?? "null";
          const bStatusKey = b.status ?? "null";
          const aPriority = statusPriority[aStatusKey] ?? 3;
          const bPriority = statusPriority[bStatusKey] ?? 3;
          return aPriority - bPriority;
        });

      return NextResponse.json({ biomarkers: response }, { status: 200 });
    }
  } catch (error) {
    console.error("Error in GET /api/biomarkers route:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching biomarkers" },
      { status: 500 }
    );
  }
}
