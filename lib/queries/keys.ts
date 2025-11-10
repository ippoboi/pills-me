/**
 * Query Keys for React Query
 * Centralized query key management for consistent caching
 */

export const supplementsKeys = {
  all: ["supplements"] as const,
  today: (date?: string, timezone?: string) =>
    ["supplements", "today", date, timezone] as const,
} as const;
