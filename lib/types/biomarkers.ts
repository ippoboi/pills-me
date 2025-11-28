import type { Tables } from "@/lib/supabase/database.types";

export type BiomarkerReport = Tables<"reports">;

export interface SaveBiomarkersRequestBody {
  reportId: string;
  biomarkers: Array<{
    name: string;
    value: number | null;
    unit: string | null;
    value_in_text?: string | null;
    selected?: boolean;
  }>;
}

export interface SaveBiomarkersResponse {
  success: boolean;
  insertedCount: number;
  matchedCount: number;
  totalProcessed: number;
  skippedCount: number;
  threshold: number;
}
