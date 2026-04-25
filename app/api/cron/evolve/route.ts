import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient, MODELS } from "@/lib/ai";
import { sendTelegramAlert } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 300;

// Create client gracefully to avoid Next.js static build failures when env vars are absent
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) throw new Error("Supabase Admin client not configured.");
    
    // 1. Authenticate the Cron request
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow execution without CRON_SECRET only in dev mode for easy local testing
      if (process.env.NODE_ENV === "production") {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // 2. See when we last generated insights, to grab the delta
    const { data: lastRun } = await supabaseAdmin
      .from("evolution_insights")
      .select("generated_at")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    const cutoffDate = lastRun?.generated_at || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 3. Fetch all completed sessions and successful payments since the cutoff
    const { data: events, error: fetchError } = await supabaseAdmin
      .from("analytics_events")
      .select("*")
      .gte("created_at", cutoffDate);

    if (fetchError) throw fetchError;

    const completedAssessments = events?.filter((e) => e.event_type === "assessment_completed") || [];
    const payments = events?.filter((e) => e.event_type === "payment_success") || [];

    // 4. Threshold check (must have at least 10 sessions to bother burning AI tokens)
    if (completedAssessments.length < 10) {
      return NextResponse.json({
        skipped: true,
        reason: `Only ${completedAssessments.length} sessions since last evolution. Threshold is 10.`,
      });
    }

    // 5. Structure payload for Claude
    const rawStats = {
      sessions: completedAssessments.length,
      payments: payments.length,
      conversionRate: ((payments.length / completedAssessments.length) * 100).toFixed(1) + "%",
      recentGaps: completedAssessments.map((a) => a.event_data).slice(-50), // Send a sampling
    };

    const prompt = `You are the core intelligence engine for FundabilityOS.
Your job is to analyze startup batch data and extract actionable insights to INCREASE $29 PAYMENT CONVERSION and REDUCE UX FRICTION.

Data since last run:
- Assessments completed: ${rawStats.sessions}
- Payments completed: ${rawStats.payments}
- Conversion Rate: ${rawStats.conversionRate}

Sample data of recent gaps/scores:
${JSON.stringify(rawStats.recentGaps, null, 2)}

Provide a concise, 3-point briefing:
1. One major trend causing startups to get low scores.
2. One specific tweak for the sales/marketing funnel to boost our $29 report conversions.
3. One UX or funnel friction point we might be suffering from.

Output strictly in JSON format matching this schema:
{ "trend": "...", "upsell_opportunity": "...", "ux_friction": "..." }`;

    // 6. Invoke Claude Sonnet
    const msg = await getAnthropicClient().messages.create({
      model: MODELS.ANALYSIS,
      max_tokens: 500,
      temperature: 0.2,
      system: "Return only raw JSON. No markdown wrappers.",
      messages: [{ role: "user", content: prompt }],
    });

    const contentText = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const insights = JSON.parse(contentText);

    // 7. Save to DB
    const { error: insertError } = await supabaseAdmin.from("evolution_insights").insert({
      run_type: "scheduled",
      session_count: rawStats.sessions,
      payment_count: rawStats.payments,
      insights: insights,
      raw_stats: rawStats,
      notification_sent: true,
      analysis_period_start: cutoffDate,
      analysis_period_end: new Date().toISOString()
    });

    if (insertError) throw insertError;

    // 8. Ping telegram
    const tgMsg = `🧠 <b>Evolution Report Generated</b>\n\nSessions: ${rawStats.sessions}\nPayments: ${rawStats.payments}\nConversion: ${rawStats.conversionRate}\n\n💡 <b>Opportunity:</b> ${insights.upsell_opportunity}\n\n⚠️ <b>Friction:</b> ${insights.ux_friction}`;
    await sendTelegramAlert(tgMsg);

    return NextResponse.json({ success: true, insights });
  } catch (err: unknown) {
    console.error("Evolution Job failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
