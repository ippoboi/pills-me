import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTodayDate,
  isValidDateString,
  groupScheduleByTimeOfDay,
  formatAdherenceData,
  calculateScheduleStats,
} from "@/lib/supplements";

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

    // Get date from query params or use today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam || getTodayDate();

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

    // Query today's schedule with adherence data
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("supplements")
      .select(
        `
        id,
        name,
        capsules_per_take,
        recommendation,
        source_name,
        source_url,
        supplement_schedules!inner (
          id,
          time_of_day
        ),
        supplement_adherence (
          id,
          taken_at,
          schedule_id
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .lte("start_date", targetDate)
      .or(`end_date.is.null,end_date.gte.${targetDate}`)
      .eq("supplement_adherence.taken_at", targetDate);

    if (scheduleError) {
      console.error("Error fetching schedule:", scheduleError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch schedule",
          details: scheduleError.message,
        },
        { status: 500 }
      );
    }

    // Transform the data to match our expected format
    const transformedData: any[] = [];

    scheduleData?.forEach((supplement) => {
      supplement.supplement_schedules.forEach((schedule) => {
        // Check if this schedule has adherence for the target date
        const adherence = supplement.supplement_adherence?.find(
          (a) => a.schedule_id === schedule.id && a.taken_at === targetDate
        );

        transformedData.push({
          supplement_id: supplement.id,
          schedule_id: schedule.id,
          name: supplement.name,
          capsules_per_take: supplement.capsules_per_take,
          recommendation: supplement.recommendation || "",
          source_name: supplement.source_name || "",
          source_url: supplement.source_url || "",
          time_of_day: schedule.time_of_day,
          adherence_id: adherence?.id || null,
          is_taken: !!adherence,
        });
      });
    });

    // Format and group the data
    const formattedData = formatAdherenceData(transformedData);
    const groupedSchedule = groupScheduleByTimeOfDay(formattedData);

    // Calculate stats
    const allSchedules = Object.values(groupedSchedule).flat();
    const stats = calculateScheduleStats(allSchedules);

    return NextResponse.json({
      date: targetDate,
      schedule: groupedSchedule,
      stats,
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
