import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import type { Database } from "@/lib/supabase/database.types";

type UserBiomarker = Database["public"]["Tables"]["user_biomarkers"]["Row"];

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { supabase, userId } = auth;

    const { data: reportsData, error: reportsError } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("collected_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (reportsError) {
      console.error("Error fetching reports", reportsError);
      return NextResponse.json(
        { error: "Failed to load lab reports." },
        { status: 500 }
      );
    }

    if (!reportsData || reportsData.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    const reportIds = reportsData.map((r) => r.id);

    // Get biomarker counts for each report
    const { data: biomarkers } = await supabase
      .from("user_biomarkers")
      .select("id, report_id")
      .in("report_id", reportIds);

    const biomarkerCountByReport = new Map<string, number>();
    ((biomarkers as UserBiomarker[] | null) ?? []).forEach((b) => {
      if (!b.report_id) return;
      biomarkerCountByReport.set(
        b.report_id,
        (biomarkerCountByReport.get(b.report_id) ?? 0) + 1
      );
    });

    return NextResponse.json({ reports: reportsData });
  } catch (error) {
    console.error("Error in /api/biomarkers/reports route:", error);
    return NextResponse.json(
      { error: "Failed to load lab reports." },
      { status: 500 }
    );
  }
}
