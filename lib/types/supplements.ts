import { Database } from "../supabase/database.types";

// Database Types
export type TimeOfDay = Database["public"]["Enums"]["time_of_day"];
export type SupplementStatus = Database["public"]["Enums"]["supplement_status"];

// Input Types
export interface SupplementInput {
  name: string;
  capsules_per_take: number;
  time_of_day: TimeOfDay[];
  recommendation?: string;
  source_url?: string;
  source_name?: string;
  start_date: string;
  end_date?: string;
  reason?: string;
}

// API Response Types
export interface CreateSupplementResponse {
  success: boolean;
  supplement: {
    id: string;
    user_id: string;
    name: string;
    capsules_per_take: number;
    recommendation: string | null;
    reason: string | null;
    source_name: string | null;
    source_url: string | null;
    start_date: string;
    end_date: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    schedules: Array<{
      id: string;
      supplement_id: string;
      time_of_day: string;
      created_at: string;
      updated_at: string;
    }>;
  };
}

export interface TodaySupplementsResponse {
  date: string;
  timezone: string;
  supplements: Supplement[];
}

export interface Supplement {
  id: string;
  name: string;
  capsules_per_take: number;
  recommendation: string | null;
  source_name: string | null;
  source_url: string | null;
  start_date: string;
  end_date: string | null;
  supplement_schedules: SupplementSchedule[];
}

export interface SupplementSchedule {
  id: string;
  time_of_day: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: string | string[];
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// Component Props Types
export interface SupplementCardProps {
  supplement: Supplement;
  scheduleId: string;
  date: string;
}

export interface SupplementsSectionProps {
  supplements: Supplement[];
  date: string;
}
