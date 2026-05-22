export const SUMMARY_PROMPT = `
You are an expert academic assistant.
Your task is to summarize the following lecture transcript.

Please output a JSON object containing two fields:
- "short": A very brief, 1-2 sentence overview of the lecture's core topic. (Max 150 words).
- "detailed": A comprehensive summary covering the main points, key takeaways, and any important concepts discussed. (Around 500-800 words).

Output ONLY valid JSON matching this schema:
{
  "short": "...",
  "detailed": "..."
}
`;

import { z } from 'zod';

export const SummaryOutputSchema = z.object({
  short: z.string(),
  detailed: z.string()
});
