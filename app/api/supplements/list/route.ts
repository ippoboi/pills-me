import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/supabase/database.types";
import { calculateAdherenceProgress } from "@/lib/utils/supplements";
import { authenticateRequest } from "@/lib/auth-helper";

type SupplementStatus = Database["public"]["Enums"]["supplement_status"];

export async function GET(request: NextRequest) {
  try {
    // Authenticate using pm_session cookie
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId, supabase } = auth;

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") as SupplementStatus | null;

    // Validate status filter if provided
    const validStatuses: SupplementStatus[] = [
      "ACTIVE",
      "COMPLETED",
      "CANCELLED",
    ];
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from("supplements")
      .select(
        `
        id,
        name,
        capsules_per_take,
        status,
        start_date,
        end_date,
        created_at,
        supplement_schedules (
          id,
          time_of_day
        )
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: supplements, error: supplementsError } = await query;

    if (supplementsError) {
      console.error("Error fetching supplements:", supplementsError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch supplements",
          details: supplementsError.message,
        },
        { status: 500 }
      );
    }

    // For each supplement, calculate adherence stats
    const supplementsWithStats = await Promise.all(
      (supplements || []).map(async (supplement) => {
        const toISODate = (d: Date) =>
          new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
            .toISOString()
            .slice(0, 10);

        // Use the centralized adherence calculation utility
        const adherence_progress = await calculateAdherenceProgress(
          supabase,
          supplement.id,
          userId,
          supplement.start_date,
          supplement.end_date,
          undefined, // Use today as reference date
          "UTC" // Default to UTC for list view
        );

        // Calculate total possible doses for the adherence object
        const startDate = new Date(supplement.start_date);
        const today = new Date();
        const calculationEndDate =
          supplement.end_date && new Date(supplement.end_date) < today
            ? new Date(supplement.end_date)
            : today;

        const daysDiff = Math.max(
          0,
          Math.floor(
            (calculationEndDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        );
        const schedulesPerDay = supplement.supplement_schedules?.length || 0;
        const totalPossibleDoses = daysDiff * schedulesPerDay;

        // Get actual adherence count for the adherence object

        const startTimestamp = toISODate(startDate) + "T00:00:00Z";
        const endTimestamp = toISODate(calculationEndDate) + "T23:59:59.999Z";

        const { count: adherenceCount, error: countError } = await supabase
          .from("supplement_adherence")
          .select("*", { count: "exact", head: true })
          .eq("supplement_id", supplement.id)
          .eq("user_id", userId)
          .gte("taken_at", startTimestamp)
          .lte("taken_at", endTimestamp);

        if (countError) {
          console.error("Error counting adherence:", countError);
        }

        const actualAdherence = adherenceCount || 0;
        const adherencePercentage = adherence_progress.percentage;
        const periodType = supplement.end_date ? "PERIOD" : "STARTED";

        return {
          id: supplement.id,
          name: supplement.name,
          capsules_per_take: supplement.capsules_per_take,
          status: supplement.status,
          start_date: supplement.start_date,
          end_date: supplement.end_date,
          schedules:
            supplement.supplement_schedules?.map((s) => ({
              id: s.id,
              time_of_day: s.time_of_day,
            })) || [],
          // UI helpers for list view
          period_type: periodType as "PERIOD" | "STARTED",
          day_number: daysDiff, // "Day N" badge (inclusive)
          schedules_per_day: schedulesPerDay,
          adherence: {
            total_possible: totalPossibleDoses,
            completed: actualAdherence,
            percentage: adherencePercentage,
          },
        };
      })
    );

    return NextResponse.json({
      supplements: supplementsWithStats,
    });
  } catch (error) {
    console.error("Unexpected error in supplements list:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
