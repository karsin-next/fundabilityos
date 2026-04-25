# Security Rules — All `.ts` / `.tsx` Files

> Applies to: every TypeScript and TSX file in this project.

---

## SR-1: Secret Handling

```typescript
// ❌ NEVER do this
const key = "sk-ant-abc123...";
const supabase = createClient(url, "eyJ...");

// ✅ ALWAYS do this
const key = process.env.ANTHROPIC_API_KEY;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
);
```

**Rule**: If a string literal looks like an API key (starts with `sk-`, `eyJ`, `re_`, `whsec_`, `pk_`), it is a violation.

---

## SR-2: Service Role Key — Server-Side Only

The `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL Row Level Security.

```typescript
// ❌ NEVER in "use client" components
// ❌ NEVER in lib/supabase/client.ts
// ✅ ONLY in:
//   - app/api/**/route.ts
//   - lib/supabase/admin.ts
//   - app/**/page.tsx (Server Components, not client)
```

Pattern to detect violation: if `SUPABASE_SERVICE_ROLE_KEY` appears in any file containing `"use client"`, it is a critical violation.

---

## SR-3: Webhook Signature Verification

Every webhook endpoint must verify authenticity before processing:

```typescript
// Stripe webhooks — app/api/webhook/stripe/route.ts
const sig = req.headers.get("stripe-signature")!;
const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
// If constructEvent throws, return 400 immediately

// Cron jobs — app/api/cron/**/route.ts  
const authHeader = req.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## SR-4: Input Validation

All inputs from `req.json()` must be validated:
```typescript
const { answers, userId, userEmail } = await req.json();
// Validate before use
if (!answers || typeof answers !== "object") {
  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}
```

Never pass unsanitised user input to:
- Database queries (use parameterised queries via Supabase SDK — never string concatenation)
- LLM prompts without sanitisation
- HTML rendering

---

## SR-5: Authentication Check Pattern

Every admin API route must verify the caller:
```typescript
// Step 1: Get authenticated user
const { data: { user } } = await supabaseAuth.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Step 2: Verify admin role (use service role to avoid RLS recursion)
const { data: profile } = await supabaseAdmin
  .from("profiles")
  .select("is_admin, role")
  .eq("id", user.id)
  .single();
if (!profile?.is_admin && profile?.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

## SR-6: Rate Limiting (TODO — not yet implemented)

Before deploying to production, add rate limiting to:
- `POST /api/score` — 5 req/min/IP
- `POST /api/chat` — 20 req/min/IP  
- `POST /api/upload` — 3 req/min/IP
- `POST /api/auth/*` — 10 req/min/IP

Recommended: `@upstash/ratelimit` with `@upstash/redis`.

---

## SR-7: Error Responses

Never expose internal errors to the client:
```typescript
// ❌ Bad
return NextResponse.json({ error: err.message }); // may leak stack trace

// ✅ Good
console.error("[API Error]:", err); // log internally
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
```
