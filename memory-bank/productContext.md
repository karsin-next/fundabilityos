# Memory Bank — Product Context

## User Personas

### Persona 1: The Startup Founder (Free User)
- **Who**: Pre-seed to Series A stage founders in SEA
- **Pain**: Don't know why investors keep saying "not yet"
- **Goal**: Understand gaps, improve score, get intro to right investors
- **Journey**: Landing page → 12-question interview → Score + Report → Unlock ($29) → Growth Plan

### Persona 2: The Institutional Investor (Paid User)
- **Who**: VC associates, angel groups, family offices
- **Pain**: Too much time spent screening unqualified deal flow
- **Goal**: See only fundable startups, give quick feedback
- **Journey**: Sign up → Pay subscription → Browse curated list (score ≥ 75) → Pass/Invest decision

### Persona 3: The Platform Admin (KarSin / NextBlaze)
- **Who**: karsin@nextblaze.asia
- **Goal**: Monitor platform health, tune scoring, manage users
- **Tools**: `/admin` dashboard — Users, Analytics, Overrides, Calibration, Debate transcripts

---

## User Flows

### Flow 1: Free Assessment (Public)
```
Landing Page (app/page.tsx)
  → Embedded QuickAssess (components/assessment/QuickAssess.tsx)
    → 12-question interview via /api/chat + /api/interview/tree
    → Scoring via POST /api/score (streamed)
    → Report page /report/[id] (locked)
      → Unlock gate → Stripe checkout ($29)
        → Webhook confirms → is_unlocked = true
        → Full report + PDF accessible
```

### Flow 2: Authenticated Founder
```
Sign up (app/auth/signup) → Email confirmation
  → Dashboard (app/dashboard)
    → Score history (app/dashboard/score/history)
    → Financial modules (app/dashboard/financials)
    → Gap report (app/dashboard/gap-report)
    → Investors page (app/dashboard/investors) — shows matched investors
```

### Flow 3: Investor Portal
```
Investor login → app/investor
  → Startup list (score ≥ 75, is_unlocked = true)
  → Startup detail (app/investor/[id]) — full report view
  → Feedback submission (pass/invest/watch + reason)
```

---

## Key UX Rules

1. **Assessment must feel conversational**, not like a form. Chat UI with one question at a time.
2. **Score must stream** to the screen — no loading spinner for 10 seconds.
3. **Admin sees full report** without payment (bypass unlock gate).
4. **Report owner** (user who took the test) sees full report without payment.
5. **Investors never see** contact details of startups until matched.

---

## Monetisation Detail

| Product | Price | Billing | Notes |
|---|---|---|---|
| Investor Platform | $99/month | Monthly or Annual | Annual = 20% discount |
| Investor Premium | $299/month | Monthly | More filters, API access |
| Investor Enterprise | $499/month | Monthly | Custom, white-label |
| Report Unlock | $29 | One-time | Stripe Payment |
| Startup Badge | TBD | Monthly | Visibility boost |
| "Buy Me Coffee" | Custom | One-time | Optional, no gate |

---

## Email Templates

- `components/emails/DiagnosticCompleteEmail.tsx` — Sent on assessment completion with score + report link
- Future: `InvestorMatchEmail.tsx` — Notify startup of investor interest
- Future: `WeeklyInsightEmail.tsx` — Founder progress update

---

## Notification System

- **Telegram**: Admin alerts on every completed assessment (`lib/telegram.ts`)
- **Resend**: User emails. From address must be verified domain (currently `RESEND_FROM_EMAIL` env var)
- **In-app**: TBD — no real-time notifications yet
