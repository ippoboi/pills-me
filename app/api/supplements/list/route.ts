import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/supabase/database.types";
import { authenticateRequest } from "@/lib/auth-helper";
import { SupplementsListItem, SupplementsListResponse } from "@/lib/types";

type SupplementStatus = Database["public"]["Enums"]["supplement_status"];

export async function GET(request: NextRequest) {
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

    // Build query
    const query = supabase
      .from("supplements")
      .select(
        `
        id,
        name,
        status,
        start_date,
        end_date,
        created_at,
        source_name,
        source_url
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const { data: supplements, error: supplementsError } = await query;

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

    const groupedSupplements = (supplements ?? []).reduce<
      Partial<Record<SupplementStatus, SupplementsListItem["items"]>>
    >((accumulator, supplement) => {
      const status = supplement.status as SupplementStatus;
      const entry =
        accumulator[status] ??
        (accumulator[status] = [] as SupplementsListItem["items"]);

      entry.push({
        id: supplement.id,
        name: supplement.name,
        start_date: supplement.start_date,
        end_date: supplement.end_date,
        created_at: supplement.created_at,
        source_name: supplement.source_name,
        source_url: supplement.source_url,
      });

      return accumulator;
    }, {});

    const supplementResponse: SupplementsListResponse = {
      supplements: (
        Object.entries(groupedSupplements) as Array<
          [SupplementStatus, SupplementsListItem["items"]]
        >
      ).map(([status, items]) => ({
        status,
        items,
      })),
    };

    return NextResponse.json(supplementResponse);
  } catch (error) {
    console.error("Unexpected error in supplements list:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
