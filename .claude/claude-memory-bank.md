# FundabilityOS — Claude Memory Bank

> The Memory Bank is a set of structured markdown files that give any AI agent full context on this project. Read all linked files before starting any task.

---

## Required Reading (in order)

1. **[Project Brief](./memory-bank/projectbrief.md)** — What the platform is and why it exists
2. **[Product Context](./memory-bank/productContext.md)** — User personas, flows, monetisation
3. **[Tech Context](./memory-bank/techContext.md)** — Stack, services, database schema, file paths
4. **[System Patterns](./memory-bank/systemPatterns.md)** — Established patterns and anti-patterns
5. **[Active Context](./memory-bank/activeContext.md)** — Current status, known issues, next priorities
6. **[Progress](./memory-bank/progress.md)** — Feature completion status and migration history

---

## Conditional Rules

Apply these rules based on the file you are working on:

| File Pattern | Rules to Apply |
|---|---|
| `**/*.ts`, `**/*.tsx` | [.claude/rules/security.md](./.claude/rules/security.md) |
| `lib/supabase/*.ts`, any Supabase import | [.claude/rules/supabase.md](./.claude/rules/supabase.md) |
| `app/api/score/route.ts`, `lib/scoring.ts` | [.claude/rules/scoring.md](./.claude/rules/scoring.md) |

---

## Skills Reference

Use these when implementing specific features:

| Task | Skill |
|---|---|
| Implementing or modifying score generation | [fundability-scoring SKILL](./.claude/skills/fundability-scoring/SKILL.md) |
| Building investor feedback features | [investor-feedback SKILL](./.claude/skills/investor-feedback/SKILL.md) |
| Security auditing or checking a new route | [security SKILL](./.claude/skills/security/SKILL.md) |

---

## Global Rules

Always apply: [.antigravity/rules.md](./.antigravity/rules.md)

---

## Quick Reference

```
Admin account:     karsin@nextblaze.asia
Live domain:       www.fundabilityos.com / www.nextblaze.asia  
Supabase project:  [see NEXT_PUBLIC_SUPABASE_URL in .env.local]
Deployment:        Vercel (main branch auto-deploys)
Score gate:        Investors see startups with score ≥ 75 only
Report unlock:     $29 Stripe one-time payment
AI model:          Claude (Anthropic) for scoring + interview
```
