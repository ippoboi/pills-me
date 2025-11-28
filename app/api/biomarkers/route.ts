import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { enrichOcrResults } from "@/lib/utils/biomarker-matching";
import type { Tables, Database } from "@/lib/supabase/database.types";

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
