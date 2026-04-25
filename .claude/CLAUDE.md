# FundabilityOS — Permanent Project Memory

> This file is the single source of truth for every AI agent working on FundabilityOS.
> Read this in full before writing any code. Import context from `/memory-bank/*.md`.

---

## Business Identity

| Field | Value |
|---|---|
| **Product** | FundabilityOS |
| **Company** | NextBlaze Asia |
| **Domain** | www.nextblaze.asia |
| **Admin Contact** | karsin@nextblaze.asia |
| **Tagline** | Know your fundability score before investors do. |

---

## What the Platform Does

1. **Startup Side (Free)**: Founder completes a 12-20 ( numbers arebased on previous question evaluation to determine the next question AI interview or uploads a pitch deck. Claude scores them across 8 dimensions (0–100). Result is a Fundability Band: Pre-Ready / Early-Stage / Investor-Ready / Top 10%.
2. **Investor Side (Paid)**: Investors see only startups scoring > 75. They can give pass/invest feedback per startup.
3. **Feedback Loop**: Investor feedback retrains the scoring weights weekly via a cron job (`/api/cron/evolve`).
4. **Report Unlock**: Startups pay donation one-time (optional) to unlock full PDF report + 30-Day Growth Plan + shareable link.
5. **"Buy Me a Coffee"**: Optional donation page for startups — no mandatory payment.

---

## Monetisation

| Revenue Stream | Price | Audience |
|---|---|---|
| Investor Platform Access | $99–$499/month | Investors |
| Full Report Unlock | $29 one-time | Startups |
| Success Fee | TBD (future) | Matched deals |
| Startup Premium Badge | Monthly/Annual | Startups wanting visibility |

---

## Scoring System (8 Dimensions)

| Dimension | Max Pts | Key Signal |
|---|---|---|
| Problem Clarity | 15 | Specific customer + problem + consequence |
| Revenue | 20 | MRR level ($100k+ = max) |
| Runway | 15 | Months of cash (>12 = max) |
| Team Size | 10 | Co-founder count and domain fit |
| Product Stage | 10 | idea → prototype → beta → live |
| Previous Funding | 10 | none → angel → seed → Series A+ |
| Market Size | 10 | TAM estimate with data |
| AI Confidence | 10 | Claude's qualitative trust signal |

**Band Thresholds**: Pre-Ready (<40) | Early-Stage (40–59) | Investor-Ready (60–79) | Top 10% (80+)

Investors see startups only when score > 75.

---

## Architecture

```
Next.js 15 App Router
├── app/
│   ├── (assessment)/     ← public interview flow
│   ├── admin/            ← platform owner tools (RLS-protected)
│   ├── api/              ← all server-side logic
│   │   ├── score/        ← CORE: AI scoring + DB persistence
│   │   ├── admin/        ← admin data APIs (service role)
│   │   ├── webhook/      ← Stripe webhook (signature-verified)
│   │   └── cron/         ← weekly evolution engine
│   ├── dashboard/        ← authenticated founder dashboard
│   ├── investor/         ← investor portal (score > 75 filter)
│   └── report/[id]/      ← report viewer (unlock gate)
├── lib/
│   ├── scoring.ts        ← rule-based fallback scorer
│   ├── prompts.ts        ← all AI prompts (never inline)
│   ├── ai.ts             ← Anthropic client singleton
│   ├── telegram.ts       ← admin alert helper
│   ├── resend.ts         ← email client singleton
│   └── supabase/
│       ├── client.ts     ← browser client (anon key, RLS applies)
│       ├── server.ts     ← SSR client (anon key + cookie session)
│       └── admin.ts      ← service role client (server-only)
└── supabase/migrations/  ← all schema changes
```

---

## Core Database Tables

| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users with role, company, admin flag |
| `sessions` | Assessment sessions (links user → answers) |
| `reports` | Scoring results with full JSON + unlock status |
| `payments` | Stripe payment records |
| `analytics_events` | Platform usage tracking |
| `logic_overrides` | Admin-managed scoring correction rules |
| `prompt_versions` | Prompt A/B testing + avg score tracking |
| `evolution_insights` | Investor feedback + model retraining data |

---

## Critical Known Issues (as of April 2026)

1. **RLS Infinite Recursion**: The `profiles_admin_all` policy caused a loop when querying profiles via anon key. Fixed via `public.is_admin(uuid)` SECURITY DEFINER function (migration `011`). Admin dashboard must use `/api/admin/**` routes (service role), never direct anon client queries.
2. **Orphaned Reports**: Assessments taken when not logged in save `user_id: null`. The scoring API has a "Smart Link" fallback that looks up the user by email if ID is missing.
3. **Scoring API Timeout**: Vercel 10s limit means email + telegram must be fire-and-forget background tasks, not awaited in the main thread.
4. **Git Push**: HTTPS push requires a GitHub Personal Access Token (PAT), not a password. User should set up SSH or PAT.

---

## Data Privacy Rules

- Startup answers (interview data) are stored encrypted-at-rest in Supabase.
- Never log full interview answers to console in production.
- Investors cannot see startup contact details until a mutual match is confirmed.
- User emails are used only for report delivery and platform alerts — no marketing without consent.
- GDPR & Asia Privacy policies in various Asia countries: Users can request data deletion. Implement a `/api/auth/delete-account` route.

---

## Environment Variables Reference

See `.env.example` for the full list. Critical ones:
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, bypasses RLS
- `ANTHROPIC_API_KEY` — scoring + interview AI
- `STRIPE_WEBHOOK_SECRET` — signature verification
- `CRON_SECRET` — protects evolution cron endpoint
- `RESEND_FROM_EMAIL` — must be a verified Resend domain
- `NEXT_PUBLIC_SITE_URL` — used for report URL generation in emails
