# Scoring Rules — Score Generation Code

> Applies to: `app/api/score/route.ts`, `lib/scoring.ts`, `lib/prompts.ts`, any file that calls Claude for scoring.

---

## SC-1: Scoring Architecture (Two Layers)

```
User Answers
    │
    ├─► Rule-Based Scorer (lib/scoring.ts → ruleBasedScore())
    │     Always runs. Used as fallback + sanity check.
    │     Deterministic: same input = same output.
    │
    └─► Claude Scorer (app/api/score/route.ts)
          Primary. Uses SCORING_SYSTEM_PROMPT from lib/prompts.ts.
          Streamed to client for real-time UX.
          Falls back to rule-based if Claude unavailable.
```

---

## SC-2: 8 Dimensions & Max Points

| Dimension | DB Key | Max Points |
|---|---|---|
| Problem Clarity | `problem_clarity` | 15 |
| Revenue | `revenue` | 20 |
| Runway | `runway` | 15 |
| Team Size | `team_size` | 10 |
| Product Stage | `product_stage` | 10 |
| Previous Funding | `previous_funding` | 10 |
| Market Size | `market_size` | 10 |
| AI Confidence | `ai_confidence` | 10 |
| **TOTAL** | | **100** |

---

## SC-3: Band Thresholds

```typescript
if (score >= 80) return "Top 10%";       // Investors see this startup
if (score >= 60) return "Investor-Ready"; // Investors see this startup
if (score >= 40) return "Early-Stage";   // Not shown to investors yet
return "Pre-Ready";                        // Not shown to investors
```

> **Business Rule**: Investors can only see startups with `score >= 75`. This threshold is enforced in the investor portal query, not just the band label.

---

## SC-4: Claude Output Validation

Claude must output ONLY valid JSON matching `ScoringResult` in `lib/scoring.ts`. Validation is mandatory:

```typescript
// Step 1: Extract JSON from response
const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  console.error("[Scoring] Claude returned no valid JSON");
  // Fall back to rule-based scorer
}

// Step 2: Parse safely
let result: ScoringResult;
try {
  result = JSON.parse(jsonMatch[0]);
} catch (e) {
  console.error("[Scoring] JSON parse failed:", e);
  // Fall back to rule-based scorer
}

// Step 3: Validate required fields
if (!result.score || !result.band || !result.component_scores) {
  console.error("[Scoring] Missing required fields in Claude output");
}

// Step 4: Validate score is in range
if (result.score < 0 || result.score > 100) {
  result.score = Math.max(0, Math.min(100, result.score));
}
```

---

## SC-5: API Operation Order (CRITICAL — prevents data loss)

The scoring API must execute tasks in this order to prevent data loss:

```
1. Resolve userId (smart-link by email if ID missing)
2. UPSERT session record → supabase.sessions
3. INSERT report record → supabase.reports  ← SAVE FIRST
4. Stream "done" event to client
5. [Background] Send Telegram alert
6. [Background] Send email via Resend
7. [Background] Track analytics event
8. [Background] Fire debate engine
```

**Rule**: Steps 5–8 MUST be inside a non-awaited `(async () => { ... })()` block. They must never block steps 1–4 or the stream closure. Vercel has a 10-second timeout.

---

## SC-6: Logic Overrides

Admins can inject scoring corrections via the `logic_overrides` table:

```typescript
// Fetch active overrides
const { data } = await supabaseAdmin
  .from("logic_overrides")
  .select("*")
  .eq("is_active", true);

// If any trigger_text appears in the answers, append correction_rule to system prompt
const matchedOverrides = data.filter(row =>
  answersJson.toLowerCase().includes(row.trigger_text.toLowerCase())
).map(row => row.correction_rule);
```

Overrides are appended to the `SCORING_SYSTEM_PROMPT` in the `CRITICAL OVERRIDES:` section.

---

## SC-7: Prompt Versioning

- All prompts live in `lib/prompts.ts` — never inline prompts in route handlers.
- The current prompt version is `v1.2-core` (set as `promptVersion` constant in the route).
- When updating prompts, increment the version and update `prompt_versions` table.
- Track: `completions`, `avg_score` per version for A/B analysis.

---

## SC-8: Debate Engine

After scoring, fire the debate engine asynchronously:
```typescript
// Fire and forget — never await
fireDebateEngine(assessmentId, answersJson, score);
```
The debate engine (`/api/debate`) runs a "Bull vs. Bear" AI debate on the startup and stores the transcript in the `evolution_insights` table.
