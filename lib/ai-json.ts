/**
 * Highly resilient utility to extract JSON objects from AI responses.
 * Especially useful when models include <thinking> tags or other preamble.
 */
export function extractAIJSON<T = any>(text: string): T {
  try {
    // 1. Try direct parsing first
    return JSON.parse(text.trim());
  } catch (e) {
    // 2. Try to find JSON within the string using regex
    // Looks for everything between the first { and last }
    const jsonMatch = text.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch) {
      try {
        // Clean up possible markdown fences inside the match
        const cleaned = jsonMatch[1]
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
        return JSON.parse(cleaned);
      } catch (innerError) {
        console.error("Failed to parse regex-extracted JSON:", cleaned);
        throw new Error("Could not extract valid JSON from AI response.");
      }
    }
    
    throw new Error("No JSON structure found in AI response.");
  }
}
