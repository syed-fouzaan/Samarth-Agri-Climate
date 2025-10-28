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
      data_quality_metrics: {
        Row: {
          accuracy_score: number | null
          anomalies_detected: number | null
          checked_at: string | null
          completeness_score: number | null
          dataset_id: string | null
          id: string
          issues_found: Json | null
          missing_values: number | null
          timeliness_score: number | null
          total_records_checked: number | null
        }
        Insert: {
          accuracy_score?: number | null
          anomalies_detected?: number | null
          checked_at?: string | null
          completeness_score?: number | null
          dataset_id?: string | null
          id?: string
          issues_found?: Json | null
          missing_values?: number | null
          timeliness_score?: number | null
          total_records_checked?: number | null
        }
        Update: {
          accuracy_score?: number | null
          anomalies_detected?: number | null
          checked_at?: string | null
          completeness_score?: number | null
          dataset_id?: string | null
          id?: string
          issues_found?: Json | null
          missing_values?: number | null
          timeliness_score?: number | null
          total_records_checked?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_quality_metrics_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          api_url: string
          category: Database["public"]["Enums"]["dataset_category"]
          columns_mapping: Json
          created_at: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          metadata: Json | null
          quality_score:
            | Database["public"]["Enums"]["data_quality_level"]
            | null
          resource_id: string
          title: string
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          api_url: string
          category: Database["public"]["Enums"]["dataset_category"]
          columns_mapping?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          quality_score?:
            | Database["public"]["Enums"]["data_quality_level"]
            | null
          resource_id: string
          title: string
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          api_url?: string
          category?: Database["public"]["Enums"]["dataset_category"]
          columns_mapping?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          quality_score?:
            | Database["public"]["Enums"]["data_quality_level"]
            | null
          resource_id?: string
          title?: string
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fact_production: {
        Row: {
          area_ha: number | null
          created_at: string | null
          crop: string
          data_source_url: string | null
          dataset_id: string | null
          district: string | null
          id: string
          production_t: number | null
          raw_record: Json
          state: string
          year: number
          yield_kg_per_ha: number | null
        }
        Insert: {
          area_ha?: number | null
          created_at?: string | null
          crop: string
          data_source_url?: string | null
          dataset_id?: string | null
          district?: string | null
          id?: string
          production_t?: number | null
          raw_record: Json
          state: string
          year: number
          yield_kg_per_ha?: number | null
        }
        Update: {
          area_ha?: number | null
          created_at?: string | null
          crop?: string
          data_source_url?: string | null
          dataset_id?: string | null
          district?: string | null
          id?: string
          production_t?: number | null
          raw_record?: Json
          state?: string
          year?: number
          yield_kg_per_ha?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_production_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_rainfall: {
        Row: {
          created_at: string | null
          data_source_url: string | null
          dataset_id: string | null
          district: string | null
          id: string
          month: number | null
          rainfall_mm: number
          raw_record: Json
          state: string
          year: number
        }
        Insert: {
          created_at?: string | null
          data_source_url?: string | null
          dataset_id?: string | null
          district?: string | null
          id?: string
          month?: number | null
          rainfall_mm: number
          raw_record: Json
          state: string
          year: number
        }
        Update: {
          created_at?: string | null
          data_source_url?: string | null
          dataset_id?: string | null
          district?: string | null
          id?: string
          month?: number | null
          rainfall_mm?: number
          raw_record?: Json
          state?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_rainfall_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      query_logs: {
        Row: {
          answer_text: string | null
          charts_data: Json | null
          citations: Json | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          execution_plan: Json | null
          execution_steps: Json | null
          id: string
          question: string
          runtime_ms: number | null
          session_id: string | null
          sql_queries: Json | null
          status: Database["public"]["Enums"]["query_status"] | null
          user_id: string | null
          verification_results: Json | null
        }
        Insert: {
          answer_text?: string | null
          charts_data?: Json | null
          citations?: Json | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_plan?: Json | null
          execution_steps?: Json | null
          id?: string
          question: string
          runtime_ms?: number | null
          session_id?: string | null
          sql_queries?: Json | null
          status?: Database["public"]["Enums"]["query_status"] | null
          user_id?: string | null
          verification_results?: Json | null
        }
        Update: {
          answer_text?: string | null
          charts_data?: Json | null
          citations?: Json | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_plan?: Json | null
          execution_steps?: Json | null
          id?: string
          question?: string
          runtime_ms?: number | null
          session_id?: string | null
          sql_queries?: Json | null
          status?: Database["public"]["Enums"]["query_status"] | null
          user_id?: string | null
          verification_results?: Json | null
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_data: Json | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_data?: Json | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_data?: Json | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      data_quality_level: "high" | "medium" | "low" | "unknown"
      dataset_category: "agriculture" | "climate" | "mixed"
      query_status: "pending" | "processing" | "completed" | "failed"
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
      data_quality_level: ["high", "medium", "low", "unknown"],
      dataset_category: ["agriculture", "climate", "mixed"],
      query_status: ["pending", "processing", "completed", "failed"],
    },
  },
} as const
