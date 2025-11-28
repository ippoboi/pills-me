import type { BiomarkerReport, BiomarkersApiResponse, SortBy } from "../types";

// Fetch list of biomarker reports (uploaded lab reports)
export async function getBiomarkerReports(): Promise<BiomarkerReport[]> {
  const response = await fetch("/api/biomarkers/reports");

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body && (body.error as string)) || "Failed to load lab reports.";
    throw new Error(message);
  }

  const body = (await response.json()) as { reports: BiomarkerReport[] };
  return body.reports ?? [];
}

// Fetch biomarker overview (grouped by STATUS or CATEGORY)
export async function getBiomarkersOverview(
  sortBy: SortBy = "STATUS"
): Promise<BiomarkersApiResponse> {
  const url = new URL("/api/biomarkers", window.location.origin);
  url.searchParams.set("sortBy", sortBy);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body && (body.error as string)) || "Failed to load biomarkers.";
    throw new Error(message);
  }

  return (await response.json()) as BiomarkersApiResponse;
}
