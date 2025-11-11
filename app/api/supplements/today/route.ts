import { authenticateRequest } from "@/lib/auth-helper";
import { calculateAdherenceProgress } from "@/lib/utils/supplements";
import {
  formatUTCToLocalDate,
  getLocalDayBoundariesInUTC,
  isValidDateString,
} from "@/lib/utils/timezone";
import { NextRequest, NextResponse } from "next/server";

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

    const { userId, supabase: db } = auth;

    // Get date and timezone from query params
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const timezoneParam = searchParams.get("timezone") || "UTC";

    // Use provided date or calculate today in user's timezone
    const targetDate =
      dateParam ||
      formatUTCToLocalDate(new Date().toISOString(), timezoneParam);

    // Validate date format
    if (!isValidDateString(targetDate)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid date format. Use YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    // Get the date range for filtering (start and end of day in user's timezone)
    const [startOfDay, endOfDay] = getLocalDayBoundariesInUTC(
      targetDate,
      timezoneParam
    );

    // Get all active supplements for the user that should be active today
    // Using proper timezone-aware date ranges and separate adherence queries
    const { data: supplements, error: supplementsError } = await db
      .from("supplements")
      .select(
        `
        id,
        name,
        capsules_per_take,
        recommendation,
        start_date,
        end_date,
        supplement_schedules!inner (
          id,
          time_of_day
        )
      `
      )
      .eq("user_id", userId!)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .lte("start_date", endOfDay)
      .or(`end_date.is.null,end_date.gte.${startOfDay}`);

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

    // Transform the data to include adherence status and calculate day-based progress
    interface SupplementScheduleData {
      id: string;
      time_of_day: string;
    }

    interface SupplementData {
      id: string;
      name: string;
      capsules_per_take: number;
      recommendation: string | null;
      start_date: string;
      end_date: string | null;
      supplement_schedules: SupplementScheduleData[];
    }

    // Optimization: Batch fetch all adherence records in one query (avoid N+1)
    const supplementIds = (supplements || []).map((s) => s.id);
    const scheduleIds = (supplements || []).flatMap((s) =>
      s.supplement_schedules.map((sc) => sc.id)
    );

    const adherenceMap = new Map<string, boolean>();

    if (supplementIds.length > 0 && scheduleIds.length > 0) {
      const { data: allAdherence } = await db
        .from("supplement_adherence")
        .select("supplement_id, schedule_id")
        .eq("user_id", userId!)
        .in("supplement_id", supplementIds)
        .in("schedule_id", scheduleIds)
        .gte("taken_at", startOfDay)
        .lt("taken_at", endOfDay);

      // Create lookup map for O(1) adherence checks
      allAdherence?.forEach((a) => {
        adherenceMap.set(`${a.supplement_id}-${a.schedule_id}`, true);
      });
    }

    // Map supplements with adherence status (no more nested queries)
    const supplementsWithAdherence = await Promise.all(
      (supplements || []).map(async (supplement: SupplementData) => {
        // Map schedules with adherence status from the lookup map
        const schedulesWithAdherence = supplement.supplement_schedules.map(
          (schedule: SupplementScheduleData) => ({
            id: schedule.id,
            time_of_day: schedule.time_of_day,
            adherence_status: adherenceMap.has(
              `${supplement.id}-${schedule.id}`
            ),
          })
        );

        // Calculate adherence progress using global utility function
        const adherence_progress = await calculateAdherenceProgress(
          db,
          supplement.id,
          userId!,
          supplement.start_date,
          supplement.end_date,
          targetDate,
          timezoneParam
        );

        return {
          ...supplement,
          supplement_schedules: schedulesWithAdherence,
          adherence_progress,
        };
      })
    );

    return NextResponse.json({
      date: targetDate,
      timezone: timezoneParam,
      supplements: supplementsWithAdherence,
    });
  } catch (error) {
    console.error("Unexpected error in today's schedule:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
