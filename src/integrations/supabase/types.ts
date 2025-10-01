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
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      branding_contracts: {
        Row: {
          assigned_trainsets: string[] | null
          client_name: string
          contract_end: string
          contract_start: string
          created_at: string
          id: string
          priority_level: number | null
          requirements: Json | null
          revenue: number | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_trainsets?: string[] | null
          client_name: string
          contract_end: string
          contract_start: string
          created_at?: string
          id: string
          priority_level?: number | null
          requirements?: Json | null
          revenue?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_trainsets?: string[] | null
          client_name?: string
          contract_end?: string
          contract_start?: string
          created_at?: string
          id?: string
          priority_level?: number | null
          requirements?: Json | null
          revenue?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      decision_conflicts: {
        Row: {
          affected_resources: Json
          conflict_type: string
          created_at: string
          description: string | null
          id: string
          optimization_id: string | null
          resolution_strategy: string | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
        }
        Insert: {
          affected_resources: Json
          conflict_type: string
          created_at?: string
          description?: string | null
          id?: string
          optimization_id?: string | null
          resolution_strategy?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
        }
        Update: {
          affected_resources?: Json
          conflict_type?: string
          created_at?: string
          description?: string | null
          id?: string
          optimization_id?: string | null
          resolution_strategy?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_conflicts_optimization_id_fkey"
            columns: ["optimization_id"]
            isOneToOne: false
            referencedRelation: "optimization_history"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_certificates: {
        Row: {
          certificate_number: string | null
          certificate_type: string
          created_at: string
          expiry_date: string
          id: string
          inspection_details: Json | null
          issue_date: string
          issuing_authority: string | null
          renewal_reminder_sent: boolean | null
          status: Database["public"]["Enums"]["certificate_status"]
          trainset_id: string
          updated_at: string
        }
        Insert: {
          certificate_number?: string | null
          certificate_type: string
          created_at?: string
          expiry_date: string
          id: string
          inspection_details?: Json | null
          issue_date: string
          issuing_authority?: string | null
          renewal_reminder_sent?: boolean | null
          status?: Database["public"]["Enums"]["certificate_status"]
          trainset_id: string
          updated_at?: string
        }
        Update: {
          certificate_number?: string | null
          certificate_type?: string
          created_at?: string
          expiry_date?: string
          id?: string
          inspection_details?: Json | null
          issue_date?: string
          issuing_authority?: string | null
          renewal_reminder_sent?: boolean | null
          status?: Database["public"]["Enums"]["certificate_status"]
          trainset_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitness_certificates_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      maintenance_jobs: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_staff: string[] | null
          completion_notes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          job_type: string
          maximo_job_id: string | null
          priority: Database["public"]["Enums"]["job_priority"]
          requirements: Json | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["job_status"]
          trainset_id: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_staff?: string[] | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id: string
          job_type: string
          maximo_job_id?: string | null
          priority?: Database["public"]["Enums"]["job_priority"]
          requirements?: Json | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          trainset_id: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_staff?: string[] | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          job_type?: string
          maximo_job_id?: string | null
          priority?: Database["public"]["Enums"]["job_priority"]
          requirements?: Json | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          trainset_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_jobs_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_records: {
        Row: {
          created_at: string
          daily_mileage: number
          date: string
          id: string
          route_details: Json | null
          trainset_id: string
        }
        Insert: {
          created_at?: string
          daily_mileage: number
          date: string
          id?: string
          route_details?: Json | null
          trainset_id: string
        }
        Update: {
          created_at?: string
          daily_mileage?: number
          date?: string
          id?: string
          route_details?: Json | null
          trainset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_records_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_history: {
        Row: {
          algorithm_version: string
          applied: boolean | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          execution_time_ms: number | null
          execution_timestamp: string
          feedback_score: number | null
          id: string
          input_parameters: Json
          recommendations: Json
        }
        Insert: {
          algorithm_version: string
          applied?: boolean | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          execution_time_ms?: number | null
          execution_timestamp?: string
          feedback_score?: number | null
          id?: string
          input_parameters: Json
          recommendations: Json
        }
        Update: {
          algorithm_version?: string
          applied?: boolean | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          execution_time_ms?: number | null
          execution_timestamp?: string
          feedback_score?: number | null
          id?: string
          input_parameters?: Json
          recommendations?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string
          employee_id: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          employee_id: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          employee_id?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stabling_positions: {
        Row: {
          adjacent_positions: string[] | null
          capacity: number | null
          created_at: string
          current_occupant: string | null
          depot_section: string
          facilities: string[] | null
          geometry: Json | null
          id: string
          position_name: string
          position_type: string
          status: Database["public"]["Enums"]["position_status"]
          track_number: number | null
          updated_at: string
        }
        Insert: {
          adjacent_positions?: string[] | null
          capacity?: number | null
          created_at?: string
          current_occupant?: string | null
          depot_section: string
          facilities?: string[] | null
          geometry?: Json | null
          id: string
          position_name: string
          position_type: string
          status?: Database["public"]["Enums"]["position_status"]
          track_number?: number | null
          updated_at?: string
        }
        Update: {
          adjacent_positions?: string[] | null
          capacity?: number | null
          created_at?: string
          current_occupant?: string | null
          depot_section?: string
          facilities?: string[] | null
          geometry?: Json | null
          id?: string
          position_name?: string
          position_type?: string
          status?: Database["public"]["Enums"]["position_status"]
          track_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stabling_positions_current_occupant_fkey"
            columns: ["current_occupant"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          assigned_job_id: string | null
          assigned_trainset_id: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          shift: Database["public"]["Enums"]["shift_type"]
          staff_id: string
          staff_name: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_job_id?: string | null
          assigned_trainset_id?: string | null
          created_at?: string
          date: string
          end_time: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          shift: Database["public"]["Enums"]["shift_type"]
          staff_id: string
          staff_name: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_job_id?: string | null
          assigned_trainset_id?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          shift?: Database["public"]["Enums"]["shift_type"]
          staff_id?: string
          staff_name?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_assigned_job_id_fkey"
            columns: ["assigned_job_id"]
            isOneToOne: false
            referencedRelation: "maintenance_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_assigned_trainset_id_fkey"
            columns: ["assigned_trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      trainsets: {
        Row: {
          battery_level: number | null
          branding_contract_id: string | null
          created_at: string
          current_location: string | null
          current_stabling_position: string | null
          fitness_certificate_expiry: string | null
          id: string
          last_cleaning_date: string | null
          last_maintenance_date: string | null
          metadata: Json | null
          name: string
          next_maintenance_date: string | null
          operational_hours: number | null
          status: Database["public"]["Enums"]["train_status"]
          total_mileage: number | null
          updated_at: string
        }
        Insert: {
          battery_level?: number | null
          branding_contract_id?: string | null
          created_at?: string
          current_location?: string | null
          current_stabling_position?: string | null
          fitness_certificate_expiry?: string | null
          id: string
          last_cleaning_date?: string | null
          last_maintenance_date?: string | null
          metadata?: Json | null
          name: string
          next_maintenance_date?: string | null
          operational_hours?: number | null
          status?: Database["public"]["Enums"]["train_status"]
          total_mileage?: number | null
          updated_at?: string
        }
        Update: {
          battery_level?: number | null
          branding_contract_id?: string | null
          created_at?: string
          current_location?: string | null
          current_stabling_position?: string | null
          fitness_certificate_expiry?: string | null
          id?: string
          last_cleaning_date?: string | null
          last_maintenance_date?: string | null
          metadata?: Json | null
          name?: string
          next_maintenance_date?: string | null
          operational_hours?: number | null
          status?: Database["public"]["Enums"]["train_status"]
          total_mileage?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          department: string
          employee_id: string
          full_name: string
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "supervisor"
        | "maintenance_planner"
        | "branding_manager"
        | "telecom_admin"
        | "rolling_stock_admin"
        | "auditor"
      certificate_status:
        | "valid"
        | "expiring_soon"
        | "expired"
        | "pending_renewal"
      job_priority: "critical" | "high" | "medium" | "low"
      job_status:
        | "pending"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "delayed"
        | "cancelled"
      position_status: "available" | "occupied" | "maintenance" | "reserved"
      shift_type: "morning" | "afternoon" | "night"
      staff_role:
        | "driver"
        | "conductor"
        | "maintenance"
        | "supervisor"
        | "security"
        | "cleaner"
      train_status:
        | "operational"
        | "maintenance"
        | "cleaning"
        | "branding"
        | "awaiting_fitness"
        | "out_of_service"
        | "standby"
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
      app_role: [
        "admin",
        "supervisor",
        "maintenance_planner",
        "branding_manager",
        "telecom_admin",
        "rolling_stock_admin",
        "auditor",
      ],
      certificate_status: [
        "valid",
        "expiring_soon",
        "expired",
        "pending_renewal",
      ],
      job_priority: ["critical", "high", "medium", "low"],
      job_status: [
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "delayed",
        "cancelled",
      ],
      position_status: ["available", "occupied", "maintenance", "reserved"],
      shift_type: ["morning", "afternoon", "night"],
      staff_role: [
        "driver",
        "conductor",
        "maintenance",
        "supervisor",
        "security",
        "cleaner",
      ],
      train_status: [
        "operational",
        "maintenance",
        "cleaning",
        "branding",
        "awaiting_fitness",
        "out_of_service",
        "standby",
      ],
    },
  },
} as const
