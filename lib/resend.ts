import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey === "re_..." || apiKey.startsWith("re_mock")) {
  console.warn("[Resend] WARNING: RESEND_API_KEY is not configured. Emails will NOT be sent.");
}

/**
 * Resend email client.
 * Initialised with the RESEND_API_KEY environment variable.
 * If the key is missing, the client is created with a dummy key
 * and all send() calls will fail gracefully with a console error.
 */
export const resend = new Resend(apiKey || "re_placeholder_key");
