import type {
  SupplementInput,
  CreateSupplementResponse,
  ApiError,
} from "../types";
import { getUserTimezone } from "../utils/timezone";

/**
 * Mutation functions for supplement operations (API calls)
 */

export async function createSupplement(
  data: SupplementInput
): Promise<CreateSupplementResponse> {
  // Get user's timezone for proper UTC conversion of backfill records
  const timezone = getUserTimezone();

  const response = await fetch(
    `/api/supplements/create?timezone=${encodeURIComponent(timezone)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to create supplement");
  }

  return response.json();
}
