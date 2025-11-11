import type { CurrentUser } from "../types";

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Failed to fetch user";
    try {
      const errorBody = await response.json();
      message =
        errorBody?.message ||
        errorBody?.error ||
        (response.status === 401 ? "Unauthorized" : message);
    } catch {
      if (response.status === 401) {
        message = "Unauthorized";
      }
    }
    throw new Error(message);
  }

  return response.json();
}


