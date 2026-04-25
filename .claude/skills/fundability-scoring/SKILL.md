# SKILL: Fundability Scoring

> How to compute and persist the 8-dimension FundabilityOS score.

---

## Overview

The fundability score combines a **deterministic rule engine** (always runs, used as fallback) with **Claude's qualitative AI scoring** (primary). The result is a `ScoringResult` object persisted to `supabase.reports`.

---

## Step 1: Collect Interview Answers

Answers come from one of two sources:
- **Interview**: 12-question conversational AI interview (`/api/chat` → `QuickAssess` component)
- **Pitch Deck**: PDF upload parsed by Claude (`/api/upload`)

The structured answer payload matches this shape:
```typescript
{
  problem_description: string,
  monthly_revenue_usd: number,
  runway_months: number,
  team_size: number,
  product_stage: "idea" | "prototype" | "beta" | "live",
  funding_type: "none" | "angel" | "seed" | "series-a" | "series-b+",
  market_size_description: string,
  // ... full schema in lib/prompts.ts INTERVIEW_SYSTEM_PROMPT
}
```

---

## Step 2: Rule-Based Pre-Score (Fallback / Sanity Check)

```typescript
import { ruleBasedScore, totalScore, scoreToBand } from "@/lib/scoring";

const components = ruleBasedScore(answers);
// Returns ComponentScores: { problem_clarity, revenue, runway, team_size, product_stage, previous_funding, market_size, ai_confidence }
// Note: problem_clarity, market_size, ai_confidence default to mid-scores (6-8) — AI fills these in.

const score = totalScore(components); // Sum of all components
const band = scoreToBand(score);      // "Pre-Ready" | "Early-Stage" | "Investor-Ready" | "Top 10%"
```

---

## Step 3: Claude AI Scoring (Primary)

```typescript
// 1. Build the prompt
const prompt = `Assess this startup diagnostic:\n${JSON.stringify(answers)}\n\nOutput ONLY JSON.`;

// 2. Stream from Claude
const stream = await anthropic.messages.stream({
  model: "claude-opus-4-5", // or MODELS.ANALYSIS from lib/ai.ts
  max_tokens: 2500,
  temperature: 0.1,
  system: SCORING_SYSTEM_PROMPT, // from lib/prompts.ts
  messages: [{ role: "user", content: prompt }],
});

// 3. Collect full response
let fullResponse = "";
for await (const chunk of stream) {
  if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
    fullResponse += chunk.delta.text;
  }
}

// 4. Extract and validate JSON
const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
const result: ScoringResult = JSON.parse(jsonMatch![0]);
```

---

## Step 4: Apply Logic Overrides

```typescript
const { data: overrides } = await supabaseAdmin
  .from("logic_overrides")
  .select("trigger_text, correction_rule")
  .eq("is_active", true);

const matched = overrides?.filter(o =>
  JSON.stringify(answers).toLowerCase().includes(o.trigger_text.toLowerCase())
).map(o => o.correction_rule) ?? [];

// Append to system prompt:
const systemPrompt = `${SCORING_SYSTEM_PROMPT}\n\nCRITICAL OVERRIDES:\n${matched.join("\n") || "None."}`;
```

---

## Step 5: Persist Results

```typescript
// Must follow this ORDER (FK constraints)
const reportId = crypto.randomUUID();

// 1. Upsert session
await supabaseAdmin.from("sessions").upsert({
  id: assessmentId,
  user_id: finalUserId || null,
  status: "completed",
  completed_at: new Date().toISOString()
});

// 2. Insert report
await supabaseAdmin.from("reports").insert({
  id: reportId,
  session_id: assessmentId,
  user_id: finalUserId || null,
  score: result.score,
  band: result.band,
  component_scores: result.component_scores,
  top_3_gaps: result.top_3_gaps,
  financial_snapshot: result.financial_snapshot,
  investor_loves: result.investor_loves,
  investor_concerns: result.investor_concerns,
  action_items: result.action_items,
  summary_paragraph: result.summary_paragraph,
  full_json: result
});
```

---

## Step 6: Report URL

```typescript
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}`;
const reportUrl = `${baseUrl}/report/${reportId}`;
// Report page: app/report/[slug]/page.tsx
// Unlock gate: requires is_unlocked = true OR user is admin/owner
```

---

## Score Display Components

- `components/score/ScoreGaugeMock.tsx` — Circular gauge visualization
- `app/report/[slug]/page.tsx` — Full report page with lock overlay
- `components/emails/DiagnosticCompleteEmail.tsx` — Email template with score
