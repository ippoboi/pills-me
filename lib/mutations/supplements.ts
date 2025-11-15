import type {
  SupplementInput,
  CreateSupplementResponse,
  EditSupplementResponse,
  SoftDeleteSupplementResponse,
  RefillSupplementResponse,
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

/*
 * Mutation function to edit the informations of a supplement
 */
export async function editSupplement(
  supplementId: string,
  data: Partial<SupplementInput>
): Promise<EditSupplementResponse> {
  const response = await fetch(`/api/supplements/${supplementId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to edit supplement");
  }
  return response.json();
}

/*
 * Mutation to soft delete a supplement
 */
export async function softDeleteSupplement(
  supplementId: string
): Promise<SoftDeleteSupplementResponse> {
  const response = await fetch(`/api/supplements/${supplementId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to delete supplement");
  }
  return response.json();
}

/**
 * Mutation function to refill a supplement
 */
export async function refillSupplement(
  supplementId: string,
  amount: number
): Promise<RefillSupplementResponse> {
  const response = await fetch(`/api/supplements/${supplementId}/refill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refill_amount: amount }),
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to refill supplement");
  }
  return response.json();
}

/*
 * Mutation function to start a new cycle for a supplement
 */
// export async function startNewCycle(
//   supplementId: string
// ): Promise<StartNewCycleResponse> {
//   const response = await fetch(`/api/supplements/${supplementId}/start-new-cycle`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
// }
