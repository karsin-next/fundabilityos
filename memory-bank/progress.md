# Memory Bank — Progress Tracker

> Update this file after every significant development session.

---

## Feature Status

### Core Assessment Flow
| Feature | Status | Notes |
|---|---|---|
| 12-20 dynamic question AI interview | ✅ Complete | `QuickAssess.tsx` + `/api/chat` |
| Dynamic decision tree (multiple choice) | ✅ Complete | `/api/interview/tree` |
| Pitch deck upload + parsing | ✅ Complete | `/api/upload` |
| AI scoring (Claude, streamed) | ✅ Complete | `/api/score` |
| Rule-based fallback scoring | ✅ Complete | `lib/scoring.ts` |
| Logic overrides | ✅ Complete | Admin-managed via `logic_overrides` table |
| Report page (locked preview) | ✅ Complete | `/report/[id]` |
| Report unlock (Stripe payment) | ✅ Complete | `/api/checkout` + `/api/webhook/stripe` |
| Admin/owner bypass for report lock | ✅ Complete | Added April 24, 2026 |
| PDF report download | ✅ Complete | `/api/report/[id]/pdf` |

### User Management  (consider external free tools, issues with built-in tools because of bad user experience in managing their user account.)
| Feature | Status | Notes |
|---|---|---|
| Signup / Login | ✅ Complete | Supabase Auth |
| Auth callback | ✅ Complete | `/auth/callback` |
| Session persistence | ✅ Complete | `@supabase/ssr` + middleware |
| Profile creation on signup | ✅ Complete | DB trigger `handle_new_user` |
| Admin user dashboard | ✅ Complete | `/admin/users` — fixed April 24 |
| User detail page | ✅ Complete | `/admin/users/[id]` — added April 24 |
| Admin API (service role) | ✅ Complete | `/api/admin/users`, `/api/admin/users/[id]` |
| RLS infinite recursion fix | ✅ Written | Migration 011 — needs to be applied |

### Notifications
| Feature | Status | Notes |
|---|---|---|
| Telegram admin alerts | ✅ Complete | `lib/telegram.ts` |
| Email to user on completion | ⚠️ Partial | Code works, Resend domain needs verification |
| Email template | ✅ Complete | `DiagnosticCompleteEmail.tsx` |

### Admin Tools (consider external free tools, issues with built-in tools because of bad user experience in managing many users.)
| Feature | Status | Notes |
|---|---|---|
| Analytics dashboard | ✅ Complete | `/admin/analytics` |
| Prompt calibration | ✅ Complete | `/admin/calibration` |
| AI debate transcripts | ✅ Complete | `/admin/debate` |
| Logic overrides manager | ✅ Complete | `/admin/overrides` |
| Score simulation | ✅ Complete | `/admin/simulate` |
| AI telemetry | ✅ Complete | `/admin/telemetry` |
| Data vault | ✅ Complete | `/admin/vault` |

### Investor Portal
| Feature | Status | Notes |
|---|---|---|
| Investor listing (score ≥ 75) | ⚠️ Partial | Page exists, data filtering TBD |
| Investor feedback (pass/invest) | ❌ Not built | Skill defined, implementation pending |
| Weekly model evolution cron | ⚠️ Partial | `/api/cron/evolve` exists, logic TBD |

### Founder Dashboard
| Feature | Status | Notes |
|---|---|---|
| Score history | ✅ Complete | `/dashboard/score/history` |
| Financial modules | ✅ Complete | `/dashboard/financials` |
| Gap report | ✅ Complete | `/dashboard/gap-report` |
| Investor connections | ✅ Complete | `/dashboard/investors` |
| Audit trail | ✅ Complete | `/dashboard/audit` |

---

## Migration History

| Migration | Status | Applied |
|---|---|---|
| 001 — Initial schema | ✅ Applied | Yes |
| 002 — Evolution insights | ✅ Applied | Yes |
| 002 — RLS policies | ✅ Applied | Yes |
| 003 — Analytics events | ✅ Applied | Yes |
| 003 — Investor directory | ✅ Applied | Yes |
| 004 — B2B referrals | ✅ Applied | Yes |
| 005 — V4 core | ✅ Applied | Yes |
| 006 — Auth fixes | ✅ Applied | Yes |
| 007 — AI learning engine | ✅ Applied | Yes |
| 008 — Telegram support | ✅ Applied | Yes |
| 009 — Security hardening | ✅ Applied | Yes |
| 010 — Harmonize admin access | ✅ Applied | Yes |
| **011 — Harmonize RLS** | **⚠️ WRITTEN, NOT APPLIED** | **APPLY NOW** |

---

## Velocity Log

| Date | What Was Done |
|---|---|
| Apr 2026 | Initial build: assessment flow, scoring, report page |
| Apr 2026 | Admin dashboard, user management, Telegram alerts |
| Apr 23, 2026 | Email delivery fix (Resend domain), RLS diagnosis |
| Apr 24, 2026 | Admin bypass for reports, scoring API refactor, memory bank creation |
