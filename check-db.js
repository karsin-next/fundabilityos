import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: reports, error: reportErr } = await supabase.from("reports").select("id, user_id, score, created_at").order("created_at", { ascending: false }).limit(5);
  console.log("Latest reports:", reports, reportErr);
  
  const { data: sessions, error: sessionErr } = await supabase.from("sessions").select("id, user_id, status").order("started_at", { ascending: false }).limit(5);
  console.log("Latest sessions:", sessions, sessionErr);
}
check();
