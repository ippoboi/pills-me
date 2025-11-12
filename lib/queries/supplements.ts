import type {
  TodaySupplementsResponse,
  ApiError,
  SupplementStatus,
  SupplementsListResponse,
  SupplementResponse,
} from "../types";

/**
 * Query functions for today's supplements
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

/**
 * Query functions for supplements list (overview)
 */
export async function getSupplementsList(
  status?: SupplementStatus | null
): Promise<SupplementsListResponse> {
  const url = new URL("/api/supplements/list", window.location.origin);
  if (status) url.searchParams.set("status", status);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch supplements list");
  }
  return response.json();
}

/**
 * Query functions for supplement by ID
 */
export async function getSupplementById(
  id: string,
  timezone?: string
): Promise<SupplementResponse> {
  const url = new URL(`/api/supplements/${id}`, window.location.origin);
  if (timezone) {
    url.searchParams.set("timezone", timezone);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch supplement by ID");
  }
  return response.json();
}
