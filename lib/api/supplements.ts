import { SupplementInput } from "@/lib/supplements";

// API Response Types
export interface CreateSupplementResponse {
  success: boolean;
  supplement: {
    id: string;
    user_id: string;
    name: string;
    capsules_per_take: number;
    recommendation: string | null;
    reason: string | null;
    source_name: string | null;
    source_url: string | null;
    start_date: string;
    end_date: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    schedules: Array<{
      id: string;
      supplement_id: string;
      time_of_day: string;
      created_at: string;
      updated_at: string;
    }>;
  };
}

export interface TodaySupplementsResponse {
  date: string;
  supplements: Supplement[];
}

export interface Supplement {
  id: string;
  name: string;
  capsules_per_take: number;
  recommendation: string | null;
  source_name: string | null;
  source_url: string | null;
  start_date: string;
  end_date: string | null;
  supplement_schedules: SupplementSchedule[];
}

export interface SupplementSchedule {
  id: string;
  time_of_day: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: string | string[];
}

// API Client Functions
export async function createSupplement(
  data: SupplementInput
): Promise<CreateSupplementResponse> {
  const response = await fetch("/api/supplements/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to create supplement");
  }

  return response.json();
}

export async function getTodaySupplements(
  date?: string
): Promise<TodaySupplementsResponse> {
  const url = new URL("/api/supplements/today", window.location.origin);
  if (date) {
    url.searchParams.set("date", date);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch today's supplements");
  }

  return response.json();
}
