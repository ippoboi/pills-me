import type { ApiError } from "../types";

/**
 * Mutation functions for user operations (API calls)
 */

// =============================================================================
// Delete Account
// =============================================================================

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

// =============================================================================
// User Information (Demographics)
// =============================================================================

export interface UserInformationInput {
  birthdate?: string | null;
  sex?: "male" | "female" | null;
}

export interface UserInformationResponse {
  birthdate: string | null;
  sex: "male" | "female" | null;
}

export interface UpdateUserInformationResponse {
  success: boolean;
  birthdate: string | null;
  sex: "male" | "female" | null;
}

/**
 * Get user demographics (birthdate, sex)
 */
export async function getUserInformation(): Promise<UserInformationResponse> {
  const response = await fetch("/api/user/information");

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to fetch user information");
  }

  return response.json();
}

/**
 * Update user demographics (birthdate, sex)
 */
export async function updateUserInformation(
  data: UserInformationInput
): Promise<UpdateUserInformationResponse> {
  const response = await fetch("/api/user/information", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || "Failed to update user information");
  }

  return response.json();
}
