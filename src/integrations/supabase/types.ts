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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accuracy_metrics: {
        Row: {
          accurate_predictions: number | null
          created_at: string
          id: string
          model_version: string | null
          total_predictions: number | null
        }
        Insert: {
          accurate_predictions?: number | null
          created_at?: string
          id?: string
          model_version?: string | null
          total_predictions?: number | null
        }
        Update: {
          accurate_predictions?: number | null
          created_at?: string
          id?: string
          model_version?: string | null
          total_predictions?: number | null
        }
        Relationships: []
      }
      ai_explanations: {
        Row: {
          active_constraints: Json | null
          binding_bottleneck: string | null
          confidence_breakdown: Json | null
          created_at: string
          explanation_type: string
          id: string
          induction_plan_id: string | null
          natural_language_explanation: string | null
          override_consequences: Json | null
          risk_factors: Json | null
          what_if_impact: Json | null
        }
        Insert: {
          active_constraints?: Json | null
          binding_bottleneck?: string | null
          confidence_breakdown?: Json | null
          created_at?: string
          explanation_type: string
          id?: string
          induction_plan_id?: string | null
          natural_language_explanation?: string | null
          override_consequences?: Json | null
          risk_factors?: Json | null
          what_if_impact?: Json | null
        }
        Update: {
          active_constraints?: Json | null
          binding_bottleneck?: string | null
          confidence_breakdown?: Json | null
          created_at?: string
          explanation_type?: string
          id?: string
          induction_plan_id?: string | null
          natural_language_explanation?: string | null
          override_consequences?: Json | null
          risk_factors?: Json | null
          what_if_impact?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_explanations_induction_plan_id_fkey"
            columns: ["induction_plan_id"]
            isOneToOne: false
            referencedRelation: "induction_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_actions: {
        Row: {
          action_details: Json
          action_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_state: Json | null
          previous_state: Json | null
          reason: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action_details?: Json
          action_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_state?: Json | null
          previous_state?: Json | null
          reason?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_state?: Json | null
          previous_state?: Json | null
          reason?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      branding_contracts: {
        Row: {
          contract_name: string
          created_at: string
          hours_current: number | null
          hours_required: number | null
          id: string
          priority_level: number | null
          status: string | null
          trainset_id: string | null
        }
        Insert: {
          contract_name: string
          created_at?: string
          hours_current?: number | null
          hours_required?: number | null
          id?: string
          priority_level?: number | null
          status?: string | null
          trainset_id?: string | null
        }
        Update: {
          contract_name?: string
          created_at?: string
          hours_current?: number | null
          hours_required?: number | null
          id?: string
          priority_level?: number | null
          status?: string | null
          trainset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branding_contracts_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          event_date: string
          event_name: string
          event_type: string
          expected_demand_factor: number | null
          fleet_adjustment_required: boolean | null
          id: string
          notes: string | null
          ridership_multiplier: number | null
        }
        Insert: {
          created_at?: string
          event_date: string
          event_name: string
          event_type: string
          expected_demand_factor?: number | null
          fleet_adjustment_required?: boolean | null
          id?: string
          notes?: string | null
          ridership_multiplier?: number | null
        }
        Update: {
          created_at?: string
          event_date?: string
          event_name?: string
          event_type?: string
          expected_demand_factor?: number | null
          fleet_adjustment_required?: boolean | null
          id?: string
          notes?: string | null
          ridership_multiplier?: number | null
        }
        Relationships: []
      }
      cleaning_schedules: {
        Row: {
          cleaning_type: string
          created_at: string
          hours_required: number | null
          id: string
          scheduled_date: string | null
          status: string | null
          trainset_id: string | null
        }
        Insert: {
          cleaning_type?: string
          created_at?: string
          hours_required?: number | null
          id?: string
          scheduled_date?: string | null
          status?: string | null
          trainset_id?: string | null
        }
        Update: {
          cleaning_type?: string
          created_at?: string
          hours_required?: number | null
          id?: string
          scheduled_date?: string | null
          status?: string | null
          trainset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_schedules_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      constraint_rules: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          parameters: Json
          rule_category: string
          rule_name: string
          rule_type: string
          updated_at: string
          violation_penalty: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parameters?: Json
          rule_category: string
          rule_name: string
          rule_type?: string
          updated_at?: string
          violation_penalty?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parameters?: Json
          rule_category?: string
          rule_name?: string
          rule_type?: string
          updated_at?: string
          violation_penalty?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      crew_assignments: {
        Row: {
          certification_valid: boolean | null
          created_at: string
          duty_end_time: string
          duty_start_time: string
          id: string
          induction_plan_id: string | null
          notes: string | null
          rest_hours_before_shift: number | null
          role: string
          staff_id: string | null
          staff_name: string
          status: string | null
        }
        Insert: {
          certification_valid?: boolean | null
          created_at?: string
          duty_end_time: string
          duty_start_time: string
          id?: string
          induction_plan_id?: string | null
          notes?: string | null
          rest_hours_before_shift?: number | null
          role: string
          staff_id?: string | null
          staff_name: string
          status?: string | null
        }
        Update: {
          certification_valid?: boolean | null
          created_at?: string
          duty_end_time?: string
          duty_start_time?: string
          id?: string
          induction_plan_id?: string | null
          notes?: string | null
          rest_hours_before_shift?: number | null
          role?: string
          staff_id?: string | null
          staff_name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_assignments_induction_plan_id_fkey"
            columns: ["induction_plan_id"]
            isOneToOne: false
            referencedRelation: "induction_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_conflicts: {
        Row: {
          conflict_type: string
          created_at: string
          description: string | null
          id: string
          resolution_strategy: string | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string | null
          trainset_ids: string[] | null
        }
        Insert: {
          conflict_type: string
          created_at?: string
          description?: string | null
          id?: string
          resolution_strategy?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          trainset_ids?: string[] | null
        }
        Update: {
          conflict_type?: string
          created_at?: string
          description?: string | null
          id?: string
          resolution_strategy?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          trainset_ids?: string[] | null
        }
        Relationships: []
      }
      depot_congestion: {
        Row: {
          active_shunting_moves: number | null
          available_tracks: number | null
          congestion_score: number | null
          created_at: string
          depot_section: string
          estimated_delay_minutes: number | null
          id: string
          sensor_data: Json | null
          timestamp: string | null
          traffic_flow: string | null
        }
        Insert: {
          active_shunting_moves?: number | null
          available_tracks?: number | null
          congestion_score?: number | null
          created_at?: string
          depot_section: string
          estimated_delay_minutes?: number | null
          id?: string
          sensor_data?: Json | null
          timestamp?: string | null
          traffic_flow?: string | null
        }
        Update: {
          active_shunting_moves?: number | null
          available_tracks?: number | null
          congestion_score?: number | null
          created_at?: string
          depot_section?: string
          estimated_delay_minutes?: number | null
          id?: string
          sensor_data?: Json | null
          timestamp?: string | null
          traffic_flow?: string | null
        }
        Relationships: []
      }
      fitness_certificates: {
        Row: {
          certificate_type: string
          created_at: string
          expiry_date: string | null
          id: string
          is_valid: boolean | null
          issued_date: string | null
          trainset_id: string | null
        }
        Insert: {
          certificate_type: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_valid?: boolean | null
          issued_date?: string | null
          trainset_id?: string | null
        }
        Update: {
          certificate_type?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_valid?: boolean | null
          issued_date?: string | null
          trainset_id?: string | null
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
      incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_type: string
          occurred_at: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          trainset_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          incident_type: string
          occurred_at?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          trainset_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          incident_type?: string
          occurred_at?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          trainset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      induction_plans: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          ai_confidence: number | null
          ai_reasoning: string | null
          assigned_crew: Json | null
          blocking_issues: Json | null
          constraint_violations: Json | null
          created_at: string
          created_by: string | null
          headway_buffer_minutes: number | null
          id: string
          locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          plan_date: string
          platform_id: string | null
          power_block_required: boolean | null
          priority: string
          risk_score: number | null
          safety_clearance_status: string | null
          scheduled_end_time: string
          scheduled_start_time: string
          shift_type: string
          status: string
          trainset_id: string | null
          turnaround_minutes: number | null
          updated_at: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          assigned_crew?: Json | null
          blocking_issues?: Json | null
          constraint_violations?: Json | null
          created_at?: string
          created_by?: string | null
          headway_buffer_minutes?: number | null
          id?: string
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          plan_date: string
          platform_id?: string | null
          power_block_required?: boolean | null
          priority?: string
          risk_score?: number | null
          safety_clearance_status?: string | null
          scheduled_end_time: string
          scheduled_start_time: string
          shift_type?: string
          status?: string
          trainset_id?: string | null
          turnaround_minutes?: number | null
          updated_at?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          assigned_crew?: Json | null
          blocking_issues?: Json | null
          constraint_violations?: Json | null
          created_at?: string
          created_by?: string | null
          headway_buffer_minutes?: number | null
          id?: string
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          plan_date?: string
          platform_id?: string | null
          power_block_required?: boolean | null
          priority?: string
          risk_score?: number | null
          safety_clearance_status?: string | null
          scheduled_end_time?: string
          scheduled_start_time?: string
          shift_type?: string
          status?: string
          trainset_id?: string | null
          turnaround_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "induction_plans_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "stabling_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "induction_plans_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_jobs: {
        Row: {
          completed_date: string | null
          created_at: string
          description: string | null
          id: string
          job_type: string
          maximo_job_id: string | null
          priority: string | null
          scheduled_date: string | null
          scheduled_start: string | null
          status: string
          trainset_id: string | null
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_type: string
          maximo_job_id?: string | null
          priority?: string | null
          scheduled_date?: string | null
          scheduled_start?: string | null
          status?: string
          trainset_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string
          maximo_job_id?: string | null
          priority?: string | null
          scheduled_date?: string | null
          scheduled_start?: string | null
          status?: string
          trainset_id?: string | null
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
          daily_mileage: number | null
          date: string | null
          id: string
          mileage: number
          recorded_at: string
          trainset_id: string | null
        }
        Insert: {
          created_at?: string
          daily_mileage?: number | null
          date?: string | null
          id?: string
          mileage: number
          recorded_at?: string
          trainset_id?: string | null
        }
        Update: {
          created_at?: string
          daily_mileage?: number | null
          date?: string | null
          id?: string
          mileage?: number
          recorded_at?: string
          trainset_id?: string | null
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
      operation_outcomes: {
        Row: {
          actual_conflicts: number | null
          actual_duration_minutes: number | null
          actual_induction_time: string | null
          congestion_impact_actual: number | null
          created_at: string
          deviation_minutes: number | null
          id: string
          learning_data: Json | null
          punctuality_achieved: boolean | null
          success_score: number | null
          trainset_id: string | null
          weather_impact_actual: number | null
        }
        Insert: {
          actual_conflicts?: number | null
          actual_duration_minutes?: number | null
          actual_induction_time?: string | null
          congestion_impact_actual?: number | null
          created_at?: string
          deviation_minutes?: number | null
          id?: string
          learning_data?: Json | null
          punctuality_achieved?: boolean | null
          success_score?: number | null
          trainset_id?: string | null
          weather_impact_actual?: number | null
        }
        Update: {
          actual_conflicts?: number | null
          actual_duration_minutes?: number | null
          actual_induction_time?: string | null
          congestion_impact_actual?: number | null
          created_at?: string
          deviation_minutes?: number | null
          id?: string
          learning_data?: Json | null
          punctuality_achieved?: boolean | null
          success_score?: number | null
          trainset_id?: string | null
          weather_impact_actual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_outcomes_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_history: {
        Row: {
          applied: boolean | null
          created_at: string
          execution_time_ms: number | null
          execution_timestamp: string | null
          feedback_score: number | null
          id: string
          optimization_type: string
          parameters: Json | null
          results: Json | null
          status: string | null
        }
        Insert: {
          applied?: boolean | null
          created_at?: string
          execution_time_ms?: number | null
          execution_timestamp?: string | null
          feedback_score?: number | null
          id?: string
          optimization_type: string
          parameters?: Json | null
          results?: Json | null
          status?: string | null
        }
        Update: {
          applied?: boolean | null
          created_at?: string
          execution_time_ms?: number | null
          execution_timestamp?: string | null
          feedback_score?: number | null
          id?: string
          optimization_type?: string
          parameters?: Json | null
          results?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          display_name: string | null
          email: string | null
          employee_id: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulation_scenarios: {
        Row: {
          baseline_plan_id: string | null
          comparison_metrics: Json | null
          created_at: string
          created_by: string | null
          delay_propagation_minutes: number | null
          feasibility_score: number | null
          id: string
          input_parameters: Json
          risk_assessment: Json | null
          scenario_name: string
          scenario_type: string
          simulation_results: Json | null
          throughput_change_percent: number | null
        }
        Insert: {
          baseline_plan_id?: string | null
          comparison_metrics?: Json | null
          created_at?: string
          created_by?: string | null
          delay_propagation_minutes?: number | null
          feasibility_score?: number | null
          id?: string
          input_parameters?: Json
          risk_assessment?: Json | null
          scenario_name: string
          scenario_type: string
          simulation_results?: Json | null
          throughput_change_percent?: number | null
        }
        Update: {
          baseline_plan_id?: string | null
          comparison_metrics?: Json | null
          created_at?: string
          created_by?: string | null
          delay_propagation_minutes?: number | null
          feasibility_score?: number | null
          id?: string
          input_parameters?: Json
          risk_assessment?: Json | null
          scenario_name?: string
          scenario_type?: string
          simulation_results?: Json | null
          throughput_change_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_scenarios_baseline_plan_id_fkey"
            columns: ["baseline_plan_id"]
            isOneToOne: false
            referencedRelation: "induction_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      stabling_positions: {
        Row: {
          bay_name: string
          created_at: string
          id: string
          is_occupied: boolean | null
          position_name: string | null
          position_type: string | null
          status: string | null
          trainset_id: string | null
        }
        Insert: {
          bay_name: string
          created_at?: string
          id?: string
          is_occupied?: boolean | null
          position_name?: string | null
          position_type?: string | null
          status?: string | null
          trainset_id?: string | null
        }
        Update: {
          bay_name?: string
          created_at?: string
          id?: string
          is_occupied?: boolean | null
          position_name?: string | null
          position_type?: string | null
          status?: string | null
          trainset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stabling_positions_trainset_id_fkey"
            columns: ["trainset_id"]
            isOneToOne: false
            referencedRelation: "trainsets"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          role: string | null
          shift_type: string | null
          staff_id: string | null
          staff_name: string | null
          start_time: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          role?: string | null
          shift_type?: string | null
          staff_id?: string | null
          staff_name?: string | null
          start_time?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          role?: string | null
          shift_type?: string | null
          staff_id?: string | null
          staff_name?: string | null
          start_time?: string | null
          status?: string | null
        }
        Relationships: []
      }
      trainsets: {
        Row: {
          battery_level: number | null
          created_at: string
          home_bay: string | null
          id: string
          metadata: Json | null
          name: string | null
          operational_hours: number | null
          status: string
          total_mileage: number | null
          train_id: string
          updated_at: string
        }
        Insert: {
          battery_level?: number | null
          created_at?: string
          home_bay?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          operational_hours?: number | null
          status?: string
          total_mileage?: number | null
          train_id: string
          updated_at?: string
        }
        Update: {
          battery_level?: number | null
          created_at?: string
          home_bay?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          operational_hours?: number | null
          status?: string
          total_mileage?: number | null
          train_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          conditions: string | null
          created_at: string
          date: string
          id: string
          precipitation: number | null
          temperature: number | null
          wind_speed: number | null
        }
        Insert: {
          conditions?: string | null
          created_at?: string
          date: string
          id?: string
          precipitation?: number | null
          temperature?: number | null
          wind_speed?: number | null
        }
        Update: {
          conditions?: string | null
          created_at?: string
          date?: string
          id?: string
          precipitation?: number | null
          temperature?: number | null
          wind_speed?: number | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
