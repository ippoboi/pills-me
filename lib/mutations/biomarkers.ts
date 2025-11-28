import type {
  BiomarkerReport,
  SaveBiomarkersRequestBody,
  SaveBiomarkersResponse,
} from "../types";

export interface AnalyzeBiomarkersVariables {
  file: File;
  reportName: string;
  collectedDate: string;
  collectedTime: string;
  timezoneId: string;
}

export async function analyzeBiomarkerReport(
  variables: AnalyzeBiomarkersVariables
): Promise<BiomarkerReport | null> {
  const { file, reportName, collectedDate, collectedTime, timezoneId } =
    variables;

  const form = new FormData();
  form.append("file", file);
  form.append("report_name", reportName);
  form.append("collected_date", collectedDate);
  form.append("collected_time", collectedTime);
  form.append("timezone_id", timezoneId);

  const res = await fetch("/api/biomarkers/ocr", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data && data.error) || "Failed to analyze lab report");
  }

  const body = (await res.json().catch(() => null)) as {
    report?: BiomarkerReport;
  } | null;

  return body?.report ?? null;
}

export async function saveBiomarkers(
  body: SaveBiomarkersRequestBody
): Promise<SaveBiomarkersResponse> {
  const res = await fetch("/api/biomarkers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data && (data.error as string)) || "Failed to save biomarkers"
    );
  }

  return (await res.json()) as SaveBiomarkersResponse;
}
