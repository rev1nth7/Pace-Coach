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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          average_heartrate: number | null
          average_pace_s_per_km: number | null
          created_at: string
          distance_m: number | null
          elapsed_time_s: number | null
          id: string
          moving_time_s: number | null
          name: string | null
          sport_type: string | null
          start_date: string
          strava_activity_id: number
          total_elevation_gain_m: number | null
          user_id: string
        }
        Insert: {
          average_heartrate?: number | null
          average_pace_s_per_km?: number | null
          created_at?: string
          distance_m?: number | null
          elapsed_time_s?: number | null
          id?: string
          moving_time_s?: number | null
          name?: string | null
          sport_type?: string | null
          start_date: string
          strava_activity_id: number
          total_elevation_gain_m?: number | null
          user_id: string
        }
        Update: {
          average_heartrate?: number | null
          average_pace_s_per_km?: number | null
          created_at?: string
          distance_m?: number | null
          elapsed_time_s?: number | null
          id?: string
          moving_time_s?: number | null
          name?: string | null
          sport_type?: string | null
          start_date?: string
          strava_activity_id?: number
          total_elevation_gain_m?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          current_fitness: string | null
          days_per_week: number
          goal_date: string
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          name: string | null
          status: string
          target_time_s: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_fitness?: string | null
          days_per_week: number
          goal_date: string
          goal_type: Database["public"]["Enums"]["goal_type"]
          id?: string
          name?: string | null
          status?: string
          target_time_s?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_fitness?: string | null
          days_per_week?: number
          goal_date?: string
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          name?: string | null
          status?: string
          target_time_s?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      strava_accounts: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          strava_athlete_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          strava_athlete_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          strava_athlete_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strava_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weeks: {
        Row: {
          coach_note: string | null
          coach_note_generated_at: string | null
          created_at: string
          focus: string | null
          id: string
          plan_id: string
          planned_distance_m: number | null
          start_date: string
          status: string
          user_id: string
          week_number: number
        }
        Insert: {
          coach_note?: string | null
          coach_note_generated_at?: string | null
          created_at?: string
          focus?: string | null
          id?: string
          plan_id: string
          planned_distance_m?: number | null
          start_date: string
          status?: string
          user_id: string
          week_number: number
        }
        Update: {
          coach_note?: string | null
          coach_note_generated_at?: string | null
          created_at?: string
          focus?: string | null
          id?: string
          plan_id?: string
          planned_distance_m?: number | null
          start_date?: string
          status?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weeks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weeks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          activity_id: string | null
          completed: boolean
          created_at: string
          date: string
          description: string | null
          id: string
          plan_id: string
          planned_distance_m: number | null
          planned_duration_s: number | null
          target_pace_s_per_km: number | null
          type: Database["public"]["Enums"]["workout_type"]
          user_id: string
          week_id: string
        }
        Insert: {
          activity_id?: string | null
          completed?: boolean
          created_at?: string
          date: string
          description?: string | null
          id?: string
          plan_id: string
          planned_distance_m?: number | null
          planned_duration_s?: number | null
          target_pace_s_per_km?: number | null
          type: Database["public"]["Enums"]["workout_type"]
          user_id: string
          week_id: string
        }
        Update: {
          activity_id?: string | null
          completed?: boolean
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          plan_id?: string
          planned_distance_m?: number | null
          planned_duration_s?: number | null
          target_pace_s_per_km?: number | null
          type?: Database["public"]["Enums"]["workout_type"]
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_type: "5k" | "10k" | "half" | "full"
      workout_type: "easy" | "tempo" | "interval" | "long" | "rest"
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
      goal_type: ["5k", "10k", "half", "full"],
      workout_type: ["easy", "tempo", "interval", "long", "rest"],
    },
  },
} as const
