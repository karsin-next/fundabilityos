# SKILL: User Dashboard & Authentication (Clerk + Stripe)

> How to manage the founder experience using external SaaS tools (Clerk for Auth, Stripe for Billing/Donations) instead of custom UI.

---

## Overview

FundabilityOS outsources user identity and account management to **Clerk**, and payment/donation flows to **Stripe**. We do not build custom React components for login, signup, password resets, or profile editing. 

## Rules & Implementation Strategy

### 1. Clerk for Authentication
- **Components:** Use Clerk's pre-built `<SignIn />`, `<SignUp />`, and `<UserProfile />` components.
- **Routing:** 
  - Place `<SignIn />` at `/sign-in/[[...index]]/page.tsx`
  - Place `<UserProfile />` at `/dashboard/settings/page.tsx`
- **Database Sync:** Do not rely exclusively on Clerk for data relational queries. Use Clerk's **Webhooks** (e.g., `user.created`, `user.updated`) to sync the `user_id` and `email` down to the local Supabase `profiles` table. This ensures our core diagnostic reports can still map to a user in PostgreSQL.

### 2. Stripe Customer Portal for Billing & Donations
- **Donation Workflow:**
  - Create a "Buy Me a Coffee" or "Support the Platform" payment link directly in the Stripe Dashboard.
  - Embed this payment link in the application (e.g., at the end of the free assessment or via a "Support Us" button).
  - Stripe handles the checkout session and receipt delivery.
- **Account Management:**
  - Do not build billing history or cancellation UI.
  - Provide a single button: `Manage Billing`. 
  - This button hits an API route (`/api/stripe/create-portal-session`) which redirects the user to their Stripe Customer Portal.

### 3. Core Focus
The only custom UI the platform should maintain for the User Dashboard is:
- The list of their past diagnostic reports.
- The button to take a new assessment.
- The button to access the Stripe Customer Portal.

Everything else (changing names, emails, avatars, passwords) is handled exclusively by Clerk.
