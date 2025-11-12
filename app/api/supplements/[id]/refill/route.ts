import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

interface RefillRequest {
  inventory_amount: number;
}

export async function POST(
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

    // Validate supplement ID format (basic UUID check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supplementId)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid supplement ID format" },
        { status: 400 }
      );
    }

    // Parse request body
    let body: RefillRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate inventory amount
    if (
      typeof body.inventory_amount !== "number" ||
      body.inventory_amount < 0 ||
      !Number.isInteger(body.inventory_amount)
    ) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "inventory_amount must be a non-negative integer",
        },
        { status: 400 }
      );
    }

    // Check if supplement exists and user owns it
    const { data: existingSupplement, error: existingError } = await supabase
      .from("supplements")
      .select("id, name, inventory_total, end_date")
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

    // Check if supplement has inventory tracking (indefinite supplements only)
    if (existingSupplement.end_date !== null) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Inventory tracking is only available for indefinite supplements",
        },
        { status: 400 }
      );
    }

    // Update inventory
    const { data: updatedSupplement, error: updateError } = await supabase
      .from("supplements")
      .update({ inventory_total: body.inventory_amount })
      .eq("id", supplementId)
      .select("inventory_total")
      .single();

    if (updateError) {
      console.error("Error updating inventory:", updateError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to update inventory",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      inventory_total: updatedSupplement.inventory_total,
    });
  } catch (error) {
    console.error("Unexpected error in refill:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
