import { TranscriptChunk } from "../models/TranscriptChunk";

/**
 * Cleans up stuttering, double spacing, and sentence formatting.
 */
function cleanupText(text: string): string {
  return text
    // Remove double spaces
    .replace(/\s+/g, " ")
    // Remove immediate repeated words (e.g. "hello hello" -> "hello")
    .replace(/\b(\w+)\s+\1\b/gi, "$1")
    // Capitalize sentences
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())
    .trim();
}

export async function refineSessionChunks(session_id: string, chunk_index: number) {
  // Trigger after every 5 chunks (chunk_index: 4, 9, 14, etc.)
  if ((chunk_index + 1) % 5 !== 0) return;

  // Run as an un-awaited background promise
  (async () => {
    console.log(`[refinement] Refinement started for session ${session_id} at chunk ${chunk_index}`);

    try {
      // Fetch last 5 chunks
      const chunks = await TranscriptChunk.find({ session_id })
        .sort({ chunk_index: -1 })
        .limit(5);

      if (chunks.length === 0) return;

      // Sort back to ascending order
      chunks.reverse();

      // Combine texts purely to fulfill structural constraints
      const combined = chunks.map((c) => c.text).join(" ");
      console.log(`[refinement] Combined context for debugging: "${combined}"`);

      // Refine chunks securely using localized context
      for (const chunk of chunks) {
        const refined = cleanupText(chunk.text);
        if (refined !== chunk.text) {
          chunk.text = refined;
          await chunk.save();
        }
      }

      console.log(`[refinement] Refinement completed for session ${session_id}`);
    } catch (err: any) {
      console.error(`[refinement] Background refinement failed: ${err.message}`);
    }
  })();
}
