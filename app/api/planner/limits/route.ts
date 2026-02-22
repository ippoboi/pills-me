import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { getAgeGroup } from "@/lib/utils/planner";
import type { AgeGroup, UserSex } from "@/lib/types/planner";

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

    const { userId, supabase } = auth;

    // Get user demographics
    const { data: userInfo, error: userInfoError } = await supabase
      .from("user_information")
      .select("birthdate, sex")
      .eq("user_id", userId)
      .single();

    if (userInfoError) {
      console.error("Error fetching user info:", userInfoError);

      // Check if user_information record doesn't exist
      if (userInfoError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: "Not Found",
            message:
              "User profile not found. Please complete your profile setup.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch user information",
          details: userInfoError.message,
        },
        { status: 500 }
      );
    }

    // Check for missing demographics
    const missingFields: string[] = [];
    if (!userInfo.birthdate) missingFields.push("birthdate");
    if (!userInfo.sex) missingFields.push("sex");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "User demographics not set. Please set your birthdate and sex in profile settings.",
          missingFields,
        },
        { status: 400 }
      );
    }

    // At this point, we know birthdate and sex are defined (validated above)
    const birthdate = new Date(userInfo.birthdate!);
    const ageGroup: AgeGroup = getAgeGroup(birthdate);
    const sex: UserSex = userInfo.sex!;

    // Get limits for user's demographics
    const { data: limits, error: limitsError } = await supabase
      .from("nutrient_limits")
      .select(
        `
        *,
        nutrient:nutrients(*)
      `
      )
      .eq("age_group", ageGroup)
      .or(`sex.eq.${sex},sex.eq.all`);

    if (limitsError) {
      console.error("Error fetching limits:", limitsError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch nutrient limits",
          details: limitsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      limits,
      demographics: {
        ageGroup,
        sex,
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/planner/limits:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
