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
  CHAT:      "claude-3-haiku-20240307",    // Stable classic Haiku
  ANALYSIS:  "claude-3-sonnet-20240229",   // Stable classic Sonnet
} as const;

export type ModelKey = keyof typeof MODELS;
