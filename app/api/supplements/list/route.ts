import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/database.types";

type SupplementStatus = Database["public"]["Enums"]["supplement_status"];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

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
      .eq("user_id", user.id)
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
        // Calculate days since start
        const startDate = new Date(supplement.start_date);
        const endDate = supplement.end_date
          ? new Date(supplement.end_date)
          : new Date();
        const today = new Date();

        // Use the earlier of end_date or today for calculation
        const calculationEndDate =
          supplement.end_date && new Date(supplement.end_date) < today
            ? new Date(supplement.end_date)
            : today;

        // Calculate total possible doses
        const daysDiff = Math.max(
          0,
          Math.floor(
            (calculationEndDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        );
        const schedulesPerDay = supplement.supplement_schedules?.length || 0;
        const totalPossibleDoses = daysDiff * schedulesPerDay;

        // Get actual adherence count
        const { count: adherenceCount, error: countError } = await supabase
          .from("supplement_adherence")
          .select("*", { count: "exact", head: true })
          .eq("supplement_id", supplement.id)
          .eq("user_id", user.id);

        if (countError) {
          console.error("Error counting adherence:", countError);
        }

        const actualAdherence = adherenceCount || 0;

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
          days_tracked: daysDiff,
          days_completed: actualAdherence,
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
