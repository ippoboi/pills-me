import type { BiomarkerReport } from "../types";

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
