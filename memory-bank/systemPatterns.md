# Memory Bank — System Patterns

> Established patterns every agent must follow. Deviation requires justification.

---

## Pattern 1: Admin API Route (Standard Template)

All routes under `app/api/admin/**` follow this exact pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  // 1. Auth
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Admin check (service role avoids RLS recursion)
  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin, role").eq("id", user.id).single();
  if (!profile?.is_admin && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Your query here
  const { data, error } = await supabaseAdmin.from("your_table").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
```

---

## Pattern 2: Scoring API — Operation Order

The `app/api/score/route.ts` must always process in this order:
```
1. Smart-link user (email lookup if no userId)
2. UPSERT sessions
3. INSERT reports              ← data safe here
4. Enqueue background tasks
5. Close stream
--- [background] ---
6. Telegram alert
7. Resend email
8. Analytics tracking
9. Debate engine fire
```

---

## Pattern 3: Client vs Server Component Decision

```
Does this component:
  ├─ Use useState, useEffect, useRef, useCallback? → "use client"
  ├─ Handle onClick, onChange, or other events? → "use client"
  ├─ Use browser APIs (localStorage, window, etc)? → "use client"
  └─ Only display data, do async fetching, await? → Server Component (default)
```

---

## Pattern 4: Supabase Client Selection

```
Where is this code running?
  ├─ Browser ("use client" component) → createClient() from lib/supabase/client.ts
  ├─ Server Component (page.tsx, layout.tsx) → createServerSupabaseClient() from lib/supabase/server.ts
  └─ API Route (route.ts) → supabaseAdmin from lib/supabase/admin.ts
```

---

## Pattern 5: Error Handling in API Routes

```typescript
try {
  // ... your logic
} catch (e) {
  console.error("[Route Name Error]:", e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  // NEVER: NextResponse.json({ error: e.message }) — leaks internals
}
```

---

## Pattern 6: Dynamic Route Params (Next.js 15)

In Next.js 15, `params` is a Promise. Always await it:
```typescript
// Server Component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// API Route
export async function GET(req: NextRequest, context: any) {
  const params = await context.params;
  const { id } = params;
}
```

---

## Pattern 7: Background Tasks in Streaming Routes

```typescript
// Stream the result first, THEN fire background tasks
controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
controller.close();

// Background — non-blocking
(async () => {
  try {
    await sendTelegramAlert(...);
    await resend.emails.send(...);
  } catch (e) {
    console.error("[BG Error]:", e);
  }
})();
```

---

## Pattern 8: LLM Output Extraction

```typescript
// Always use this exact pattern to extract JSON from Claude
const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
if (!jsonMatch) throw new Error("No JSON in LLM response");
const result = JSON.parse(jsonMatch[0]);
```

---

## Anti-Patterns (NEVER DO)

| ❌ Anti-Pattern | ✅ Correct Pattern |
|---|---|
| `createClient(url, SERVICE_ROLE_KEY)` in "use client" | Only in server-side route.ts |
| `dangerouslySetInnerHTML` with LLM output | Render as text/JSX |
| `await` on email/telegram in streaming routes | Fire-and-forget `(async () => {})()`|
| Admin check via anon client (RLS recursion) | Always use supabaseAdmin |
| `params.id` directly in Next.js 15 | `const { id } = await params` |
| Hardcoded API keys or tokens | Always `process.env.VAR_NAME` |
