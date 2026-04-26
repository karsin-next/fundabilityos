interface TelegramAlertData {
  type: string;
  user_email?: string;
  score?: number;
  band?: string;
  report_url?: string;
  [key: string]: unknown;
}

/**
 * Send a Telegram notification alert.
 * Accepts either a plain string or a structured data object.
 */
export async function sendTelegramAlert(input: string | TelegramAlertData): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // Support both TELEGRAM_ADMIN_CHAT_ID (preferred) and TELEGRAM_CHAT_ID (legacy)
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (!token || token.startsWith("7xxxxxxxxxx") || token === "your-bot-token") {
    console.warn("[Telegram] Skipped: TELEGRAM_BOT_TOKEN is not configured.");
    return;
  }
  if (!chatId || chatId === "123456789") {
    console.warn("[Telegram] Skipped: TELEGRAM_ADMIN_CHAT_ID is not configured.");
    return;
  }

  // Build message text
  let message: string;
  if (typeof input === "string") {
    message = input;
  } else {
    // Format structured data into a readable Telegram message
    const lines: string[] = [];
    lines.push(`🔔 <b>${input.type?.replace(/_/g, " ").toUpperCase() || "ALERT"}</b>`);
    if (input.user_email) lines.push(`👤 ${input.user_email}`);
    if (input.score !== undefined) lines.push(`📊 Score: <b>${input.score}/100</b>`);
    if (input.band) lines.push(`🏷 Band: ${input.band}`);
    if (input.report_url) lines.push(`📄 <a href="${input.report_url}">View Report</a>`);
    message = lines.join("\n");
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Telegram API Error:", data.description);
    } else {
      console.log("✅ Telegram Alert Sent");
    }
  } catch (error) {
    console.error("Failed to fetch Telegram API:", error);
  }
}
