import { authenticateRequest } from "@/lib/auth-helper";
import { Database } from "@/lib/supabase/database.types";
import { type SupplementInput } from "@/lib/types";
import { validateSupplementInput } from "@/lib/utils/validation";
import {
  calculateAdherenceProgress,
  calculateTotalTakes,
} from "@/lib/utils/supplements";
import { enumerateLocalDates } from "@/lib/utils/supplements";
import { formatUTCToLocalDate } from "@/lib/utils/timezone";
import { NextRequest, NextResponse } from "next/server";

type TimeOfDay = Database["public"]["Enums"]["time_of_day"];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id: supplementId } = await params;

    // Validate supplement ID format (basic UUID check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supplementId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid supplement ID format" },
        { status: 400 }
      );
    }

    // Fetch supplement details
    const { data: supplement, error: supplementError } = await supabase
      .from("supplements")
      .select(
        `
        id,
        name,
        capsules_per_take,
        recommendation,
        reason,
        source_name,
        source_url,
        start_date,
        end_date,
        status,
        created_at,
        inventory_total,
        low_inventory_threshold,
        supplement_schedules (
          id,
          time_of_day
        )
      `
      )
      .eq("id", supplementId)
      .eq("user_id", userId)
      .is("deleted_at", null)
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

    // TODO: MODIFY THIS FOR INDEFINITE SUPPLEMENTS LATER ON WHEN WE HAVE 90 DAYS+ i would say
    // // Fetch recent adherence history (last 30 days)
    // const thirtyDaysAgo = new Date();
    // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // // Convert to proper timestamp for TIMESTAMPTZ comparison
    // const thirtyDaysAgoTimestamp =
    //   thirtyDaysAgo.toISOString().split("T")[0] + "T00:00:00Z";

    const { data: adherenceHistory, error: adherenceError } = await supabase
      .from("supplement_adherence")
      .select(
        `
        taken_at,
        marked_at,
        supplement_schedules!inner (
          time_of_day
        )
      `
      )
      .eq("supplement_id", supplementId)
      .eq("user_id", userId)
      .order("taken_at", { ascending: false })
      .order("marked_at", { ascending: false });

    if (adherenceError) {
      console.error("Error fetching adherence history:", adherenceError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch adherence history",
          details: adherenceError.message,
        },
        { status: 500 }
      );
    }

    // Calculate adherence progress using schedules and adherence table
    const url = new URL(request.url);
    const timezone = url.searchParams.get("timezone") || "UTC";
    const adherence_progress = await calculateAdherenceProgress(
      supabase,
      supplementId,
      userId,
      supplement.start_date,
      supplement.end_date,
      undefined,
      timezone
    );
    const schedulesPerDay = supplement.supplement_schedules?.length ?? 0;
    const total_takes = calculateTotalTakes(
      supplement.start_date,
      supplement.end_date,
      schedulesPerDay,
      undefined,
      timezone
    );
    // Build day buckets { date, isTaken }[]
    const adherenceDateSet = new Set(
      (adherenceHistory || []).map((a) =>
        formatUTCToLocalDate(a.taken_at, timezone)
      )
    );
    const allDays = enumerateLocalDates(
      supplement.start_date,
      supplement.end_date,
      timezone
    );
    const todayLocal = formatUTCToLocalDate(new Date().toISOString(), timezone);
    const day_buckets = allDays.map((d) => {
      const isFuture = d > todayLocal;
      return {
        date: d,
        isTaken: adherenceDateSet.has(d),
        isFuture,
      };
    });

    // Format the response
    const response = {
      supplement: {
        id: supplement.id,
        name: supplement.name,
        capsules_per_take: supplement.capsules_per_take,
        recommendation: supplement.recommendation || "",
        reason: supplement.reason || "",
        source_name: supplement.source_name || "",
        source_url: supplement.source_url || "",
        start_date: supplement.start_date,
        end_date: supplement.end_date,
        status: supplement.status,
        created_at: supplement.created_at,
        inventory_total: supplement.inventory_total,
        low_inventory_threshold: supplement.low_inventory_threshold,
        schedules:
          supplement.supplement_schedules?.map(
            (schedule) => schedule.time_of_day
          ) ?? [],
        total_takes,
        adherence_progress,
      },
      day_buckets,
      recent_adherence:
        adherenceHistory?.map((adherence) => ({
          date: adherence.taken_at,
          time_of_day: adherence.supplement_schedules?.time_of_day || "",
          marked_at: adherence.marked_at,
        })) || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in supplement detail:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: supplementId } = await params;

    // Validate supplement ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supplementId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid supplement ID format" },
        { status: 400 }
      );
    }

    // Parse request body
    let body: Partial<SupplementInput>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check if supplement exists and user owns it
    const { data: existingSupplement, error: existingError } = await supabase
      .from("supplements")
      .select("id, name")
      .eq("id", supplementId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (existingError || !existingSupplement) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Supplement not found or access denied",
        },
        { status: 404 }
      );
    }

    // Validate input if provided (partial validation for updates)
    if (Object.keys(body).length > 0) {
      // For updates, we need to validate only the fields that are provided
      const fieldsToValidate: Partial<SupplementInput> = {};

      // Copy provided fields for validation
      if (body.name !== undefined) fieldsToValidate.name = body.name;
      if (body.capsules_per_take !== undefined)
        fieldsToValidate.capsules_per_take = body.capsules_per_take;
      if (body.time_of_day !== undefined)
        fieldsToValidate.time_of_day = body.time_of_day;
      if (body.start_date !== undefined)
        fieldsToValidate.start_date = body.start_date;
      if (body.end_date !== undefined)
        fieldsToValidate.end_date = body.end_date;
      if (body.recommendation !== undefined)
        fieldsToValidate.recommendation = body.recommendation;
      if (body.reason !== undefined) fieldsToValidate.reason = body.reason;
      if (body.source_name !== undefined)
        fieldsToValidate.source_name = body.source_name;
      if (body.source_url !== undefined)
        fieldsToValidate.source_url = body.source_url;
      if (body.inventory_total !== undefined)
        fieldsToValidate.inventory_total = body.inventory_total;
      if (body.low_inventory_threshold !== undefined)
        fieldsToValidate.low_inventory_threshold = body.low_inventory_threshold;

      // Only validate if we have fields that need validation
      if (
        body.name ||
        body.capsules_per_take ||
        body.time_of_day ||
        body.start_date
      ) {
        // For required fields, use existing values if not provided
        const validation = validateSupplementInput({
          name: body.name || existingSupplement.name,
          capsules_per_take: body.capsules_per_take || 1,
          time_of_day: body.time_of_day || ["MORNING"],
          start_date: body.start_date || "2025-01-01",
          ...fieldsToValidate,
        });

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
      }
    }

    // Prepare update data
    const updateData: Partial<SupplementInput> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.capsules_per_take !== undefined)
      updateData.capsules_per_take = body.capsules_per_take;
    if (body.recommendation !== undefined)
      updateData.recommendation = body.recommendation?.trim() || undefined;
    if (body.reason !== undefined)
      updateData.reason = body.reason?.trim() || undefined;
    if (body.source_name !== undefined)
      updateData.source_name = body.source_name?.trim() || undefined;
    if (body.source_url !== undefined)
      updateData.source_url = body.source_url?.trim() || undefined;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined)
      updateData.end_date = body.end_date || undefined;
    if (body.inventory_total !== undefined)
      updateData.inventory_total = body.inventory_total;
    if (body.low_inventory_threshold !== undefined)
      updateData.low_inventory_threshold = body.low_inventory_threshold;

    // Update supplement if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("supplements")
        .update(updateData)
        .eq("id", supplementId);

      if (updateError) {
        console.error("Error updating supplement:", updateError);
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to update supplement",
            details: updateError.message,
          },
          { status: 500 }
        );
      }
    }

    // Handle schedule updates if time_of_day is provided
    if (body.time_of_day) {
      // Delete existing schedules
      const { error: deleteSchedulesError } = await supabase
        .from("supplement_schedules")
        .delete()
        .eq("supplement_id", supplementId);

      if (deleteSchedulesError) {
        console.error("Error deleting old schedules:", deleteSchedulesError);
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to update schedules",
            details: deleteSchedulesError.message,
          },
          { status: 500 }
        );
      }

      // Insert new schedules
      const scheduleInserts = body.time_of_day.map((timeOfDay: TimeOfDay) => ({
        supplement_id: supplementId,
        time_of_day: timeOfDay,
      }));

      const { error: insertSchedulesError } = await supabase
        .from("supplement_schedules")
        .insert(scheduleInserts);

      if (insertSchedulesError) {
        console.error("Error creating new schedules:", insertSchedulesError);
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to update schedules",
            details: insertSchedulesError.message,
          },
          { status: 500 }
        );
      }
    }

    // Fetch and return updated supplement
    const { data: updatedSupplement, error: fetchError } = await supabase
      .from("supplements")
      .select(
        `
        id,
        name,
        capsules_per_take,
        recommendation,
        reason,
        source_name,
        source_url,
        start_date,
        end_date,
        status,
        created_at,
        updated_at,
        supplement_schedules (
          id,
          time_of_day
        )
      `
      )
      .eq("id", supplementId)
      .single();

    if (fetchError) {
      console.error("Error fetching updated supplement:", fetchError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Supplement updated but failed to fetch updated data",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      supplement: {
        ...updatedSupplement,
        schedules: updatedSupplement.supplement_schedules || [],
      },
    });
  } catch (error) {
    console.error("Unexpected error in supplement update:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: supplementId } = await params;

    // Validate supplement ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supplementId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid supplement ID format" },
        { status: 400 }
      );
    }

    // Check if supplement exists and user owns it
    const { data: existingSupplement, error: existingError } = await supabase
      .from("supplements")
      .select("id, name, deleted_at")
      .eq("id", supplementId)
      .eq("user_id", userId)
      .single();

    if (existingError || !existingSupplement) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Supplement not found or access denied",
        },
        { status: 404 }
      );
    }

    // Check if already deleted
    if (existingSupplement.deleted_at) {
      return NextResponse.json(
        { error: "Bad Request", message: "Supplement is already deleted" },
        { status: 400 }
      );
    }

    // Soft delete the supplement
    const { error: deleteError } = await supabase
      .from("supplements")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", supplementId);

    if (deleteError) {
      console.error("Error deleting supplement:", deleteError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to delete supplement",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supplement deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error in supplement deletion:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
