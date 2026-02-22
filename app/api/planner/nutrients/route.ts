import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { supabase } = auth;

    // Fetch nutrients with categories
    const { data: nutrients, error } = await supabase
      .from("nutrients")
      .select(`
        *,
        category:nutrient_categories(*)
      `)
      .order("name");

    if (error) {
      console.error("Error fetching nutrients:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch nutrients",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ nutrients });
  } catch (error) {
    console.error("Unexpected error in GET /api/planner/nutrients:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
