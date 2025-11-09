import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidDateString } from "@/lib/supplements";

interface ToggleAdherenceRequest {
  supplement_id: string;
  schedule_id: string;
  taken_at: string;
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    let body: ToggleAdherenceRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.supplement_id || !body.schedule_id || !body.taken_at) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Missing required fields: supplement_id, schedule_id, taken_at",
        },
        { status: 400 }
      );
    }

    // Validate date format
    if (!isValidDateString(body.taken_at)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid date format. Use YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    // Verify user owns the supplement
    const { data: supplement, error: supplementError } = await supabase
      .from("supplements")
      .select("id, capsules_per_take")
      .eq("id", body.supplement_id)
      .eq("user_id", user.id)
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

    // Verify the schedule belongs to this supplement
    const { data: schedule, error: scheduleError } = await supabase
      .from("supplement_schedules")
      .select("id")
      .eq("id", body.schedule_id)
      .eq("supplement_id", body.supplement_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: "Not Found", message: "Schedule not found" },
        { status: 404 }
      );
    }

    // Check if adherence record already exists
    const { data: existingAdherence, error: adherenceCheckError } =
      await supabase
        .from("supplement_adherence")
        .select("id")
        .eq("supplement_id", body.supplement_id)
        .eq("schedule_id", body.schedule_id)
        .eq("taken_at", body.taken_at)
        .eq("user_id", user.id)
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

      is_taken = false;
    } else {
      // Create new adherence record (toggle on)
      const { data: newAdherence, error: insertError } = await supabase
        .from("supplement_adherence")
        .insert({
          user_id: user.id,
          supplement_id: body.supplement_id,
          schedule_id: body.schedule_id,
          taken_at: body.taken_at,
          capsules_taken: supplement.capsules_per_take,
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

      is_taken = true;
      adherence_id = newAdherence.id;
    }

    return NextResponse.json({
      success: true,
      is_taken,
      adherence_id,
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
