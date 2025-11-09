import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodayDate, isValidDateString } from "@/lib/supplements";

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

    // Get all active supplements for the user that should be active today
    const { data: supplements, error: supplementsError } = await supabase
      .from("supplements")
      .select(
        `
        id,
        name,
        capsules_per_take,
        recommendation,
        source_name,
        source_url,
        start_date,
        end_date,
        supplement_schedules (
          id,
          time_of_day
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .lte("start_date", targetDate)
      .or(`end_date.is.null,end_date.gte.${targetDate}`);

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

    return NextResponse.json({
      date: targetDate,
      supplements: supplements || [],
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
