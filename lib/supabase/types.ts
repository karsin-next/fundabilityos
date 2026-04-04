// ============================================================
// FundabilityOS — Supabase Database Types
// ============================================================
// These match the SQL schema exactly. Update when schema changes.

export type ScoreBand = "Pre-Ready" | "Early-Stage" | "Investor-Ready" | "Top 10%";
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type InputMethod = "interview" | "deck_upload" | "hybrid";
export type PaymentType = "report" | "badge_monthly" | "badge_annual" | "addon";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type SubStatus = "active" | "past_due" | "canceled" | "trialing" | "incomplete";
export type PlanType = "monthly" | "annual";
export type AddonType = "deck_analyzer" | "cap_table" | "projections" | "intro_letter" | "data_room";

export interface ComponentScores {
  problem_clarity: number;
  revenue: number;
  runway: number;
  team_size: number;
  product_stage: number;
  previous_funding: number;
  market_size: number;
  ai_confidence: number;
}

export interface GapItem {
  dimension: string;
  score: number;
  max: number;
  explanation: string;
  fix: string;
  priority: "high" | "medium" | "low";
}

export interface ActionItem {
  week: 1 | 2 | 3 | 4;
  action: string;
  impact: string;
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          company_name: string | null;
          is_admin: boolean;
          referral_code: string | null;
          referred_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };

      sessions: {
        Row: {
          id: string;
          user_id: string | null;
          input_method: InputMethod;
          status: SessionStatus;
          drop_off_question: number | null;
          source_channel: string | null;
          ab_variants: Json;
          started_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sessions"]["Row"], "id" | "started_at" | "updated_at"> & Partial<Pick<Database["public"]["Tables"]["sessions"]["Row"], "id" | "started_at">>;
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };

      messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          question_index: number | null;
          time_spent_sec: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at">;
        Update: never;
      };

      deck_uploads: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          storage_path: string;
          file_size_bytes: number | null;
          extracted_data: Json | null;
          missing_fields: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deck_uploads"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["deck_uploads"]["Insert"]>;
      };

      reports: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          score: number | null;
          band: ScoreBand | null;
          component_scores: ComponentScores | null;
          display_groups: Json | null;
          top_3_gaps: GapItem[] | null;
          financial_snapshot: Json | null;
          team_overview: Json | null;
          investor_loves: Json | null;
          investor_concerns: Json | null;
          action_items: ActionItem[] | null;
          summary_paragraph: string | null;
          is_unlocked: boolean;
          public_slug: string | null;
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reports"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };

      payments: {
        Row: {
          id: string;
          user_id: string;
          report_id: string | null;
          stripe_session_id: string | null;
          stripe_customer_id: string | null;
          stripe_payment_intent: string | null;
          type: PaymentType;
          addon_type: string | null;
          status: PaymentStatus;
          amount_cents: number | null;
          price_variant: string | null;
          referral_code_used: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };

      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          plan_type: PlanType;
          status: SubStatus | null;
          badge_url: string | null;
          badge_embed_code: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };

      addon_purchases: {
        Row: {
          id: string;
          user_id: string;
          addon_type: AddonType;
          stripe_session_id: string | null;
          status: "pending" | "completed" | "failed";
          amount_cents: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["addon_purchases"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["addon_purchases"]["Insert"]>;
      };

      investors: {
        Row: {
          id: string;
          name: string;
          firm: string | null;
          stage_focus: string[] | null;
          sector_focus: string[] | null;
          geography: string[] | null;
          ticket_min_usd: number | null;
          ticket_max_usd: number | null;
          contact_pref: string | null;
          linkedin_url: string | null;
          email_domain: string | null;
          notes: string | null;
          logo_url: string | null;
          is_active: boolean;
          is_verified: boolean;
          submitted_by: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["investors"]["Row"], "id" | "created_at" | "updated_at" | "view_count">;
        Update: Partial<Database["public"]["Tables"]["investors"]["Insert"]>;
      };

      analytics_events: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string | null;
          event_type: string;
          event_data: Json;
          source_channel: string | null;
          price_variant: string | null;
          session_score: number | null;
          ab_variant: string | null;
          ab_test_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["analytics_events"]["Row"], "id" | "created_at">;
        Update: never;
      };

      evolution_insights: {
        Row: {
          id: string;
          run_type: "scheduled" | "manual";
          generated_at: string;
          analysis_period_start: string | null;
          analysis_period_end: string | null;
          session_count: number;
          payment_count: number;
          notification_sent: boolean;
          insights: Json | null;
          raw_stats: Json | null;
        };
        Insert: Omit<Database["public"]["Tables"]["evolution_insights"]["Row"], "id" | "generated_at">;
        Update: never;
      };

      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          referral_code: string;
          credit_earned: number;
          status: "pending" | "credited" | "expired";
          converted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["referrals"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>;
      };

      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_log"]["Row"], "id" | "created_at">;
        Update: never;
      };
    };
    Views: {
      user_credit_balances: {
        Row: {
          user_id: string;
          balance_cents: number;
          credits_earned: number;
          credits_redeemed: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
