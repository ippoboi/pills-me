import { createClient } from "@/lib/supabase/server";
import {
  formatTimestampToDate,
  getDateRangeTimestamps,
  isValidDateString,
} from "@/lib/utils/timezone";
import { calculateAdherenceProgress } from "@/lib/utils/supplements";
import { NextRequest, NextResponse } from "next/server";

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

    // Get date and timezone from query params
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const timezoneParam = searchParams.get("timezone") || "UTC";

    // Use provided date or calculate today in user's timezone
    const targetDate =
      dateParam || formatTimestampToDate(new Date(), timezoneParam);

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
    const [startOfDay, endOfDay] = getDateRangeTimestamps(
      targetDate,
      timezoneParam
    );

    // Get all active supplements for the user that should be active today
    // Now using timestamp comparison with timezone-aware date ranges
    const { data: supplements, error: supplementsError } = await supabase
      .from("supplements")
      .select(
        `
        id,
        name,
        capsules_per_take,
        recommendation,
        start_date,
        end_date,
        supplement_schedules (
          id,
          time_of_day,
          supplement_adherence!left (
            id
          )
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .lte("start_date", endOfDay)
      .or(`end_date.is.null,end_date.gte.${startOfDay}`)
      .eq("supplement_schedules.supplement_adherence.user_id", user.id)
      .gte("supplement_schedules.supplement_adherence.taken_at", startOfDay)
      .lt("supplement_schedules.supplement_adherence.taken_at", endOfDay);

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
      supplement_adherence?: Array<{ id: string }>;
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

    const supplementsWithAdherence = await Promise.all(
      (supplements || []).map(async (supplement: SupplementData) => {
        const schedules = supplement.supplement_schedules.map(
          (schedule: SupplementScheduleData) => ({
            id: schedule.id,
            time_of_day: schedule.time_of_day,
            adherence_status:
              schedule.supplement_adherence &&
              schedule.supplement_adherence.length > 0,
          })
        );

        // Calculate adherence progress using global utility function
        const adherence_progress = await calculateAdherenceProgress(
          supabase,
          supplement.id,
          user.id,
          supplement.start_date,
          supplement.end_date,
          targetDate
        );

        return {
          ...supplement,
          supplement_schedules: schedules,
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
