import { NextRequest, NextResponse } from "next/server";
import {
  createUTCTimestampFromLocalDateTime,
  isValidDateString,
} from "@/lib/utils/timezone";
import { authenticateRequest } from "@/lib/auth-helper";

interface ToggleAdherenceRequest {
  supplement_id: string;
  schedule_id: string;
  date: string; // Date in YYYY-MM-DD format
  timezone: string; // IANA timezone identifier
}

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
    let body: ToggleAdherenceRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (
      !body.supplement_id ||
      !body.schedule_id ||
      !body.date ||
      !body.timezone
    ) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Missing required fields: supplement_id, schedule_id, date, timezone",
        },
        { status: 400 }
      );
    }

    // Validate date format
    if (!isValidDateString(body.date)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Invalid date format. Use YYYY-MM-DD format (e.g., 2025-11-10)",
        },
        { status: 400 }
      );
    }

    // Verify user owns the supplement
    const { data: supplement, error: supplementError } = await supabase
      .from("supplements")
      .select("id")
      .eq("id", body.supplement_id)
      .eq("user_id", userId)
      .single();

    if (supplementError || !supplement) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Supplement not found or access denied",
        },
        { status: 404 }
      );
    }

    // Verify the schedule belongs to this supplement and get time_of_day
    const { data: schedule, error: scheduleError } = await supabase
      .from("supplement_schedules")
      .select("id, time_of_day")
      .eq("id", body.schedule_id)
      .eq("supplement_id", body.supplement_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: "Not Found", message: "Schedule not found" },
        { status: 404 }
      );
    }

    // Generate schedule-specific timestamp using proper timezone conversion
    // Convert the user's local date + time to UTC for storage
    const hoursByTimeOfDay: Record<string, number> = {
      MORNING: 8,
      LUNCH: 12,
      DINNER: 18,
      BEFORE_SLEEP: 22,
    };
    const localHours = hoursByTimeOfDay[schedule.time_of_day] ?? 0;

    // Convert: "2025-11-10" + 8:00 AM PST → "2025-11-10T16:00:00.000Z" (UTC)
    const scheduleSpecificTimestamp = createUTCTimestampFromLocalDateTime(
      body.date,
      localHours,
      0,
      body.timezone
    );

    console.log("🔧 [ADHERENCE DEBUG] Timestamp generation:", {
      date: body.date,
      timezone: body.timezone,
      timeOfDay: schedule.time_of_day,
      localHours,
      scheduleSpecificTimestamp,
      supplementId: body.supplement_id,
      scheduleId: body.schedule_id,
    });

    // Check if adherence record already exists
    const { data: existingAdherence, error: adherenceCheckError } =
      await supabase
        .from("supplement_adherence")
        .select("id")
        .eq("supplement_id", body.supplement_id)
        .eq("schedule_id", body.schedule_id)
        .eq("taken_at", scheduleSpecificTimestamp)
        .eq("user_id", userId)
        .maybeSingle();

    if (adherenceCheckError) {
      console.error("Error checking adherence:", adherenceCheckError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to check adherence status",
          details: adherenceCheckError.message,
        },
        { status: 500 }
      );
    }

    let is_taken: boolean;
    let adherence_id: string | null = null;

    if (existingAdherence) {
      // Delete existing adherence (untoggle)
      const { error: deleteError } = await supabase
        .from("supplement_adherence")
        .delete()
        .eq("id", existingAdherence.id);

      if (deleteError) {
        console.error("Error deleting adherence:", deleteError);
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to update adherence status",
            details: deleteError.message,
          },
          { status: 500 }
        );
      }

      // Increment inventory back when untoggling
      const { data: supplementData } = await supabase
        .from("supplements")
        .select("capsules_per_take, inventory_total")
        .eq("id", body.supplement_id)
        .single();

      if (
        supplementData?.inventory_total !== null &&
        supplementData?.inventory_total !== undefined
      ) {
        const newInventory =
          supplementData.inventory_total + supplementData.capsules_per_take;
        await supabase
          .from("supplements")
          .update({ inventory_total: newInventory })
          .eq("id", body.supplement_id);
      }

      is_taken = false;
    } else {
      // Create new adherence record (toggle on)
      console.log("📝 [ADHERENCE DEBUG] Attempting to insert:", {
        user_id: userId,
        supplement_id: body.supplement_id,
        schedule_id: body.schedule_id,
        taken_at: scheduleSpecificTimestamp,
      });

      const { data: newAdherence, error: insertError } = await supabase
        .from("supplement_adherence")
        .insert({
          user_id: userId,
          supplement_id: body.supplement_id,
          schedule_id: body.schedule_id,
          taken_at: scheduleSpecificTimestamp,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating adherence:", insertError);
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to update adherence status",
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      // Decrement inventory when marking as taken
      const { data: supplementData } = await supabase
        .from("supplements")
        .select("capsules_per_take, inventory_total")
        .eq("id", body.supplement_id)
        .single();

      if (
        supplementData?.inventory_total !== null &&
        supplementData?.inventory_total !== undefined
      ) {
        const newInventory = Math.max(
          0,
          supplementData.inventory_total - supplementData.capsules_per_take
        );
        await supabase
          .from("supplements")
          .update({ inventory_total: newInventory })
          .eq("id", body.supplement_id);
      }

      is_taken = true;
      adherence_id = newAdherence.id;
    }

    return NextResponse.json({
      success: true,
      is_taken,
      adherence_id,
      taken_at: scheduleSpecificTimestamp, // Return the schedule-specific timestamp for client reference
    });
  } catch (error) {
    console.error("Unexpected error in adherence toggle:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
