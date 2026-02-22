import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { getAgeGroup, calculateIntake } from "@/lib/utils/planner";
import type {
  NutrientEntry,
  LocalPlanItem,
  AgeGroup,
  UserSex,
  Nutrient,
  NutrientLimit,
} from "@/lib/types/planner";

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

    // Check if calculation is requested
    const { searchParams } = new URL(request.url);
    const includeCalculation =
      searchParams.get("include_calculation") === "true";

    // Get active supplements with plan_id (only plan-linked supplements have nutrient data)
    const { data: supplements, error: supplementsError } = await supabase
      .from("supplements")
      .select(
        `
        id,
        name,
        brand,
        capsules_per_take,
        plan_id
      `
      )
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .not("plan_id", "is", null);

    if (supplementsError) {
      console.error("Error fetching supplements:", supplementsError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch supplements",
          details: supplementsError.message,
        },
        { status: 500 }
      );
    }

    if (!supplements || supplements.length === 0) {
      return NextResponse.json({
        supplements: [],
        ...(includeCalculation && { intakeResults: [] }),
      });
    }

    // Get plan_items for these supplements
    // Filter out null plan_ids (though the query above should only return non-null)
    const planIds = [
      ...new Set(
        supplements.map((s) => s.plan_id).filter((id): id is string => id !== null)
      ),
    ];

    const { data: planItems, error: planItemsError } = await supabase
      .from("plan_items")
      .select("plan_id, name, nutrients")
      .in("plan_id", planIds);

    if (planItemsError) {
      console.error("Error fetching plan items:", planItemsError);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "Failed to fetch plan items",
          details: planItemsError.message,
        },
        { status: 500 }
      );
    }

    // Map nutrients to supplements by matching name and plan_id
    const supplementsWithNutrients = supplements.map((supplement) => {
      const matchingPlanItem = planItems?.find(
        (item) =>
          item.plan_id === supplement.plan_id && item.name === supplement.name
      );

      return {
        id: supplement.id,
        name: supplement.name,
        brand: supplement.brand,
        nutrients: (matchingPlanItem?.nutrients as unknown as NutrientEntry[]) || [],
        servingsPerDay: supplement.capsules_per_take || 1,
        planId: supplement.plan_id,
      };
    });

    // If calculation not requested, return early
    if (!includeCalculation) {
      return NextResponse.json({ supplements: supplementsWithNutrients });
    }

    // Get user demographics for calculation
    const { data: userInfo, error: userInfoError } = await supabase
      .from("user_information")
      .select("birthdate, sex")
      .eq("user_id", userId)
      .single();

    if (userInfoError || !userInfo?.birthdate || !userInfo?.sex) {
      // Return supplements without calculation if demographics not available
      return NextResponse.json({
        supplements: supplementsWithNutrients,
        intakeResults: [],
        message:
          "Demographics not set. Set birthdate and sex in profile for intake calculation.",
      });
    }

    const ageGroup: AgeGroup = getAgeGroup(new Date(userInfo.birthdate));
    const sex: UserSex = userInfo.sex;

    // Get nutrients master data
    const { data: nutrientsData, error: nutrientsError } = await supabase
      .from("nutrients")
      .select("*");

    if (nutrientsError) {
      console.error("Error fetching nutrients:", nutrientsError);
      return NextResponse.json({
        supplements: supplementsWithNutrients,
        intakeResults: [],
        error: "Failed to fetch nutrients for calculation",
      });
    }

    // Get limits for user's demographics
    const { data: limitsData, error: limitsError } = await supabase
      .from("nutrient_limits")
      .select("*")
      .eq("age_group", ageGroup)
      .or(`sex.eq.${sex},sex.eq.all`);

    if (limitsError) {
      console.error("Error fetching limits:", limitsError);
      return NextResponse.json({
        supplements: supplementsWithNutrients,
        intakeResults: [],
        error: "Failed to fetch limits for calculation",
      });
    }

    // Build maps for calculateIntake
    const nutrientsMap = new Map<string, Nutrient>();
    nutrientsData?.forEach((n) => nutrientsMap.set(n.id, n));

    const limitsMap = new Map<string, NutrientLimit>();
    limitsData?.forEach((l) => limitsMap.set(l.nutrient_id, l));

    // Convert to LocalPlanItem format for calculateIntake
    const planItemsForCalc: LocalPlanItem[] = supplementsWithNutrients.map(
      (s) => ({
        id: s.id,
        name: s.name,
        brand: s.brand || undefined,
        servingsPerDay: s.servingsPerDay,
        nutrients: s.nutrients,
      })
    );

    // Calculate intake (no draft items, all are active)
    const intakeResults = calculateIntake(
      [], // no draft items
      planItemsForCalc, // active supplements
      limitsMap,
      nutrientsMap
    );

    return NextResponse.json({
      supplements: supplementsWithNutrients,
      intakeResults,
      demographics: {
        ageGroup,
        sex,
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/planner/active-intake:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
