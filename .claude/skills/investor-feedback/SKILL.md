# SKILL: Investor Feedback Collection

> How to collect, store, and use investor pass/invest decisions to retrain the scoring model.

---

## Overview

Investors on the platform (score > 75 gate) can submit pass/invest decisions on startups. This feedback is the training signal for the weekly model evolution cron job.

---

## Data Model

```sql
-- Table: evolution_insights
CREATE TABLE evolution_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES profiles(id),
  decision TEXT CHECK (decision IN ('pass', 'invest', 'watch')),
  reason TEXT,                    -- Free text: why pass/invest
  dimension_flags JSONB,          -- Which dimensions drove the decision
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Step 1: Investor Views Startup

```typescript
// Investor portal query — ENFORCES score > 75 gate
const { data: startups } = await supabaseAdmin
  .from("reports")
  .select(`
    id, score, band, summary_paragraph, investor_loves, investor_concerns,
    component_scores, created_at,
    profiles!reports_user_id_fkey(company_name, full_name)
  `)
  .gte("score", 75)                    // BUSINESS RULE: Never lower this
  .eq("is_unlocked", true)             // Only show unlocked reports
  .order("score", { ascending: false });
```

---

## Step 2: Collect Feedback Decision

API Route: `POST /api/investor/feedback`

```typescript
// Request body
{
  report_id: string,         // UUID of the report being reviewed
  decision: "pass" | "invest" | "watch",
  reason: string,            // 2–3 sentences minimum
  dimension_flags: {         // Optional: which dimensions swayed decision
    revenue: boolean,
    team: boolean,
    market: boolean,
    // ...
  }
}

// Validation
if (!["pass", "invest", "watch"].includes(decision)) {
  return { error: "Invalid decision" };
}
if (!reason || reason.length < 20) {
  return { error: "Reason must be at least 20 characters" };
}

// Store
await supabaseAdmin.from("evolution_insights").insert({
  report_id,
  investor_id: user.id,
  decision,
  reason,
  dimension_flags
});
```

---

## Step 3: Weekly Evolution Cron Job

Route: `POST /api/cron/evolve` (protected by `CRON_SECRET`)

```typescript
// 1. Fetch all feedback from last 7 days
const { data: feedback } = await supabaseAdmin
  .from("evolution_insights")
  .select("*, reports(component_scores, score)")
  .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

// 2. Calculate dimension pass rates
// For each dimension, what % of "invest" decisions had high scores in that dimension?

// 3. Use Claude to generate scoring adjustment recommendations
const prompt = `Based on this investor feedback data, suggest scoring weight adjustments...
${JSON.stringify(feedback)}`;

// 4. Store recommendations as new logic_overrides or prompt_versions
// Human review required before applying — store as "pending" status
```

---

## Step 4: Prevent Gaming

Rules to prevent investors from manipulating scores:
- One decision per investor per report (unique constraint on `(report_id, investor_id)`)
- Investors cannot see other investors' decisions
- Raw feedback is only accessible to platform admins
- Score adjustments from feedback require manual admin approval

---

## Viewing Feedback (Admin)

Admin route: `GET /api/admin/feedback` → reads `evolution_insights` via service role.
Admin page: `app/admin/debate/page.tsx` shows Bull/Bear debate transcripts linked to feedback.

---

## Privacy Rules

- Investor identity is hidden from startups (they see aggregate feedback only)
- Startup founders can see: average decision, top cited concerns, dimension flags
- Individual investor names and reasons are admin-only
