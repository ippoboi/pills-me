export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      biomarker_categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id: string
          label: string
          sort_order: number
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      biomarker_synonyms: {
        Row: {
          biomarker_id: string
          created_at: string
          id: number
          synonym: string
        }
        Insert: {
          biomarker_id: string
          created_at?: string
          id?: number
          synonym: string
        }
        Update: {
          biomarker_id?: string
          created_at?: string
          id?: number
          synonym?: string
        }
        Relationships: [
          {
            foreignKeyName: "biomarker_synonyms_biomarker_id_fkey"
            columns: ["biomarker_id"]
            isOneToOne: false
            referencedRelation: "biomarkers_information"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarkers_information: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          short_name: string
          slug: string
          thresholds: Json
          unit: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          short_name: string
          slug: string
          thresholds: Json
          unit: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          short_name?: string
          slug?: string
          thresholds?: Json
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "biomarkers_information_category_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "biomarker_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          app_updates_enabled: boolean
          created_at: string
          id: string
          refill_reminders_enabled: boolean
          reminder_times: Json | null
          supplement_reminders_enabled: boolean
          system_notifications_enabled: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_updates_enabled?: boolean
          created_at?: string
          id?: string
          refill_reminders_enabled?: boolean
          reminder_times?: Json | null
          supplement_reminders_enabled?: boolean
          system_notifications_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_updates_enabled?: boolean
          created_at?: string
          id?: string
          refill_reminders_enabled?: boolean
          reminder_times?: Json | null
          supplement_reminders_enabled?: boolean
          system_notifications_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      passkey_challenges: {
        Row: {
          challenge: string
          created_at: string | null
          expires_at: string
          flow: string
          id: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string | null
          expires_at: string
          flow: string
          id: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string | null
          expires_at?: string
          flow?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      passkeys: {
        Row: {
          authenticator_attachment: string | null
          backup_eligible: boolean | null
          backup_state: boolean | null
          counter: number | null
          created_at: string | null
          credential_id: string
          device_info: Json | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          updated_at: string | null
          user_display_name: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          authenticator_attachment?: string | null
          backup_eligible?: boolean | null
          backup_state?: boolean | null
          counter?: number | null
          created_at?: string | null
          credential_id: string
          device_info?: Json | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          updated_at?: string | null
          user_display_name?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          authenticator_attachment?: string | null
          backup_eligible?: boolean | null
          backup_state?: boolean | null
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          device_info?: Json | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          updated_at?: string | null
          user_display_name?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          subscription_data: Json
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          subscription_data: Json
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          subscription_data?: Json
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      raw_unmatched_data: {
        Row: {
          attempted_at: string
          best_match_biomarker_id: string | null
          best_match_name: string | null
          created_at: string
          id: string
          match_confidence: number | null
          processing_status: Database["public"]["Enums"]["unmatched_processing_status"]
          raw_name: string
          raw_unit: string | null
          raw_value_numeric: number | null
          raw_value_text: string | null
          report_id: string
          resolution_action:
            | Database["public"]["Enums"]["unmatched_resolution_action"]
            | null
          resolution_notes: string | null
          resolved_at: string | null
          reviewed_at: string | null
          user_id: string
        }
        Insert: {
          attempted_at?: string
          best_match_biomarker_id?: string | null
          best_match_name?: string | null
          created_at?: string
          id?: string
          match_confidence?: number | null
          processing_status?: Database["public"]["Enums"]["unmatched_processing_status"]
          raw_name: string
          raw_unit?: string | null
          raw_value_numeric?: number | null
          raw_value_text?: string | null
          report_id: string
          resolution_action?:
            | Database["public"]["Enums"]["unmatched_resolution_action"]
            | null
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          user_id: string
        }
        Update: {
          attempted_at?: string
          best_match_biomarker_id?: string | null
          best_match_name?: string | null
          created_at?: string
          id?: string
          match_confidence?: number | null
          processing_status?: Database["public"]["Enums"]["unmatched_processing_status"]
          raw_name?: string
          raw_unit?: string | null
          raw_value_numeric?: number | null
          raw_value_text?: string | null
          report_id?: string
          resolution_action?:
            | Database["public"]["Enums"]["unmatched_resolution_action"]
            | null
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_unmatched_data_best_match_biomarker_id_fkey"
            columns: ["best_match_biomarker_id"]
            isOneToOne: false
            referencedRelation: "biomarkers_information"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_unmatched_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          biomarker_count: number
          collected_at: string | null
          country: string | null
          created_at: string
          id: string
          lab_name: string | null
          raw_biomarkers: Json | null
          report_name: string
          status: Database["public"]["Enums"]["report_status"]
          timezone_id: string | null
          user_id: string
        }
        Insert: {
          biomarker_count?: number
          collected_at?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lab_name?: string | null
          raw_biomarkers?: Json | null
          report_name: string
          status?: Database["public"]["Enums"]["report_status"]
          timezone_id?: string | null
          user_id: string
        }
        Update: {
          biomarker_count?: number
          collected_at?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lab_name?: string | null
          raw_biomarkers?: Json | null
          report_name?: string
          status?: Database["public"]["Enums"]["report_status"]
          timezone_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplement_adherence: {
        Row: {
          created_at: string
          id: string
          marked_at: string
          schedule_id: string
          supplement_id: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          marked_at?: string
          schedule_id: string
          supplement_id: string
          taken_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          marked_at?: string
          schedule_id?: string
          supplement_id?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_adherence_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "supplement_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_adherence_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_schedules: {
        Row: {
          created_at: string
          id: string
          supplement_id: string
          time_of_day: Database["public"]["Enums"]["time_of_day"]
        }
        Insert: {
          created_at?: string
          id?: string
          supplement_id: string
          time_of_day: Database["public"]["Enums"]["time_of_day"]
        }
        Update: {
          created_at?: string
          id?: string
          supplement_id?: string
          time_of_day?: Database["public"]["Enums"]["time_of_day"]
        }
        Relationships: [
          {
            foreignKeyName: "supplement_schedules_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          capsules_per_take: number
          created_at: string
          deleted_at: string | null
          end_date: string | null
          id: string
          inventory_total: number | null
          low_inventory_threshold: number | null
          name: string
          reason: string | null
          recommendation: string | null
          source_name: string | null
          source_url: string | null
          start_date: string
          status: Database["public"]["Enums"]["supplement_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          capsules_per_take?: number
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          inventory_total?: number | null
          low_inventory_threshold?: number | null
          name: string
          reason?: string | null
          recommendation?: string | null
          source_name?: string | null
          source_url?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["supplement_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          capsules_per_take?: number
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          inventory_total?: number | null
          low_inventory_threshold?: number | null
          name?: string
          reason?: string | null
          recommendation?: string | null
          source_name?: string | null
          source_url?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["supplement_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_biomarkers: {
        Row: {
          biomarker_id: string
          created_at: string
          id: number
          measured_at: string | null
          raw_name: string | null
          report_id: string | null
          user_id: string
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          biomarker_id: string
          created_at?: string
          id?: number
          measured_at?: string | null
          raw_name?: string | null
          report_id?: string | null
          user_id: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          biomarker_id?: string
          created_at?: string
          id?: number
          measured_at?: string | null
          raw_name?: string | null
          report_id?: string | null
          user_id?: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_biomarkers_biomarker_id_fkey"
            columns: ["biomarker_id"]
            isOneToOne: false
            referencedRelation: "biomarkers_information"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_biomarkers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_information: {
        Row: {
          created_at: string
          id: string
          sex: Database["public"]["Enums"]["user_sex"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sex: Database["public"]["Enums"]["user_sex"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sex?: Database["public"]["Enums"]["user_sex"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          reminder_enabled: boolean
          reminder_times: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_enabled?: boolean
          reminder_times?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_enabled?: boolean
          reminder_times?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_challenges: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      report_status:
        | "EXTRACTING"
        | "VERIFYING"
        | "SAVING"
        | "COMPLETED"
        | "CANCELED"
        | "UNMATCHED"
      supplement_status: "ACTIVE" | "COMPLETED" | "CANCELLED"
      time_of_day: "MORNING" | "LUNCH" | "DINNER" | "BEFORE_SLEEP"
      unmatched_processing_status:
        | "UNMATCHED"
        | "REVIEWED"
        | "RESOLVED"
        | "REFUSED"
      unmatched_resolution_action:
        | "ADDED_SYNONYM"
        | "MARKED_INVALID"
        | "CREATED_BIOMARKER"
      user_sex: "male" | "female"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      report_status: [
        "EXTRACTING",
        "VERIFYING",
        "SAVING",
        "COMPLETED",
        "CANCELED",
        "UNMATCHED",
      ],
      supplement_status: ["ACTIVE", "COMPLETED", "CANCELLED"],
      time_of_day: ["MORNING", "LUNCH", "DINNER", "BEFORE_SLEEP"],
      unmatched_processing_status: [
        "UNMATCHED",
        "REVIEWED",
        "RESOLVED",
        "REFUSED",
      ],
      unmatched_resolution_action: [
        "ADDED_SYNONYM",
        "MARKED_INVALID",
        "CREATED_BIOMARKER",
      ],
      user_sex: ["male", "female"],
    },
  },
} as const
