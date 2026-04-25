export async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram Alert Skipped (Missing Credentials):", message);
    return;
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
      console.log("✅ Telegram Alert Sent:", message.substring(0, 30) + "...");
    }
  } catch (error) {
    console.error("Failed to fetch Telegram API:", error);
  }
}
