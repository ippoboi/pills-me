import type { ApiError } from "../types";

/**
 * Mutation functions for user operations (API calls)
 */

export interface DeleteAccountResponse {
  success: boolean;
}

export async function deleteAccount(): Promise<DeleteAccountResponse> {
  const response = await fetch("/api/auth/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to delete account");
  }

  return response.json();
}
