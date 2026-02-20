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
      nutrient_categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          label: string
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id: string
          label: string
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      nutrient_limits: {
        Row: {
          age_group: string
          id: string
          nutrient_id: string
          rda: number | null
          sex: string
          source: string | null
          unit: string
          upper_limit: number | null
        }
        Insert: {
          age_group: string
          id?: string
          nutrient_id: string
          rda?: number | null
          sex: string
          source?: string | null
          unit: string
          upper_limit?: number | null
        }
        Update: {
          age_group?: string
          id?: string
          nutrient_id?: string
          rda?: number | null
          sex?: string
          source?: string | null
          unit?: string
          upper_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrient_limits_nutrient_id_fkey"
            columns: ["nutrient_id"]
            isOneToOne: false
            referencedRelation: "nutrients"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrients: {
        Row: {
          alternate_unit: string | null
          category_id: string | null
          conversion_factor: number | null
          created_at: string | null
          default_unit: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          alternate_unit?: string | null
          category_id?: string | null
          conversion_factor?: number | null
          created_at?: string | null
          default_unit: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          alternate_unit?: string | null
          category_id?: string | null
          conversion_factor?: number | null
          created_at?: string | null
          default_unit?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "nutrient_categories"
            referencedColumns: ["id"]
          },
        ]
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
      plan_items: {
        Row: {
          brand: string | null
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          nutrients: Json
          plan_id: string
          servings_per_day: number | null
          source_type: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          nutrients?: Json
          plan_id: string
          servings_per_day?: number | null
          source_type?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          nutrients?: Json
          plan_id?: string
          servings_per_day?: number | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "supplement_plans"
            referencedColumns: ["id"]
          },
        ]
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
      supplement_categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          label: string
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id: string
          label: string
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      supplement_plans: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["plan_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          brand: string | null
          capsules_per_take: number
          category_id: string | null
          created_at: string
          deleted_at: string | null
          end_date: string | null
          id: string
          inventory_total: number | null
          low_inventory_threshold: number | null
          name: string
          plan_id: string | null
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
          brand?: string | null
          capsules_per_take?: number
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          inventory_total?: number | null
          low_inventory_threshold?: number | null
          name: string
          plan_id?: string | null
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
          brand?: string | null
          capsules_per_take?: number
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          inventory_total?: number | null
          low_inventory_threshold?: number | null
          name?: string
          plan_id?: string | null
          reason?: string | null
          recommendation?: string | null
          source_name?: string | null
          source_url?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["supplement_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supplement_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "supplement_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_information: {
        Row: {
          birthdate: string | null
          created_at: string
          id: string
          sex: Database["public"]["Enums"]["user_sex"]
          updated_at: string
          user_id: string
        }
        Insert: {
          birthdate?: string | null
          created_at?: string
          id?: string
          sex: Database["public"]["Enums"]["user_sex"]
          updated_at?: string
          user_id: string
        }
        Update: {
          birthdate?: string | null
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
      plan_status: "draft" | "active" | "paused" | "archived"
      supplement_status: "ACTIVE" | "COMPLETED" | "CANCELLED"
      time_of_day: "MORNING" | "LUNCH" | "DINNER" | "BEFORE_SLEEP"
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
      plan_status: ["draft", "active", "paused", "archived"],
      supplement_status: ["ACTIVE", "COMPLETED", "CANCELLED"],
      time_of_day: ["MORNING", "LUNCH", "DINNER", "BEFORE_SLEEP"],
      user_sex: ["male", "female"],
    },
  },
} as const
