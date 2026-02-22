import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { validateCreatePlanInput } from "@/lib/utils/planner-validation";
import type { PlanStatus } from "@/lib/types/planner";

const VALID_STATUSES: PlanStatus[] = ["draft", "active", "paused", "archived"];

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId, supabase } = auth;

    // Get optional status filter from query params
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    // Build query
    let query = supabase
      .from("supplement_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Apply status filter if provided and valid
    if (statusParam && VALID_STATUSES.includes(statusParam as PlanStatus)) {
      query = query.eq("status", statusParam as PlanStatus);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error("Error fetching plans:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch plans",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Unexpected error in GET /api/planner/plans:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const validation = validateCreatePlanInput(body);
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

    const input = body as { name: string; notes?: string };

    // Create plan
    const { data: plan, error } = await supabase
      .from("supplement_plans")
      .insert({
        user_id: userId,
        name: input.name.trim(),
        notes: input.notes?.trim() || null,
        status: "draft",
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating plan:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to create plan",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/planner/plans:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
