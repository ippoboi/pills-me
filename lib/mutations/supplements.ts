import type {
  SupplementInput,
  CreateSupplementResponse,
  ApiError,
} from "../types";

/**
 * Mutation functions for supplement operations (API calls)
 */

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
