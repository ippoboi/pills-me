import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import {
  validateCreatePlanItemInput,
  isValidUUID,
} from "@/lib/utils/planner-validation";
import type { CreatePlanItemInput } from "@/lib/types/planner";
import type { Json } from "@/lib/supabase/database.types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: planId } = await params;

    // Validate plan ID format
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

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateCreatePlanItemInput(body);
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

    const input = body as CreatePlanItemInput;

    // Verify plan exists, belongs to user, and is in draft status
    const { data: plan, error: planError } = await supabase
      .from("supplement_plans")
      .select("id, status")
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
      console.error("Error fetching plan:", planError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to verify plan",
          details: planError.message,
        },
        { status: 500 }
      );
    }

    // Business rule: Can only add items to draft plans
    if (plan.status !== "draft") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: `Cannot add items to a plan with status "${plan.status}". Only draft plans can be modified.`,
        },
        { status: 400 }
      );
    }

    // Insert the plan item
    const { data: item, error: insertError } = await supabase
      .from("plan_items")
      .insert({
        plan_id: planId,
        name: input.name.trim(),
        brand: input.brand?.trim() || null,
        servings_per_day: input.servingsPerDay,
        nutrients: input.nutrients as unknown as Json,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating plan item:", insertError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to create plan item",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Update the plan's updated_at timestamp
    await supabase
      .from("supplement_plans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", planId);

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/planner/plans/[id]/items:",
      error
    );
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
