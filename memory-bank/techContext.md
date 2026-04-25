# Memory Bank — Tech Context

## Runtime

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 15 (App Router) | No Pages Router |
| Language | TypeScript | 5.x (strict) | `tsconfig.json` strict: true |
| Styling | Vanilla CSS | — | `app/globals.css` + inline styles |
| Runtime | Node.js | 18+ | Vercel serverless |

## Services

| Service | Purpose | SDK | Env Var Prefix |
|---|---|---|---|
| Supabase | Database + Auth + Storage | `@supabase/supabase-js`, `@supabase/ssr` | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*` |
| Anthropic | AI Scoring + Interview | `@anthropic-ai/sdk` | `ANTHROPIC_*` |
| Stripe | Payments | `stripe` | `STRIPE_*`, `NEXT_PUBLIC_STRIPE_*` |
| Resend | Email | `resend` | `RESEND_*` |
| Telegram | Admin Alerts | REST API | `TELEGRAM_*` |
| Vercel | Deployment + Edge | — | `VERCEL_URL` (auto-set) |

## Key Dependencies (`package.json`)

```json
{
  "@anthropic-ai/sdk": "^0.x",
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x",
  "stripe": "^14.x",
  "resend": "^3.x",
  "next": "15.x",
  "react": "18.x",
  "lucide-react": "^0.x",
  "@react-pdf/renderer": "^3.x"
}
```

## Database Schema Overview

### Core Tables
```sql
profiles        -- id(uuid PK), email, full_name, company_name, is_admin, role, created_at
sessions        -- id(uuid PK), user_id(fk→profiles), status, started_at, completed_at
reports         -- id(uuid PK), session_id(fk→sessions), user_id(fk→profiles), score, band, is_unlocked, full_json
payments        -- id, user_id, stripe_payment_id, amount, status
analytics_events -- id, event_type, user_id, metadata, created_at
```

### AI/Learning Tables
```sql
logic_overrides   -- id, trigger_text, correction_rule, is_active
prompt_versions   -- version_name, system_prompt, completions, avg_score
evolution_insights -- id, report_id, investor_id, decision, reason, dimension_flags
analytics_logs    -- assessment_id, final_output, tokens_used
```

## Auth Architecture

- Supabase Auth handles registration/login
- Auth callback: `app/auth/callback/route.ts` (handles email confirmation redirect)
- Session managed via cookies (`@supabase/ssr`)
- Middleware refreshes session on every request for protected routes
- Protected routes: `/dashboard`, `/report`, `/admin`, `/directory`
- Admin check: `profiles.is_admin = true` OR `profiles.role = 'admin'`

## File Structure (Key Paths)

```
lib/ai.ts               — Anthropic client singleton (getAnthropicClient())
lib/scoring.ts          — Rule-based scorer + band thresholds + ScoringResult type
lib/prompts.ts          — ALL AI prompts (interview, scoring, tree, module)
lib/telegram.ts         — sendTelegramAlert() helper
lib/resend.ts           — Resend client export
lib/analytics.ts        — trackEvent() helper
lib/supabase/client.ts  — Browser client (anon key)
lib/supabase/server.ts  — SSR client (anon key + cookies)
lib/supabase/admin.ts   — Admin client (service role — server only)
lib/supabase/types.ts   — Full Database TypeScript types
context/AuthContext.tsx  — useAuth() hook (provides user, profile, loading)
middleware.ts           — Route protection + session refresh
```

## Deployment

- **Platform**: Vercel
- **Branch**: `main` → auto-deploys to production
- **Build Command**: `next build`
- **Output**: `.next/`
- **Vercel Timeout**: 10 seconds max per serverless function
  - Solution: streaming responses + fire-and-forget background tasks

## Path Aliases

All imports use `@/` prefix (configured in `tsconfig.json`):
```typescript
import { createClient } from "@/lib/supabase/client";
import { sendTelegramAlert } from "@/lib/telegram";
import { useAuth } from "@/context/AuthContext";
```
