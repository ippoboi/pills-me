import { NextRequest, NextResponse } from "next/server";
import { validateSupplementInput } from "@/lib/utils/validation";
import { type SupplementInput } from "@/lib/types";
import { Database } from "@/lib/supabase/database.types";
import { authenticateRequest } from "@/lib/auth-helper";
import {
  createUTCTimestampFromLocalDateTime,
  formatUTCToLocalDate,
} from "@/lib/utils/timezone";

type TimeOfDay = Database["public"]["Enums"]["time_of_day"];

export async function POST(request: NextRequest) {
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

    // Parse request body
    let body: SupplementInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Get timezone from query params or default to UTC
    const url = new URL(request.url);
    const timezone = url.searchParams.get("timezone") || "UTC";

    // Validate input
    const validation = validateSupplementInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Start transaction by creating supplement first
    const { data: supplement, error: supplementError } = await supabase
      .from("supplements")
      .insert({
        user_id: userId,
        name: body.name.trim(),
        capsules_per_take: body.capsules_per_take,
        recommendation: body.recommendation?.trim() || null,
        reason: body.reason?.trim() || null,
        source_name: body.source_name?.trim() || null,
        source_url: body.source_url?.trim() || null,
        start_date: body.start_date,
        end_date: body.end_date || null,
        status: "ACTIVE",
        inventory_total: body.end_date ? null : body.inventory_total || null,
        low_inventory_threshold: body.end_date ? null : 10,
      })
      .select()
      .single();

    if (supplementError) {
      console.error("Error creating supplement:", supplementError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to create supplement",
          details: supplementError.message,
        },
        { status: 500 }
      );
    }

    // Create schedule entries
    const scheduleInserts = body.time_of_day.map((timeOfDay: TimeOfDay) => ({
      supplement_id: supplement.id,
      time_of_day: timeOfDay,
    }));

    const { data: schedules, error: schedulesError } = await supabase
      .from("supplement_schedules")
      .insert(scheduleInserts)
      .select();

    if (schedulesError) {
      console.error("Error creating schedules:", schedulesError);

      // Rollback: delete the supplement if schedule creation fails
      await supabase.from("supplements").delete().eq("id", supplement.id);

      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to create supplement schedules",
          details: schedulesError.message,
        },
        { status: 500 }
      );
    }

    // Create backfill adherence records if start_date is in the past
    // Important: Calculate "today" in the user's timezone, not server time
    const todayInUserTz = formatUTCToLocalDate(
      new Date().toISOString(),
      timezone
    );
    const startDateString = body.start_date.includes("T")
      ? body.start_date.split("T")[0]
      : body.start_date;

    // Compare date strings in YYYY-MM-DD format
    if (startDateString < todayInUserTz && schedules) {
      try {
        console.log(`🔄 [BACKFILL DEBUG] Starting backfill process:`, {
          startDateString,
          todayInUserTz,
          timezone,
          missedDays: body.missed_days || [],
        });

        // Convert missed_days to Set for O(1) lookup
        const missedDaysSet = new Set(body.missed_days || []);

        // Time mapping for each time_of_day (same as adherence toggle route)
        const hoursByTimeOfDay: Record<string, number> = {
          MORNING: 8,
          LUNCH: 12,
          DINNER: 18,
          BEFORE_SLEEP: 22,
        };

        // Generate all dates from start_date to yesterday (in user's timezone)
        const adherenceRecords: Array<{
          user_id: string;
          supplement_id: string;
          schedule_id: string;
          taken_at: string;
        }> = [];

        // Parse start date and create date objects for iteration
        const [startYear, startMonth, startDay] = startDateString
          .split("-")
          .map(Number);
        const currentDate = new Date(startYear, startMonth - 1, startDay);

        // Parse today date to know when to stop
        const [todayYear, todayMonth, todayDay] = todayInUserTz
          .split("-")
          .map(Number);
        const todayDate = new Date(todayYear, todayMonth - 1, todayDay);

        while (currentDate < todayDate) {
          // Format current date as YYYY-MM-DD
          const dateString = currentDate.toISOString().split("T")[0];

          // Also format for missed_days comparison (which uses toLocaleDateString format)
          const dateStringForComparison =
            currentDate.toLocaleDateString("en-US");

          // Only create adherence records for days NOT in missed_days
          if (!missedDaysSet.has(dateStringForComparison)) {
            // Create adherence record for each schedule (time of day)
            schedules.forEach((schedule) => {
              // Get the appropriate hour for this time of day
              const localHours = hoursByTimeOfDay[schedule.time_of_day] ?? 0;

              // Convert local date/time to UTC timestamp (same logic as adherence toggle)
              const takenAtUTC = createUTCTimestampFromLocalDateTime(
                dateString,
                localHours,
                0,
                timezone
              );

              adherenceRecords.push({
                user_id: userId,
                supplement_id: supplement.id,
                schedule_id: schedule.id,
                taken_at: takenAtUTC,
              });
            });
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Insert all adherence records in batch
        if (adherenceRecords.length > 0) {
          console.log(
            `🔄 [BACKFILL DEBUG] Creating ${adherenceRecords.length} adherence records with timezone: ${timezone}`
          );
          console.log(
            "📝 [BACKFILL DEBUG] Sample record:",
            adherenceRecords[0]
          );

          const { error: adherenceError } = await supabase
            .from("supplement_adherence")
            .insert(adherenceRecords);

          if (adherenceError) {
            console.error(
              "❌ [BACKFILL DEBUG] Error creating backfill adherence records:",
              adherenceError
            );
            // Note: We don't rollback here as the supplement and schedules are already created
            // The user can manually mark adherence later if needed
          } else {
            console.log(
              `✅ [BACKFILL DEBUG] Successfully created ${adherenceRecords.length} backfill adherence records`
            );
          }
        } else {
          console.log(
            "ℹ️ [BACKFILL DEBUG] No adherence records to create (all days were missed or supplement starts today/future)"
          );
        }
      } catch (backfillError) {
        console.error("Error during backfill process:", backfillError);
        // Continue without failing the entire request
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        supplement: {
          ...supplement,
          schedules: schedules || [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in supplement creation:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
