# SKILL: Security Checks

> Automated security verification checklist for FundabilityOS agents.

---

## Pre-Commit Checklist

Run these checks before committing any code:

### 1. Secret Scanning
```bash
# Scan for hardcoded secrets
grep -r "sk-ant-" app/ lib/ components/ --include="*.ts" --include="*.tsx"
grep -r "eyJ" app/ lib/ components/ --include="*.ts" --include="*.tsx" | grep -v "SUPABASE_URL" | grep -v ".env"
grep -r "whsec_" app/ lib/ components/ --include="*.ts" --include="*.tsx"
grep -r "re_" app/ lib/ components/ --include="*.ts" --include="*.tsx"
# If any results found → STOP. Remove secrets before committing.
```

### 2. Service Role Key Exposure Check
```bash
# SERVICE_ROLE_KEY must NEVER appear in client-side files
grep -r "SUPABASE_SERVICE_ROLE_KEY" app/ components/ --include="*.ts" --include="*.tsx" | grep -v "api/" | grep -v "route.ts"
# Any result in a non-api, non-route file is a CRITICAL violation
```

### 3. "use client" + Service Role Check
```bash
# Files with "use client" must not import from lib/supabase/admin.ts
grep -l "use client" app/ components/ -r --include="*.tsx" | xargs grep -l "supabase/admin"
# Any matches are critical violations
```

---

## API Route Security Verification

For every new API route, verify:

```typescript
// ✅ Checklist for app/api/**/route.ts

// [ ] 1. Uses correct Supabase client
//         Public routes → no client or server client (anon key)
//         Admin routes → supabaseAdmin (service role) AFTER auth check

// [ ] 2. Authenticates user before sensitive operations
const { data: { user } } = await supabaseAuth.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// [ ] 3. Admin routes verify admin role
const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin, role").eq("id", user.id).single();
if (!profile?.is_admin && profile?.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// [ ] 4. Validates all inputs from req.json()
// [ ] 5. Returns standard { data, error } envelope
// [ ] 6. Logs errors internally, never exposes to client
// [ ] 7. Webhook routes verify signature before processing
```

---

## Supabase RLS Policy Audit

Run periodically to verify policies are not creating recursion:
```sql
-- Check for infinite recursion risk
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE qual LIKE '%profiles%'
AND tablename = 'profiles';
-- Any policy on 'profiles' that queries 'profiles' without SECURITY DEFINER is at risk
-- Solution: use the public.is_admin() function instead
```

---

## Rate Limit Verification (TODO)

When `@upstash/ratelimit` is implemented, verify:
- `/api/score` → `new Ratelimit({ limiter: Ratelimit.fixedWindow(5, "1m") })`
- `/api/chat` → `new Ratelimit({ limiter: Ratelimit.fixedWindow(20, "1m") })`
- `/api/upload` → `new Ratelimit({ limiter: Ratelimit.fixedWindow(3, "1m") })`
- `/api/auth/**` → `new Ratelimit({ limiter: Ratelimit.fixedWindow(10, "1m") })`

```typescript
// Standard rate limit implementation pattern
const { success, limit, reset, remaining } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    { status: 429, headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Reset": String(reset) } }
  );
}
```

---

## LLM Output Sanitisation Check

For any code that uses Claude output:
```typescript
// [ ] 1. JSON extracted with regex before parse
const jsonMatch = response.match(/\{[\s\S]*\}/);
if (!jsonMatch) throw new Error("No valid JSON in LLM response");

// [ ] 2. Parsed inside try/catch
let parsed;
try { parsed = JSON.parse(jsonMatch[0]); }
catch { /* handle gracefully */ }

// [ ] 3. Required fields validated before DB write
if (!parsed.score || !parsed.band) throw new Error("Invalid scoring output");

// [ ] 4. Score clamped to valid range
parsed.score = Math.max(0, Math.min(100, parsed.score));

// [ ] 5. Output rendered as text/JSX, never as dangerouslySetInnerHTML
```

---

## Dependency Security

```bash
# Check for known vulnerabilities
npm audit
# Target: 0 high/critical severity vulnerabilities
# Run before every production deployment
```

---

## Environment Variable Completeness Check

```bash
# Verify all required env vars are set
node -e "
const required = [
  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY',
  'TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID', 'CRON_SECRET', 'NEXT_PUBLIC_SITE_URL'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) console.error('MISSING:', missing);
else console.log('All env vars present');
"
```
