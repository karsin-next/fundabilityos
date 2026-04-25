# SKILL: Admin Dashboard (Basedash / Supabase)

> How to manage administrative operations by leveraging external tools (Basedash) instead of building custom internal Next.js dashboards.

---

## Overview

We do not write custom React/Next.js code to build admin tables, user editing forms, or internal analytics graphs. Building internal tools steals engineering cycles from the core AI diagnostic engine.

Instead, we use **Basedash** (or the native **Supabase Dashboard**) connected directly to the PostgreSQL database.

## Rules & Implementation Strategy

### 1. Zero Custom Admin UI
- Remove custom routes like `app/admin/users/page.tsx`.
- We no longer need to worry about writing frontend logic for pagination, search filtering, or CRUD operations for internal use.

### 2. Basedash Integration
- **Connection:** Basedash connects directly to the Supabase Postgres database using a read/write connection string.
- **Views:** Admins configure "Views" inside Basedash to see:
  - Users and their associated profiles.
  - All Reports generated, with scores and bands.
  - Stripe payments and unlocked statuses.
  - Logic overrides (admins can add rows to `logic_overrides` directly in Basedash without needing a custom UI).
- **Security:** Basedash handles its own user authentication. Only verified team members are invited to the Basedash workspace. 

### 3. Native Supabase Fallback
If Basedash is not configured, the platform owner should use the **Supabase Table Editor** (`app.supabase.com`) to manually adjust records or view system logs.

### 4. Admin API Pruning
By outsourcing the Admin UI, we can safely delete internal API routes that were solely used to feed data to the custom admin tables (e.g., `/api/admin/users/route.ts`), significantly reducing the API attack surface area and the amount of code to maintain.
