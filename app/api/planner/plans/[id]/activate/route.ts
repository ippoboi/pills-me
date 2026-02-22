import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { validateActivatePlanInput, isValidUUID } from "@/lib/utils/planner-validation";
import { formatUTCToLocalDate } from "@/lib/utils/timezone";
import type { Database } from "@/lib/supabase/database.types";

type TimeOfDay = Database["public"]["Enums"]["time_of_day"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: planId } = await params;

    // Validate UUID format
    if (!isValidUUID(planId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid plan ID format" },
        { status: 400 }
      );
    }

    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId, supabase } = auth;

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateActivatePlanInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Bad Request", message: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const input = body as { schedules: TimeOfDay[]; timezone: string };

    // Fetch plan with items
    const { data: plan, error: planError } = await supabase
      .from("supplement_plans")
      .select(`
        *,
        items:plan_items(*)
      `)
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (planError) {
      if (planError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Not Found", message: "Plan not found or access denied" },
          { status: 404 }
        );
      }
      throw planError;
    }

    // Validate plan status
    if (plan.status !== "draft") {
      return NextResponse.json(
        { error: "Bad Request", message: "Plan must be in draft status to activate" },
        { status: 400 }
      );
    }

    // Validate plan has items
    if (!plan.items || plan.items.length === 0) {
      return NextResponse.json(
        { error: "Bad Request", message: "Plan has no items to activate" },
        { status: 400 }
      );
    }

    // Calculate today's date in user's timezone
    const todayDate = formatUTCToLocalDate(new Date().toISOString(), input.timezone);

    // Create supplements from plan_items
    const supplementInserts = plan.items.map((item: {
      name: string;
      brand: string | null;
      servings_per_day: number | null;
    }) => ({
      user_id: userId,
      name: item.name,
      brand: item.brand,
      capsules_per_take: item.servings_per_day || 1,
      start_date: todayDate,
      status: "ACTIVE" as const,
      plan_id: planId,
    }));

    const { data: supplements, error: supplementsError } = await supabase
      .from("supplements")
      .insert(supplementInserts)
      .select("id, name");

    if (supplementsError) {
      console.error("Error creating supplements:", supplementsError);
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to create supplements", details: supplementsError.message },
        { status: 500 }
      );
    }

    // Create schedules for each supplement
    const scheduleInserts = supplements.flatMap((supplement: { id: string }) =>
      input.schedules.map((timeOfDay) => ({
        supplement_id: supplement.id,
        time_of_day: timeOfDay,
      }))
    );

    const { error: schedulesError } = await supabase
      .from("supplement_schedules")
      .insert(scheduleInserts);

    if (schedulesError) {
      console.error("Error creating schedules:", schedulesError);

      // Rollback: delete created supplements
      const supplementIds = supplements.map((s: { id: string }) => s.id);
      await supabase.from("supplements").delete().in("id", supplementIds);

      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to create schedules. Rolled back supplements.", details: schedulesError.message },
        { status: 500 }
      );
    }

    // Update plan status to active
    const { data: updatedPlan, error: updateError } = await supabase
      .from("supplement_plans")
      .update({
        status: "active",
        start_date: todayDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating plan status:", updateError);
      // Note: Supplements and schedules already created - don't rollback at this point
      // The user can manually update the plan status if needed
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan || { ...plan, status: "active", start_date: todayDate },
      supplements: supplements,
      schedulesCreated: scheduleInserts.length,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/planner/plans/[id]/activate:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
