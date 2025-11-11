import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../queries";
import { userKeys } from "../queries";
import type { CurrentUser } from "../types";

export function useCurrentUser() {
  return useQuery<CurrentUser, Error>({
    queryKey: userKeys.current,
    queryFn: getCurrentUser,
    retry: (failureCount, error) => {
      if (error.message === "Unauthorized") {
        return false;
      }
      return failureCount < 2;
    },
  });
}


