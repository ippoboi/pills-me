import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import {
  validateUpdatePlanItemInput,
  isValidUUID,
} from "@/lib/utils/planner-validation";
import type { UpdatePlanItemInput } from "@/lib/types/planner";
import type { Json } from "@/lib/supabase/database.types";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: planId, itemId } = await params;

    // Validate UUID formats
    if (!isValidUUID(planId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid plan ID format" },
        { status: 400 }
      );
    }
    if (!isValidUUID(itemId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid item ID format" },
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
    const validation = validateUpdatePlanItemInput(body);
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

    const input = body as UpdatePlanItemInput;

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

    // Business rule: Can only modify items in draft plans
    if (plan.status !== "draft") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: `Cannot modify items in a plan with status "${plan.status}". Only draft plans can be modified.`,
        },
        { status: 400 }
      );
    }

    // Verify item exists and belongs to this plan
    const { data: existingItem, error: itemFetchError } = await supabase
      .from("plan_items")
      .select("id")
      .eq("id", itemId)
      .eq("plan_id", planId)
      .single();

    if (itemFetchError) {
      if (itemFetchError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: "Not Found",
            message: "Item not found or does not belong to this plan",
          },
          { status: 404 }
        );
      }
      console.error("Error fetching item:", itemFetchError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to verify item",
          details: itemFetchError.message,
        },
        { status: 500 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.brand !== undefined)
      updateData.brand = input.brand?.trim() || null;
    if (input.servingsPerDay !== undefined)
      updateData.servings_per_day = input.servingsPerDay;
    if (input.nutrients !== undefined)
      updateData.nutrients = input.nutrients as unknown as Json;

    // Update the item
    const { data: item, error: updateError } = await supabase
      .from("plan_items")
      .update(updateData)
      .eq("id", itemId)
      .eq("plan_id", planId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating plan item:", updateError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to update plan item",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Update the plan's updated_at timestamp
    await supabase
      .from("supplement_plans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", planId);

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error(
      "Unexpected error in PUT /api/planner/plans/[id]/items/[itemId]:",
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: planId, itemId } = await params;

    // Validate UUID formats
    if (!isValidUUID(planId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid plan ID format" },
        { status: 400 }
      );
    }
    if (!isValidUUID(itemId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid item ID format" },
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

    // Business rule: Can only delete items from draft plans
    if (plan.status !== "draft") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: `Cannot delete items from a plan with status "${plan.status}". Only draft plans can be modified.`,
        },
        { status: 400 }
      );
    }

    // Delete the item
    const { data: deletedItem, error: deleteError } = await supabase
      .from("plan_items")
      .delete()
      .eq("id", itemId)
      .eq("plan_id", planId)
      .select("id, name")
      .single();

    if (deleteError) {
      if (deleteError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: "Not Found",
            message: "Item not found or does not belong to this plan",
          },
          { status: 404 }
        );
      }
      console.error("Error deleting plan item:", deleteError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to delete plan item",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    // Update the plan's updated_at timestamp
    await supabase
      .from("supplement_plans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", planId);

    return NextResponse.json({
      success: true,
      message: "Item deleted",
    });
  } catch (error) {
    console.error(
      "Unexpected error in DELETE /api/planner/plans/[id]/items/[itemId]:",
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
