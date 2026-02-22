import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import {
  validateUpdatePlanInput,
  isValidUUID,
} from "@/lib/utils/planner-validation";
import type { PlanStatus } from "@/lib/types/planner";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
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

    // Fetch plan with items
    const { data: plan, error } = await supabase
      .from("supplement_plans")
      .select(
        `
        *,
        items:plan_items(*)
      `
      )
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Not Found", message: "Plan not found or access denied" },
          { status: 404 }
        );
      }
      console.error("Error fetching plan:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch plan",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Unexpected error in GET /api/planner/plans/[id]:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
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

    // Parse body
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
    const validation = validateUpdatePlanInput(body);
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

    const input = body as { name?: string; notes?: string; status?: PlanStatus };

    // Fetch current plan to check status
    const { data: existingPlan, error: fetchError } = await supabase
      .from("supplement_plans")
      .select("status")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Not Found", message: "Plan not found or access denied" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Business rule: Cannot update archived plans
    if (existingPlan.status === "archived") {
      return NextResponse.json(
        { error: "Bad Request", message: "Cannot update an archived plan" },
        { status: 400 }
      );
    }

    // Business rule: Cannot change active -> draft
    if (existingPlan.status === "active" && input.status === "draft") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Cannot change status from active to draft. Archive the plan first.",
        },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.notes !== undefined)
      updateData.notes = input.notes?.trim() || null;
    if (input.status !== undefined) updateData.status = input.status;

    // Update plan
    const { data: plan, error: updateError } = await supabase
      .from("supplement_plans")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating plan:", updateError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to update plan",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Unexpected error in PUT /api/planner/plans/[id]:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
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

    // Delete plan (plan_items cascade delete via FK)
    const { data: deletedPlan, error } = await supabase
      .from("supplement_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, name")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Not Found", message: "Plan not found or access denied" },
          { status: 404 }
        );
      }
      console.error("Error deleting plan:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to delete plan",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
      plan: deletedPlan,
    });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/planner/plans/[id]:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
