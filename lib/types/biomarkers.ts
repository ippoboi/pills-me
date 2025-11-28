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

// Shared biomarker overview types (API + UI)
export type SortBy = "STATUS" | "CATEGORY";

export interface ThresholdBand {
  name: string;
  min: number | null;
  max: number | null;
  status: "optimal" | "borderline" | "out_of_range";
}

export interface Thresholds {
  unit: string;
  bands: ThresholdBand[];
}

export interface Category {
  id: string;
  label: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface BiomarkerItem {
  id: string;
  name: string;
  category: Category;
  status: "optimal" | "borderline" | "out_of_range" | null;
  latestValue: number | null;
  unit: string;
  thresholds: Thresholds;
}

// Grouping when sorting by STATUS
export interface BiomarkersByStatusResponse {
  status: "optimal" | "borderline" | "out_of_range" | null;
  biomarkers: BiomarkerItem[];
}

// Grouping when sorting by CATEGORY
export interface BiomarkersByCategoryResponse {
  category: Category;
  biomarkers: BiomarkerItem[];
}

// API response union for /api/biomarkers
export type BiomarkersApiResponse =
  | { biomarkers: BiomarkersByStatusResponse[] }
  | { biomarkers: BiomarkersByCategoryResponse[] };

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
