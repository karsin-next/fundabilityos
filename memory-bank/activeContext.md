# Memory Bank — Active Context

> Last updated: April 24, 2026. Update this file whenever a major change is made.

---

## Current Status: IN ACTIVE DEVELOPMENT

### What Was Just Completed (April 23–24, 2026)

1. **Admin Dashboard Users Page** (`app/admin/users/page.tsx`)
   - ✅ Switched from broken anon-client query to `/api/admin/users` route (service role)
   - ✅ Fixed RLS infinite recursion by using `public.is_admin()` function
   - ✅ Users with scores now visible in dashboard
   - ✅ Clicking user name navigates to detail page

2. **User Detail Page** (`app/admin/users/[id]/page.tsx`)
   - ✅ Created. Shows all assessments for a user.
   - ⚠️ "User Not Found" error was a params handling bug — fixed by using `context: any`

3. **Report Page** (`app/report/[slug]/page.tsx`)
   - ✅ Admin bypass: admins see full report without paying
   - ✅ Owner bypass: user who took test sees full report
   - ✅ Fixed server-side exception from dynamic imports

4. **Scoring API** (`app/api/score/route.ts`)
   - ✅ Complete refactor: DB save is SEQUENTIAL (session → report)
   - ✅ Smart user linking by email if userId is missing
   - ✅ Email + Telegram are background fire-and-forget (prevents Vercel timeout)
   - ✅ Deep Resend logging added

5. **RLS Fix** (`supabase/migrations/011_harmonize_core_tables_rls.sql`)
   - ✅ Written. Uses `SECURITY DEFINER` function to prevent infinite recursion.
   - ⚠️ NEEDS TO BE APPLIED TO LIVE DATABASE (Supabase SQL Editor)

---

## Current Known Issues

| Issue | Severity | Status | Fix |
|---|---|---|---|
| Migration 011 not applied to live DB | High | Pending | Run SQL in Supabase dashboard |
| Resend domain not verified for production | High | Pending | Verify domain in Resend dashboard |
| All existing reports have `user_id: null` | Medium | Partially fixed | Manually link via admin script |
| Rate limiting not implemented | Medium | Backlog | Implement with Upstash |
| 10+ temp debug JS files in root | Low | Backlog | Delete before go-live |
| GitHub SSH not configured | Low | Pending | Set up SSH key or PAT for git push |

---

## Files Changed This Session (Need Git Commit + GitHub Push)

```
app/api/score/route.ts              ← CRITICAL: New scoring logic
app/api/admin/users/route.ts        ← NEW: Admin users API
app/api/admin/users/[id]/route.ts   ← NEW: Admin user detail API
app/admin/users/page.tsx            ← UPDATED: Uses API, fixed imports
app/admin/users/[id]/page.tsx       ← NEW: Founder detail page
app/report/[slug]/page.tsx          ← UPDATED: Admin bypass, server error fix
supabase/migrations/011_harmonize_core_tables_rls.sql ← RLS fix (apply manually)
.antigravity/rules.md               ← NEW
.claude/CLAUDE.md                   ← NEW
.claude/rules/security.md           ← NEW
.claude/rules/supabase.md           ← NEW
.claude/rules/scoring.md            ← NEW
.claude/skills/*/SKILL.md           ← NEW
memory-bank/*.md                    ← NEW
```

---

## What to Work On Next

1. **[URGENT]** Verify Resend domain and test email delivery end-to-end
2. **[URGENT]** Apply migration 011 to live database
3. **[HIGH]** Test full assessment flow while logged in — confirm user + report appear in dashboard
4. **[HIGH]** Implement rate limiting on `/api/score`, `/api/chat`, `/api/upload`
5. **[MEDIUM]** Build investor portal (`app/investor/`) with score ≥ 75 filter
6. **[MEDIUM]** Build investor feedback submission flow
7. **[LOW]** Clean up root-level debug files
8. **[LOW]** Set up GitHub SSH / PAT for git push
