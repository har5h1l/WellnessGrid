export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          name: string
          age: string | null
          gender: string | null
          height: string | null
          weight: string | null
          wellness_score: number | null
          avatar: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          age?: string | null
          gender?: string | null
          height?: string | null
          weight?: string | null
          wellness_score?: number | null
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          age?: string | null
          gender?: string | null
          height?: string | null
          weight?: string | null
          wellness_score?: number | null
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      health_conditions: {
        Row: {
          id: string
          user_id: string
          condition_id: string
          name: string
          category: string | null
          description: string | null
          severity: string | null
          diagnosed_date: string | null
          is_active: boolean | null
          is_custom: boolean | null
          icon: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          condition_id: string
          name: string
          category?: string | null
          description?: string | null
          severity?: string | null
          diagnosed_date?: string | null
          is_active?: boolean | null
          is_custom?: boolean | null
          icon?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          condition_id?: string
          name?: string
          category?: string | null
          description?: string | null
          severity?: string | null
          diagnosed_date?: string | null
          is_active?: boolean | null
          is_custom?: boolean | null
          icon?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_tools: {
        Row: {
          id: string
          user_id: string
          tool_id: string
          tool_name: string
          tool_category: string | null
          is_enabled: boolean | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_id: string
          tool_name: string
          tool_category?: string | null
          is_enabled?: boolean | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_id?: string
          tool_name?: string
          tool_category?: string | null
          is_enabled?: boolean | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      user_information_sources: {
        Row: {
          id: string
          user_id: string
          condition_id: string
          source_id: string
          source_title: string
          source_type: string
          source_content: string | null
          source_url: string | null
          author: string | null
          is_custom: boolean | null
          is_selected: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          condition_id: string
          source_id: string
          source_title: string
          source_type: string
          source_content?: string | null
          source_url?: string | null
          author?: string | null
          is_custom?: boolean | null
          is_selected?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          condition_id?: string
          source_id?: string
          source_title?: string
          source_type?: string
          source_content?: string | null
          source_url?: string | null
          author?: string | null
          is_custom?: boolean | null
          is_selected?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      user_protocols: {
        Row: {
          id: string
          user_id: string
          condition_id: string
          protocol_id: string
          protocol_name: string
          description: string | null
          protocol_type: string | null
          steps: Json | null
          is_custom: boolean | null
          is_selected: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          condition_id: string
          protocol_id: string
          protocol_name: string
          description?: string | null
          protocol_type?: string | null
          steps?: Json | null
          is_custom?: boolean | null
          is_selected?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          condition_id?: string
          protocol_id?: string
          protocol_name?: string
          description?: string | null
          protocol_type?: string | null
          steps?: Json | null
          is_custom?: boolean | null
          is_selected?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      user_health_data: {
        Row: {
          id: string
          user_id: string
          data_type: string
          title: string
          description: string | null
          content: string | null
          file_name: string | null
          file_size: string | null
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data_type: string
          title: string
          description?: string | null
          content?: string | null
          file_name?: string | null
          file_size?: string | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data_type?: string
          title?: string
          description?: string | null
          content?: string | null
          file_name?: string | null
          file_size?: string | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string | null
          frequency: string | null
          time_slots: string[] | null
          adherence: number | null
          side_effects: string[] | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage?: string | null
          frequency?: string | null
          time_slots?: string[] | null
          adherence?: number | null
          side_effects?: string[] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          dosage?: string | null
          frequency?: string | null
          time_slots?: string[] | null
          adherence?: number | null
          side_effects?: string[] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      user_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_value: number | null
          current_value: number | null
          unit: string | null
          deadline: string | null
          completed: boolean | null
          progress: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_value?: number | null
          current_value?: number | null
          unit?: string | null
          deadline?: string | null
          completed?: boolean | null
          progress?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_value?: number | null
          current_value?: number | null
          unit?: string | null
          deadline?: string | null
          completed?: boolean | null
          progress?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      symptom_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          time: string
          type: string
          severity: number
          notes: string | null
          triggers: string[] | null
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          time: string
          type: string
          severity: number
          notes?: string | null
          triggers?: string[] | null
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          time?: string
          type?: string
          severity?: number
          notes?: string | null
          triggers?: string[] | null
          location?: string | null
          created_at?: string
        }
      }
      mood_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          time: string
          mood: string
          energy: number
          stress: number
          notes: string | null
          activities: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          time: string
          mood: string
          energy: number
          stress: number
          notes?: string | null
          activities?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          time?: string
          mood?: string
          energy?: number
          stress?: number
          notes?: string | null
          activities?: string[] | null
          created_at?: string
        }
      }
      medication_logs: {
        Row: {
          id: string
          user_id: string
          medication_id: string
          date: string
          time: string
          taken: boolean
          notes: string | null
          side_effects: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          medication_id: string
          date: string
          time: string
          taken: boolean
          notes?: string | null
          side_effects?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          medication_id?: string
          date?: string
          time?: string
          taken?: boolean
          notes?: string | null
          side_effects?: string[] | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          notifications_enabled: boolean | null
          reminder_frequency: string | null
          theme: string | null
          language: string | null
          privacy_settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notifications_enabled?: boolean | null
          reminder_frequency?: string | null
          theme?: string | null
          language?: string | null
          privacy_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notifications_enabled?: boolean | null
          reminder_frequency?: string | null
          theme?: string | null
          language?: string | null
          privacy_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
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

// Analytics Types
export interface HealthInsight {
  id?: string
  user_id: string
  insight_type: 'daily' | 'weekly' | 'monthly' | 'triggered' | 'on_demand'
  insights: {
    trends?: Array<{
      metric: string
      direction: 'improving' | 'declining' | 'stable'
      confidence: number
      description: string
    }>
    concerns?: Array<{
      type: string
      severity: 'low' | 'medium' | 'high'
      description: string
      recommendations: string[]
    }>
    recommendations?: Array<{
      category: string
      action: string
      priority: 'low' | 'medium' | 'high'
      rationale: string
    }>
    achievements?: Array<{
      type: string
      description: string
      metric_improvement: number
    }>
  }
  alerts: Array<{
    type: string
    severity: 'info' | 'warning' | 'urgent' | 'critical'
    message: string
    action_required?: string
  }>
  metadata: {
    processing_time_ms?: number
    data_points_analyzed?: number
    llm_service_used?: string
    confidence_score?: number
  }
  generated_at?: string
  created_at?: string
  updated_at?: string
}

export interface HealthScore {
  id?: string
  user_id: string
  overall_score: number
  component_scores: {
    glucose?: number
    medication_adherence?: number
    exercise?: number
    sleep?: number
    mood?: number
    nutrition?: number
    vital_signs?: number
    symptom_severity?: number
  }
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
  score_period: string
  calculated_at?: string
  created_at?: string
}

export interface UserAlert {
  id?: string
  user_id: string
  alert_type: string
  severity: 'info' | 'warning' | 'urgent' | 'critical'
  title: string
  message: string
  action_required?: string
  metadata: {
    tool_id?: string
    metric_value?: number
    threshold?: number
    related_entries?: string[]
  }
  is_read: boolean
  is_dismissed: boolean
  expires_at?: string
  created_at?: string
}

export interface AnalyticsCache {
  id?: string
  user_id: string
  cache_key: string
  cache_data: any
  expires_at: string
  created_at?: string
}

export interface HealthTrend {
  date: string
  value: number
  tool_id: string
  metric: string
}

export interface CorrelationData {
  metric1: string
  metric2: string
  correlation: number
  significance: number
  data_points: number
}

export interface GoalProgress {
  goal_id: string
  goal_name: string
  target_value: number
  current_value: number
  progress_percentage: number
  days_remaining?: number
  trend: 'on_track' | 'behind' | 'ahead'
}

export interface StreakData {
  tool_id: string
  tool_name: string
  current_streak: number
  longest_streak: number
  last_entry_date: string
  streak_status: 'active' | 'broken' | 'at_risk'
}

export interface AnalyticsData {
  trends: HealthTrend[]
  correlations: CorrelationData[]
  goals: GoalProgress[]
  streaks: StreakData[]
  health_score: HealthScore
  insights: HealthInsight[]
  alerts: UserAlert[]
} 