import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

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

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Find all ACTIVE supplements where end_date has passed
    const { data: expiredSupplements, error: fetchError } = await supabase
      .from("supplements")
      .select("id, name, end_date")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .not("end_date", "is", null)
      .lt("end_date", today)
      .is("deleted_at", null);

    if (fetchError) {
      console.error("Error fetching expired supplements:", fetchError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch expired supplements",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!expiredSupplements || expiredSupplements.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No supplements to auto-complete",
        updated_count: 0,
        updated_supplements: [],
      });
    }

    // Update all expired supplements to COMPLETED status
    const supplementIds = expiredSupplements.map((s) => s.id);

    const { error: updateError } = await supabase
      .from("supplements")
      .update({ status: "COMPLETED" })
      .in("id", supplementIds);

    if (updateError) {
      console.error("Error updating supplement statuses:", updateError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to update supplement statuses",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Auto-completed ${expiredSupplements.length} supplement(s)`,
      updated_count: expiredSupplements.length,
      updated_supplements: expiredSupplements.map((s) => ({
        id: s.id,
        name: s.name,
        end_date: s.end_date,
      })),
    });
  } catch (error) {
    console.error("Unexpected error in auto-complete:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
