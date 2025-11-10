import type { TodaySupplementsResponse, ApiError } from "../types";

/**
 * Query functions for supplement operations (API calls)
 */

export async function getTodaySupplements(
  date?: string,
  timezone?: string
): Promise<TodaySupplementsResponse> {
  const url = new URL("/api/supplements/today", window.location.origin);
  if (date) {
    url.searchParams.set("date", date);
  }
  if (timezone) {
    url.searchParams.set("timezone", timezone);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch today's supplements");
  }

  return response.json();
}
