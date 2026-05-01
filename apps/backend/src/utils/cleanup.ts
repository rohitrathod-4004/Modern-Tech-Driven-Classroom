/**
 * Applies rules to fix common transcription artifacts.
 */
export function cleanText(text: string): string {
  if (!text) return "";

  let cleaned = text
    // 1. Trim extra spaces and remove double spaces
    .trim()
    .replace(/\s+/g, " ")
    // 2. Remove duplicate consecutive words (case-insensitive)
    .replace(/\b(\w+)\s+\1\b/gi, "$1");

  if (!cleaned) return "";

  // 3. Casing: Capitalize the first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // 4. Basic punctuation: Ensure it ends with . or ? or !
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += ".";
  }

  return cleaned;
}
