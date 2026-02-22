import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import type { UserSex } from "@/lib/types/planner";

const VALID_SEX: UserSex[] = ["male", "female"];

/**
 * GET /api/user/information
 * Returns user demographics (birthdate, sex)
 */
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

    const { data: userInfo, error } = await supabase
      .from("user_information")
      .select("birthdate, sex")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user information:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch user information",
        },
        { status: 500 }
      );
    }

    // Return defaults if no record exists
    return NextResponse.json({
      birthdate: userInfo?.birthdate ?? null,
      sex: userInfo?.sex ?? null,
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/user/information:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/information
 * Updates user demographics (birthdate, sex)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId, supabase } = auth;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;

    // Validate birthdate (optional, ISO date string or null)
    if (input.birthdate !== undefined && input.birthdate !== null) {
      if (typeof input.birthdate !== "string") {
        return NextResponse.json(
          { error: "Bad Request", message: "Birthdate must be a string" },
          { status: 400 }
        );
      }
      // Validate date format
      const date = new Date(input.birthdate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Bad Request", message: "Invalid birthdate format" },
          { status: 400 }
        );
      }
      // Validate reasonable date range (not in future, not too old)
      const now = new Date();
      if (date > now) {
        return NextResponse.json(
          { error: "Bad Request", message: "Birthdate cannot be in the future" },
          { status: 400 }
        );
      }
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      if (date < minDate) {
        return NextResponse.json(
          { error: "Bad Request", message: "Invalid birthdate" },
          { status: 400 }
        );
      }
    }

    // Validate sex (optional)
    if (input.sex !== undefined && input.sex !== null) {
      if (!VALID_SEX.includes(input.sex as UserSex)) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: `Sex must be one of: ${VALID_SEX.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from("user_information")
      .select("id, sex")
      .eq("user_id", userId)
      .maybeSingle();

    let data;
    let error;

    if (existing) {
      // Update existing record
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.birthdate !== undefined) {
        updatePayload.birthdate = input.birthdate;
      }
      if (input.sex !== undefined) {
        updatePayload.sex = input.sex;
      }

      const result = await supabase
        .from("user_information")
        .update(updatePayload)
        .eq("user_id", userId)
        .select("birthdate, sex")
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Insert new record - sex is required for new records
      if (!input.sex) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "Sex is required when creating user information",
          },
          { status: 400 }
        );
      }

      const result = await supabase
        .from("user_information")
        .insert({
          user_id: userId,
          sex: input.sex as UserSex,
          birthdate: (input.birthdate as string) ?? null,
        })
        .select("birthdate, sex")
        .single();

      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      console.error("Error updating user information:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to update user information",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      birthdate: data.birthdate,
      sex: data.sex,
    });
  } catch (error) {
    console.error("Unexpected error in PUT /api/user/information:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
