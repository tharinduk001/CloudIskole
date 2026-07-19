export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          ip: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          ip?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      bank_transfers: {
        Row: {
          amount_declared_cents: number | null
          deposited_at: string | null
          depositor_name: string | null
          id: string
          order_id: string
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slip_path: string
          submitted_at: string
        }
        Insert: {
          amount_declared_cents?: number | null
          deposited_at?: string | null
          depositor_name?: string | null
          id?: string
          order_id: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slip_path: string
          submitted_at?: string
        }
        Update: {
          amount_declared_cents?: number | null
          deposited_at?: string | null
          depositor_name?: string | null
          id?: string
          order_id?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slip_path?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bank_transfers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bank_transfers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          code: string
          course_id: string
          external_badge_url: string | null
          id: string
          issued_at: string
          pdf_path: string | null
          revoke_reason: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          course_id: string
          external_badge_url?: string | null
          id?: string
          issued_at?: string
          pdf_path?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          course_id?: string
          external_badge_url?: string | null
          id?: string
          issued_at?: string
          pdf_path?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          handled_at: string | null
          handled_by: string | null
          id: string
          ip: unknown
          message: string
          name: string
          phone: string | null
          subject: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          ip?: unknown
          message: string
          name: string
          phone?: string | null
          subject?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          ip?: unknown
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_messages_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_messages_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean
          level: Database["public"]["Enums"]["course_level"]
          price_cents: number
          published_at: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          subtitle: string | null
          thumbnail_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          price_cents?: number
          published_at?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          thumbnail_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          price_cents?: number
          published_at?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress_pct: number
          source_order_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress_pct?: number
          source_order_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_pct?: number
          source_order_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_source_order_fk"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          last_seen_at: string
          lesson_id: string
          seconds_watched: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          last_seen_at?: string
          lesson_id: string
          seconds_watched?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          last_seen_at?: string
          lesson_id?: string
          seconds_watched?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachment_path: string | null
          content_mdx: string | null
          course_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          is_preview: boolean
          module_id: string
          slug: string
          sort_order: number
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
          updated_at: string
          youtube_id: string | null
        }
        Insert: {
          attachment_path?: string | null
          content_mdx?: string | null
          course_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_preview?: boolean
          module_id: string
          slug: string
          sort_order?: number
          title: string
          type?: Database["public"]["Enums"]["lesson_type"]
          updated_at?: string
          youtube_id?: string | null
        }
        Update: {
          attachment_path?: string | null
          content_mdx?: string | null
          course_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_preview?: boolean
          module_id?: string
          slug?: string
          sort_order?: number
          title?: string
          type?: Database["public"]["Enums"]["lesson_type"]
          updated_at?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          dedupe_key: string | null
          id: number
          last_error: string | null
          payload: Json
          recipient: string
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          dedupe_key?: string | null
          id?: never
          last_error?: string | null
          payload?: Json
          recipient: string
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          dedupe_key?: string | null
          id?: never
          last_error?: string | null
          payload?: Json
          recipient?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          course_id: string
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          idempotency_key: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_txn_id: string | null
          reference_code: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          course_id: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          idempotency_key: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_txn_id?: string | null
          reference_code: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          course_id?: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_txn_id?: string | null
          reference_code?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: number
          ip: unknown
          note: string | null
          order_id: string
          raw: Json
          to_status: Database["public"]["Enums"]["order_status"] | null
          type: Database["public"]["Enums"]["payment_event_type"]
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          ip?: unknown
          note?: string | null
          order_id: string
          raw?: Json
          to_status?: Database["public"]["Enums"]["order_status"] | null
          type: Database["public"]["Enums"]["payment_event_type"]
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          ip?: unknown
          note?: string | null
          order_id?: string
          raw?: Json
          to_status?: Database["public"]["Enums"]["order_status"] | null
          type?: Database["public"]["Enums"]["payment_event_type"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: number
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: never
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: never
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_otp_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "phone_otp_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "phone_otp_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          al_year: number | null
          avatar_url: string | null
          created_at: string
          district: string | null
          email: string
          full_name: string
          id: string
          leaderboard_opt_in: boolean
          marketing_opt_in: boolean
          phone: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          al_year?: number | null
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          email: string
          full_name?: string
          id: string
          leaderboard_opt_in?: boolean
          marketing_opt_in?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          al_year?: number | null
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          email?: string
          full_name?: string
          id?: string
          leaderboard_opt_in?: boolean
          marketing_opt_in?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempt_answers: {
        Row: {
          attempt_id: string
          is_correct: boolean | null
          option_id: string | null
          points_awarded: number
          question_id: string
        }
        Insert: {
          attempt_id: string
          is_correct?: boolean | null
          option_id?: string | null
          points_awarded?: number
          question_id: string
        }
        Update: {
          attempt_id?: string
          is_correct?: boolean | null
          option_id?: string | null
          points_awarded?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "quiz_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_no: number
          expires_at: string | null
          id: string
          passed: boolean | null
          quiz_id: string
          score_pct: number | null
          score_points: number | null
          started_at: string
          submitted_at: string | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          attempt_no?: number
          expires_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id: string
          score_pct?: number | null
          score_points?: number | null
          started_at?: string
          submitted_at?: string | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          attempt_no?: number
          expires_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score_pct?: number | null
          score_points?: number | null
          started_at?: string
          submitted_at?: string | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          body: string
          id: string
          is_correct: boolean
          question_id: string
          sort_order: number
        }
        Insert: {
          body: string
          id?: string
          is_correct?: boolean
          question_id: string
          sort_order?: number
        }
        Update: {
          body?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          body: string
          created_at: string
          explanation: string | null
          id: string
          points: number
          quiz_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number
          quiz_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number
          quiz_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          available_from: string | null
          available_until: string | null
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          lesson_id: string | null
          max_attempts: number | null
          pass_mark_pct: number
          scope: Database["public"]["Enums"]["quiz_scope"]
          shuffle_options: boolean
          shuffle_questions: boolean
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          max_attempts?: number | null
          pass_mark_pct?: number
          scope: Database["public"]["Enums"]["quiz_scope"]
          shuffle_options?: boolean
          shuffle_questions?: boolean
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          max_attempts?: number | null
          pass_mark_pct?: number
          scope?: Database["public"]["Enums"]["quiz_scope"]
          shuffle_options?: boolean
          shuffle_questions?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          attended: boolean
          attended_marked_at: string | null
          id: string
          registered_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          attended_marked_at?: string | null
          id?: string
          registered_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          attended?: boolean
          attended_marked_at?: string | null
          id?: string
          registered_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "session_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "session_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          capacity: number | null
          course_id: string | null
          cover_image_path: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          host_name: string | null
          id: string
          is_free: boolean
          join_url: string | null
          recording_url: string | null
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          course_id?: string | null
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_name?: string | null
          id?: string
          is_free?: boolean
          join_url?: string | null
          recording_url?: string | null
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          course_id?: string | null
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_name?: string | null
          id?: string
          is_free?: boolean
          join_url?: string | null
          recording_url?: string | null
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_days: {
        Row: {
          activity_date: string
          user_id: string
        }
        Insert: {
          activity_date: string
          user_id: string
        }
        Update: {
          activity_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          created_at: string
          id: number
          points: number
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          points: number
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          points?: number
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_all_time"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_monthly"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      certificate_verification: {
        Row: {
          code: string | null
          course_title: string | null
          holder_name: string | null
          is_valid: boolean | null
          issued_at: string | null
        }
        Relationships: []
      }
      leaderboard_all_time: {
        Row: {
          avatar_url: string | null
          district: string | null
          full_name: string | null
          rank: number | null
          user_id: string | null
          xp: number | null
        }
        Relationships: []
      }
      leaderboard_monthly: {
        Row: {
          avatar_url: string | null
          district: string | null
          full_name: string | null
          rank: number | null
          user_id: string | null
          xp: number | null
        }
        Relationships: []
      }
      sessions_public: {
        Row: {
          capacity: number | null
          course_id: string | null
          cover_image_path: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          host_name: string | null
          id: string | null
          is_free: boolean | null
          recording_url: string | null
          slug: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          title: string | null
        }
        Insert: {
          capacity?: number | null
          course_id?: string | null
          cover_image_path?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host_name?: string | null
          id?: string | null
          is_free?: boolean | null
          recording_url?: string | null
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title?: string | null
        }
        Update: {
          capacity?: number | null
          course_id?: string | null
          cover_image_path?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host_name?: string | null
          id?: string | null
          is_free?: boolean | null
          recording_url?: string | null
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      award_xp: {
        Args: {
          p_points: number
          p_source: string
          p_source_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      claim_notifications: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          dedupe_key: string | null
          id: number
          last_error: string | null
          payload: Json
          recipient: string
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_order: {
        Args: { p_course_id: string }
        Returns: {
          amount_cents: number
          course_id: string
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          idempotency_key: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_txn_id: string | null
          reference_code: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_streak: { Args: { p_user_id: string }; Returns: number }
      get_attempt_result: { Args: { p_attempt_id: string }; Returns: Json }
      get_course_outline_public: {
        Args: { p_course_id: string }
        Returns: {
          duration_seconds: number
          is_preview: boolean
          lesson_id: string
          lesson_slug: string
          lesson_sort_order: number
          lesson_title: string
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          module_id: string
          module_sort_order: number
          module_title: string
        }[]
      }
      get_quiz_paper: { Args: { p_quiz_id: string }; Returns: Json }
      grant_enrollment: {
        Args: { p_actor_id?: string; p_note?: string; p_order_id: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_enrolled: { Args: { p_course_id: string }; Returns: boolean }
      is_trusted_write: { Args: never; Returns: boolean }
      recompute_enrollment_progress: {
        Args: { p_course_id: string; p_user_id?: string }
        Returns: undefined
      }
      reject_order: {
        Args: { p_actor_id: string; p_order_id: string; p_reason: string }
        Returns: undefined
      }
      request_phone_otp: { Args: { p_phone: string }; Returns: string }
      start_quiz_attempt: { Args: { p_quiz_id: string }; Returns: string }
      submit_bank_transfer_slip: {
        Args: {
          p_amount_declared_cents?: number
          p_deposited_at?: string
          p_depositor_name?: string
          p_order_id: string
          p_slip_path: string
        }
        Returns: undefined
      }
      submit_quiz_attempt: {
        Args: { p_answers: Json; p_attempt_id: string }
        Returns: Json
      }
      verify_phone_otp: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      content_status: "draft" | "published" | "archived"
      course_level: "beginner" | "intermediate" | "advanced"
      enrollment_status: "active" | "completed" | "revoked"
      lesson_type: "video" | "text" | "pdf"
      notification_channel: "sms" | "email"
      notification_status:
        | "queued"
        | "sending"
        | "sent"
        | "failed"
        | "cancelled"
      order_status:
        | "pending"
        | "under_review"
        | "paid"
        | "rejected"
        | "failed"
        | "cancelled"
        | "refunded"
      payment_event_type:
        | "order_created"
        | "slip_submitted"
        | "review_started"
        | "admin_approved"
        | "admin_rejected"
        | "webhook_received"
        | "verification_failed"
        | "enrollment_granted"
        | "payment_failed"
        | "order_cancelled"
        | "refund_issued"
      payment_provider: "bank_transfer" | "payhere"
      quiz_scope: "lesson" | "course" | "exam"
      session_status: "upcoming" | "live" | "completed" | "cancelled"
      user_role: "student" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      content_status: ["draft", "published", "archived"],
      course_level: ["beginner", "intermediate", "advanced"],
      enrollment_status: ["active", "completed", "revoked"],
      lesson_type: ["video", "text", "pdf"],
      notification_channel: ["sms", "email"],
      notification_status: ["queued", "sending", "sent", "failed", "cancelled"],
      order_status: [
        "pending",
        "under_review",
        "paid",
        "rejected",
        "failed",
        "cancelled",
        "refunded",
      ],
      payment_event_type: [
        "order_created",
        "slip_submitted",
        "review_started",
        "admin_approved",
        "admin_rejected",
        "webhook_received",
        "verification_failed",
        "enrollment_granted",
        "payment_failed",
        "order_cancelled",
        "refund_issued",
      ],
      payment_provider: ["bank_transfer", "payhere"],
      quiz_scope: ["lesson", "course", "exam"],
      session_status: ["upcoming", "live", "completed", "cancelled"],
      user_role: ["student", "admin"],
    },
  },
} as const

