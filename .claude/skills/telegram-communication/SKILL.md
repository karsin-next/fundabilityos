# SKILL: Telegram Communication

> How to send critical alerts and communications to admins via the Telegram Bot API.

---

## Overview

FundabilityOS uses Telegram as a fire-and-forget real-time alert system for administrators. It ensures that founders and admins are immediately notified of key events (like a successful Stripe payment, a completed assessment, or an unexpected system error) without introducing latency to the user experience.

## Rules & Patterns

### 1. Fire-and-Forget Execution
Telegram alerts must NEVER block the main execution thread or the user's API response. Because Vercel has a 10s timeout on serverless functions, awaiting the Telegram API will cause the route to crash.

**✅ Correct Pattern:**
```typescript
import { sendTelegramAlert } from "@/lib/telegram";

// Execute in background
(async () => {
  try {
    await sendTelegramAlert("🚀 New assessment completed!");
  } catch (e) {
    console.error("Telegram alert failed:", e);
  }
})();
```

### 2. Required Environment Variables
The Telegram client requires the following environment variables to function. If they are missing, the system should gracefully degrade (log the message to the console instead of throwing an error).
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

### 3. HTML Formatting
The `sendTelegramAlert` function is configured to accept `parse_mode: 'HTML'`.
Use bold `<b>`, italics `<i>`, and links `<a href="...">` to format messages nicely for the admin.

**Example Alert:**
```typescript
const message = `
💰 <b>BOOM! New $29 Revenue!</b>
A user just unlocked a FundabilityOS Report.
<a href="${reportUrl}">View Unlocked Report</a>
`;
```

### 4. When to Trigger Alerts
- **High Priority:** Successful Stripe checkout (Report unlocked or Donation received).
- **High Priority:** New User Signup.
- **Medium Priority:** A startup completed an assessment and generated a new report.
- **Low Priority/Debug:** System fallback errors or rate limit spikes.
