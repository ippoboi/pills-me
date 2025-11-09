import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateSupplementInput,
  type SupplementInput,
} from "@/lib/supplements";
import { Database } from "@/lib/supabase/database.types";

type TimeOfDay = Database["public"]["Enums"]["time_of_day"];

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
    let body: SupplementInput;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

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
        user_id: user.id,
        name: body.name.trim(),
        capsules_per_take: body.capsules_per_take,
        recommendation: body.recommendation?.trim() || null,
        reason: body.reason?.trim() || null,
        source_name: body.source_name?.trim() || null,
        source_url: body.source_url?.trim() || null,
        start_date: body.start_date,
        end_date: body.end_date || null,
        status: "ACTIVE",
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
