# Supabase Rules — All Supabase Client Files

> Applies to: `lib/supabase/*.ts`, any file that imports from `@supabase/supabase-js` or `@supabase/ssr`.

---

## DB-1: Three-Client Architecture

| Client | File | Key Used | RLS? | Use Case |
|---|---|---|---|---|
| Browser | `lib/supabase/client.ts` | `ANON_KEY` | ✅ Yes | Client components, user-scoped reads |
| Server (SSR) | `lib/supabase/server.ts` | `ANON_KEY` + cookies | ✅ Yes | Server components, session-aware reads |
| Admin | `lib/supabase/admin.ts` | `SERVICE_ROLE_KEY` | ❌ Bypassed | API routes only, admin operations |

```typescript
// lib/supabase/admin.ts — THE ONLY PLACE service role is used
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## DB-2: RLS Infinite Recursion Fix

**Known Issue**: Any RLS policy on `profiles` that queries `profiles` to check admin status causes infinite recursion.

**Solution**: Use the `public.is_admin()` SECURITY DEFINER function:

```sql
-- This function runs with elevated privileges, bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND (is_admin = TRUE OR role = 'admin')
  );
$$;

-- Use it in policies
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin(auth.uid()));
```

**Code-side rule**: Never query `profiles` via the anon client in an admin context. Always use `supabaseAdmin` (service role) or the API route.

---

## DB-3: User Query Patterns

```typescript
// ✅ Server Component — read own data
const supabase = await createServerSupabaseClient(); // uses session cookie
const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();

// ✅ API Route — admin reads any user
const { data } = await supabaseAdmin.from("profiles").select("*"); // bypasses RLS

// ❌ NEVER in client components
const { data } = await supabase.from("profiles").select("*"); // will fail due to RLS if not owner
```

---

## DB-4: Upsert vs Insert

- For sessions: use `.upsert()` with `{ onConflict: 'id' }` to handle the case where the session was pre-created.
- For reports: use `.insert()` since each report has a new UUID.
- For profiles: use `.upsert()` in the `handle_new_user` trigger to avoid duplicate key errors.

---

## DB-5: Migration Rules

- Every schema change requires a new file in `supabase/migrations/`.
- Naming: `NNN_descriptive_name.sql` (e.g., `012_add_investor_feedback.sql`).
- Always include `IF NOT EXISTS` and `IF EXISTS` guards.
- Run locally with `supabase db push` or apply via Supabase SQL Editor in production.
- The current highest migration is `011_harmonize_core_tables_rls.sql`.

---

## DB-6: Smart User Linking Pattern

When a user ID might be missing (anonymous assessment that later logs in):

```typescript
let finalUserId = userId;
if (!finalUserId && userEmail) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", userEmail)
    .single();
  if (profile) finalUserId = profile.id;
}
```

---

## DB-7: Foreign Key Order

When inserting related records, respect FK constraints:
1. `sessions` must exist before `reports` (reports.session_id → sessions.id)
2. `profiles` must exist before `sessions` (sessions.user_id → profiles.id)
3. Use `upsert` on sessions before inserting reports.
