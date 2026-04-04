import { createClient } from "@supabase/supabase-js";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

type EventType = "interview_started" | "deck_uploaded" | "assessment_completed" | "paywall_hit" | "payment_success";

export async function trackEvent(
  eventType: EventType,
  data: {
    sessionId?: string;
    userId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData?: Record<string, any>;
    score?: number;
  }
) {
  if (!supabase) {
    console.warn(`Analytics Skipped [${eventType}] - Supabase not configured.`);
    return;
  }

  // Fire and forget so we don't block the UI
  supabase
    .from("analytics_events")
    .insert({
      event_type: eventType,
      session_id: data.sessionId,
      user_id: data.userId,
      event_data: data.eventData || {},
      session_score: data.score,
    })
    .then(({ error }) => {
      if (error) console.error("Analytics DB Error:", error);
    });
}
