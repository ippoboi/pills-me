export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          id: string;
          ip_address: string | null;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      passkey_challenges: {
        Row: {
          challenge: string;
          created_at: string | null;
          expires_at: string;
          flow: string;
          id: string;
          user_id: string;
        };
        Insert: {
          challenge: string;
          created_at?: string | null;
          expires_at: string;
          flow: string;
          id: string;
          user_id: string;
        };
        Update: {
          challenge?: string;
          created_at?: string | null;
          expires_at?: string;
          flow?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      passkeys: {
        Row: {
          authenticator_attachment: string | null;
          backup_eligible: boolean | null;
          backup_state: boolean | null;
          counter: number | null;
          created_at: string | null;
          credential_id: string;
          device_info: Json | null;
          id: string;
          last_used_at: string | null;
          public_key: string;
          transports: string[] | null;
          updated_at: string | null;
          user_display_name: string | null;
          user_id: string;
          user_name: string | null;
        };
        Insert: {
          authenticator_attachment?: string | null;
          backup_eligible?: boolean | null;
          backup_state?: boolean | null;
          counter?: number | null;
          created_at?: string | null;
          credential_id: string;
          device_info?: Json | null;
          id?: string;
          last_used_at?: string | null;
          public_key: string;
          transports?: string[] | null;
          updated_at?: string | null;
          user_display_name?: string | null;
          user_id: string;
          user_name?: string | null;
        };
        Update: {
          authenticator_attachment?: string | null;
          backup_eligible?: boolean | null;
          backup_state?: boolean | null;
          counter?: number | null;
          created_at?: string | null;
          credential_id?: string;
          device_info?: Json | null;
          id?: string;
          last_used_at?: string | null;
          public_key?: string;
          transports?: string[] | null;
          updated_at?: string | null;
          user_display_name?: string | null;
          user_id?: string;
          user_name?: string | null;
        };
        Relationships: [];
      };
      supplement_adherence: {
        Row: {
          created_at: string;
          id: string;
          marked_at: string;
          schedule_id: string;
          supplement_id: string;
          taken_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          marked_at?: string;
          schedule_id: string;
          supplement_id: string;
          taken_at: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          marked_at?: string;
          schedule_id?: string;
          supplement_id?: string;
          taken_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplement_adherence_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "supplement_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supplement_adherence_supplement_id_fkey";
            columns: ["supplement_id"];
            isOneToOne: false;
            referencedRelation: "supplements";
            referencedColumns: ["id"];
          }
        ];
      };
      supplement_schedules: {
        Row: {
          created_at: string;
          id: string;
          supplement_id: string;
          time_of_day: Database["public"]["Enums"]["time_of_day"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          supplement_id: string;
          time_of_day: Database["public"]["Enums"]["time_of_day"];
        };
        Update: {
          created_at?: string;
          id?: string;
          supplement_id?: string;
          time_of_day?: Database["public"]["Enums"]["time_of_day"];
        };
        Relationships: [
          {
            foreignKeyName: "supplement_schedules_supplement_id_fkey";
            columns: ["supplement_id"];
            isOneToOne: false;
            referencedRelation: "supplements";
            referencedColumns: ["id"];
          }
        ];
      };
      supplements: {
        Row: {
          capsules_per_take: number;
          created_at: string;
          deleted_at: string | null;
          end_date: string | null;
          id: string;
          name: string;
          reason: string | null;
          recommendation: string | null;
          source_name: string | null;
          source_url: string | null;
          start_date: string;
          status: Database["public"]["Enums"]["supplement_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          capsules_per_take?: number;
          created_at?: string;
          deleted_at?: string | null;
          end_date?: string | null;
          id?: string;
          name: string;
          reason?: string | null;
          recommendation?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          start_date: string;
          status?: Database["public"]["Enums"]["supplement_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          capsules_per_take?: number;
          created_at?: string;
          deleted_at?: string | null;
          end_date?: string | null;
          id?: string;
          name?: string;
          reason?: string | null;
          recommendation?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          start_date?: string;
          status?: Database["public"]["Enums"]["supplement_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          created_at: string;
          id: string;
          reminder_enabled: boolean;
          reminder_times: Json | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reminder_enabled?: boolean;
          reminder_times?: Json | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          reminder_enabled?: boolean;
          reminder_times?: Json | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_expired_challenges: { Args: never; Returns: undefined };
    };
    Enums: {
      supplement_status: "ACTIVE" | "COMPLETED" | "CANCELLED";
      time_of_day: "MORNING" | "LUNCH" | "DINNER" | "BEFORE_SLEEP";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      supplement_status: ["ACTIVE", "COMPLETED", "CANCELLED"],
      time_of_day: ["MORNING", "LUNCH", "DINNER", "BEFORE_SLEEP"],
    },
  },
} as const;
