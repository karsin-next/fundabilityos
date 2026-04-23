import Anthropic from "@anthropic-ai/sdk";

// Singleton client — instantiated once, reused across requests
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "[FundabilityOS] ANTHROPIC_API_KEY is not set. Add it to .env.local"
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// Model constants — haiku for speed, sonnet for depth
export const MODELS = {
  CHAT:      "claude-haiku-4-5",    // Ultra-fast 4.5 Haiku
  ANALYSIS:  "claude-sonnet-4-5",   // Powerful 4.5 Sonnet
} as const;

export type ModelKey = keyof typeof MODELS;
