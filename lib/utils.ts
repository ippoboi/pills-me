import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatters
const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * Formats a date as "November 12th, 2025" (long format)
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string or empty string if invalid
 */
export function formatDateLong(date?: string | Date | null): string {
  if (!date) {
    return "";
  }

  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  // Get the formatted date and add ordinal suffix to day
  const formatted = longDateFormatter.format(parsedDate);
  const day = parsedDate.getDate();
  const ordinalSuffix = getOrdinalSuffix(day);

  // Replace the day number with the ordinal version
  return formatted.replace(` ${day},`, ` ${day}${ordinalSuffix},`);
}

/**
 * Formats a date as "Nov 12, 2025" (short format)
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string or empty string if invalid
 */
export function formatDateShort(date?: string | Date | null): string {
  if (!date) {
    return "";
  }

  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return shortDateFormatter.format(parsedDate);
}

/**
 * Helper function to get ordinal suffix for a day number
 * @param day - Day number (1-31)
 * @returns Ordinal suffix ("st", "nd", "rd", "th")
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return "th";
  }

  const lastDigit = day % 10;
  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * @deprecated Use formatDateLong instead
 */
export function formatDisplayDate(date?: string | Date | null) {
  return formatDateLong(date);
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
