# FundabilityOS — Global Agent Rules
> Every AI agent working in this repo MUST read and comply with these rules before writing any code.

---

## 1. Tech Stack (Authoritative)
- **Framework**: Next.js 15 App Router (TypeScript strict mode)
- **Database**: Supabase (PostgreSQL + RLS)
- **AI**: Anthropic Claude (via `@anthropic-ai/sdk`)
- **Payments**: Stripe
- **Email**: Resend
- **Alerts**: Telegram Bot API
- **Deployment**: Vercel (Edge-compatible routes only where needed)

---

## 2. Security Rules (OWASP Agentic Top-10 Aligned)

### 2.1 No Hardcoded Secrets
- **NEVER** write API keys, tokens, or passwords in source code.
- All secrets are in `.env.local` (local) or Vercel environment variables (production).
- Reference the `.env.example` file for the full list of required variables.
- Allowed env vars: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`.

### 2.2 Least Privilege & JIT Access
- The **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is for client-side queries only — it is subject to RLS.
- The **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) **bypasses RLS**. It MUST only be used inside:
  - `app/api/**` server-side route handlers
  - `lib/supabase/admin.ts`
  - Never in `"use client"` components or `lib/supabase/client.ts`
- Validate service role access on every sensitive API route (check `auth.getUser()` first).

### 2.3 RBAC (Role-Based Access Control)
- Two roles exist: `startup` (default) and `admin`.
- Admin check pattern: `profile.is_admin === true || profile.role === 'admin'`
- **NEVER** check admin status via the anon client — use the service role client to avoid RLS recursion.
- Middleware (`middleware.ts`) protects: `/dashboard`, `/report`, `/admin`, `/directory`.
- Admin-only routes must additionally verify role inside the API handler — middleware alone is not sufficient.

### 2.4 Non-Human Identity Treatment
- The Stripe webhook (`/api/webhook/stripe`) must verify the `Stripe-Signature` header using `stripe.webhooks.constructEvent()` before processing any event.
- The cron endpoint (`/api/cron/**`) must validate the `Authorization: Bearer ${CRON_SECRET}` header.
- Telegram bot alerts are fire-and-forget — never expose webhook tokens client-side.

### 2.5 Rate Limiting
- All public unauthenticated endpoints must be rate-limited:
  - `/api/score` — AI-intensive, limit to 5 req/min per IP
  - `/api/chat` — 20 req/min per IP
  - `/api/upload` — 3 req/min per IP
  - `/api/auth/**` — 10 req/min per IP
- Preferred implementation: Vercel Edge Config or `upstash/ratelimit`.

### 2.6 LLM Output Sanitisation
- All Claude responses MUST be validated before database writes:
  - Use `JSON.parse()` inside a try/catch — never trust raw LLM output.
  - Extract JSON with regex: `fullResponse.match(/\{[\s\S]*\}/)` before parsing.
  - Validate required fields exist before INSERT (e.g., `score`, `band`, `component_scores`).
- Never render raw LLM output as `dangerouslySetInnerHTML` — always render as plain text or structured React components.

### 2.7 Webhook Security
- Stripe: Always call `stripe.webhooks.constructEvent(body, sig, secret)` — reject if it throws.
- Never log full webhook payloads to console in production.

### 2.8 API Response Envelope
All API routes must return responses in this format:
```typescript
// Success
{ data: T, error: null }
// Error
{ data: null, error: { message: string, code?: string } }
```

---

## 3. TypeScript Rules
- Strict mode is ON (`tsconfig.json`). No `any` unless absolutely necessary (use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment explaining why).
- Use path aliases: `@/lib/...`, `@/components/...`, `@/context/...`
- RSC (React Server Components) by default. Add `"use client"` only when using hooks, browser APIs, or event handlers.
- Server Components can `await` directly — no need for `useEffect` for initial data fetching.

---

## 4. Database Rules
- Never drop or alter production tables without a migration file in `supabase/migrations/`.
- Migration files use the naming convention: `NNN_description.sql` (e.g., `012_add_investor_tier.sql`).
- Known RLS issue: The `profiles` admin policy previously caused infinite recursion. Use the `public.is_admin(uuid)` SECURITY DEFINER function instead of inline policy subqueries on the `profiles` table.
- All admin data fetches must go through `app/api/admin/**` routes that use the service role client.

---

## 5. File Cleanup
These files in the root are temporary debug scripts and should be deleted before production deployment:
- `check-auth.js`, `check-db.js`, `check-policy.js`, `diagnose.js`, `fix-profiles.js`
- `test-admin-view.js`, `test-assessment.js`, `test-trigger.js`, `test2.js`, `test3.js`
- `dev_log*.txt`, `debug_log.txt`, `check_user.ts`
